/**
 * @module abusos.controllers
 * @description
 * Controlador para gestión de ABUSOS en el sistema IAVE.
 * Los abusos son infracciones cometidas por operadores de transporte,
 * como exceso de velocidad, circulación en carril restringido, etc.
 * 
 * Funcionalidades principales:
 * - Consultar abusos registrados en el sistema
 * - Filtrar abusos por operador
 * - Agrupar abusos por fecha y operador
 * - Actualizar estatus de abusos (pendiente, reporte enviado, descuento aplicado, etc)
 * - Generar estadísticas de abusos
 * - Obtener ubicaciones geográficas de infracciones
 * 
 * Categorías de abusos:
 * - Incumplimiento de normas
 * 
 * Estados secundarios:
 * - pendiente_reporte: Abuso detectado, pendiente de reporte
 * - reporte_enviado_todo_pendiente: Reporte enviado, pendiente aplicación
 * - descuento_aplicado_pendiente_acta: Descuento aplicado, pendiente acta
 * - acta_aplicada_pendiente_descuento: Acta aplicada, pendiente descuento
 * - completado: Proceso completo
 * - condonado: Perdonado/anulado
 * 
 * @requires ../database/connection.js - Conexión a base de datos MSSQL */

import { getConnection, sql } from "../database/connection.js";

¿


/**
 * Obtiene todos los abusos registrados en el sistema.
 * @async
 * @function getAbusos
 * @param {Object} req - Objeto de solicitud (sin parámetros)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de abusos con información enriquecida
 * @throws {Error} Error 500 si falla la conexión
 * @description
 * Consulta tabla Cruces donde Estatus='Abuso' con información adicional:
 * - Estado personal del operador en esa fecha
 * - Datos del operador (nombre, apellidos)
 * - Enriquece NombreCompleto si está vacío usando No_Economico
 * 
 * Lógica especial:
 * - Solo obtiene el PRIMER estado del operador por fecha (rn=1)
 * - Usa CTE PrimerEstado para evitar duplicados
 * @example
 * // GET /api/abusos
 * // Response (200 OK)
 * [
 *   {
 *     "ID_Cruce": 1,
 *     "ID_Matricula": 123,
 *     "NombreCompleto": "Carlos García López",
 *     "Nombres": "Carlos",
 *     "Apellidos": "García López",
 *     "FechaAbuso": "2025-12-01",
 *     "Estatus": "Abuso",
 *     "Estatus_Secundario": "pendiente_reporte",
 *     "No_Economico": "123 Carlos García López",
 *     "Importe": 250.00,
 *     "Estado_Personal": "ACTIVO",
 *     ...
 *   },
 *   {...}
 * ]
 */
export const getAbusos = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
WITH PrimerEstado AS (
    SELECT *,
           ROW_NUMBER() OVER(PARTITION BY ID_matricula, ID_fecha 
                             ORDER BY ID_fecha ASC) AS rn
    FROM Estado_del_personal
)
SELECT DISTINCT
    TRY_CONVERT(int, LEFT(cr.No_Economico, CHARINDEX(' ', cr.No_Economico+' ')-1)) AS ID_Matricula,
    CONCAT(Per.nombres, ' ', Per.Ap_paterno,' ', Per.Ap_materno) AS NombreCompleto,
    CAST(CR.Fecha AS date) AS FechaAbuso,
    CR.*,
    EP.Descripcion AS Estado_Personal,
    Per.Nombres,
    CONCAT(Per.Ap_paterno,' ', Per.Ap_materno) AS Apellidos
FROM cruces CR
LEFT JOIN PrimerEstado EP
    ON TRY_CONVERT(int, LEFT(CR.No_Economico, CHARINDEX(' ', CR.No_Economico+' ')-1)) = EP.ID_matricula
   AND CAST(CR.Fecha AS date) = EP.ID_fecha
   AND EP.rn = 1  -- <-- Solo el primer estado por operador y fecha
   LEFT JOIN
   Personal Per on Per.ID_matricula = EP.ID_matricula
WHERE CR.Estatus = 'Abuso' ORDER BY CR.ID DESC;

`);
    for (const row of result.recordset) {
      row.NombreCompleto = (row.NombreCompleto.trim().length > 0 ? row.NombreCompleto : row.No_Economico.split(' ')[1]);
      row.Nombres = (row.Nombres ? row.Nombres : row.No_Economico.split(' ')[1]);
    }
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


/**
 * Obtiene abusos de un operador específico.
 * @async
 * @function getAbusosByOperador
 * @param {Object} req - Objeto de solicitud
 * @param {string} req.params.operador - ID de matrícula del operador
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de abusos del operador
 * @throws {Error} Error 500 si falla
 * @description
 * Retorna abusos y abusos condonados de un operador.
 * Ordenados por Estatus_Secundario (asc) y Fecha (desc).
 * 
 * ⚠️ NOTA: Usa interpolación SQL directa (vulnerable a SQL injection).
 * Debería usar parametrizadas como en otros endpoints.
 * @example
 * // GET /api/abusos/operador/123
 * // Response
 * [
 *   {
 *     "ID": 1,
 *     "No_Economico": "123 Carlos García",
 *     "Estatus": "Abuso",
 *     "Estatus_Secundario": "condonado",
 *     "Fecha": "2025-12-01",
 *     ...
 *   }
 * ]
 */
export const getAbusosByOperador = async (req, res) => {
  try {
    const { operador } = req.params;
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT * FROM cruces WHERE (Estatus='Abuso' OR Estatus_Secundario='Condonado') AND SUBSTRING(No_Economico, 1, CHARINDEX(' ', No_Economico) - 1) = '${operador}' ORDER BY Estatus_Secundario asc, Fecha DESC`);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

/**
 * Obtiene ubicaciones geográficas de un abuso específico durante ese día.
 * @async
 * @function getUbicacionesinADayByOperador
 * @param {Object} req - Objeto de solicitud
 * @param {string} req.params.IDCruce - ID del cruce/abuso
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con ubicaciones y polilíneas
 * @throws {Error} Error 500 si falla
 * @description
 * Obtiene registro de geolocalización (tabla geo_op) para el operador en esa fecha.
 * Retorna:
 * - ubicaciones: Array completo de registros geo
 * - polylines: Array de coordenadas filtradas (sin [0,0])
 * 
 * Si no hay geolocalización, usa fallback con datos del cruce.
 * @example
 * // GET /api/abusos/ubicaciones/1
 * // Response (200 OK)
 * {
 *   "ubicaciones": [
 *     {
 *       "latitud": "20.3456",
 *       "longitud": "-99.1234",
 *       "fecha": "2025-12-01T10:30:00",
 *       "fk_op": 123,
 *       "Nombres": "Carlos",
 *       "Ap_paterno": "García",
 *       "Ap_materno": "López"
 *     }
 *   ],
 *   "polylines": [[20.3456, -99.1234], [20.3500, -99.1300], ...]
 * }
 */
export const getUbicacionesinADayByOperador = async (req, res) => {
  try {
    const { IDCruce } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input("IDCruce", sql.VarChar, IDCruce)
      .query(`SELECT Ubi.*, ps.Nombres, ps.Ap_paterno, ps.Ap_materno, cruces.*
FROM cruces
    INNER JOIN Personal Ps
    ON PS.ID_matricula= SUBSTRING(No_Economico, 1, CHARINDEX(' ', No_Economico) - 1)
    INNER JOIN geo_op Ubi
    ON Ubi.fk_op = PS.ID_matricula AND DATEFROMPARTS(YEAR(cruces.Fecha),MONTH(cruces.Fecha), DAY(cruces.Fecha)) = DATEFROMPARTS(YEAR(Ubi.fecha),MONTH(Ubi.fecha), DAY(Ubi.fecha))
WHERE  cruces.ID = @IDCruce
ORDER BY Ubi.fecha ASC`);
    console.log(result);


    if (result.recordset.length > 0) {
      /*
      Filtramos todas las coordenadas que sean [0,0]
      */
      const polyline = result.recordset.map(ubicacion => [parseFloat(ubicacion.latitud), parseFloat(ubicacion.longitud)]);
      const filteredPolyline = polyline.filter(coord => coord[0] !== 0 || coord[1] !== 0);
      res.status(200);
      res.json({ ubicaciones: result.recordset, polylines: filteredPolyline });
    }
    else {
      const fallbackQuery = await pool.request()
        .input("IDCruce", sql.VarChar, IDCruce)
        .query(`
SELECT ps.Nombres, ps.Ap_paterno, ps.Ap_materno, cruces.*
FROM cruces
    INNER JOIN Personal Ps
    ON PS.ID_matricula= SUBSTRING(No_Economico, 1, CHARINDEX(' ', No_Economico) - 1)
WHERE  Estatus='Abuso' AND cruces.ID = @IDCruce`);
      res.status(200)
      res.json({ ubicaciones: fallbackQuery.recordset });
    }

  } catch (error) {
    res.status(500).send(error.message);
  }
}



/**
 * Obtiene abusos agrupados por fecha y operador.
 * @async
 * @function getAbusosAgrupados
 * @param {Object} req - Objeto de solicitud (sin parámetros)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de grupos de abusos
 * @throws {Error} Error 500 si falla
 * @description
 * Agrupa abusos por fecha + operador con:
 * - Conteo de abusos en el grupo
 * - Importe total
 * - Información del operador
 * - Flag de verificación (Operador_Verificado)
 * 
 * Ordenado por fecha descendente.
 * @example
 * // GET /api/abusos/agrupados
 * // Response
 * [
 *   {
 *     "ID_Matricula_Agrupado": "2025-12-01_123",
 *     "Fecha_Cruce": "2025-12-01",
 *     "NumAbusos": 3,
 *     "TotalImporte": 750.00,
 *     "Nombre_Operador": "Carlos García López",
 *     "Descripcion": "ACTIVO",
 *     "Operador_Verificado": 1
 *   }
 * ]
 */
export const getAbusosAgrupados = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
    SELECT
    CONCAT( CAST(c.Fecha AS date),'_', LEFT(c.No_Economico, CHARINDEX(' ', c.No_Economico+' ')-1)) AS ID_Matricula_Agrupado,
    CAST(c.Fecha AS date) AS Fecha_Cruce,
    COUNT(*) AS NumAbusos,
    SUM(c.Importe) AS TotalImporte,
    MIN(op.Descripcion) AS Descripcion,
    LTRIM(RTRIM(
        COALESCE(per.Nombres, '') + ' ' + COALESCE(per.Ap_paterno, '') + ' ' + COALESCE(per.Ap_materno, '')
    )) AS Nombre_Operador,
    CASE WHEN op.ID_Matricula IS NOT NULL THEN 1 ELSE 0 END AS Operador_Verificado
FROM cruces c
    LEFT JOIN Estado_del_personal op 
        ON op.ID_Matricula = LEFT(c.No_Economico, CHARINDEX(' ', c.No_Economico+' ')-1)
       AND CAST(op.ID_fecha AS date) = CAST(c.Fecha AS date)
    INNER JOIN Personal per 
        ON per.ID_matricula = op.ID_matricula
WHERE c.Estatus = 'Abuso'
GROUP BY
    CONCAT(CAST(c.Fecha AS date),'_', LEFT(c.No_Economico, CHARINDEX(' ', c.No_Economico+' ')-1)),
    CAST(c.Fecha AS date),
    LTRIM(RTRIM(
        COALESCE(per.Nombres, '') + ' ' + COALESCE(per.Ap_paterno, '')  + ' ' + COALESCE(per.Ap_materno, '')
    )),
    CASE WHEN op.ID_Matricula IS NOT NULL THEN 1 ELSE 0 END
ORDER BY Fecha_Cruce DESC;
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

/**
 * Actualiza el comentario/observación de un abuso.
 * @async
 * @function actualizarComentarioAbuso
 * @param {Object} req - Objeto de solicitud
 * @param {string} req.params.ID - ID del cruce/abuso
 * @param {string} req.body.nuevoComentario - Nuevo texto de comentario
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con mensaje de éxito
 * @throws {Error} 500 si falla
 * @example
 * // PUT /api/abusos/comentario/1
 * // Body
 * {
 *   "nuevoComentario": "Operador reportó cambio de ruta"
 * }
 * // Response
 * {
 *   "message": "Comentario actualizado correctamente"
 * }
 */
export const actualizarComentarioAbuso = async (req, res) => {
  const { ID } = req.params;
  const { nuevoComentario } = req.body;

  try {
    const pool = await getConnection();

    const result = await pool.query`UPDATE cruces SET observaciones = ${nuevoComentario} WHERE ID = ${ID}`;
    res.status(200).json({ message: 'Comentario actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando estatus:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};


/**
 * Actualiza información completa de un abuso.
 * @async
 * @function UpdateAbuso
 * @param {Object} req - Objeto de solicitud
 * @param {string} req.params.id - ID del abuso/cruce
 * @param {string} req.body.noAclaracion - Número de aclaración
 * @param {string} req.body.FechaDictamen - Fecha del dictamen
 * @param {string} req.body.estatusSecundario - Nuevo estado (pendiente_reporte, completado, etc)
 * @param {string} req.body.observaciones - Observaciones
 * @param {boolean} req.body.dictaminado - ¿Ha sido dictaminado?
 * @param {number} req.body.montoDictaminado - Monto del dictamen
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con mensaje de éxito
 * @throws {Error} 500 si falla
 * @example
 * // PUT /api/abusos/1
 * // Body
 * {
 *   "noAclaracion": "AC-2025-001",
 *   "FechaDictamen": "2025-12-01",
 *   "estatusSecundario": "completado",
 *   "observaciones": "Descuento aplicado correctamente",
 *   "dictaminado": true,
 *   "montoDictaminado": 250.00
 * }
 * // Response
 * {
 *   "message": "Estatus completado actualizado correctamente sobre el ID 1"
 * }
 */
export const UpdateAbuso = async (req, res) => {
  const { id } = req.params;
  const { noAclaracion, FechaDictamen, estatusSecundario, observaciones, dictaminado, montoDictaminado } = req.body;

  try {
    const pool = await getConnection();
    console.log("UPDATE ABUSOOOOOOO", id, noAclaracion, FechaDictamen, estatusSecundario, observaciones, dictaminado, montoDictaminado);
    const result = await pool.request()
      .input("FechaDictamen", sql.VarChar, FechaDictamen)
      .input("noAclaracion", sql.VarChar, noAclaracion)
      .input("dictaminado", sql.Bit, dictaminado)
      .input("observaciones", sql.VarChar, observaciones)
      .input("estatusSecundario", sql.VarChar, estatusSecundario)
      .input("montoDictaminado", sql.Decimal(18, 2), (montoDictaminado || 0))
      .input("id", sql.VarChar, id)
      .query(`UPDATE cruces SET NoAclaracion = @noAclaracion, FechaDictamen = @FechaDictamen, aplicado = @dictaminado, observaciones = @observaciones, Estatus_Secundario = @estatusSecundario, montoDictaminado = @montoDictaminado WHERE ID = @id`);
    res.status(200).json({
      message: `Estatus ${estatusSecundario} actualizado correctamente sobre el ID ${id}`,
    });
  } catch (error) {
    console.error("Error actualizando estatus:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
/**
 * Actualiza el estado de múltiples abusos simultáneamente.
 * @async
 * @function actualizarEstatusMasivo
 * @param {Object} req - Objeto de solicitud
 * @param {Array<string>} req.body.ids - Array de IDs de abusos
 * @param {string} req.body.nuevoEstatus - Nuevo estado secundario
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con mensaje de éxito
 * @throws {Error} 400 si datos inválidos; 500 si falla BD
 * @example
 * // PUT /api/abusos/masivo
 * // Body
 * {
 *   "ids": ["1", "2", "3"],
 *   "nuevoEstatus": "completado"
 * }
 * // Response
 * {
 *   "message": "Estatus actualizado correctamente"
 * }
 */
export const actualizarEstatusMasivo = async (req, res) => {
  const { ids, nuevoEstatus } = req.body;
  if (!Array.isArray(ids) || !nuevoEstatus) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  try {
    const pool = await getConnection();
    await pool.request().query(`
        UPDATE cruces
        SET Estatus_Secundario = '${nuevoEstatus}'
        WHERE ID IN (${"'"}${ids.join("','")}${"'"}) AND Estatus = 'Abuso'
      `);
    res.status(200).json({ message: "Estatus actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



/**
 * Obtiene estadísticas agregadas de abusos.
 * @async
 * @function getStatsAbusos
 * @param {Object} _ - Objeto de solicitud (no utilizado)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con estadísticas de abusos
 * @throws {Error} Error 500 si falla
 * @description
 * Retorna conteos y montos por estado secundario:
 * - pendiente_reporte: Abusos detectados sin reporte
 * - reporte_enviado_todo_pendiente: Reporte enviado
 * - descuento_aplicado_pendiente_acta: Descuento aplicado
 * - acta_aplicada_pendiente_descuento: Acta aplicada
 * - completado: Proceso finalizado
 * 
 * Incluye totales generales de conteo e importes.
 * @example
 * // GET /api/abusos/stats
 * // Response
 * [
 *   {
 *     "pendiente_reporte_count": 45,
 *     "pendiente_reporte_monto": 11250.00,
 *     "reporte_enviado_todo_pendiente_count": 30,
 *     "reporte_enviado_todo_pendiente_monto": 7500.00,
 *     "descuento_aplicado_pendiente_acta_count": 12,
 *     "descuento_aplicado_pendiente_acta_monto": 3000.00,
 *     "acta_aplicada_pendiente_descuento_count": 8,
 *     "acta_aplicada_pendiente_descuento_monto": 2000.00,
 *     "completado_count": 25,
 *     "completado_monto": 6250.00,
 *     "total_count": 120,
 *     "total_monto": 30000.00
 *   }
 * ]
 */
export const getStatsAbusos = async (_, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
    SELECT 
      -- Conteos por estatus
        SUM(CASE WHEN Estatus_Secundario = 'pendiente_reporte' THEN 1 ELSE 0 END) AS pendiente_reporte_count,
        SUM(CASE WHEN Estatus_Secundario = 'reporte_enviado_todo_pendiente' THEN 1 ELSE 0 END) AS reporte_enviado_todo_pendiente_count,
        SUM(CASE WHEN Estatus_Secundario = 'descuento_aplicado_pendiente_acta' THEN 1 ELSE 0 END) AS descuento_aplicado_pendiente_acta_count,
        SUM(CASE WHEN Estatus_Secundario = 'acta_aplicada_pendiente_descuento' THEN 1 ELSE 0 END) AS acta_aplicada_pendiente_descuento_count,
        SUM(CASE WHEN Estatus_Secundario = 'completado' THEN 1 ELSE 0 END) AS completado_count,

      -- Montos por estatus
        SUM(CASE WHEN Estatus_Secundario = 'pendiente_reporte' THEN Importe ELSE 0 END) AS pendiente_reporte_monto,
        SUM(CASE WHEN Estatus_Secundario = 'reporte_enviado_todo_pendiente' THEN Importe ELSE 0 END) AS reporte_enviado_todo_pendiente_monto,
        SUM(CASE WHEN Estatus_Secundario = 'descuento_aplicado_pendiente_acta' THEN montoDictaminado ELSE 0 END) AS descuento_aplicado_pendiente_acta_monto,
        SUM(CASE WHEN Estatus_Secundario = 'acta_aplicada_pendiente_descuento' THEN Importe ELSE 0 END) AS acta_aplicada_pendiente_descuento_monto,
        SUM(CASE WHEN Estatus_Secundario = 'completado' THEN montoDictaminado ELSE 0 END) AS completado_monto,

      -- Totales generales
        COUNT(*) AS total_count,
        SUM(Importe) AS total_monto

    FROM Cruces
    WHERE Estatus = 'abuso';
    `);


    res.json(result.recordset);

  } catch (error) {
    console.error("Error en getStatsAbusos:", error);
    res.status(500).send(error.message);
  }
};