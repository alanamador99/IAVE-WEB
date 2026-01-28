import { getConnection, sql } from "../database/connection.js";


export const getGeneralDashboardData = async (req, res) => {
    const { idOrden, Matricula, FechaInicio, FechaFin, idRuta } = req.body;
    try {
        const pool = await getConnection();

        let query = `
      SELECT SUM (CR.Importe) AS Importe, SUM (CR.ImporteOficial) AS ImporteOficial, CP.Nombre, CR.idCaseta, count(*) AS totalCruces, CR.No_Economico
      FROM cruces CR
      INNER JOIN Orden_traslados OT
          ON CR.id_orden = OT.ID_orden
      INNER JOIN casetas_Plantillas CP
          ON CR.idCaseta = CP.ID_Caseta`;

        const conditions = [];

        if (idOrden && idOrden !== '0') {
            conditions.push('CR.id_orden = @idOrden');
        }
        if (Matricula && Matricula !== '0') {
            conditions.push('CR.No_Economico = @Matricula');
        }
        if (FechaInicio && FechaInicio !== '0') {
            conditions.push('CR.Fecha >= @FechaInicio');
        }
        if (FechaFin && FechaFin !== '0') {
            conditions.push('CR.Fecha <= @FechaFin');
        }
        if (idRuta && idRuta !== '0') {
            conditions.push('CR.idRuta = @idRuta');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += `
      GROUP BY CP.Nombre, CR.idCaseta, CR.No_Economico
      ORDER BY   totalCruces DESC, CP.Nombre`;

        const gastosCrucesAgrupados = await pool.request()
            .input('idOrden', sql.Int, idOrden)
            .input('Matricula', sql.VarChar, Matricula)
            .input('FechaInicio', sql.Date, FechaInicio)
            .input('FechaFin', sql.Date, FechaFin)
            .input('idRuta', sql.Int, idRuta)
            .query(query);
        for (const detalleDeGasto of gastosCrucesAgrupados.recordset) {
            if (detalleDeGasto.Importe - detalleDeGasto.ImporteOficial < 0) {
                detalleDeGasto.ahorro = detalleDeGasto.ImporteOficial - detalleDeGasto.Importe;
                continue;
            }
            if (detalleDeGasto.Importe - detalleDeGasto.ImporteOficial > 0) {
                detalleDeGasto.diferencia = detalleDeGasto.Importe - detalleDeGasto.ImporteOficial;
                continue;
            }
            if (detalleDeGasto.Importe - detalleDeGasto.ImporteOficial === 0) {
                detalleDeGasto.casetaOK = true;
                continue;
            }
        }
        const rutasConformeACruces = await pool.request().query(`
        SELECT COUNT(Orden_traslados.Id_tipo_ruta) as Recuento, DIR_DESTINO.Nombre AS NombreDestino, DIR_ORIGEN.Nombre AS NombreOrigen  
        from cruces CR
        INNER JOIN
        Orden_traslados ON CR.id_orden=Orden_traslados.ID_orden
        INNER JOIN 
        Tipo_de_ruta_N TRN ON Orden_traslados.Id_tipo_ruta=TRN.id_Tipo_ruta
        INNER JOIN
        Directorio DIR_DESTINO ON TRN.PoblacionOrigen=DIR_DESTINO.ID_entidad
        INNER JOIN
        Directorio DIR_ORIGEN ON TRN.PoblacionDestino=DIR_ORIGEN.ID_entidad
        WHERE Orden_traslados.Id_tipo_ruta IS NOT NULL AND Orden_traslados.Id_tipo_ruta<>'' GROUP BY Orden_traslados.Id_tipo_ruta, DIR_DESTINO.Nombre, DIR_ORIGEN.Nombre HAVING COUNT(Orden_traslados.Id_tipo_ruta) >1
      `);
        const detalleDeAclaraciones = await pool.request().query(`
        SELECT SUM (CR.Importe) AS Importe, SUM (CR.ImporteOficial) AS ImporteOficial, CP.Nombre, CR.idCaseta, CR.No_Economico
        FROM cruces CR
        INNER JOIN Orden_traslados OT
            ON CR.id_orden = OT.ID_orden
        INNER JOIN casetas_Plantillas CP
            ON CR.idCaseta = CP.ID_Caseta
        WHERE CR.Estatus = 'Aclaración'
        GROUP BY CP.Nombre, CR.idCaseta, CR.No_Economico, CR.Fecha
        ORDER BY  CR.Fecha DESC, CP.Nombre
        `);

        res.json({ 'rutasActivas': rutasConformeACruces.recordset, 'detalleDeAclaraciones': detalleDeAclaraciones.recordset, 'gastosCrucesAgrupados': gastosCrucesAgrupados.recordset });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};
