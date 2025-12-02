/**
 * @module aclaraciones.controllers
 * @description
 * Controlador para gestión de ACLARACIONES en el sistema IAVE.
 * Una aclaración es un reclamo por diferencia en cobro de peaje.
 * 
 * Puede ocurrir cuando:
 * - Se cobra una tarifa incorrecta (mayor a la programada)
 * - Hay error en clasificación del vehículo
 * - Duplicación de cobro
 * - Error del sistema
 * 
 * Funcionalidades principales:
 * - Consultar aclaraciones registradas
 * - Filtrar por orden de traslado
 * - Calcular diferencia entre importe cobrado e importe oficial
 * - Actualizar estatus de aclaraciones
 * - Generar estadísticas
 * 
 * Estados secundarios:
 * - pendiente_aclaracion: Aclaración registrada, pendiente resolución
 * - aclaracion_levantada: Aclaración resuelta a favor del cliente
 * - dictaminado: Dictamen emitido sobre la aclaración
 * - completado: Proceso finalizado
 * 
 * @requires ../database/connection.js - Conexión a base de datos MSSQL
 */

import { getConnection, sql } from "../database/connection.js";





/**
 * Obtiene todas las aclaraciones registradas en el sistema.
 * @async
 * @function getAclaraciones
 * @param {Object} req - Objeto de solicitud (sin parámetros)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de aclaraciones enriquecidas
 * @throws {Error} Error 500 si falla
 * @description
 * Consulta tabla Cruces donde Estatus='Aclaración' e incluye:
 * - Información de orden de traslado (ID_clave)
 * - Datos de caseta (nombre, tarifas, ubicación)
 * - Cálculo de diferencia: Importe - ImporteOficial
 * 
 * Ordenado por Fecha descendente (más recientes primero).
 * @example
 * // GET /api/aclaraciones
 * // Response (200 OK)
 * [
 *   {
 *     "ID": 1,
 *     "Estatus": "Aclaración",
 *     "Estatus_Secundario": "pendiente_aclaracion",
 *     "Importe": 250.00,
 *     "ImporteOficial": 200.00,
 *     "diferencia": 50.00,
 *     "Fecha": "2025-12-01",
 *     "Nombre_IAVE": "Tlanalapa",
 *     "latitud": "20.3456",
 *     "longitud": "-99.1234",
 *     "Estado": "HIDALGO",
 *     "ID_clave": "C-5",
 *     ...
 *   },
 *   {...}
 * ]
 */
export const getAclaraciones = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT DISTINCT CR.*, OT.ID_clave, CP.Nombre_IAVE, CP.Automovil, CP.Camion2Ejes, CP.Camion3Ejes, CP.Camion5Ejes, CP.Camion9Ejes, CP.latitud, CP.longitud, CP.Estado
      FROM cruces CR
      INNER JOIN Orden_traslados OT
          ON CR.id_orden = OT.ID_orden
      INNER JOIN casetas_Plantillas CP
          ON CR.idCaseta = CP.ID_Caseta
      WHERE CR.Estatus = 'Aclaración'
      ORDER BY  CR.Fecha DESC;`);
    for (const row of result.recordset) {
      row.diferencia = row.Importe - row.ImporteOficial;
    }
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

/**
 * Obtiene estadísticas agregadas de aclaraciones.
 * @async
 * @function getStats
 * @param {Object} _ - Objeto de solicitud (no utilizado)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con estadísticas de aclaraciones
 * @throws {Error} Error 500 si falla
 * @description
 * Retorna conteos y montos por estado secundario:
 * - pendiente_aclaracion: Aclaraciones sin resolver
 * - aclaracion_levantada: Aclaraciones resueltas a favor
 * - dictaminado: Dictamen emitido
 * 
 * Los montos reflejan la diferencia cobrada:
 * - pendiente_aclaracion: Importe - ImporteOficial
 * - aclaracion_levantada: montoDictaminado o (Importe - ImporteOficial)
 * - dictaminado: montoDictaminado
 * @example
 * // GET /api/aclaraciones/stats
 * // Response
 * [
 *   {
 *     "pendiente_count": 35,
 *     "pendiente_monto": 5250.00,
 *     "aclaracion_levantada_count": 18,
 *     "aclaracion_levantada_monto": 2700.00,
 *     "dictaminado_count": 7,
 *     "dictaminado_monto": 1050.00,
 *     "total_count": 60,
 *     "total_monto": 9000.00
 *   }
 * ]
 */
export const getStats = async (_, res) => {
  console.log("Getstats")
  try {
    const pool = await getConnection();
    const aclaracionesPorCategoria = await pool
      .request()
      .query(
        `  SELECT 
      -- Conteos por estatus
        SUM(CASE WHEN Estatus_Secundario = 'pendiente_aclaracion' THEN 1 ELSE 0 END) AS pendiente_count,
        SUM(CASE WHEN Estatus_Secundario = 'aclaracion_levantada' THEN 1 ELSE 0 END) AS aclaracion_levantada_count,
        SUM(CASE WHEN Estatus_Secundario = 'dictaminado' THEN 1 ELSE 0 END) AS dictaminado_count,

      -- Montos por estatus
        SUM(CASE WHEN Estatus_Secundario = 'pendiente_aclaracion' THEN (cruces.Importe - cruces.ImporteOficial) ELSE 0 END) AS pendiente_monto,
        SUM(CASE WHEN Estatus_Secundario = 'aclaracion_levantada' THEN (COALESCE (cruces.montoDictaminado, cruces.Importe - cruces.ImporteOficial )) ELSE 0 END) AS aclaracion_levantada_monto,
        SUM(CASE WHEN Estatus_Secundario = 'dictaminado' THEN (cruces.montoDictaminado) ELSE 0 END) AS dictaminado_monto,

      -- Totales generales
        COUNT(*) AS total_count,
        SUM(cruces.Importe - cruces.ImporteOficial) AS total_monto

    FROM cruces
    WHERE Estatus = 'Aclaración';`
      );

    res.json(aclaracionesPorCategoria.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
    console.log(error.message);
  }
};


/**
 * Funciones auxiliares privadas para consultas de rutas y casetas.
 * No son endpoints, solo helpers internos.
 */

/**
 * Obtiene el ID de ruta (tipo_ruta) desde una orden de traslado.
 * @async
 * @private
 * @param {string} id_orden - ID de la orden de traslado
 * @returns {Promise<number|null>} ID de tipo de ruta o null
 */
const getRutaFromOT = async (id_orden) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("Orden", sql.VarChar, id_orden)
      .query(`
        SELECT Id_tipo_ruta
        FROM Orden_traslados
        WHERE ID_orden = @Orden
      `);
    // Devuelve el valor de Id_tipo_ruta si existe, sino, null
    return result.recordset.length > 0 ? result.recordset[0].Id_tipo_ruta : null;
  } catch (error) {
    // Manejo de error simple, puedes personalizarlo
    return null;
  }
}

/**
 * Obtiene casetas asociadas a una ruta.
 * @async
 * @private
 * @param {number} idRuta - ID de la ruta
 * @returns {Promise<Array|null>} Array de casetas o null
 */
const getCasetasFromRuta = async (idRuta) => {
  try {
    const pool = await getConnection();
    const { recordset } = await pool.request()
      .input("ruta", sql.Int, idRuta)
      .query(`
        SELECT *
        FROM PCasetasporruta
        WHERE Id_Ruta = @ruta 
      `);

    return recordset;
  } catch (error) {
    return null;
  }
}


/**
 * Obtiene aclaraciones asociadas a una orden de traslado específica.
 * @async
 * @function getAclaracionesByOT
 * @param {Object} req - Objeto de solicitud
 * @param {string} req.params.IDOrden - ID de la orden de traslado
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de aclaraciones enriquecidas
 * @throws {Error} Error 500 si falla
 * @description
 * Consulta aclaraciones de una orden específica con información completa:
 * - Ruta (origen - destino)
 * - Datos de caseta
 * - Tarifas por tipo de vehículo
 * - Diferencia calculada: ImporteOficial - Importe
 * - Campo 'cobrado' (tipo de vehículo deducido de ID_clave)
 * 
 * Ordenado por Fecha descendente.
 * @example
 * // GET /api/aclaraciones/ot/OT-12345
 * // Response
 * [
 *   {
 *     "ID": 1,
 *     "id_orden": "OT-12345",
 *     "Importe": 250.00,
 *     "ImporteOficial": 200.00,
 *     "diferencia": -50.00,
 *     "Origen": "Tlanalapa",
 *     "Destino": "Mexico DF",
 *     "ruta": "Tlanalapa - Mexico DF",
 *     "ID_clave": "C-5",
 *     "cobrado": "Camion5Ejes",
 *     "Nombre_IAVE": "Tlanalapa",
 *     "Camion5Ejes": 200.00,
 *     ...
 *   }
 * ]
 */
export const getAclaracionesByOT = async (req, res) => {
  try {
    const IDOrden = req.params.IDOrden;
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("IDOrden", sql.NVarChar, IDOrden)
      .query(`
SELECT DISTINCT
    CR.*,
    PB.Poblacion AS 'Origen',
    PBD.Poblacion AS 'Destino',
    OT.ID_orden,
    OT.ID_clave,
    CP.ID_Caseta,
    CP.Nombre_IAVE,
    CP.IAVE,
    cp.Automovil,
    cp.Autobus2Ejes,
    CP.Camion2Ejes,
    CP.Camion3Ejes,
    CP.Camion5Ejes,
    cp.Camion9Ejes,
    CP.Notas
FROM
    cruces CR
    LEFT JOIN
    Orden_traslados OT ON CR.id_orden = OT.ID_orden
    LEFT JOIN
    Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    LEFT JOIN
    PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    LEFT JOIN
    casetas_Plantillas CP ON CR.idCaseta = CP.ID_Caseta
    LEFT JOIN
    Poblaciones PB ON TRN.id_origen = PB.ID_poblacion
    LEFT JOIN
    Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion

WHERE 
    CR.id_orden = @IDOrden
    AND PCR.consecutivo IS NOT NULL
ORDER BY 
    CR.Fecha DESC;`);
    const claveToImporteField = {
      'A': 'Automovil',
      'B': 'Autobus2Ejes',
      'C-2': 'Camion2Ejes',
      'C-3': 'Camion3Ejes',
      'C-4': 'Camion3Ejes',
      'C-5': 'Camion5Ejes',
      'C-9': 'Camion9Ejes'
    };

    for (const row of result.recordset) {
      row.ruta = `${row.Origen} - ${row.Destino}`;
      row.cobrado = claveToImporteField[row.ID_clave.trim()] || 'Camion9Ejes';
      row.diferencia = row.ImporteOficial - row.Importe;
    }

    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



/**
 * Actualiza información completa de una aclaración.
 * @async
 * @function UpdateAclaracion
 * @param {Object} req - Objeto de solicitud
 * @param {string} req.params.id - ID de la aclaración/cruce
 * @param {string} req.body.noAclaracion - Número de aclaración
 * @param {string} req.body.FechaDictamen - Fecha del dictamen
 * @param {string} req.body.estatusSecundario - Nuevo estado (pendiente_aclaracion, aclaracion_levantada, dictaminado)
 * @param {string} req.body.observaciones - Observaciones/notas
 * @param {boolean} req.body.dictaminado - ¿Ha sido dictaminado?
 * @param {number} req.body.montoDictaminado - Monto del dictamen
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con mensaje de éxito
 * @throws {Error} 500 si falla
 * @example
 * // PUT /api/aclaraciones/1
 * // Body
 * {
 *   "noAclaracion": "ACL-2025-001",
 *   "FechaDictamen": "2025-12-01",
 *   "estatusSecundario": "aclaracion_levantada",
 *   "observaciones": "Reembolso autorizado",
 *   "dictaminado": true,
 *   "montoDictaminado": 50.00
 * }
 * // Response
 * {
 *   "message": "Estatus aclaracion_levantada actualizado correctamente sobre el ID 1"
 * }
 */
export const UpdateAclaracion = async (req, res) => {
  const { id } = req.params;
  const { noAclaracion, FechaDictamen, estatusSecundario, observaciones, dictaminado, montoDictaminado } = req.body;

  try {
    const pool = await getConnection();
    console.log("UpdateAclaracion", id, noAclaracion, FechaDictamen, estatusSecundario, observaciones, dictaminado, montoDictaminado);
    const result = await pool.request()
      .input("FechaDictamen", sql.VarChar, FechaDictamen)
      .input("noAclaracion", sql.VarChar, noAclaracion)
      .input("dictaminado", sql.Bit, dictaminado)
      .input("observaciones", sql.VarChar, observaciones)
      .input("estatusSecundario", sql.VarChar, estatusSecundario)
      .input("montoDictaminado", sql.Decimal(18, 2), (montoDictaminado || 0))
      .input("id", sql.VarChar, id)
      .query`UPDATE cruces SET NoAclaracion = @noAclaracion, FechaDictamen = @FechaDictamen, aplicado = @dictaminado, observaciones = @observaciones, Estatus_Secundario = @estatusSecundario, montoDictaminado = @montoDictaminado WHERE ID = @id`;
    res.status(200).json({
      message: `Estatus ${estatusSecundario} actualizado correctamente sobre el ID ${id}`,
    });
  } catch (error) {
    console.error("Error actualizando estatus:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
