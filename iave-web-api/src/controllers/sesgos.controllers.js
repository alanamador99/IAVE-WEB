/**
 * Controlador de Sesgos - IAVE WEB API
 * 
 * Este módulo gestiona las operaciones relacionadas con "sesgos" en los cruces.
 * Los sesgos son discrepancias o anomalías detectadas durante el procesamiento de cruces,
 * principalmente casos donde no se encuentra una caseta en la ruta registrada.
 * 
 * Funcionalidades:
 * - Consulta de cruces con estatus "CasetaNoEncontradaEnRuta"
 * - Análisis de rutas que presentan sesgos
 * - Gestión de tickets/reportes de sesgos (asignación, seguimiento)
 * - Estadísticas de sesgos por estado (asignado, en proceso, finalizado)
 * - Actualización de estatus y comentarios en reportes de sesgos
 * 
 * @module sesgos.controllers
 * @requires ../database/connection.js
 */

import { getConnection, sql } from "../database/connection.js";

/**
 * Normaliza un nombre de lugar removiendo caracteres especiales y acentos
 * 
 * Convierte a mayúsculas y remueve puntos, guiones y acentos para facilitar
 * comparaciones exactas entre nombres de diferentes fuentes.
 * 
 * @param {string} nombre - Nombre a normalizar (ej: "Sólo-la Paz")
 * @returns {string} Nombre normalizado en mayúsculas sin acentos (ej: "SOLOLA PAZ")
 * 
 * @example
 * normalize("Caseta-Sólo") // "CASETA SOLO"
 */
function normalize(nombre) {
  return nombre.toUpperCase().replace(/[-.]/g, '').trim().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
}

/**
 * Obtiene todos los cruces con estatus "CasetaNoEncontradaEnRuta"
 * 
 * Un cruce tiene este estatus cuando:
 * - La caseta del cruce no se encuentra en la ruta registrada para esa OT
 * - Esto indica un sesgo o discrepancia que requiere investigación
 * 
 * Los resultados se ordenan por ID descendente (más recientes primero).
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object[]>} Array de cruces con campo Estatus = "CasetaNoEncontradaEnRuta"
 * @returns {Object[]} Array vacío si no hay sesgos
 * @returns {Object} error - Si ocurre un error en la BD (500)
 * 
 * @example
 * GET /api/sesgos
 * Response: [
 *   {
 *     ID: "251125_143045_1234",
 *     No_Economico: "123 Carlos García",
 *     Caseta: "Caseta Desconocida",
 *     Importe: 150,
 *     Estatus: "CasetaNoEncontradaEnRuta",
 *     ...
 *   }
 * ]
 */
export const getSesgos = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM cruces WHERE Estatus = 'CasetaNoEncontradaEnRuta' OR Estatus = 'Sesgos' OR Estatus LIKE '%Ruta Sin Casetas%' ORDER BY ID DESC");
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};


/**
 * Obtiene las rutas que contienen cruces con estatus "CasetaNoEncontradaEnRuta"
 * 
 * Análisis detallado:
 * 1. Identifica todas las rutas que tienen al menos un cruce con caseta no encontrada
 * 2. Retorna información completa de esas rutas (Km, peajes, poblaciones, etc.)
 * 3. Calcula la categoría de ruta basada en campos booleanos (Latinos, Nacionales, etc.)
 * 
 * ## Lógica de Categoría:
 * - Si 1 campo booleano está activo → Esa es la categoría
 * - Si 2 campos activos y uno es "Alterna" → La categoría es el otro campo
 * - Si ninguna condición se cumple → Categoría = null
 * 
 * ## Campos Booleanos:
 * Latinos, Nacionales, Exportacion, Otros, Cemex, Alterna
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object[]>} Array de rutas con sesgos enriquecidas
 * 
 * @returns {Object} Cada ruta incluye:
 * - **ID_ruta**: ID único de la ruta
 * - **id_Tipo_ruta**: Tipo de ruta
 * - **Categoria**: Categoría calculada (Latinos, Nacionales, etc.)
 * - **PoblacionOrigen**: Población de origen
 * - **PoblacionDestino**: Población de destino
 * - **RazonOrigen**: Razón social del origen
 * - **RazonDestino**: Razón social del destino
 * - **Km_reales**: Kilómetros reales
 * - **Km_oficiales**: Kilómetros oficiales
 * - **Km_de_pago**: Kilómetros de pago
 * - **Km_Tabulados**: Kilómetros tabulados
 * - **peaje_dos_ejes**: Tarifa peaje 2 ejes
 * - **peaje_tres_ejes**: Tarifa peaje 3 ejes
 * - **Observaciones**: Notas sobre la ruta
 * - **fecha_Alta**: Fecha de creación de la ruta
 * 
 * @example
 * GET /api/sesgos/por-casetas
 * Response: [
 *   {
 *     ID_ruta: "1001",
 *     id_Tipo_ruta: "TR-1",
 *     Categoria: "Latinos",
 *     PoblacionOrigen: "Guadalajara",
 *     PoblacionDestino: "Monterrey",
 *     RazonOrigen: "Terminal Guadalajara",
 *     RazonDestino: "Terminal Monterrey",
 *     Km_reales: 850,
 *     Km_oficiales: 860,
 *     Km_de_pago: 860,
 *     Km_Tabulados: 850,
 *     peaje_dos_ejes: 450,
 *     peaje_tres_ejes: 650,
 *     ...
 *   }
 * ]
 */
export const getSesgosPorCasetas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      
WITH RutasConCasetasNoEncontradas AS (
    SELECT DISTINCT TRN.id_Tipo_ruta
    FROM Tipo_de_ruta_N TRN
    INNER JOIN Orden_traslados OT ON OT.Id_tipo_ruta = TRN.id_Tipo_ruta
    INNER JOIN cruces CR ON CR.id_orden = OT.ID_orden
    WHERE CR.Estatus = 'CasetaNoEncontradaEnRuta'
)
SELECT DISTINCT
    TRN.ID_ruta,
    TRN.id_Tipo_ruta,
    TRN.Latinos,
    TRN.Nacionales,
    TRN.Exportacion,
    TRN.Otros,
    TRN.Cemex,
    TRN.Alterna,
    TRN.Observaciones,
    TRN.fecha_Alta,
    TRN.Km_reales,
    TRN.Km_oficiales,
    TRN.Km_de_pago,
    TRN.Km_Tabulados,
    TRN.peaje_dos_ejes,
    TRN.peaje_tres_ejes,
    PBO.Poblacion AS "PoblacionOrigen",
    PBD.Poblacion AS "PoblacionDestino",
    DIR_O.Razon_social as "RazonOrigen",
    DIR_D.Razon_social as "RazonDestino"
FROM Tipo_de_ruta_N TRN
    INNER JOIN Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
    INNER JOIN Poblaciones PBO ON TRN.id_origen = PBO.ID_poblacion
    INNER JOIN Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
    INNER JOIN Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
WHERE TRN.id_Tipo_ruta IN (SELECT id_Tipo_ruta FROM RutasConCasetasNoEncontradas)
ORDER BY TRN.id_Tipo_ruta ASC
      `);
    for (const row of result.recordset) {
      // Determina la categoría según los campos booleanos
      const campos = ['Latinos', 'Nacionales', 'Exportacion', 'Otros', 'Cemex', 'Alterna'];
      const activos = campos.filter(campo => row[campo] === true);

      if (activos.length === 1) {
        row.Categoria = activos[0];
      } else if (activos.length === 2 && activos.includes('Alterna')) {
        // Si hay dos activos y uno es Alterna, asigna el otro campo como categoría
        row.Categoria = activos.find(campo => campo !== 'Alterna');
        row.Alterna = true; // Agrega el campo Alterna como bandera alzada
      } else {
        row.Categoria = null; // No cumple la condición
      }
      campos.forEach(campo => {
        delete row[campo];
      });
    }
    res.json(result.recordset);
  } catch (error) {
    console.log(error);
    res.status(500);
    res.send(error.message);
  }
};




/**
 * Obtiene todos los sesgos/reportes asociados a una Orden de Traslado específica
 * 
 * Los sesgos son tickets o reportes creados cuando se detectan anomalías
 * durante el procesamiento de cruces de una OT particular.
 * 
 * ## Estados posibles de un Sesgo:
 * - **asignado**: Se asignó a un operador pero no ha empezado investigación
 * - **en_proceso**: Se está investigando activamente
 * - **finalizado**: Investigación completada
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {string} req.params.IDOrden - ID de la orden de traslado (ej: "OT-12345")
 * @param {Object} res - Objeto response
 * @returns {Promise<Object[]>} Array de sesgos/reportes para esa OT
 * @returns {Object[]} Array vacío si no hay sesgos para esa OT
 * @returns {Object} error - Si ocurre un error en la BD (500)
 * 
 * @example
 * GET /api/sesgos/orden/OT-12345
 * Response: [
 *   {
 *     ID: 1,
 *     IDOrden: "OT-12345",
 *     Estatus: "en_proceso",
 *     Comentarios: "Caseta no identificada en ruta",
 *     FechaCreacion: "2025-11-25T14:30:00.000Z",
 *     ...
 *   }
 * ]
 */
export const getSesgosByOT = async (req, res) => {
  try {
    const { IDOrden } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input("IDOrden", sql.Int, IDOrden)
      .query("SELECT * FROM cruces WHERE id_orden = @IDOrden");
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



/**
 * Obtiene estadísticas de sesgos agrupados por estado
 * 
 * Retorna el conteo total de sesgos/reportes clasificados por su estado actual:
 * - **asignados**: Sesgos asignados pero sin investigación iniciada
 * - **en_proceso**: Sesgos siendo investigados activamente
 * - **finalizados**: Sesgos con investigación completada
 * 
 * Útil para dashboards y reportes de seguimiento.
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object>} Objeto con conteos de cada estado
 * @returns {Object.asignados} Número de sesgos asignados
 * @returns {Object.en_proceso} Número de sesgos en investigación
 * @returns {Object.finalizados} Número de sesgos finalizados
 * 
 * @example
 * GET /api/sesgos/stats
 * Response: [
 *   {
 *     asignados: 15,
 *     en_proceso: 28,
 *     finalizados: 127
 *   }
 * ]
 */
export const getStats = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Sesgos WHERE Estatus = 'asignado') AS asignados,
        (SELECT COUNT(*) FROM Sesgos WHERE Estatus = 'en_proceso') AS en_proceso,
        (SELECT COUNT(*) FROM Sesgos WHERE Estatus = 'finalizado') AS finalizados
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};


/**
 * Actualiza el estatus y comentarios de un sesgo/reporte
 * 
 * Permite cambiar el estado de un sesgo en el flujo de investigación:
 * - asignado → en_proceso → finalizado
 * 
 * Los comentarios se usan para documentar el progreso y hallazgos
 * de la investigación del sesgo.
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {string} req.params.id - ID del sesgo a actualizar
 * @param {Object} req.body - Body con datos a actualizar
 * @param {string} req.body.Estatus - Nuevo estatus (asignado, en_proceso, finalizado)
 * @param {string} req.body.Comentarios - Observaciones/hallazgos de la investigación
 * @param {Object} res - Objeto response
 * @returns {Promise<void>} Status 204 (No Content) si exitoso
 * @returns {Object} error - Si ocurre un error en la BD (500)
 * 
 * @example
 * PUT /api/sesgos/1
 * Body: {
 *   "Estatus": "en_proceso",
 *   "Comentarios": "Se está investigando la caseta no encontrada"
 * }
 * Response: 200 OK 'Estatus en_proceso actualizado correctamente sobre el ID 251125_143046_1234'
 * 
 * @example
 * PUT /api/sesgos/1
 * Body: {
 *   "Estatus": "finalizado",
 *   "Comentarios": "Caseta encontrada: Era 'Caseta Sahagún' con nombre alternativo"
 * }
 * Response: 200 OK 'Estatus finalizado actualizado correctamente sobre el ID 251125_143046_1234'
 */
export const UpdateSesgo = async (req, res) => {
  try {
    const { id } = req.params;
    const { Estatus, Comentarios } = req.body;
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, id)
      .input("Estatus", sql.VarChar, Estatus)
      .input("Comentarios", sql.VarChar, Comentarios)
      .query(`UPDATE Sesgos SET Estatus_Secundario = @Estatus, Comentarios = @Comentarios WHERE ID = @id`);
    res.status(200).json({
      message: `Estatus ${Estatus} actualizado correctamente sobre el ID ${id}`,
    });
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};






/**
 * Actualiza el estatus y comentarios de un sesgo/reporte
 * 
 * Permite cambiar el estado de un sesgo en el flujo de investigación:
 * - asignado → en_proceso → finalizado
 * 
 * Los comentarios se usan para documentar el progreso y hallazgos
 * de la investigación del sesgo.
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {string} req.params.id - ID del sesgo a actualizar
 * @param {Object} req.body - Body con datos a actualizar
 * @param {string} req.body.Estatus - Nuevo estatus (asignado, en_proceso, finalizado)
 * @param {string} req.body.Comentarios - Observaciones/hallazgos de la investigación
 * @param {Object} res - Objeto response
 * @returns {Promise<void>} Status 204 (No Content) si exitoso
 * @returns {Object} error - Si ocurre un error en la BD (500)
 * 
 * @example
 * PUT /api/sesgos/1
 * Body: {
 *   "Estatus": "en_proceso",
 *   "Comentarios": "Se está investigando la caseta no encontrada"
 * }
 * Response: 200 OK 'Estatus en_proceso actualizado correctamente sobre el ID 251125_143046_1234'
 * 
 * @example
 * PUT /api/sesgos/1
 * Body: {
 *   "Estatus": "finalizado",
 *   "Comentarios": "Caseta encontrada: Era 'Caseta Sahagún' con nombre alternativo"
 * }
 * Response: 200 OK 'Estatus finalizado actualizado correctamente sobre el ID 251125_143046_1234'
 */
export const getNearDirectorios = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Latitud y longitud requeridas' });
  }

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('latitud', sql.Float, parseFloat(lat))
      .input('longitud', sql.Float, parseFloat(lng))
      .query(`
        SELECT 
          ID_entidad,
          Nombre,
          Razon_social,
          latitud,
          longitud,
          (
            6371 * ACOS(
              COS(RADIANS(@latitud)) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT))) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(longitud)), CHAR(9), ''), ' ', '') AS FLOAT)) - RADIANS(@longitud)) 
              + SIN(RADIANS(@latitud)) 
              * SIN(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT)))
            )
          ) AS distancia_km
        FROM Directorio
        WHERE TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT) IS NOT NULL 
          AND TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(longitud)), CHAR(9), ''), ' ', '') AS FLOAT) IS NOT NULL
          AND (
            6371 * ACOS(
              COS(RADIANS(@latitud)) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT))) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(longitud)), CHAR(9), ''), ' ', '') AS FLOAT)) - RADIANS(@longitud)) 
              + SIN(RADIANS(@latitud)) 
              * SIN(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT)))
            )
          ) <= 2
        ORDER BY distancia_km
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener directorio cercano' });
  }
};
