import { getConnection, sql } from "../database/connection.js";

import enviarCorreoAbuso from "../utils/email.js"



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