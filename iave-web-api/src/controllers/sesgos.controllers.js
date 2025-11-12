import { getConnection, sql } from "../database/connection.js";


function normalize(nombre) {
  return nombre.toUpperCase().replace(/[-.]/g, '').trim().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
}

export const getSesgos = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM cruces WHERE Estatus = 'CasetaNoEncontradaEnRuta' ORDER BY ID DESC");
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};


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




export const getSesgosByOT = async (req, res) => {
  try {
    const { IDOrden } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input("IDOrden", sql.Int, IDOrden)
      .query("SELECT * FROM Sesgos WHERE IDOrden = @IDOrden");
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
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
export const UpdateSesgo = async (req, res) => {
  try {
    const { id } = req.params;
    const { Estatus, Comentarios } = req.body;
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, id)
      .input("Estatus", sql.VarChar, Estatus)
      .input("Comentarios", sql.VarChar, Comentarios)
      .query("UPDATE Sesgos SET Estatus = @Estatus, Comentarios = @Comentarios WHERE ID = @id");
    res.sendStatus(204);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};