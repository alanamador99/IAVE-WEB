import { getConnection, sql } from "../database/connection.js";

// Token INEGI (Mismo que en casetas.controllers.js)
const INEGI_TOKEN = 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';
const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;

/**
 * Función auxiliar para obtener la dirección legible desde OpenCage Geocoding API
 * @param {number} lat - Latitud
 * @param {number} lon - Longitud
 * @returns {Promise<string>} - Dirección formateada o descripción del error
 */
const getOpenCageLocation = async (lat, lon) => {
    if (!lat || !lon || !OPENCAGE_API_KEY) return null;
    
    try {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPENCAGE_API_KEY}&language=es&no_annotations=1`;
        const response = await fetch(url);
            
        if (!response.ok) {
            console.error(`Error OpenCage: ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].formatted;
        }
        return null;
    } catch (error) {
        console.error("Error al consultar OpenCage:", error);
        return null; // Fallback silencioso para no romper el flujo principal
    }
};

/**
 * Obtiene el estatus de rastreo para una lista de matrículas (Operadores)
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
export const getTrackingStatus = async (req, res) => {
    const { matriculas } = req.body; // Array de IDs de matrícula

    if (!matriculas || !Array.isArray(matriculas) || matriculas.length === 0) {
        return res.status(400).json({ error: "Se requiere un array de matrículas." });
    }

    try {
        const pool = await getConnection();
        
        // --- OPTIMIZACIÓN: Consulta Bulk ---
        const safeMatriculas = matriculas.map(m => String(m).replace(/[^a-zA-Z0-9]/g, ''));
        if (safeMatriculas.length === 0) return res.json([]);
        
        const request = pool.request();
        safeMatriculas.forEach((m, i) => {
            request.input(`m${i}`, sql.VarChar, m);
        });
        const paramList = safeMatriculas.map((_, i) => `@m${i}`).join(',');

        // Query fetching top 3 OTs + Latest GPS
        const query = `
            WITH RankedOTs AS (
                SELECT 
                    OT.ID_matricula, 
                    OT.ID_orden, 
                    OT.Id_tipo_ruta, 
                    OT_Status.iniciada, 
                    OT_Status.finalizada,
                    TRN.id_origen, TRN.id_destino,
                    PO.Poblacion as Origen, 
                    PD.Poblacion as Destino,
                    DIR_O.latitud as LatOrigen, 
                    DIR_O.longitud as LonOrigen,
                    DIR_D.latitud as LatDestino, 
                    DIR_D.longitud as LonDestino,
                    ROW_NUMBER() OVER(PARTITION BY OT.ID_matricula ORDER BY OT.Fecha_solicitud_cte DESC) as rn
                FROM Orden_traslados OT
                INNER JOIN orden_status OT_Status ON OT.ID_orden = OT_Status.fk_orden
                LEFT JOIN Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.id_Tipo_ruta
                LEFT JOIN Poblaciones PO ON TRN.id_origen = PO.ID_poblacion
                LEFT JOIN Poblaciones PD ON TRN.id_destino = PD.ID_poblacion
                LEFT JOIN Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
                LEFT JOIN Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
                WHERE OT.ID_matricula IN (${paramList})
            ),
            LatestGPS AS (
                SELECT 
                    fk_op, latitud, longitud, fecha,
                    ROW_NUMBER() OVER(PARTITION BY fk_op ORDER BY fecha DESC) as rn
                FROM geo_op
                WHERE fk_op IN (${paramList})
            )
            SELECT 
                P.ID_matricula, 
                P.Nombres, P.Ap_paterno, P.Ap_materno,
                LOT.ID_orden, LOT.iniciada, LOT.finalizada,
                LOT.Origen, LOT.Destino,
                LOT.id_origen, LOT.id_destino,
                LOT.LatOrigen, LOT.LonOrigen,
                LOT.LatDestino, LOT.LonDestino,
                LG.latitud as GPSLat, LG.longitud as GPSLon, LG.fecha as GPSFecha
            FROM Personal P
            LEFT JOIN RankedOTs LOT ON P.ID_matricula = LOT.ID_matricula AND LOT.rn <= 3
            LEFT JOIN LatestGPS LG ON P.ID_matricula = LG.fk_op AND LG.rn = 1
            WHERE P.ID_matricula IN (${paramList})
            ORDER BY P.ID_matricula, LOT.rn
        `;

        const dbResult = await request.query(query);
        const rows = dbResult.recordset;

        // Group rows by operator
        const opMap = {};
        rows.forEach(row => {
            const mat = String(row.ID_matricula);
            if (!opMap[mat]) {
                opMap[mat] = {
                    matricula: mat,
                    nombre: `${row.Nombres} ${row.Ap_paterno || ''} ${row.Ap_materno || ''}`.trim(),
                    gps: row.GPSLat ? { lat: row.GPSLat, lon: row.GPSLon, fecha: row.GPSFecha } : null,
                    ots: []
                };
            }
            if (row.ID_orden) {
                opMap[mat].ots.push({
                    id: row.ID_orden,
                    iniciada: row.iniciada,
                    finalizada: row.finalizada,
                    origen: row.Origen,
                    destino: row.Destino,
                    lat_origen: row.LatOrigen,
                    lon_origen: row.LonOrigen,
                    lat_destino: row.LatDestino,
                    lon_destino: row.LonDestino
                });
            }
        });

        // Loop to categorize OTs and fetch Geocoding
        const processedResults = await Promise.all(Object.values(opMap).map(async (op) => {
            // Logic to identify Current, Next, Prev
            // OTs are sorted by Fecha_solicitud_cte DESC (newest first)
            
            let current = null;
            let next = null;
            let prev = null;

            // Simple heurestic based on 'finalizada' and 'iniciada'
            // Assumes ot[0] is newest.
            
            const [first, second, third] = op.ots;
            
            // Case 1: First is active (started, not finished)
            if (first && !first.finalizada && first.iniciada) {
                current = first;
                // Next? Usually none unless pre-assigned. If next existed it would be newer?
                // If 'first' is active, any newer one (index -1?) doesn't exist.
                // Prev is second
                prev = second; 
            } 
            // Case 2: First is pending (assigned, not started)
            else if (first && !first.iniciada) {
                next = first;
                // Then second might be current
                if (second && !second.finalizada && second.iniciada) {
                    current = second;
                    prev = third;
                } else {
                    // Or second was completed
                    prev = second;
                }
            } 
            // Case 3: First is completed
            else if (first && first.finalizada) {
                prev = first;
                // current is null (idle)
                // next is null
            } 
            // Case 4: First is active but maybe odd state? Default to Current
            else if (first) {
                current = first;
                prev = second;
            }

            // Fill standard response fields with CURRENT info (or null)
            const result = {
                matricula: op.matricula,
                nombre: op.nombre,
                
                // Current OT fields (legacy + display)
                ot: current ? current.id : "Sin Asignar",
                origen: current ? current.origen : "N/A",
                destino: current ? current.destino : "N/A",
                id_origen: current ? current.id_origen : null,
                id_destino: current ? current.id_destino : null,
                lat_origen: current && current.lat_origen ? parseFloat(current.lat_origen) : null,
                lon_origen: current && current.lon_origen ? parseFloat(current.lon_origen) : null,
                lat_destino: current && current.lat_destino ? parseFloat(current.lat_destino) : null,
                lon_destino: current && current.lon_destino ? parseFloat(current.lon_destino) : null,
                fecha_inicio_ot: current ? current.iniciada : null,

                // New fields for Next/Prev
                ot_next: next ? { id: next.id, origen: next.origen, destino: next.destino } : null,
                ot_prev: prev ? { id: prev.id, origen: prev.origen, destino: prev.destino } : null,
                
                // GPS Fields
                latitud: op.gps ? parseFloat(op.gps.lat) : null,
                longitud: op.gps ? parseFloat(op.gps.lon) : null,
                fecha_gps: op.gps && op.gps.fecha ? op.gps.fecha : null,
                ubicacion_detallada: "Ubicación no disponible"
            };

            // Geocoding (only if coords exist)
            if (result.latitud && result.longitud) {
                try {
                    const dir = await getOpenCageLocation(result.latitud, result.longitud);
                    if (dir) result.ubicacion_detallada = dir;
                } catch (e) {
                    // ignore error
                }
            }

            return result;
        }));

        res.json(processedResults);

    } catch (error) {
        console.error("Error fetching tracking status:", error);
        res.status(500).json({ error: "Error interno del servidor al obtener datos de rastreo." });
    }
};

/**
 * Proxy para consultar el nombre del municipio (Geocodificación Inversa) usando INEGI API
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
export const getMunicipalityProxy = async (req, res) => {
    const { lat, lon, escala } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitud y Longitud requeridas." });
    }

    try {
        // INEGI 'buscalinea' requires POST with x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append('x', lon);
        params.append('y', lat);
        //este es el valor que se debe de actualizar conforme se arrastra el scroll en la barra de zoom del mapa, para que la consulta se haga con la escala adecuada y se obtengan resultados más precisos.
        params.append('escala', escala || '8000');
        params.append('type', 'json');
        params.append('key', INEGI_TOKEN);

        const response = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/buscalinea', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        if (!response.ok) {
            throw new Error(`INEGI API responded with status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error calling INEGI API:", error.message);
        res.status(500).json({ error: "Error al consultar API de INEGI." });
    }
};

/**
 * Obtiene la lista de operadores activos con puesto 'O'
 * @param {Object} req 
 * @param {Object} res 
 */
export const getActiveOperators = async (req, res) => {
    try {
        const pool = await getConnection();
        // Filtramos por Fecha_de_baja IS NULL y Puesto = 'O' (Operador)
        const result = await pool.request().query(`
            SELECT ID_matricula, Nombres, Ap_paterno, Ap_materno 
            FROM Personal 
            WHERE Fecha_de_baja IS NULL 
            AND Puesto = 'O' 
            AND ID_matricula NOT IN (5001, 5002, 5003, 5004, 5005, 5006, 5009, 5007)
            ORDER BY Nombres ASC
        `);
        
        const operadores = result.recordset.map(op => ({
            id: op.ID_matricula,
            nombre: `${op.Nombres} ${op.Ap_paterno || ''} ${op.Ap_materno || ''}`.trim()
        }));

        res.json(operadores);
    } catch (error) {
        console.error("Error al obtener operadores:", error);
        res.status(500).json({ error: "Error interno al obtener operadores." });
    }
};
