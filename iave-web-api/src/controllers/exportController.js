// backend/controllers/exportController.js
import { Workbook } from 'exceljs';
import { join } from 'path';
import dayjs from 'dayjs';

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
