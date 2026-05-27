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

        // Query fetching top 3 OTs + Latest GPS (solo OTs programadas de los últimos 15 días)
        const query = `
            WITH RankedOTs AS (
                SELECT 
                    OT.ID_matricula, 
                    OT.ID_orden, 
                    OT.ID_Clave,
                    OT.Id_tipo_ruta, 
                    OT_Status.asignada,
                    OT_Status.origen as origen_status,
                    OT_Status.en_sitio,
                    OT_Status.iniciada, 
                    OT_Status.finalizada,
                    COALESCE(OT.Origen, TRN.id_origen) as id_origen,
                    COALESCE(OT.Destino, TRN.id_destino) as id_destino,
                    COALESCE(POB_OT_O.Poblacion, PO.Poblacion) as Origen,
                    COALESCE(POB_OT_D.Poblacion, PD.Poblacion) as Destino,
                    COALESCE(DIR_OT_O.latitud, DIR_O.latitud) as LatOrigen,
                    COALESCE(DIR_OT_O.longitud, DIR_O.longitud) as LonOrigen,
                    COALESCE(DIR_OT_D.latitud, DIR_D.latitud) as LatDestino,
                    COALESCE(DIR_OT_D.longitud, DIR_D.longitud) as LonDestino,
                    DIR_OT_O.Nombre as OrigenNombre,
                    DIR_OT_O.Razon_social as OrigenRazonSocial,
                    DIR_OT_O.Direccion as OrigenDireccion,
                    DIR_OT_O.Colonia as OrigenColonia,
                    DIR_OT_O.Contacto as OrigenContacto,
                    DIR_OT_O.Celular as OrigenCelular,
                    DIR_OT_O.Correo_electronico as OrigenCorreo,
                    DIR_OT_D.Nombre as DestinoNombre,
                    DIR_OT_D.Razon_social as DestinoRazonSocial,
                    DIR_OT_D.Direccion as DestinoDireccion,
                    DIR_OT_D.Colonia as DestinoColonia,
                    DIR_OT_D.Contacto as DestinoContacto,
                    DIR_OT_D.Celular as DestinoCelular,
                    DIR_OT_D.Correo_electronico as DestinoCorreo,
                    OT.ID_usuario,
                    ROW_NUMBER() OVER(
                        PARTITION BY OT.ID_matricula
                        ORDER BY
                            CASE
                                -- 0: En curso (ya marcada como iniciada y sin finalizar)
                                WHEN OT_Status.iniciada IS NOT NULL AND OT_Status.finalizada IS NULL THEN 0
                                -- 1: En curso "implícito" (operador en origen pero no marcó iniciada)
                                WHEN OT_Status.origen IS NOT NULL AND OT_Status.iniciada IS NULL AND OT_Status.finalizada IS NULL THEN 1
                                -- 2: Pendiente (asignada pero aún sin operar)
                                WHEN OT_Status.iniciada IS NULL AND OT_Status.finalizada IS NULL THEN 2
                                -- 3: Histórica (finalizada)
                                ELSE 3
                            END,
                            COALESCE(OT_Status.iniciada, OT_Status.origen, OT_Status.asignada, OT_Status.finalizada, OT.Fecha_solicitud_cte) DESC
                    ) as rn
                FROM Orden_traslados OT
                INNER JOIN orden_status OT_Status ON OT.ID_orden = OT_Status.fk_orden
                LEFT JOIN Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.id_Tipo_ruta
                LEFT JOIN Poblaciones PO ON TRN.id_origen = PO.ID_poblacion
                LEFT JOIN Poblaciones PD ON TRN.id_destino = PD.ID_poblacion
                LEFT JOIN Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
                LEFT JOIN Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
                LEFT JOIN Directorio DIR_OT_O ON OT.Origen = DIR_OT_O.ID_entidad
                LEFT JOIN Directorio DIR_OT_D ON OT.Destino = DIR_OT_D.ID_entidad
                LEFT JOIN Poblaciones POB_OT_O ON DIR_OT_O.ID_poblacion = POB_OT_O.ID_poblacion
                LEFT JOIN Poblaciones POB_OT_D ON DIR_OT_D.ID_poblacion = POB_OT_D.ID_poblacion
                WHERE OT.ID_matricula IN (${paramList})
                AND (
                  -- OTs aún no iniciadas/pendientes recientes
                  (OT_Status.iniciada IS NULL AND OT_Status.finalizada IS NULL AND OT.Fecha_solicitud_cte > DATEADD(day, -15, GETDATE()))
                  -- OTs iniciadas recientes (en curso o finalizadas)
                  OR (OT_Status.iniciada IS NOT NULL AND OT_Status.iniciada > DATEADD(day, -15, GETDATE()))
                  -- OTs finalizadas recientes (asegurar 'ot_prev' aunque iniciaran hace más tiempo)
                  OR (OT_Status.finalizada IS NOT NULL AND OT_Status.finalizada > DATEADD(day, -15, GETDATE()))
                )
            ),
            LatestGPS AS (
                SELECT 
                    fk_op, latitud, longitud, fecha,
                    ROW_NUMBER() OVER(PARTITION BY fk_op ORDER BY fecha DESC) as rn
                FROM geo_op
                WHERE fk_op IN (${paramList})
            ),
            TagData AS (
                SELECT id_matricula, Dispositivo
                FROM Control_Tags
                WHERE Activa = 1 AND id_matricula IN (${paramList})
            ),
            CurrentEstado AS (
                SELECT E1.ID_matricula, 
                STUFF((
                    SELECT ' | ' + Descripcion 
                    FROM Estado_del_personal E2 
                    WHERE E2.ID_matricula = E1.ID_matricula AND CAST(E2.ID_Fecha AS DATE) = CAST(GETDATE() AS DATE)
                    ORDER BY E2.ID_Fecha ASC 
                    FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 3, '') as Descripcion
                FROM Estado_del_personal E1
                WHERE E1.ID_matricula IN (${paramList}) AND CAST(E1.ID_Fecha AS DATE) = CAST(GETDATE() AS DATE)
                GROUP BY E1.ID_matricula
            )
            SELECT 
                P.ID_matricula, 
                P.Nombres, P.Ap_paterno, P.Ap_materno,
                LOT.ID_orden, LOT.ID_Clave, LOT.Id_tipo_ruta, LOT.asignada, LOT.origen_status, LOT.en_sitio, LOT.iniciada, LOT.finalizada,
                LOT.Origen, LOT.Destino,
                LOT.id_origen, LOT.id_destino,
                LOT.LatOrigen, LOT.LonOrigen,
                LOT.LatDestino, LOT.LonDestino,
                LOT.OrigenNombre, LOT.OrigenRazonSocial, LOT.OrigenDireccion, LOT.OrigenColonia, LOT.OrigenContacto, LOT.OrigenCelular, LOT.OrigenCorreo,
                LOT.DestinoNombre, LOT.DestinoRazonSocial, LOT.DestinoDireccion, LOT.DestinoColonia, LOT.DestinoContacto, LOT.DestinoCelular, LOT.DestinoCorreo,
                LOT.ID_usuario,
                LG.latitud as GPSLat, LG.longitud as GPSLon, CONVERT(VARCHAR(23), LG.fecha, 126) + '-06:00' as GPSFecha,
                CE.Descripcion as EstadoPersonal,
                TD.Dispositivo as Tag
            FROM Personal P
            LEFT JOIN RankedOTs LOT ON P.ID_matricula = LOT.ID_matricula AND LOT.rn <= 3
            LEFT JOIN LatestGPS LG ON P.ID_matricula = LG.fk_op AND LG.rn = 1
            LEFT JOIN CurrentEstado CE ON P.ID_matricula = CE.ID_matricula
            LEFT JOIN TagData TD ON P.ID_matricula = TD.id_matricula
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
                    estadoPersonal: row.EstadoPersonal || null,
                    tag: row.Tag || null,
                    ots: []
                };
            }
            if (row.ID_orden) {
                opMap[mat].ots.push({
                    id: row.ID_orden,
                    id_clave: row.ID_Clave,
                    asignada: row.asignada,
                    origen_status: row.origen_status,
                    en_sitio: row.en_sitio,
                    iniciada: row.iniciada,
                    finalizada: row.finalizada,
                    origen: row.Origen,
                    destino: row.Destino,
                    id_origen: row.id_origen,
                    id_destino: row.id_destino,
                    id_tipo_ruta: row.Id_tipo_ruta,
                    id_usuario: row.ID_usuario,
                    lat_origen: row.LatOrigen,
                    lon_origen: row.LonOrigen,
                    lat_destino: row.LatDestino,
                    lon_destino: row.LonDestino,
                    origen_detalle: row.OrigenNombre ? {
                        nombre: row.OrigenNombre,
                        razon_social: row.OrigenRazonSocial,
                        direccion: row.OrigenDireccion,
                        colonia: row.OrigenColonia,
                        contacto: row.OrigenContacto,
                        celular: row.OrigenCelular,
                        correo: row.OrigenCorreo
                    } : null,
                    destino_detalle: row.DestinoNombre ? {
                        nombre: row.DestinoNombre,
                        razon_social: row.DestinoRazonSocial,
                        direccion: row.DestinoDireccion,
                        colonia: row.DestinoColonia,
                        contacto: row.DestinoContacto,
                        celular: row.DestinoCelular,
                        correo: row.DestinoCorreo
                    } : null
                });
            }
        });

        // Loop to categorize OTs and fetch Geocoding
        const processedResults = await Promise.all(Object.values(opMap).map(async (op) => {
            // Selección por estado para evitar invertir rutas cuando el orden temporal no refleja el estado operativo.
            // Una OT se considera "en curso" si:
            //   a) Está marcada como iniciada y no finalizada, ó
            //   b) El operador ya llegó al origen (origen_status != null) pero aún no marcó iniciada ni finalizada.
            //     Esto cubre el caso real donde el operador recoge la carga pero olvida/retrasa marcar "iniciada".
            // Si hay varias, se prefiere la marcada como iniciada; si no, la más reciente por origen_status/asignada.
            const enCurso = op.ots
                .filter(ot => !ot.finalizada && (ot.iniciada || ot.origen_status))
                .sort((a, b) => {
                    // Priorizar las que tienen 'iniciada' sobre las que solo tienen 'origen_status'
                    if (!!a.iniciada !== !!b.iniciada) return a.iniciada ? -1 : 1;
                    const aDate = new Date(a.iniciada || a.origen_status || a.asignada || 0);
                    const bDate = new Date(b.iniciada || b.origen_status || b.asignada || 0);
                    return bDate - aDate;
                });
            const current = enCurso[0] || null;

            // Próxima OT: asignada/pendiente sin iniciar y sin origen_status, y que NO sea la actual
            const next = op.ots
                .filter(ot => !ot.finalizada && !ot.iniciada && !ot.origen_status && (!current || ot.id !== current.id))
                .sort((a, b) => {
                    const aDate = new Date(a.asignada || 0);
                    const bDate = new Date(b.asignada || 0);
                    return bDate - aDate; // la más reciente asignada
                })[0] || null;

            // Último traslado realizado: el finalizado más reciente
            const prev = op.ots
                .filter(ot => !!ot.finalizada)
                .sort((a, b) => new Date(b.finalizada) - new Date(a.finalizada))[0] || null;

            // Fill standard response fields with CURRENT info (or null)
            const result = {
                matricula: op.matricula,
                nombre: op.nombre,
                estadoPersonal: op.estadoPersonal,
                
                // Current OT fields (legacy + display)
                id_tipo_ruta: current ? current.id_tipo_ruta : null,
                id_clave: current ? current.id_clave : null,
                ot: current ? current.id : "Sin Asignar",
                origen: current ? current.origen : "N/A",
                destino: current ? current.destino : "N/A",
                id_origen: current ? current.id_origen : null,
                id_destino: current ? current.id_destino : null,
                origen_detalle: current ? current.origen_detalle : null,
                destino_detalle: current ? current.destino_detalle : null,
                lat_origen: current && current.lat_origen ? parseFloat(current.lat_origen) : null,
                lon_origen: current && current.lon_origen ? parseFloat(current.lon_origen) : null,
                lat_destino: current && current.lat_destino ? parseFloat(current.lat_destino) : null,
                lon_destino: current && current.lon_destino ? parseFloat(current.lon_destino) : null,
                fecha_inicio_ot: current ? current.iniciada : null,
                id_usuario: current ? current.id_usuario : null,
                tag: op.tag || null,

                // New fields for Next/Prev
                ot_next: next ? { id: next.id, id_tipo_ruta: next.id_tipo_ruta, id_clave: next.id_clave, origen: next.origen, destino: next.destino, id_usuario: next.id_usuario } : null,
                ot_prev: prev ? { id: prev.id, id_tipo_ruta: prev.id_tipo_ruta, id_clave: prev.id_clave, origen: prev.origen, destino: prev.destino, id_usuario: prev.id_usuario } : null,
                
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

/**
 * Obtiene detalles de rastreo de una OT, incluyendo eventos de operacion y ruta gps
 * @param {Object} req 
 * @param {Object} res 
 */
export const getOTTrackingDetails = async (req, res) => {
    try {
        const { otId } = req.params;
        if (!otId) return res.status(400).json({ error: "OT requerida" });

        const pool = await getConnection();

        // Datos principales de la OT
        const otResult = await pool.request()
            .input('otId', sql.VarChar, otId)
            .query(`
                SELECT 
                    OT.ID_orden,
                    OT.ID_matricula,
                    OT.Id_tipo_ruta,
                    OT.ID_Clave,
                    OT.ID_usuario,
                    P.Nombres, 
                    P.Ap_paterno, 
                    P.Ap_materno,
                    OS.asignada,
                    OS.origen as origen_status,
                    OS.en_sitio,
                    OS.iniciada,
                    OS.finalizada
                FROM Orden_traslados OT
                LEFT JOIN orden_status OS ON OS.fk_orden = OT.ID_orden
                LEFT JOIN Personal P ON P.ID_matricula = OT.ID_matricula
                WHERE OT.ID_orden = @otId
            `);

        if (!otResult.recordset || otResult.recordset.length === 0) {
            return res.status(404).json({ error: "OT no encontrada" });
        }

        const otData = otResult.recordset[0];
        otData.OperadorNombre = `${otData.Nombres || ''} ${otData.Ap_paterno || ''} ${otData.Ap_materno || ''}`.trim();

        // Coordenadas geo_op
        const geoResult = await pool.request()
            .input('otId', sql.VarChar, otId)
            .query(`
                SELECT Id_geo, fk_ot, fk_op, CONVERT(VARCHAR(23), fecha, 126) + '-06:00' as fecha, latitud, longitud, velocidad, distancia, tipo
                FROM geo_op
                WHERE fk_ot = @otId AND latitud IS NOT NULL AND longitud IS NOT NULL
                ORDER BY fecha ASC
            `);

        res.json({
            info: otData,
            tracking: geoResult.recordset || []
        });

    } catch (error) {
        console.error("Error al obtener tracking de OT:", error);
        res.status(500).json({ error: "Error interno al obtener tracking de la OT." });
    }
};

