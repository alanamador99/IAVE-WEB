import { getConnection, sql } from "../database/connection.js";


export const getGeneralDashboardData = async (req, res) => {
    const { idOrden, Matricula, FechaInicio, FechaFin, idRuta } = req.body;
    try {
        const pool = await getConnection();

        let query = `
      SELECT SUM (CR.Importe) AS Importe, SUM (CR.ImporteOficial) AS ImporteOficial, CP.Nombre, CR.idCaseta, count(*) AS totalCruces, CR.No_Economico, OT.Id_tipo_ruta, CR.Fecha, CR.Estatus
      FROM cruces CR
      INNER JOIN Orden_traslados OT
          ON CR.id_orden = OT.ID_orden  
      INNER JOIN casetas_Plantillas CP
          ON CR.idCaseta = CP.ID_Caseta
      GROUP BY CP.Nombre, CR.idCaseta, CR.No_Economico, OT.Id_tipo_ruta, CR.Fecha, CR.Estatus
      ORDER BY   totalCruces DESC, CP.Nombre`;

        const gastosCrucesAgrupados = await pool.request()
            .query(query);
        
        let sobrecostoNoReclamado = 0;

        for (const detalleDeGasto of gastosCrucesAgrupados.recordset) {
            const diferencia = detalleDeGasto.Importe - detalleDeGasto.ImporteOficial;

            if (diferencia < 0) {
                detalleDeGasto.ahorro = Math.abs(diferencia);
                continue;
            }
            if (diferencia > 0) {
                detalleDeGasto.diferencia = diferencia;

                // KPI: Sobrecosto No Reclamado
                // Si nos cobraron de más (+) y NO está marcado como 'Aclaración', es dinero pendiente de recuperar.
                if (detalleDeGasto.Estatus !== 'Aclaración') {
                    sobrecostoNoReclamado += diferencia;
                }
                continue;
            }
            if (diferencia === 0) {
                detalleDeGasto.casetaOK = true;
                continue;
            }
        }
        //Este query obtiene las rutas activas conforme a los cruces registrados.
        const rutasConformeACruces = await pool.request().query(`
            SELECT COUNT(Orden_traslados.Id_tipo_ruta) as Recuento,Orden_traslados.ID_orden, DIR_DESTINO.Nombre AS Destino, DIR_ORIGEN.Nombre AS Origen, Orden_traslados.Id_tipo_ruta, CONVERT(varchar, (Orden_traslados.Fecha_solicitud_cte), 23) as FechaSolicitud
            FROM cruces CR
            INNER JOIN
                Orden_traslados ON CR.id_orden=Orden_traslados.ID_orden
            INNER JOIN
                Tipo_de_ruta_N TRN ON Orden_traslados.Id_tipo_ruta=TRN.id_Tipo_ruta
            INNER JOIN
                Directorio DIR_DESTINO ON TRN.PoblacionOrigen=DIR_DESTINO.ID_entidad
            INNER JOIN
                Directorio DIR_ORIGEN ON TRN.PoblacionDestino=DIR_ORIGEN.ID_entidad
            WHERE Orden_traslados.Id_tipo_ruta IS NOT NULL AND Orden_traslados.Id_tipo_ruta<>''
            GROUP BY Orden_traslados.Id_tipo_ruta, DIR_DESTINO.Nombre, DIR_ORIGEN.Nombre, Orden_traslados.Fecha_solicitud_cte, Orden_traslados.ID_orden
            ORDER BY Recuento DESC
      `);
        //Este query obtiene el detalle de las aclaraciones generadas.
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

        res.json({ 
            'rutasActivas': rutasConformeACruces.recordset, 
            'detalleDeAclaraciones': detalleDeAclaraciones.recordset, 
            'gastosCrucesAgrupados': gastosCrucesAgrupados.recordset,
            'kpis': {
                'sobrecostoNoReclamado': sobrecostoNoReclamado
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500);
        res.send(error.message);
    }
};




export const getRutasFromTUSA = async (req, res) => {
    //const { idOrden, Matricula, FechaInicio, FechaFin, idRuta } = req.body;
    try {
        const pool = await getConnection();

        let query = `
        SELECT distinct
            COUNT(distinct OT.ID_orden) AS Recuento,
            TRN.id_Tipo_ruta,
            TRN.Id_Ruta,
            PO.Poblacion AS Origen,
            PD.Poblacion AS Destino,
            --Parseamos la fecha a un formato legible
            CONVERT(varchar, (OT.Fecha_solicitud_cte), 23) as FechaSolicitud
        FROM Orden_traslados OT
            INNER JOIN
            orden_status OS ON OS.fk_orden = OT.ID_orden
            INNER JOIN
            Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta=TRN.id_Tipo_ruta
            INNER JOIN
            Poblaciones PO ON PO.ID_poblacion=TRN.id_origen
            INNER JOIN
            Poblaciones PD ON PD.ID_poblacion=TRN.id_destino
        WHERE OT.ID_orden LIKE 'OT-6%' AND OT.Fecha_solicitud_cte BETWEEN  DATEFROMPARTS(2025, 01, 01) AND DATEFROMPARTS(2026, 01, 28)
        GROUP BY
            TRN.id_Tipo_ruta, TRN.Id_Ruta, PO.Poblacion, PD.Poblacion, OT.Fecha_solicitud_cte
        ORDER BY Recuento DESC
        `;

        //Pendiente de ajustar esta consulta para que tome en cuenta los filtros enviados desde el front-end.
        const rutasDelPeriodoSeleccionado = await pool.request()
            .query(query);

        res.json({ data: rutasDelPeriodoSeleccionado.recordset });
    } catch (error) {
        console.log(error);
        res.status(500);
        res.send(error.message);
        
    }
};
