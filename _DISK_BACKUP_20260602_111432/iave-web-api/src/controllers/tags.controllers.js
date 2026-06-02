/**
 * Controlador de TAGs - IAVE WEB API
 * 
 * Este módulo gestiona todas las operaciones relacionadas con los TAGs IAVE,
 * incluyendo consultas, estadísticas, generación de documentos de responsiva.
 * 
 * Funcionalidades principales:
 * - Consulta de TAGs y su estado (asignado, stock, inactivo, extraviado)
 * - Estadísticas de TAGs por categoría
 * - Generación de documentos de responsiva en Excel
 * - Consulta de operadores disponibles en fechas específicas
 * - Sincronización de datos de control de TAGs con personal
 * 
 * @module tags.controllers
 * @requires ../database/connection.js
 * @requires exceljs
 * @requires dayjs
 */

import { getConnection, sql } from "../database/connection.js";


import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import path from 'path';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Lista de situaciones laborales que inhabilitan a un operador para trabajar
 * Se utiliza para identificar operadores no disponibles en fechas específicas
 * @type {string[]}
 */
const situacionesAbusivas = ["DESCANSO CON DERECHO",
  "FALTA INJUSTIFICADA",
  "VACACIONES",
  "PERMISO",
  "INCAPACIDAD",
  "DESCANSO POR DIA FESTIVO",
  "DESCANSO POR SEMANA SANTA",
  "BAJA",
  "CURSO",
  "CURSO ICECCT",
  "CAPACITACION",
  "IMSS",
  "CONSULTA IMSS",
  "CITA IMSS",
  "TRAMITE LICENCIA",
  "TRAMITE PASAPORTE",
  "TRAMITE VISA",
  "PERMISO SALIDA",
  "PERMISO SALIDA / ENTRADA",
  "PATERNIDAD",
  "INDISCIPLINA",
  "FALTA JUSTIFICADA",
  "FALTA CON AVISO",
  "PROBLEMA FAMILIAR",
  "SE REPORTO ENFERMO",
  "INASISTENCIA A CURSO",
  "PRESENTO SU RENUNCIA",
  "IRSE SIN AVISAR",
  "CASTIGADO",
  "QUITAR PREMIO",
  "CONSULTA",
  "PROBLEMA DE SALUD",
  "PLATICA",
  "SE REPORTO",
  "CURSO DE AUDITOR",
  "CURSO AUDITORIA SAHAGUN",
  "AUDITOR INTERNO",
  "COCINERO",
  "TRAMITE LIC FEDERAL",
  "PASAPORTE",
  "PERMISO",
];



// Utilidad opcional para sanitizar el nombre
/**
 * Normaliza un nombre removiendo caracteres especiales y acentos
 * 
 * Convierte a mayúsculas y remueve puntos, guiones y acentos para facilitar
 * comparaciones exactas entre nombres de diferentes fuentes.
 * 
 * @param {string} nombre - Nombre a normalizar
 * @returns {string} Nombre normalizado en mayúsculas sin acentos
 * 
 * @example
 * normalize("Sólo-la Paz") // "SOLOLA PAZ"
 */
function normalize(nombre) {
  return nombre.toUpperCase().replace(/[-.]/g, '').replace.trim().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
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
 * @returns {string} TAG normalizado sin puntos
 * 
 * @example
 * limpiarTAG("IMDM29083641.") // "IMDM29083641"
 */
function limpiarTAG(valor) {
  if (!valor) return "";
  // Quitar el punto que le sigue al TAG
  return valor.replace(/\./g, "").trim() || 0;
}






/**
 * Obtiene todos los TAGs registrados con información de personal asignado
 * 
 * Retorna lista completa de dispositivos TAGs con estado computado:
 * - **activo**: TAG asignado a operador activo
 * - **stockM**: TAG en stock en base Monterrey (matricula 5001)
 * - **stockS**: TAG en stock en base Sahagún (matricula 5007)
 * - **inactivo**: TAG inactivo por retiro (sin extraviado)
 * - **extravio**: TAG reportado como extraviado
 * 
 * Enriquece datos con información personal (nombre, apellidos) y construye
 * No_Economico como: "id_matricula Nombre Apellido_Paterno Apellido_Materno"
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object[]>} Array de TAGs con información enriquecida
 * 
 * @returns {Object} Cada TAG incluye:
 * - **id_control_tags**: ID único del TAG
 * - **Dispositivo**: Número de serie del TAG
 * - **id_matricula**: ID del operador asignado
 * - **Activa**: Boolean (activo o inactivo)
 * - **Fecha_inactiva**: Fecha de desactivación (si aplica)
 * - **Fecha_Extravio**: Fecha de reporte de extraviado (si aplica)
 * - **Estatus_Secundario**: Clasificación (activo/stockM/stockS/inactivo/extravio)
 * - **No_Economico**: Identificador formateado del operador
 * - **Nombres**: Nombre del operador
 * - **Ap_paterno**: Apellido paterno del operador
 * - **Ap_materno**: Apellido materno del operador
 * 
 * @example
 * GET /api/tags
 * Response: [
 *   {
 *     id_control_tags: 1,
 *     Dispositivo: "IMDM29083641",
 *     id_matricula: 123,
 *     Activa: true,
 *     Estatus_Secundario: "activo",
 *     No_Economico: "123 Carlos García López",
 *     Nombres: "Carlos",
 *     ...
 *   }
 * ]
 */
export const getTags = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT Ps.Nombres, Ps.Ap_paterno, Ps.Ap_materno, CT.*   FROM Control_Tags CT INNER JOIN Personal Ps ON CT.id_matricula = Ps.ID_matricula ORDER BY CT.Activa DESC;");
    for (const row of result.recordset) {
      row.Estatus_Secundario = row.Activa ? ((row["id_matricula"] === 5001) ? "stockM" : (row["id_matricula"] === 5007) ? "stockS" : "activo") : ((!!row["Fecha_inactiva"] && !row.Activa && !!!row["Fecha_Extravio"])) ? "inactivo" : "extravio";
      row.No_Economico = row.id_matricula + " " + row.Nombres + " " + row.Ap_paterno + " " + row.Ap_materno;
    }
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



/**
 * Obtiene el total de TAGs registrados en el sistema
 * 
 * Retorna un simple conteo de registros en la tabla Control_Tags.
 * Útil para dashboards y reportes de inventario general.
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object>} Objeto con campo "Total"
 * 
 * @example
 * GET /api/tags/total
 * Response: [
 *   { "Total": 257 }
 * ]
 */
export const getTotalStatsTags = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT COUNT (*) AS 'Total' FROM Control_Tags");
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



/**
 * Obtiene estadísticas de TAGs desglosadas por estado
 * 
 * Retorna conteos de TAGs clasificados en 5 categorías:
 * - **asignados**: TAGs activos asignados a operadores en bases (no es stock)
 * - **stockM**: TAGs activos en stock Monterrey (matricula 5001)
 * - **stockS**: TAGs activos en stock Sahagún (matricula 5007)
 * - **inactivos**: TAGs retirados sin extraviado (con fecha_inactiva, sin fecha_extravio)
 * - **extravios**: TAGs reportados como extraviados (con fecha_extravio)
 * 
 * Útil para dashboards de inventario y análisis de disponibilidad de TAGs.
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @returns {Promise<Object>} Objeto con conteos por categoría
 * 
 * @returns {Object} Estructura:
 * - **asignados**: Número de TAGs en operadores activos
 * - **stockM**: Número de TAGs en stock Monterrey
 * - **stockS**: Número de TAGs en stock Sahagún
 * - **inactivos**: Número de TAGs retirados
 * - **extravios**: Número de TAGs extraviados
 * 
 * @example
 * GET /api/tags/stats
 * Response: [
 *   {
 *     asignados: 185,
 *     stockM: 35,
 *     stockS: 28,
 *     inactivos: 8,
 *     extravios: 1
 *   }
 * ]
 */
export const getStatsTags = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
          SUM(CASE 
                  WHEN CT.Activa = 1 
                       AND CT.id_matricula NOT IN (5001, 5007) 
                  THEN 1 ELSE 0 
              END) AS asignados,

          SUM(CASE 
                  WHEN CT.Activa = 1 
                       AND CT.id_matricula = 5001
                  THEN 1 ELSE 0 
              END) AS stockM,

          SUM(CASE 
                  WHEN CT.Activa = 1 
                       AND CT.id_matricula = 5007
                  THEN 1 ELSE 0 
              END) AS stockS,

          SUM(CASE 
                  WHEN CT.Activa = 0
                       AND CT.Fecha_inactiva IS NOT NULL
                       AND CT.Fecha_Extravio IS NULL
                  THEN 1 ELSE 0 
              END) AS inactivos,

          SUM(CASE 
                  WHEN CT.Activa = 0
                       AND CT.Fecha_Extravio IS NOT NULL
                  THEN 1 ELSE 0 
              END) AS extravios
      FROM Control_Tags CT
      INNER JOIN Personal Ps ON CT.id_matricula = Ps.ID_matricula;
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
};




/**
 * Genera un documento PDF/Excel de responsiva para asignación de TAG
 * 
 * Genera un documento legal que acredita:
 * - Asignación de TAG al operador
 * - Aceptación de responsabilidad del operador
 * - Condiciones de uso y custodia
 * - Obligación de reporte en caso de pérdida/daño
 * 
 * Utiliza una plantilla Excel (`ResponsivaTags.xlsx`) y completa:
 * - Nombre y apellidos del operador
 * - Matrícula del operador
 * - Número de serie del dispositivo TAG
 * - Fecha y lugar de asignación (Tlanalapa, Hidalgo)
 * 
 * El archivo generado se descarga con nombre: `Responsiva_TAG_{numeroDispositivo}.xlsx`
 * 
 * @async
 * @param {Object} req - Objeto request
 * @param {Object} req.body - Body con datos para completar responsiva
 * @param {string} req.body.nombre - Nombre completo del operador
 * @param {string} req.body.matricula - Matrícula/ID del operador
 * @param {string} req.body.numeroDispositivo - Número de serie del TAG
 * @param {string} req.body.fechaAsignacion - Fecha de asignación (formato ISO o cualquier parseable por dayjs)
 * @param {Object} res - Objeto response
 * @returns {Promise<void>} Descarga archivo Excel como attachment
 * 
 * @throws {Error} Si no encuentra plantilla o error al generar documento
 * 
 * @example
 * POST /api/tags/responsiva
 * Body: {
 *   "nombre": "Carlos García López",
 *   "matricula": "123",
 *   "numeroDispositivo": "IMDM29083641",
 *   "fechaAsignacion": "2025-11-29"
 * }
 * Response: Descarga archivo "Responsiva_TAG_IMDM29083641.xlsx"
 */
export const generarResponsivaDesdePlantilla = async (req, res) => {
  try {
    const { nombre, matricula, numeroDispositivo, fechaAsignacion } = req.body;

    const workbook = new ExcelJS.Workbook();
    const plantillaPath = path.join(__dirname, '../../plantillas/ResponsivaTags.xlsx');
    await workbook.xlsx.readFile(plantillaPath);

    const worksheet = workbook.getWorksheet(1);

    worksheet.getCell('B33').value = nombre;
    worksheet.getCell('B38').value = matricula;
    worksheet.getCell('E5').value = numeroDispositivo;
    worksheet.getCell('B21').value = `Tlanalapa Hidalgo ${dayjs(fechaAsignacion).format('DD/MM/YYYY')}`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Responsiva_TAG_${numeroDispositivo}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar responsiva:', error);
    res.status(500).json({ message: 'Error al generar la responsiva' });
  }
};





/**
 * Obtiene operadores NO disponibles en una fecha específica
 * 
 * Identifica todos los operadores que NO pueden trabajar en una fecha porque:
 * - Están en situación de no disponibilidad (vacaciones, incapacidad, curso, etc.)
 * - Y tienen registros de cruces en esa misma fecha (aparente inconsistencia)
 * 
 * ## Situaciones que inhabilitan:
 * - Vacaciones, Permiso, Incapacidad, Descanso (festivo, semana santa)
 * - Cursos/Capacitaciones, Trámites (licencia, pasaporte, visa)
 * - Problemas (familiar, salud), Ausencias (sin avisar, falta injustificada)
 * - Sanciones (castigado, quitar premio)
 * - Cambios laborales (baja, renuncia)
 * 
 * ## Filtros aplicados:
 * - Solo operadores activos (Fecha_de_baja IS NULL)
 * - Solo posición 'O' (Operador)
 * - Solo con cruces registrados esa fecha
 * - Solo descripciones en lista de situacionesAbusivas
 * 
 * ## Parámetro de entrada:
 * La fecha se pasa en formato: "DD-MM-YYYY" (ej: "29-11-2025")
 * Y se convierte internamente a DATEFROMPARTS para consulta SQL
 * 
 * @async\n * @param {Object} req - Objeto request\n 
 * @param {string} req.params.fechaBuscada - Fecha en formato "DD-MM-YYYY"\n 
 * @param {Object} res - Objeto response\n * @returns {Promise<Object[]>} Array de operadores no disponibles\n * \n 
 * @returns {Object} Cada operador incluye:\n 
 * - **ID_matricula**: ID del operador\n 
 * - **Nombres**: Nombre\n 
 * - **Ap_paterno**: Apellido paterno\n 
 * - **Ap_materno**: Apellido materno\n 
 * - **Descripcion**: Situación laboral (vacaciones, incapacidad, etc.)\n
 * - **Fecha_captura**: Cuándo se registró el estado\n 
 * - **ID_fecha**: Fecha del estado\n 
 * - **Captor**: Quién registró el estado\n 
 * - **ID_orden**: Orden asociada (si la hay)\n 
 * - **Tag**: TAG del vehículo en que se registró cruce\n \n 
 * @example
 * GET /api/tags/unavailable/29-11-2025
 * Response: [\n *   {\n *     ID_matricula: 45,\n
 *      Nombres: \"Miguel\",\n *     Ap_paterno: \"González\",\n *     Ap_materno: \"Martínez\",\n *     Descripcion: \"VACACIONES\",\n *     Fecha_captura: \"2025-11-20T08:00:00.000Z\",\n *     ID_fecha: \"2025-11-29\",\n *     Captor: \"admin@iave.mx\",\n *     Tag: \"IMDM29083641\"\n *   }\n * ]\n * \n 
 * @note Si no hay operadores no disponibles, retorna array vacío []\n 
 * @note Útil para validar inconsistencias en registros de cruces\n */
export const getUnavailableOps = async (req, res) => {
  try {
    const pool = await getConnection();
    const { fechaBuscada } = req.params;
    console.log(fechaBuscada);

    // Armar fecha del cruce desde el ID (formato: YYMMDD_hh.mm.ss_TAG)
    const day = fechaBuscada.split('-')[0];
    const month = fechaBuscada.split('-')[1];
    const year = fechaBuscada.split('-')[2];
    console.log("Fecha: ", `${year}-${month}-${day}`);
    // Formato SQL Server seguro

    const result = await pool.request()
      .input('day', sql.Int, parseInt(day))
      .input('month', sql.Int, parseInt(month))
      .input('year', sql.Int, parseInt(year))
      .query(`
SELECT DISTINCT
    p.ID_matricula,
    p.Ap_paterno,
    p.Ap_materno,
    p.Nombres,
    ep.Descripcion,
    ep.Fecha_captura,
    ep.ID_fecha,
    ep.Captor,
    ep.ID_orden,
    cr.Tag
FROM Personal p
INNER JOIN Estado_del_personal ep
    ON p.ID_matricula = ep.ID_matricula
INNER JOIN cruces cr
    ON p.ID_Matricula = TRY_CONVERT(int, LEFT(cr.No_Economico, CHARINDEX(' ', cr.No_Economico+' ')-1))
WHERE 
    p.Fecha_de_baja IS NULL -- Operadores activos
    AND p.Puesto = 'O'
    AND ep.ID_fecha = DATEFROMPARTS(@year,@month,@day)
    AND TRY_CONVERT(int, LEFT(cr.No_Economico, CHARINDEX(' ', cr.No_Economico+' ')-1)) IS NOT NULL -- Filtrar valores que no se pueden convertir
    AND ep.Descripcion IN (
        'DESCANSO CON DERECHO',
        'FALTA INJUSTIFICADA',
        'VACACIONES',
        'PERMISO',
        'INCAPACIDAD',
        'DESCANSO POR DIA FESTIVO',
        'DESCANSO POR SEMANA SANTA',
        'BAJA',
        'CURSO',
        'CURSO ICECCT',
        'CAPACITACION',
        'IMSS',
        'CONSULTA IMSS',
        'CITA IMSS',
        'TRAMITE LICENCIA',
        'TRAMITE PASAPORTE',
        'TRAMITE VISA',
        'PERMISO SALIDA',
        'PERMISO SALIDA / ENTRADA',
        'PATERNIDAD',
        'INDISCIPLINA',
        'FALTA JUSTIFICADA',
        'FALTA CON AVISO',
        'PROBLEMA FAMILIAR',
        'SE REPORTO ENFERMO',
        'INASISTENCIA A CURSO',
        'PRESENTO SU RENUNCIA',
        'IRSE SIN AVISAR',
        'CASTIGADO',
        'QUITAR PREMIO',
        'CONSULTA',
        'PROBLEMA DE SALUD',
        'PLATICA',
        'SE REPORTO',
        'CURSO DE AUDITOR',
        'CURSO AUDITORIA SAHAGUN',
        'AUDITOR INTERNO',
        'COCINERO',
        'TRAMITE LIC FEDERAL',
        'PASAPORTE',
        'PERMISO'
    )
ORDER BY p.ID_matricula;

    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
};