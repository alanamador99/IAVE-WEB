SELECT COUNT(Orden_traslados.Id_tipo_ruta) as Recuento, DIR_DESTINO.Nombre AS NombreDestino, DIR_ORIGEN.Nombre AS NombreOrigen, Orden_traslados.Id_tipo_ruta
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
    AND Orden_traslados.Fecha_solicitud_cte BETWEEN DATEFROMPARTS(2026, 01, 01) AND DATEFROMPARTS(2026, 01, 28)
GROUP BY Orden_traslados.Id_tipo_ruta, DIR_DESTINO.Nombre, DIR_ORIGEN.Nombre
HAVING COUNT(Orden_traslados.Id_tipo_ruta) >1
ORDER BY Recuento DESC;

SELECT TOP 10
    *
FROM Orden_traslados OT
ORDER BY OT.Fecha_solicitud_cte DESC;


SELECT distinct
    COUNT(distinct OT.ID_orden) AS Recuento,
    TRN.id_Tipo_ruta,
    TRN.Id_Ruta,
    PO.Poblacion AS PoblacionOrigen,
    PD.Poblacion AS PoblacionDestino,
    OT.ID_orden,

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
            TRN.id_Tipo_ruta, TRN.Id_Ruta, PO.Poblacion, PD.Poblacion, OT.Fecha_solicitud_cte, OT.ID_orden
ORDER BY Recuento DESC;







SELECT COUNT(Orden_traslados.Id_tipo_ruta) as Recuento,Orden_traslados.ID_orden, DIR_DESTINO.Nombre AS NombreDestino, DIR_ORIGEN.Nombre AS NombreOrigen, Orden_traslados.Id_tipo_ruta, CONVERT(varchar, (Orden_traslados.Fecha_solicitud_cte), 23) as FechaSolicitud
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



SELECT distinct
            COUNT(distinct OT.ID_orden) AS Recuento,
            TRN.id_Tipo_ruta,
            TRN.Id_Ruta,
            PO.Poblacion AS PoblacionOrigen,
            PD.Poblacion AS PoblacionDestino,
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

        SELECT * FROM Tipo_de_ruta_N

SELECT SUM (CR.Importe) AS Importe, SUM (CR.ImporteOficial) AS ImporteOficial, CP.Nombre, CR.idCaseta, count(*) AS totalCruces, CR.No_Economico, CONVERT(varchar, CR.Fecha, 23) AS Fecha
      FROM cruces CR
      INNER JOIN Orden_traslados OT
          ON CR.id_orden = OT.ID_orden  
      INNER JOIN casetas_Plantillas CP
          ON CR.idCaseta = CP.ID_Caseta

      GROUP BY CP.Nombre, CR.idCaseta, CR.No_Economico, CONVERT(varchar, CR.Fecha, 23)
      ORDER BY Importe DESC, totalCruces DESC


SELECT SUM(Importe) FROM cruces


SELECT [TRN].[id_Tipo_ruta], OT.ID_orden, PO.Poblacion AS Origen, PD.Poblacion AS Destino
FROM Tipo_de_ruta_N AS TRN
INNER JOIN Orden_traslados OT
    ON TRN.id_Tipo_ruta = OT.Id_tipo_ruta
    INNER JOIN Poblaciones PO
        ON TRN.id_origen = PO.ID_poblacion
    INNER JOIN Poblaciones PD
        ON TRN.id_destino = PD.ID_poblacion
    WHERE OT.ID_orden = 'OT-5101319'


    