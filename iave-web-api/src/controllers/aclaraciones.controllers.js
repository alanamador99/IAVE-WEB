import { getConnection, sql } from "../database/connection.js";





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
