import { getConnection, sql } from "../database/connection.js";

import pkg from 'exceljs';
const { Workbook } = pkg;
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import path from 'path';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
function normalize(nombre) {
  return nombre.toUpperCase().replace(/[-.]/g, '').replace.trim().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
}

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


function limpiarTAG(valor) {
  if (!valor) return "";
  // Quitar el punto que le sigue al TAG
  return valor.replace(/\./g, "").trim() || 0;
}






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





export const getUnavailableOps = async (req, res) => {
  try {
    const pool = await getConnection();
    const {fechaBuscada} = req.params;
    console.log(fechaBuscada);

    // Armar fecha del cruce desde el ID (formato: YYMMDD_hh.mm.ss_TAG)
    const day = fechaBuscada.split('-')[0];
    const month = fechaBuscada.split('-')[1];
    const year = fechaBuscada.split('-')[2];
    console.log("Fecha: " , `${year}-${month}-${day}`);
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