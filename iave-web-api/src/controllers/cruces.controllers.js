/**
 * Controlador de Cruces - IAVE WEB API
 * 
 * Este módulo gestiona todas las operaciones relacionadas con los registros de "cruces" (pasos)
 * de vehículos a través de casetas de peaje. Incluye funcionalidades para:
 * 
 * - Importación masiva de cruces desde archivos CSV/Excel
 * - Consulta de estado del personal en fechas específicas
 * - Conciliación de cruces con órdenes de traslado (OT)
 * - Actualización de estatus y órdenes de cruces
 * - Estadísticas y consultas generales
 * - Streaming de progreso en importaciones mediante SSE (Server-Sent Events)
 * 
 * @module cruces.controllers
 * @requires ../database/connection.js
 */

import { getConnection, sql } from "../database/connection.js";

/**
 * Almacena las conexiones SSE activas para notificaciones de progreso en tiempo real
 * @type {Map<string, Response>}
 */
const clientesConectados = new Map();

/**
 * Lista de matrículas administrativas para identificar vehículos no operacionales
 * Se utiliza para evitar errores en el parseo de matrículas y clasificar bases
 * @type {string[]}
 */
const matriculasAdmins = [
  "1", "165", "166", "1436", "1224", "CarlosFTMP", "Frontier", "Highlander", "Versa",
];

/**
 * Normaliza un nombre de lugar removiendo caracteres especiales y acentos
 * 
 * Convierte a mayúsculas y remueve puntos, guiones y acentos para facilitar
 * comparaciones exactas entre nombres de casetas de diferentes fuentes
 * 
 * @param {string} nombre - Nombre a normalizar
 * @returns {string} Nombre normalizado en mayúsculas sin acentos
 * 
 * @example
 * normalize("PALMILLAS-APASEO gde") // "PALMILLAS APASEO GDE"
 */
function normalize(nombre) {
  return nombre.toUpperCase().replace('-', ' ').replace(/[-.]/g, '').trim().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
}


/**
 * Situaciones laborales que se consideran abusivas o fuera de horario
 * Se utiliza durante la importación para clasificar cruces cuando el personal
 * está en situación especial (incapacidad, vacaciones, etc.)
 * @type {string[]}
 */
const situacionesAbusivas = ["Descanso con Derecho",
  "Falta Injustificada",
  "Vacaciones",
  "Permiso",
  "Incapacidad",
  "Descanso por día festivo",
  "Descanso por Semana Santa",
  "Baja",
  "Curso",
  "Curso ICECCT",
  "Capacitación",
  "Imss",
  "Consulta IMSS",
  "Cita IMSS",
  "Trámite Licencia",
  "Trámite Pasaporte",
  "Trámite Visa",
  "Permiso Salida",
  "Permiso Salida / Entrada",
  "Paternidad",
  "Indisciplina",
  "Falta Justificada",
  "Falta con Aviso",
  "Problema Familiar",
  "Se reportó enfermo",
  "Inasistencia a curso",
  "Presento su Renuncia",
  "Irse sin Avisar",
  "Castigado",
  "Quitar Premio",
  "Consulta",
  "Problema de Salud",
  "Plática",
  "Se Reportó",
  "Curso de Auditor",
  "Curso Auditoria Sahagún",
  "Auditor Interno",
  "Cocinero",
  "Consulta",
  "Trámite Lic Federal",
  "Pasaporte",
  "Përmiso"
];
//Se limpia completamente la fecha y hora del cruce, descomponiendo la fecha y las partes de la hora.
/**
 * Parsea y valida una fecha y hora en formato DD/MM/YYYY y HH:MM:SS
 * 
 * Realiza validaciones de formato y crea un objeto Date válido.
 * Si el formato no es válido, retorna null para evitar errores.
 * 
 * Formato esperado:
 * - Fecha: DD/MM/YYYY (3 partes separadas por /)
 * - Hora: HH:MM o HH:MM:SS (mínimo 2 partes separadas por :)
 * 
 * @param {string} fecha - Fecha en formato DD/MM/YYYY
 * @param {string} hora - Hora en formato HH:MM:SS o HH:MM
 * @returns {Date|null} Objeto Date válido o null si el formato es inválido
 * 
 * @example
 * parsearFechaHora("25/11/2025", "14:30:45") // Date object
 * parsearFechaHora("invalid", "14:30") // null
 */
function parsearFechaHora(fecha, hora) {
  if (!fecha || !hora) return null;

  // Reemplaza posibles separadores raros
  const fechaParts = fecha.trim().split("/");
  const horaParts = hora.trim().split(":");

  /* En caso de que el formato de la fecha no venga cómo DD/MM/YYYY (3 partes) 
                    y la hora no sea "HH:MM:SS" (también 3 partes, o por lo menos 2 <HH:MM>), 
                  →→ se retorna un dato vacío para rellenar el campo en la tabla y evitar errores.
                  */
  if (fechaParts.length !== 3 || horaParts.length < 2) return null;

  // Detección formato DD/MM/YYYY
  const dia = parseInt(fechaParts[0]);
  const mes = parseInt(fechaParts[1]) - 1; // JS usa meses 0-11
  const anio = parseInt(fechaParts[2]);

  const horas = parseInt(horaParts[0]);
  const minutos = parseInt(horaParts[1]);
  const segundos = horaParts[2] ? parseInt(horaParts[2]) : 0;

  const date = new Date(anio, mes, dia, horas, minutos, segundos);

  return isNaN(date.getTime()) ? null : date;
}

/**
 * Crea un ID único para un cruce basado en fecha, hora y TAG
 * 
 * Formato del ID: YYMMDD_HHMMSS_LASTOURTAG
 * Ejemplo: 251125_143045_1234
 * 
 * @param {string} fechaC - Fecha del cruce en formato DD/MM/YYYY
 * @param {string} HoraC - Hora del cruce en formato HH:MM:SS
 * @param {string} TAGC - TAG/Identificador del dispositivo de peaje
 * @returns {string} ID del cruce con formato normalizado
 * 
 * @example
 * crearID_Cruce("25/11/2025", "14:30:45", "IMDM29083641.") 
 * // Returns: "251125_143045_3456789"
 */
function crearID_Cruce(fechaC, HoraC, TAGC) {
  const fechaParts = fechaC.trim().split("/");
  const horaParts = HoraC.trim().split(":");

  const dia = (
    10 > parseInt(fechaParts[0])
      ? "0" + parseInt(fechaParts[0]).toString()
      : parseInt(fechaParts[0])
  ).toString(); // Se formatea cómo "01" el día
  const mes = (
    10 > parseInt(fechaParts[1])
      ? "0" + parseInt(fechaParts[1]).toString()
      : parseInt(fechaParts[1])
  ).toString(); // Se formatea cómo "01" el mes
  const anio = parseInt(fechaParts[2]).toString().slice(2);

  const horas = parseInt(horaParts[0]).toString();
  const minutos = parseInt(horaParts[1]).toString();
  const segundos = (horaParts[2] ? parseInt(horaParts[2]) : "00").toString();

  return (
    //El IDCruce.
    anio + mes + dia + "_" + horas + minutos + segundos + "_" + limpiarTAG(TAGC).slice(4)
  );
}




/**
 * Limpia y convierte un valor monetario a número flotante
 * 
 * Remueve símbolos $ y comas, maneja errores y retorna 0 si no es convertible
 * 
 * @param {string|number} valor - Valor monetario a limpiar (ej: "$1,234.56")
 * @returns {number} Valor numérico flotante
 * 
 * @example
 * limpiarImporte("$1,234.56") // 1234.56
 * limpiarImporte("1000") // 1000
 * limpiarImporte(null) // 0
 */
function limpiarImporte(valor) {
  if (!valor) return 0;
  // Quitar el signo $, comas, espacios y se convierten a números, funcion util en los importes
  try {
    if (typeof valor === "string") {
      return parseFloat(valor.replace(/\$/g, "").replace(/,/g, "").trim());
    }
  } catch (error) {
    console.error("Error al limpiar importe:", error);
  }
  return parseFloat(valor) || 0; // Si no se puede convertir, retorna 0
}



/**
 * Limpia un TAG removiendo puntos finales
 * 
 * @param {string} valor - TAG/dispositivo a limpiar
 * @returns {string} TAG normalizado sin puntos, o cadena vacía si el valor es vacío o inválido
 * 
 * @example
 * limpiarTAG("IMDM29083641.") // "IMDM29083641"
 * limpiarTAG("") // ""
 * limpiarTAG(null) // ""
 */
function limpiarTAG(valor) {
  if (!valor) return "";
  // Quitar el punto que le sigue al TAG
  return valor.replace(/\./g, "").trim() || "";
}


/**
 * Obtiene el estado laboral del personal en una fecha específica
 * 
 * Busca el registro del estado del personal (Estado_del_personal) para una matrícula
 * y fecha determinadas. Si no encuentra registro exacto, busca en ±1 día como fallback.
 * 
 * Extrae la matrícula del No_Economico del cruce (primer número antes del espacio).
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {string} req.params.ID_Cruce - ID del cruce (formato: YYMMDD_HHMMSS_TAG)
 * @returns {Promise<Object>} JSON con estado del personal
 * @returns {Object[]} Array de registros de estado del personal
 * @returns {Object} error - Si no se encuentra registros (404) o error del servidor (500)
 * 
 * @example
 * GET /api/cruces/status/251125_143045_1234
 * Response: [
 *   {
 *     ID_matricula: "123",
 *     ID_ordinal: "1",
 *     Descripcion: "Vacaciones",
 *     ID_fecha: "2025-11-25"
 *   }
 * ]
 */
export const getStatusPersonal = async (req, res) => {
  try {
    const IDCruce = req.params.ID_Cruce;
    const pool = await getConnection();

    // Obtener cruce
    const { recordset: cruces } = await pool
      .request()
      .query(`SELECT * FROM cruces WHERE ID = '${IDCruce}'`);

    if (!cruces || cruces.length === 0) {
      console.log(`❌ No se encontró el cruce con ID: ${IDCruce}`);
      return res.status(404).json({ mensaje: `Cruce con ID ${IDCruce} no encontrado.` });
    }

    const cruce = cruces[0];

    // Obtener matrícula (antes del espacio si aplica)
    const matricula = cruce.No_Economico?.includes(" ")
      ? cruce.No_Economico.split(" ")[0].trim()
      : cruce.No_Economico?.trim();

    if (!matricula) {
      return res.status(400).json({ mensaje: `No se pudo extraer matrícula del cruce.` });
    }

    // Armar fecha del cruce desde el ID (formato: YYMMDD_hhmmss_TAG)
    const año = "20" + IDCruce.slice(0, 2);
    const mes = IDCruce.slice(2, 4);
    const dia = IDCruce.slice(4, 6);
    const fechaCruce = new Date(`${año}-${mes}-${dia}`);
    console.log("Fecha del cruce:", fechaCruce);
    // Formato DATETIME SQL Server 
    const sqlDate = `DATEFROMPARTS(${"20" + IDCruce.slice(0, 2)}, ${IDCruce.slice(2, 4)}, ${IDCruce.slice(4, 6)})`;

    // Buscar status exacto
    let { recordset: status } = await pool.request().input("matricula", sql.VarChar, matricula)
      .query(`SELECT * FROM Estado_del_personal WHERE ID_matricula = @matricula AND ID_fecha = ${sqlDate}`);
    // Si no hay resultado exacto, buscar ±1 día como fallback
    if (status.length === 0) {
      const fechaMenos1 = new Date(fechaCruce);
      fechaMenos1.setDate(fechaCruce.getDate() - 1);

      const fechaMas1 = new Date(fechaCruce);
      fechaMas1.setDate(fechaCruce.getDate() + 1);

      const fecha1 = `DATEFROMPARTS(${fechaMenos1.getFullYear()}, ${fechaMenos1.getMonth() + 1}, ${fechaMenos1.getDate()})`;
      const fecha2 = `DATEFROMPARTS(${fechaMas1.getFullYear()}, ${fechaMas1.getMonth() + 1}, ${fechaMas1.getDate()})`;

      const fallbackQuery = `
        SELECT * FROM Estado_del_personal 
        WHERE ID_matricula = @matricula 
        AND ID_fecha BETWEEN ${fecha1} AND ${fecha2}
      `;

      const { recordset: fallbackStatus } = await pool.request().input("matricula", sql.VarChar, matricula).query(fallbackQuery);

      if (fallbackStatus.length === 0) {
        return res.status(404).json({
          mensaje: `No se cuentan con registros para la matrícula ${matricula} en la fecha ${fechaCruce.toISOString()} o en los días inmediatos ( ±1 día ), dentro de la tabla de estatus del personal.`,
        });
      }
      // Si hay fallback, lo retornamos
      let modifiedFallbackStatus = fallbackStatus.map((item) => ({
        ...item,
        // Formatear fecha a YYYY-MM-DD
        ID_fecha: new Date(item.ID_fecha).toISOString().split("T")[0],
        Encabezado: "Alterno", // Asegurar que Encabezado tenga un valor
        EstatusConcatenado: fallbackStatus.map(s => s.Descripcion).join(", ") // Concatena todos los estatus encontrados en un string
      }));
      return res.status(200).json(modifiedFallbackStatus);
    }
    // Resultado encontrado
    return res.status(200).json(status);

  } catch (error) {
    console.error("❌ Error en getStatusPersonal:", error);
    return res.status(500).json({ mensaje: "Error interno al consultar el estado del personal." });
  }
};




/**
 * Asigna una orden de traslado de manera manual a un cruce específico
 * 
 * Valida que la OT tenga formato válido (OT-XXXXX) antes de actualizar.
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {string} req.params.id - ID del cruce a actualizar
 * @param {Object} req.body - Body de la solicitud
 * @param {string} req.body.OT - Orden de traslado en formato "OT-12345"
 * @returns {Promise<Object>} Mensaje de confirmación
 * @returns {Object} error - Si OT está vacío (400) o error del servidor (500)
 * 
 * @example
 * PUT /api/cruces/251125_143045_1234/ot
 * Body: { OT: "OT-12345" }
 * Response: { message: "Se colocó la OT-12345 actualizada correctamente sobre el ID 251125_143045_1234" }
 */
export const setOTSbyIDCruce = async (req, res) => {
  const { id } = req.params;
  const { OT } = req.body;

  try {
    const pool = await getConnection();

    // Validar que OT no esté vacío
    if (!OT || OT.trim() === "") {
      return res.status(400).json({ error: "El campo OT es obligatorio" });
    }
    // Validar que OT tenga el formato correcto (ejemplo: "OT-12345")
    const otRegex = /^OT-\d+$/; // Asegúrate de que OT comience con "OT" seguido de números
    if (!otRegex.test(OT)) {
      return res.status(400).json({ error: "El formato de OT es inválido" });
    }



    const result =
      await pool.request()
        .input("id", req.params.id)
        .input("OT", sql.VarChar, OT)
        .query(
          "UPDATE Cruces SET id_orden = @OT WHERE id = @id"
        );
    console.log("Resultado de la actualización:", result);
    res.status(200).json({
      message: `Se colocó la ${OT} actualizada correctamente sobre el ID ${id}`,
    });
  } catch (error) {
    console.error("Error actualizando estatus:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/**
 * Obtiene todos los cruces registrados
 * 
 * "Enriquece" cada cruce con información adicional:
 * - Extrae el carácter 6 de id_orden para determinar base (1=Sahagún, 0=Monterrey)
 * - Asigna base como "Administrativos" si la matrícula está en lista de admins
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object[]>} Array de todos los cruces con información enriquecida
 * 
 * @example
 * GET /api/cruces
 * Response: [
 *   {
 *     ID: "251125_143045_1234",
 *     No_Economico: "123 Carlos García",
 *     Caseta: "Caseta Sahagún",
 *     Importe: 150,
 *     Base: "Base Cd. Sahagún",
 *     ...
 *   }
 * ]
 */
export const getCruces = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM cruces");

    for (const row of result.recordset) {
      row.char = row.id_orden?.charAt(6);
      try {
        row.Base = (row.id_orden?.charAt(6) === "1") ? "Base Cd. Sahagún" : (row.id_orden?.charAt(6) === "0") ? "Base Monterrey" : matriculasAdmins.includes(row.No_Economico.split(" ")[0]) ? "Administrativos" : "Desconocido";
      } catch (error) {
        console.error("Error al asignar Base:", error);
        row.Base = "Administrativos";
      }
    }

    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

/**
 * Obtiene estadísticas de cruces agrupadas por estatus
 * 
 * Retorna el conteo de cruces para cada estatus posible
 * (Confirmado, Abuso, Aclaración, CasetaNoEncontradaEnRuta, etc.)
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object[]>} Array con objeto {Estatus, total} para cada estatus
 * 
 * @example
 * GET /api/cruces/stats
 * Response: [
 *   { Estatus: "Abuso", total: 45 },
 *   { Estatus: "Aclaración", total: 128 },
 *   { Estatus: "Confirmado", total: 2350 }
 * ]
 */
export const getStats = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(
        "SELECT Estatus, COUNT(*) as total FROM cruces GROUP BY Estatus ORDER BY Estatus ASC"
      );
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

/**
 * Obtiene todas las órdenes de traslado (OT) del año actual
 * 
 * Consulta tabla Orden_traslados desde el 1 de enero del año actual hasta hoy
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object[]>} Array de todas las órdenes de traslado
 * @returns {Object} error - Si no hay conexión a base de datos (500)
 * 
 * @example
 * GET /api/cruces/ots
 * Response: [
 *   {
 *     ID_orden: "OT-12345",
 *     ID_clave: "C-3",
 *     Fecha_traslado: "2025-11-25",
 *     ...
 *   }
 * ]
 */
export const getOTS = async (req, res) => {
  try {
    const pool = await getConnection();

    // Validamos que sí se conectó
    if (!pool) {
      return res
        .status(500)
        .send("No se pudo establecer conexión con la base de datos Tusa.");
    }

    const result = await pool.request().query(`
                      SELECT *  
                      FROM Orden_traslados  
                      WHERE Fecha_traslado BETWEEN DATEFROMPARTS(YEAR(GETDATE()), 1, 1) AND GETDATE();
                    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener OTs desde Tusa:", error);
    res.status(500).send("Error interno (500):\n" + error.message);
  }
};



/**
 * Importa masivamente cruces desde un archivo CSV/Excel
 * 
 * ## Flujo de Importación:
 * 1. Valida que los datos no estén vacíos
 * 2. Para cada cruce:
 *    - Valida campos obligatorios (Tag, Fecha, Hora, Caseta)
 *    - Parsea y valida fecha/hora
 *    - Crea ID único del cruce
 *    - Busca matrícula en Control_Tags_Historico (por TAG y fecha)
 *    - Busca OT coincidente por matrícula y fecha
 *    - Obtiene tarifa oficial de la caseta según ID_clave
 *    - Compara importe del cruce con tarifa oficial para determinar estatus
 *    - Maneja situaciones especiales (vacaciones, incapacidades) como "Abuso"
 *    - Inserta en tabla Cruces
 * 3. Registra importación en tabla ImportacionesCruces
 * 
 * ## Estatus Posibles:
 * - **Confirmado**: Importe coincide exactamente con tarifa
 * - **Se cobró menos**: Importe menor que tarifa
 * - **Aclaración**: Importe mayor que tarifa
 * - **Abuso**: Personal en situación especial (vacaciones, incapacidad)
 * - **CasetaNoEncontradaEnRuta**: Caseta no existe en la ruta de la OT
 * - **Ruta Sin Casetas**: OT sin casetas asignadas
 * - **Pendiente**: Sin OT pero en situación especial
 * 
 * ## SSE (Server-Sent Events):
 * Envía actualizaciones de progreso a todos los clientes conectados en tiempo real
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} req.body - Array de cruces a importar
 * @param {Object} req.body[].Tag - TAG del dispositivo
 * @param {Object} req.body[].No.Economico - Número económico del vehículo
 * @param {Object} req.body[].Fecha - Fecha en DD/MM/YYYY
 * @param {Object} req.body[].Hora - Hora en HH:MM:SS
 * @param {Object} req.body[].Caseta - Nombre de la caseta
 * @param {Object} req.body[].Importe - Importe cobrado
 * @param {string} req.headers['x-usuario'] - Usuario que realiza la importación
 * @param {Object} res - Objeto response
 * @returns {Promise<Object>} {insertados, omitidos: {incompletos, fechaInvalida, duplicado}}
 * @returns {Object} error - Si ocurre un error durante la importación (500)
 * 
 * @example
 * POST /api/cruces/import
 * Headers: { 'x-usuario': 'admin@iave.mx' }
 * Body: [
 *   {
 *     Tag: "IMDM29083641.",
 *     "No.Economico": "123 Carlos García",
 *     Fecha: "25/11/2025",
 *     Hora: "14:30:45",
 *     Caseta: "Caseta Sahagún",
 *     Importe: "150.00"
 *   }
 * ]
 * Response: { insertados: 1, omitidos: { incompletos: 0, fechaInvalida: 0, duplicado: 0 } }
 */
export const importCruces = async (req, res) => {
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
      fechaInvalida: 0,
      duplicado: 0,
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

    // 👉 Iterar sobre cada cruce
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
          skipped: omitidos.incompletos + omitidos.fechaInvalida + omitidos.duplicado,
          percentage: percentage,
          message: `Procesando cruce ${i} de ${totalCruces}...`
        });
      }

      const {
        Tag,
        "No.Economico": NoEconomico,
        Fecha,
        Hora,
        Caseta,
        Carril,
        Clase,
        Importe,
        "Fecha Aplicacion": FechaAplicacion,
        "Hora Aplicacion": HoraAplicacion,
        Consecar,
      } = cruce;

      if (!Tag?.trim() || !Fecha?.trim() || !Hora?.trim() || !Caseta?.trim()) {
        omitidos.incompletos++;
        continue;
      }

      const fechaCruce = parsearFechaHora(Fecha, Hora);
      if (!fechaCruce) {
        omitidos.fechaInvalida++;
        continue;
      }

      const IDCruce = crearID_Cruce(Fecha, Hora, Tag);
      let fechaAplicacion = null;
      if (FechaAplicacion && HoraAplicacion) {
        fechaAplicacion = parsearFechaHora(FechaAplicacion, HoraAplicacion);
      }

      const existe = await pool.request().input("ID", sql.NVarChar, IDCruce)
        .query("SELECT COUNT(*) as existe FROM Cruces WHERE ID = @ID");

      if (existe.recordset[0].existe > 0) {
        omitidos.duplicado++;
        continue;
      }
      /*Aquí se definía la matricula, pero ahora vamos a ajustar para que se obtenga en base al registro que se tiene de la tabla de Control_Tags_Historico, 
      con base a la fecha del cruce se asigna la matricula y se sobreescribe el No_economico de esta tabla (cruces):
      Respecto a la fecha y hora del cruce se consulta la matricula que tenía el tag asignado.
      */
      let matriculaInt = null;
      let NoEconomicoCruce = null;
      try {
        const tagHistory = await pool.request()
          .input("tag", sql.NVarChar, limpiarTAG(Tag))
          .input("fechaCruce", sql.DateTime, fechaCruce)
          .query(`
            SELECT TOP (1)
    LEFT(
        CAST(CTHistorico.id_matricula AS VARCHAR(15)) + ' ' +
        -- Primer nombre (si hay espacio, toma el primero; si no, todo)
        CASE WHEN CHARINDEX(' ', Per.Nombres) > 0 
            THEN LEFT(Per.Nombres, CHARINDEX(' ', Per.Nombres) - 1)
            ELSE Per.Nombres
        END
        + ' ' +
        UPPER(LEFT(Per.Ap_paterno,1)) + LOWER(SUBSTRING(Per.Ap_paterno,2,LEN(Per.Ap_paterno))),
        15
    ) AS Matricula_Formateada
FROM Control_Tags_Historico CTHistorico
INNER JOIN Control_Tags CTags 
    ON CTags.id_control_tags = CTHistorico.id_control_tags
INNER JOIN Personal Per
    ON Per.ID_matricula = CTags.id_matricula
WHERE RTRIM(LTRIM(CTags.Dispositivo)) = RTRIM(LTRIM(@tag))
  AND ((@fechaCruce >= CTHistorico.Fecha_Alta_Tag AND CTHistorico.Fecha_Baja_Tag is NULL) OR (@fechaCruce BETWEEN CTHistorico.Fecha_Alta_Tag AND CTHistorico.Fecha_Baja_Tag))
          `);
        if (tagHistory.recordset.length > 0) {
          matriculaInt = tagHistory.recordset[0].Matricula_Formateada.split(" ")[0] || 'Detalle Matricula';
          NoEconomicoCruce = tagHistory.recordset[0].Matricula_Formateada || 'Detalle en Control_Tags_Historico';
          matriculaInt = parseInt(matriculaInt, 10);
        }
        else {
          NoEconomicoCruce = NoEconomico?.trim();
          matriculaInt = NoEconomicoCruce?.includes(" ") ? parseInt(NoEconomicoCruce.split(" ")[0], 10) : 'NA';
        }
      } catch (error) {
        console.error("Error al extraer matrícula:", error);
        omitidos.incompletos++;
        continue;
      }


      let idOrdenAsignada = null;
      let Estatus = null;
      let TarifaOficial = null;
      let EstatusSecundario = null;
      let coincidencias = 0;
      let idCaseta = null;

      if (!isNaN(matriculaInt)) {
        const match = await pool.request()
          .input("matricula", sql.Int, matriculaInt)
          .input("fechaCruce", sql.DateTime, fechaCruce)
          .query(`
            SELECT TOP 1 
            OT.ID_clave, OS.fk_orden, OT.Id_tipo_ruta AS 'TIPO_RUTA'
            FROM Orden_traslados OT INNER JOIN orden_status OS ON OT.ID_orden = OS.fk_orden
            WHERE OS.fk_matricula = @matricula
            AND OS.iniciada IS NOT NULL
            AND OS.finalizada IS NOT NULL
            AND @fechaCruce BETWEEN OS.iniciada AND OS.finalizada
            `);

        if (match.recordset.length > 0) {
          coincidencias = (match.recordset.length > coincidencias ? match.recordset.length : coincidencias);
          idOrdenAsignada = match.recordset[0].fk_orden;
          const claveToImporteField = {
            'A': 'Automovil',
            'B': 'Autobus2Ejes',
            'C-2': 'Camion2Ejes',
            'C-3': 'Camion3Ejes',
            'C-4': 'Camion3Ejes',
            'C-5': 'Camion5Ejes',
            'C-9': 'Camion9Ejes'
          };

          const recordsetTarifaOficial = await pool.request()
            .input("id_clave", sql.NVarChar, match.recordset[0].ID_clave)
            .input("IDOrden", sql.NVarChar, idOrdenAsignada)
            .query(`
          SELECT DISTINCT
              OT.ID_orden,
              CP.Nombre_IAVE,
              CP.${(claveToImporteField[match.recordset[0].ID_clave.trim()] || 'Camion9Ejes')} AS Importe,
              PCR.consecutivo,
              CP.ID_Caseta
          FROM
              Orden_traslados OT
              INNER JOIN
              Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
              INNER JOIN
              PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
              INNER JOIN
              casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta
          WHERE 
              OT.ID_orden = @IDOrden  AND PCR.consecutivo IS NOT NULL
          ORDER BY 
              PCR.consecutivo;`);

          if (recordsetTarifaOficial.recordset.length == 0) {
            // Si no se encuentran casetas para la OT, asignar tarifa 1 y estatus especial
            TarifaOficial = 1;
            Estatus = ("Ruta Sin Casetas" + (match.recordset[0].TIPO_RUTA ? " - " + match.recordset[0].TIPO_RUTA : ""));
          }

          for (const caseta of recordsetTarifaOficial.recordset) {
            if (normalize(caseta.Nombre_IAVE) === normalize(Caseta)) {
              TarifaOficial = limpiarImporte(caseta.Importe);
              //Se va a solicitar apoyo con el área de sistemas para agregar el campo ID_Caseta a la tabla de cruces.
              idCaseta = caseta.ID_Caseta;
              Estatus = ((limpiarImporte(Importe) - TarifaOficial) === 0 ? "Confirmado" : (limpiarImporte(Importe) - TarifaOficial) < 0 ? "Se cobró menos" : "Aclaración");
              EstatusSecundario = (Estatus === "Confirmado" ? "confirmado" : (Estatus === "Se cobró menos" ? "cobro_menor" : "pendiente_aclaracion"));
              break;
            } else {
              idCaseta = null;
              Estatus = "CasetaNoEncontradaEnRuta";
            }
          }
          if (Estatus === "CasetaNoEncontradaEnRuta") {

            TarifaOficial = 1;
          }
        } else {
          const fechaTruncada = '' + fechaCruce.toISOString().split("T")[0] + 'T00:00:00.000Z';
          const statusMatch = await pool.request()
            .input("matricula", sql.Int, matriculaInt)
            .input("FECHATRUNCADA", sql.DateTime, fechaTruncada)
            .query(`
              SELECT ID_matricula, ID_ordinal, Descripcion, ID_orden, Fecha_captura, Captor
              FROM Estado_del_personal
              WHERE ID_matricula = @matricula AND ID_fecha = @FECHATRUNCADA
            `);

          if (statusMatch.recordset.length > 0) {
            coincidencias = (statusMatch.recordset.length > coincidencias ? statusMatch.recordset.length : coincidencias);
            Estatus = "Pendiente";
            for (const situacion of statusMatch.recordset) {
              const estatusPersonal = situacion.Descripcion;
              const descripcion = estatusPersonal?.toLowerCase() || "";
              const esAbuso = situacionesAbusivas.some((frase) =>
                descripcion.includes(frase.toLowerCase())
              );

              if (esAbuso) {
                Estatus = "Abuso";
                EstatusSecundario = 'pendiente_reporte';
                break;
              }
            }
          }
        }
      }
      if (typeof idCaseta !== 'string') {
        idCaseta = String(idCaseta ?? '');
      }
      // Insertar el cruce
      await pool.request()
        .input("ID", sql.NVarChar, IDCruce)
        .input("idCaseta", sql.NVarChar, idCaseta || '')
        .input("Tag", sql.NVarChar, limpiarTAG(Tag))
        .input("NoEco", sql.NVarChar, NoEconomicoCruce)
        .input("Fecha", sql.DateTime, fechaCruce)
        .input("FechaAplicacionCobro", sql.DateTime, fechaAplicacion)
        .input("Caseta", sql.NVarChar, Caseta)
        .input("Carril", sql.NVarChar, Carril || "")
        .input("Clase", sql.NVarChar, Clase || "")
        .input("Importe", sql.Float, limpiarImporte(Importe))
        .input("TarifaOficial", sql.Float, TarifaOficial || 0)
        .input("Consecar", sql.NVarChar, Consecar || "")
        .input("Estatus", sql.NVarChar, Estatus || "Vacío")
        .input("EstatusSecundario", sql.NVarChar, EstatusSecundario || "")
        .input("id_orden", sql.NVarChar, idOrdenAsignada)
        .query(`
          INSERT INTO Cruces
          (ID, Tag, [No_Economico], Fecha, FechaAplicacion, Caseta, Carril, Clase, Importe, Consecar, Estatus,  id_orden, Estatus_Secundario, ImporteOficial, idCaseta)
          VALUES
          (@ID, @Tag, @NoEco, @Fecha, @FechaAplicacionCobro, @Caseta, @Carril, @Clase, @Importe, @Consecar, @Estatus, @id_orden, @EstatusSecundario, @TarifaOficial, @idCaseta) 
        `);

      insertados++;
    }

    // Enviar progreso final
    sendProgressToClients({
      type: 'complete',
      total: totalCruces,
      processed: totalCruces,
      inserted: insertados,
      skipped: omitidos.incompletos + omitidos.fechaInvalida + omitidos.duplicado,
      percentage: 100,
      message: 'Procesamiento completado',
      omitidos: omitidos
    });

    // Log de importación
    await pool
      .request()
      .input("Usuario", sql.NVarChar, usuario)
      .input("FechaImportacion", sql.DateTime, new Date())
      .input("TotalInsertados", sql.Int, insertados).query(`
        INSERT INTO ImportacionesCruces (Usuario, TotalInsertados, FechaImportacion)
        VALUES (@Usuario, @TotalInsertados, @FechaImportacion)
      `);

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





/**
 * ⚠️ FUNCIÓN NO UTILIZADA ACTUALMENTE
 * 
 * Intenta encontrar una caseta por nombre dentro del sistema
 * 
 * ## Estrategia de búsqueda (en orden):
 * 1. Búsqueda exacta en casetas_Plantillas (nombre normalizado)
 * 2. Búsqueda en tabla Cat_EntidadCaseta (nombres relacionados con Origen=1)
 * 3. Si no hay coincidencia, registra sugerencia con Origen=0 para validación manual
 * 
 * Esta función fue diseñada para un futuro sistema de validación manual de casetas
 * con coincidencias ambiguas. El nombre normalizado queda en mayúsculas, omite
 * acentos y caracteres especiales (permitiendo una comparacion normalizada).
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {string} req.params.CasetaNCruce - Nombre de la caseta a buscar
 * @param {Object} res - Objeto response
 * @returns {Promise<Object>} Objeto con status y datos de la caseta encontrada
 * @returns {Object} {status: 'confirmado_exacto', caseta: {...}} - Coincidencia exacta
 * @returns {Object} {status: 'confirmado_Aux', caseta: {...}} - Coincidencia en tabla auxiliar
 * @returns {Object} {status: 'sin_match', sugerencia: {...}} - Sin coincidencia (para validar después)
 * 
 * @example
 * GET /api/cruces/caseta-match/Caseta%20Sahagún
 * Response: { status: 'confirmado_exacto', caseta: {...} }
 */
export const getCasetaMatch = async (req, res) => {
  const { CasetaNCruce } = req.params;

  try {
    const pool = await getConnection();

    const normalizado = normalize(CasetaNCruce);

    // 1. Intentar match exacto con casetas_Plantillas
    const exacto = await pool.request()
      .input("nombre", sql.NVarChar, normalizado)
      .query(`
        SELECT TOP 1 * 
        FROM casetas_Plantillas 
        WHERE UPPER(REPLACE(REPLACE(Nombre_IAVE, '-', ''), '.', '')) = @nombre
      `);

    if (exacto.recordset.length > 0) {
      return res.json({
        status: 'confirmado_exacto',
        caseta: exacto.recordset[0]
      });
    }

    // 2. Intentar match en Cat_EntidadCaseta con Origen = 1
    const matchAux = await pool.request()
      .input("nombreRelacionado", sql.NVarChar, normalizado)
      .query(`
        SELECT TOP 1 CP.* 
        FROM Cat_EntidadCaseta CMA
        INNER JOIN casetas_Plantillas CP ON CMA.ID_Caseta = CP.ID_Caseta
        WHERE UPPER(REPLACE(REPLACE(CMA.NombreRelacionado, '-', ''), '.', '')) = @nombreRelacionado
          AND CMA.OrigenIAVE = 1
      `);

    if (matchAux.recordset.length > 0) {
      return res.json({
        status: 'confirmado_Aux',
        caseta: matchAux.recordset[0]
      });
    }

    // 3. Si no hay match, registrar sugerencia en Cat_EntidadCaseta con Origen = 0
    // (Requiere que el frontend te mande el ID_Caseta sugerido más adelante para validarlo manualmente)
    return res.json({
      status: 'sin_match',
      sugerencia: {
        nombreRelacionado: CasetaNCruce,
        sugerido: true,
        origen: 0
      }
    });

  } catch (error) {
    console.error('Error en getCasetaMatch:', error);
    res.status(500).send('Error en la búsqueda de caseta.');
  }
};



/**
 * Configura una conexión SSE (Server-Sent Events) para recibir actualizaciones de progreso
 * 
 * Cuando se inicia una importación masiva, el cliente se conecta a esta ruta para
 * recibir actualizaciones de progreso en tiempo real sin necesidad de polling.
 * 
 * El cliente recibe eventos con estructura:
 * ```json
 * {
 *   "type": "progress|complete|error",
 *   "processed": 100,
 *   "inserted": 95,
 *   "percentage": 50,
 *   "message": "Procesando cruce 100 de 200..."
 * }
 * ```
 * 
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {void} Stream de eventos SSE
 * 
 * @example
 * // En el cliente JavaScript
 * const eventSource = new EventSource('/api/cruces/progress');
 * eventSource.onmessage = (event) => {
 *   const progress = JSON.parse(event.data);
 *   console.log(`Progreso: ${progress.percentage}%`);
 * };
 */
export const getImportProgress = (req, res) => {
  const clientId = Date.now().toString();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Agregar cliente a la lista
  clientesConectados.set(clientId, res);

  // Enviar conexión inicial
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Conectado al stream de progreso'
  })}\n\n`);

  // Limpiar cuando el cliente se desconecte
  req.on('close', () => {
    clientesConectados.delete(clientId);
  });
};



/**
 * Envía actualizaciones de progreso a todos los clientes SSE conectados
 * 
 * Itera sobre la lista de clientes conectados y envía el mensaje de progreso.
 * Si hay error enviando a un cliente, lo desconecta automáticamente.
 * 
 * @param {Object} progressData - Datos del progreso
 * @param {string} progressData.type - Tipo de evento (progress, complete, error)
 * @param {number} progressData.processed - Registros procesados
 * @param {number} progressData.inserted - Registros insertados
 * @param {number} progressData.percentage - Porcentaje de progreso
 * @param {string} progressData.message - Mensaje descriptivo
 * 
 * @example
 * sendProgressToClients({
 *   type: 'progress',
 *   processed: 100,
 *   inserted: 95,
 *   percentage: 50,
 *   message: 'Procesando cruce 100 de 200...'
 * });
 */
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




/**
 * Actualiza el estatus de un cruce individual
 * 
 * ## Lógica especial:
 * - Si estatus = "Abuso" → Asigna Estatus_Secundario = "pendiente_reporte"
 * - Si estatus = "Condonado" → Cambia a "Confirmado" con Estatus_Secundario = "Condonado"
 * - Si estatus = "Aclaración" → Cambia a "Aclaración" con Estatus_Secundario = "pendiente_aclaracion"
 * - Demás casos → Actualiza solo el Estatus
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {string} req.params.id - ID del cruce a actualizar
 * @param {Object} req.body - Body de la solicitud
 * @param {string} req.body.estatus - Nuevo estatus (ej: "Abuso", "Aclaración", "Confirmado", "Condonado")
 * @param {Object} res - Objeto response
 * @returns {Promise<Object>} {message: "Estatus {estatus} actualizado correctamente sobre el ID {id}"}
 * @returns {Object} error - Si ocurre un error en la base de datos (500)
 * 
 * @example
 * PUT /api/cruces/251125_143045_1234/status
 * Body: { estatus: "Aclaración" }
 * Response: { message: "Estatus Aclaración actualizado correctamente sobre el ID 251125_143045_1234" }
 */
export const actualizarEstatusCruce = async (req, res) => {
  const { id } = req.params;
  const { estatus } = req.body;
  try {
    const pool = await getConnection();
    if (estatus === 'Abuso') {
      const result =
        await pool.request().input("estatus", estatus).input("id", id).query`UPDATE Cruces SET Estatus = @estatus, Estatus_Secundario = 'pendiente_reporte' WHERE ID = @id`;

    }
    else {
      if (estatus === 'Condonado') {
        const result =
          await pool.request().input("id", id).query`UPDATE Cruces SET Estatus = 'Confirmado', Estatus_Secundario = 'Condonado' WHERE ID = @id`;
      }
      if (estatus === 'Aclaración') {
        const result =
          await pool.request().input("id", id).query`UPDATE Cruces SET Estatus = 'Aclaración', Estatus_Secundario = 'pendiente_aclaracion' WHERE ID = @id`;
      }
      else {
        const result =
          await pool.request().input("estatus", estatus).input("id", id).query`UPDATE Cruces SET Estatus = @estatus WHERE ID = @id`;
      }
    }
    res.status(200).json({
      message: `Estatus ${estatus} actualizado correctamente sobre el ID ${id}`,
    });
  } catch (error) {
    console.error("Error actualizando estatus:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};


/**
 * Actualiza masivamente el estatus de múltiples cruces
 * 
 * Aplica la misma lógica de actualizarEstatusCruce pero para múltiples registros.
 * 
 * ## Lógica especial por estatus:
 * - "Abuso" → Estatus_Secundario = "pendiente_reporte"
 * - "Aclaración" → Estatus_Secundario = "pendiente_aclaracion"
 * - "Condonado" → Cambia a "Confirmado" con Estatus_Secundario = "Condonado"
 * - Demás → Solo actualiza Estatus
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} req.body - Body de la solicitud
 * @param {string[]} req.body.ids - Array de IDs de cruces a actualizar
 * @param {string} req.body.nuevoEstatus - Nuevo estatus para todos los cruces
 * @param {Object} res - Objeto response
 * @returns {Promise<Object>} {message: "Estatus {estatus} actualizado correctamente sobre los IDs ..."}
 * @returns {Object} error - Si datos inválidos (400) o error del servidor (500)
 * 
 * @example
 * PATCH /api/cruces/status-masivo
 * Body: {
 *   ids: ["251125_143045_1234", "251125_143046_1234"],
 *   nuevoEstatus: "Aclaración"
 * }
 * Response: { message: "Estatus Aclaración actualizado correctamente sobre los IDs 251125_143045_1234, 251125_143046_1234" }
 */
export const actualizarEstatusMasivoCruces = async (req, res) => {
  const { ids, nuevoEstatus } = req.body;
  if (!Array.isArray(ids) || !nuevoEstatus) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  try {
    const pool = await getConnection();
    if (nuevoEstatus === 'Abuso') {
      const result =
        await pool.request().input("nuevoEstatus", nuevoEstatus).query(`
        UPDATE Cruces 
        SET Estatus = @nuevoEstatus, 
        Estatus_Secundario = 'pendiente_reporte'
        WHERE ID IN (${"'"}${ids.join("','")}${"'"})
        `);
    }
    else if (nuevoEstatus === 'Aclaración') {
      const result =
        await pool.request().input("nuevoEstatus", nuevoEstatus).query(`
        UPDATE Cruces 
        SET Estatus = @nuevoEstatus, 
        Estatus_Secundario = 'pendiente_aclaracion'
        WHERE ID IN (${"'"}${ids.join("','")}${"'"})
        `);
    }
    else {
      if (nuevoEstatus === 'Condonado') {
        const result =
          await pool.request().query(`
          UPDATE Cruces 
          SET Estatus = 'Confirmado', 
          Estatus_Secundario = 'Condonado' 
          WHERE ID IN (${"'"}${ids.join("','")}${"'"})
          `);
      } else {
        const result =
          await pool.request().query(`
          UPDATE Cruces 
          SET Estatus = '${nuevoEstatus}'
          WHERE ID IN (${"'"}${ids.join("','")}${"'"})
          `);
      }
    }
    res.status(200).json({
      message: `Estatus ${nuevoEstatus} actualizado correctamente sobre los IDs ${ids.join(", ")}`,
    });
  } catch (error) {
    console.error("Error actualizando estatus:", error);
    console.error("ID de los cruces:", ids);
    res.status(500).json({ error: error.message });
  }
};
