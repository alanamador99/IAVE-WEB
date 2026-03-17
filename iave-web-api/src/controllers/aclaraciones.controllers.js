/**
 * @module aclaraciones.controllers
 * @description
 * Controlador para gestión de ACLARACIONES en el sistema IAVE.
 * Una aclaración es un ticket que se levanta en el portal de PASE por diferencia en cobro de peaje.
 * 
 * Puede ocurrir cuando:
 * - Se cobra una tarifa incorrecta (mayor a la programada)
 * - Hay error en clasificación del vehículo
 * - Duplicación de cobro de la caseta 
 * - Error del sistema
 * 
 * Funcionalidades principales de este controlador:
 * - Consultar aclaraciones registradas
 * - Filtrar por orden de traslado
 * - Calcular diferencia entre importe cobrado e importe oficial
 * - Actualizar estatus de aclaraciones
 * - Generar estadísticas
 * 
 * Estados secundarios:
 * - pendiente_aclaracion: Aclaración identificada, pendiente levantar aclaración en el portal PASE
 * - aclaracion_levantada: Aclaración registrada en el portal PASE, pendiente de dictaminación por parte del proveedor para saber si procedió o no.
 * - dictaminado: Dictamen emitido sobre la aclaración (Pueden no ser procedente).
 * - completado: Proceso finalizado
 * 
 * @requires ../database/connection.js - Es necesario iniciar una conexión a la base de datos SQL-Server, mediante el motor MSSQL.
 */

import { getConnection, sql } from "../database/connection.js";


const clientesConectados = new Map();


/**
 * Obtiene todas las aclaraciones registradas en el sistema.
 * @async
 * @function getAclaraciones
 * @param {Object} req - Objeto de solicitud (sin parámetros)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de aclaraciones enriquecidas
 * @throws {Error} Error 500 si falla
 * @description
 * Consultamos la tabla de Cruces donde Estatus='Aclaración' e incluye:
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
      LEFT JOIN Orden_traslados OT
          ON CR.id_orden = OT.ID_orden
      LEFT JOIN casetas_Plantillas CP
          ON CR.idCaseta = CP.ID_Caseta
      WHERE CR.Estatus = 'Aclaración'
      ORDER BY  CR.Estatus_Secundario DESC, CR.MontoDictaminado DESC,  CR.Fecha DESC;`);
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
        SUM(CASE WHEN Estatus_Secundario = 'Aprobado' THEN 1 ELSE 0 END) AS Aprobado_count,
        SUM(CASE WHEN Estatus_Secundario = 'Rechazado' THEN 1 ELSE 0 END) AS Rechazado_count,

      -- Montos por estatus
        SUM(CASE WHEN Estatus_Secundario = 'pendiente_aclaracion' THEN (cruces.Importe - cruces.ImporteOficial) ELSE 0 END) AS pendiente_monto,
        SUM(CASE WHEN Estatus_Secundario = 'aclaracion_levantada' THEN (COALESCE (cruces.montoDictaminado, cruces.Importe - cruces.ImporteOficial )) ELSE 0 END) AS aclaracion_levantada_monto,
        SUM(CASE WHEN Estatus_Secundario = 'Aprobado' THEN (cruces.montoDictaminado) ELSE 0 END) AS Aprobado_monto,
        SUM(CASE WHEN Estatus_Secundario = 'Rechazado' THEN (cruces.montoDictaminado) ELSE 0 END) AS Rechazado_monto,

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
      row.diferencia = (row.montoDictaminado>0)? row.montoDictaminado  : row.ImporteOficial - row.Importe;
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





/**
 * Suscribe al cliente a eventos SSE para recibir progreso de operaciones largas.
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
export const subscribeToProgress = (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  clientesConectados.set(clientId, res);

  // Mensaje de conexión
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Conectado al stream de progreso' })}\n\n`);

  req.on('close', () => {
    clientesConectados.delete(clientId);
  });
};

const sendProgressToClients = (progressData) => {
  const message = `data: ${JSON.stringify(progressData)}\n\n`;

  clientesConectados.forEach((client, clientId) => {
    try {
      client.write(message);
    } catch (error) {
      console.error(`Error enviando a cliente ${clientId}:`, error);
      clientesConectados.delete(clientId);
    }
  });
};



export const importFoliosFromCruces = async (req, res) => {
  const pool = await getConnection();
  const cruces = req.body;
  const usuario = req.headers["x-usuario"] || "desconocido";

  if (!Array.isArray(cruces) || cruces.length === 0) {
    return res.status(400).json({ error: "Datos inválidos o vacíos" });
  }

  try {
    await getConnection();
    let insertados = 0;
    let omitidos = {
      incompletos: 0,
      duplicados: 0,
    };

    const totalCruces = cruces.length;

    // Enviar inicio del proceso
    sendProgressToClients({
      type: 'start',
      total: totalCruces,
      processed: 0,
      inserted: 0,
      skipped: 0,
      percentage: 0,
      message: 'Iniciando procesamiento de cruces...'
    });

    // Iterar sobre cada cruce
    let i = 0;
    for (const cruce of cruces) {
      i++;

      // Enviar progreso cada 10 cruces o en cruces importantes
      if (i % 10 === 0 || i === 1 || i === totalCruces) {
        const percentage = Math.round((i / totalCruces) * 100);
        sendProgressToClients({
          type: 'progress',
          total: totalCruces,
          processed: i,
          inserted: insertados,
          skipped: omitidos.incompletos + omitidos.duplicados,
          percentage: percentage,
          message: `Procesando cruce ${i} de ${totalCruces}...`
        });
      }

      const {
        IDCruceFolio,
        Folio
      } = cruce;

      if (!IDCruceFolio?.trim() || !Folio?.trim()) {
        omitidos.incompletos++;
        continue;
      }

      // Verificar si el cruce que se está verificando ya cuenta con el folio que se está intentando colocar


      const existe = await pool.request().input("ID", sql.NVarChar, IDCruceFolio)
        .input("Folio", sql.NVarChar, Folio)
        .query("SELECT COUNT(*) as existe FROM Cruces WHERE ID = @ID AND NoAclaracion = @Folio");


      if (existe.recordset[0].existe > 0) {
        omitidos.duplicados++;
        continue;
      }

      // Si el cruce no tiene un folio asignado, se procede a asignar el folio y actualizar su estatus a "Aclaración" y el estatus secundario a "aclaracion_levantada"

      await pool.request().input("ID", sql.NVarChar, IDCruceFolio)
        .input("Folio", sql.NVarChar, Folio)
        .query("UPDATE Cruces SET NoAclaracion = @Folio, Estatus = 'Aclaración', Estatus_Secundario = 'aclaracion_levantada' WHERE ID = @ID");

      insertados++;
    }

    // Enviar progreso final
    sendProgressToClients({
      type: 'complete',
      total: totalCruces,
      processed: totalCruces,
      inserted: insertados,
      skipped: omitidos.incompletos + omitidos.duplicados,
      percentage: 100,
      message: 'Procesamiento completado',
      omitidos: omitidos
    });


    res.json({ insertados, omitidos });
  } catch (err) {
    console.error("❌ Error al guardar cruces:", err);

    // Enviar error a clientes SSE
    sendProgressToClients({
      type: 'error',
      message: 'Error durante el procesamiento',
      error: err.message
    });

    res.status(500).json({ error: "Error al importar los cruces" });
  }
};




//Vamos a desarrollar una función (basada en <<importFoliosFromCruces>>) que actualice el monto dictaminado, la fecha de dictamen, el estatus secundario y las observaciones de una aclaración específica, identificada por su ID. Esta función se llamará UpdateAclaracion y recibirá los datos necesarios a través del cuerpo de la solicitud (Se recibe un objeto obtenido desde pase, con estilo JSON, que tiene los campos:
/*
id
folio
clatran
status
prefijo
numero
fechaAclaracion
fechaDictamen
motivoId
motivo
importeCobrado
importeCorrecto
importeDevuelto
numtar
dictamen
idCaseta
nombreCaseta
idCarril
nombreCarril
clase
claseCorrecta
fechaCruce
horaCruce
comentario
puedeRedictaminar
numeroRedictamen
).
De momento, nos enfocaremos en actualizar los siguientes campos en la tabla de cruces:
- montoDictaminado: Se actualizará con el valor de importeDevuelto recibido en el cuerpo de la solicitud.
- FechaDictamen: Se actualizará con el valor de fechaDictamen recibido en el cuerpo de la solicitud.
- Estatus_Secundario: Se actualizará con base en el valor de dictamen recibido en el cuerpo de la solicitud.
- Observaciones: Se actualizará con el valor de comentario recibido en el cuerpo de la solicitud. 
Se realizaran el proceso para todos los registros que vengan dentro del json que se reciba. La función realizará una consulta SQL para actualizar los campos correspondientes en la tabla de cruces y responderá con un mensaje de éxito o error según corresponda.
*/


export const conciliarJSONfromPASE = async (req, res) => {
  const cruces = req.body;

  try {
    const pool = await getConnection();
    let insertados = 0;
    let omitidos = {
      incompletos: 0,
      duplicados: 0,
    };

    const totalCruces = cruces.length;

    // Enviar inicio del proceso
    sendProgressToClients({
      type: 'start',
      total: totalCruces,
      processed: 0,
      inserted: 0,
      skipped: 0,
      percentage: 0,
      message: 'Iniciando conciliación...'
    });

    let i = 0;
    for (const cruce of cruces) {
      i++;
      
      const {
        id,
        fechaDictamen,
        fechaCruce,
        horaCruce,
        dictamen,
        comentario,
        importeDevuelto,
        folio,
        numero,
        status
      } = cruce;

      // Enviar progreso cada 10 registros o al inicio/final
      if (i % 10 === 0 || i === 1 || i === totalCruces) {
        const percentage = Math.round((i / totalCruces) * 100);
        sendProgressToClients({
          type: 'progress',
          total: totalCruces,
          processed: i,
          inserted: insertados,
          skipped: omitidos.incompletos + omitidos.duplicados,
          percentage: percentage,
          message: `Procesando registro ${i} de ${totalCruces}`
        });
      }

      if (!id || !fechaCruce || !horaCruce) {
        omitidos.incompletos++;
        continue;
      }
      
      // IDCruce=concatenadoDe(yymmdd)+"_"+concatenadoDe(hhmmss)+"_"+numero
      // Aseguramos que son strings
      let fechaCruceStr = String(fechaCruce);
      let horaCruceStr = String(horaCruce);
      
      let fechaCruceFormatted = fechaCruceStr.replace(/-/g, "").slice(2); // yymmdd
      let horaCruceFormatted = horaCruceStr.replace(/:/g, ""); // hhmmss
      const IDCruce = `${fechaCruceFormatted}_${horaCruceFormatted}_${numero}`;

      const estatusSecundario = (status === "DICTAMINADO") ? "dictaminado" : "aclaracion_levantada";
      
      await pool.request()
        .input("ID", sql.NVarChar, IDCruce)
        .input("FechaDictamen", sql.Date, fechaDictamen)
        .input("montoDictaminado", sql.Decimal(18, 2), parseFloat(importeDevuelto) || 0)
        .input("estatusSecundario", sql.VarChar, estatusSecundario)
        .input("observaciones", sql.VarChar, comentario)
        .input("folio", sql.VarChar, folio)
        .query("UPDATE Cruces SET FechaDictamen = @FechaDictamen, montoDictaminado = @montoDictaminado, Estatus_Secundario = @estatusSecundario, observaciones = @observaciones, NoAclaracion = @folio WHERE ID = @ID");
      
      insertados++;
    }

    // Enviar progreso final
    sendProgressToClients({
      type: 'complete',
      total: totalCruces,
      processed: totalCruces,
      inserted: insertados,
      skipped: omitidos.incompletos + omitidos.duplicados,
      percentage: 100,
      message: 'Conciliación completada',
      omitidos: omitidos
    });

    res.json({ insertados, omitidos });
  } catch (err) {
    console.error("❌ Error al actualizar cruces:", err);
    
    // Enviar error a clientes SSE
    sendProgressToClients({
      type: 'error',
      message: 'Error durante la conciliación',
      error: err.message
    });

    res.status(500).json({ error: "Error al actualizar los cruces" });
  }
};
      