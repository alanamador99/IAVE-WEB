/**
 * @module exportController
 * @description
 * Controlador para generación y exportación de documentos en el sistema IAVE.
 * Permite generar archivos Excel con información de responsivas, reportes y datos.
 * 
 * Funcionalidades principales:
 * - Generar responsivas de asignación de TAGs (desde plantilla Excel)
 * - Exportar datos a Excel con formato
 * - Generar reportes en Excel
 * 
 * Librerías utilizadas:
 * - exceljs: Lectura/escritura de archivos Excel
 * - dayjs: Formateo de fechas
 * 
 * @requires exceljs - Para manipulación de archivos Excel
 * @requires dayjs - Para formateo de fechas
 * @requires path - Para manejo de rutas de archivos
 */

// backend/controllers/exportController.js
import { Workbook } from 'exceljs';
import { join } from 'path';
import dayjs from 'dayjs';

/**
 * Genera una responsiva de asignación de TAG desde plantilla Excel.
 * @async
 * @function generarResponsivaDesdePlantilla
 * @param {Object} req - Objeto de solicitud
 * @param {string} req.body.nombre - Nombre completo del operador
 * @param {string} req.body.matricula - Matrícula del operador
 * @param {string} req.body.numeroDispositivo - Número de serie del TAG
 * @param {string} req.body.fechaAsignacion - Fecha de asignación (formato ISO o similar)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Descarga archivo Excel con responsiva completa
 * @throws {Error} 500 si falla la generación
 * @description
 * Proceso:
 * 1. Lee plantilla ResponsivaTags.xlsx
 * 2. Completa campos:
 *    - B33: Nombre completo
 *    - B38: Matrícula
 *    - E5: Número del TAG
 *    - B21: Fecha formateada "Tlanalapa Hidalgo DD/MM/YYYY"
 * 3. Envía archivo como descarga
 * 
 * Plantilla debe existir en: /plantillas/ResponsivaTags.xlsx
 * 
 * @example
 * // POST /api/export/responsiva-tag
 * // Body
 * {
 *   "nombre": "Carlos García López",
 *   "matricula": "123",
 *   "numeroDispositivo": "IMDM29083641",
 *   "fechaAsignacion": "2025-12-01"
 * }
 * // Response
 * // Descarga: Responsiva_TAG_IMDM29083641.xlsx
 * // Archivo contiene responsiva completa con campos rellenados
 * 
 * @note
 * - Fecha se formatea a: "Tlanalapa Hidalgo DD/MM/YYYY"
 * - Filename incluye número de TAG para identificación
 * - Contenido de respuesta: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 */
const generarResponsivaDesdePlantilla = async (req, res) => {
  try {
    const { nombre, matricula, numeroDispositivo, fechaAsignacion } = req.body;

    const workbook = new Workbook();

    // Ruta absoluta a la plantilla
    const plantillaPath = join(__dirname, '../../plantillas/ResponsivaTags.xlsx');
    await workbook.xlsx.readFile(plantillaPath);

    const worksheet = workbook.getWorksheet(1); // primera hoja

    // 🧩 Rellenar campos
    worksheet.getCell('B33').value = nombre; // Nombre completo
    worksheet.getCell('B38').value = matricula; // Matrícula
    worksheet.getCell('E5').value = numeroDispositivo; // Número de TAG

    // Formato de fecha tipo: Tlanalapa Hidalgo 06/08/2025
    const fechaFormateada = `Tlanalapa Hidalgo ${dayjs(fechaAsignacion).format('DD/MM/YYYY')}`;
    worksheet.getCell('B21').value = fechaFormateada;

    // 📤 Enviar como descarga
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

export default { generarResponsivaDesdePlantilla };
