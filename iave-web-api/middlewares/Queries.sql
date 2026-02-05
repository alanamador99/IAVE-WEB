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







SELECT COUNT(Orden_traslados.Id_tipo_ruta) as Recuento, Orden_traslados.ID_orden, DIR_DESTINO.Nombre AS NombreDestino, DIR_ORIGEN.Nombre AS NombreOrigen, Orden_traslados.Id_tipo_ruta, CONVERT(varchar, (Orden_traslados.Fecha_solicitud_cte), 23) as FechaSolicitud
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

SELECT *
FROM Tipo_de_ruta_N

SELECT SUM (CR.Importe) AS Importe, SUM (CR.ImporteOficial) AS ImporteOficial, CP.Nombre, CR.idCaseta, count(*) AS totalCruces, CR.No_Economico, CONVERT(varchar, CR.Fecha, 23) AS Fecha
FROM cruces CR
    INNER JOIN Orden_traslados OT
    ON CR.id_orden = OT.ID_orden
    INNER JOIN casetas_Plantillas CP
    ON CR.idCaseta = CP.ID_Caseta

GROUP BY CP.Nombre, CR.idCaseta, CR.No_Economico, CONVERT(varchar, CR.Fecha, 23)
ORDER BY Importe DESC, totalCruces DESC


SELECT SUM(Importe)
FROM cruces


SELECT [TRN].[id_Tipo_ruta], OT.ID_orden, PO.Poblacion AS Origen, PD.Poblacion AS Destino
FROM Tipo_de_ruta_N AS TRN
    INNER JOIN Orden_traslados OT
    ON TRN.id_Tipo_ruta = OT.Id_tipo_ruta
    INNER JOIN Poblaciones PO
    ON TRN.id_origen = PO.ID_poblacion
    INNER JOIN Poblaciones PD
    ON TRN.id_destino = PD.ID_poblacion
WHERE OT.ID_orden = 'OT-5101319'


SELECT *
FROM cruces
WHERE estatus = 'Abuso'

SELECT SUM (Importe) AS ImporteTotal, COUNT(*) AS TotalCruces
FROM cruces


SELECT *
FROM cruces
where fecha BETWEEN DATEFROMPARTS(2025, 01, 01) AND DATEFROMPARTS(2025, 03, 29)


SELECT DISTINCT CR.Estatus_Secundario
from Cruces CR


SELECT SUM (CR.Importe) AS Importe, SUM (CR.ImporteOficial) AS ImporteOficial, CP.Nombre, CR.idCaseta, count(*) AS totalCruces, CR.No_Economico, OT.Id_tipo_ruta, CR.Fecha, CR.Estatus, OT.ID_orden, CR.Estatus_Secundario
FROM cruces CR
    LEFT JOIN Orden_traslados OT
    ON CR.id_orden = OT.ID_orden
    LEFT JOIN casetas_Plantillas CP
    ON CR.idCaseta = CP.ID_Caseta
GROUP BY CP.Nombre, CR.idCaseta, CR.No_Economico, OT.Id_tipo_ruta, CR.Fecha, CR.Estatus, OT.ID_orden, CR.Estatus_Secundario
ORDER BY   totalCruces DESC, CP.Nombre

--Estatus secundarios agrupados en:
--Culminados
--confirmado
--dictaminado
--cobro_menor
--descuento_aplicado_pendiente_acta
--acta_aplicada_pendiente_descuento
--NULL
--Condonado


--En proceso
--aclaracion_levantada
--pendiente_reporte
--pendiente_aclaracion


--Recuento de cruces por día, según el mes seleccionado
SELECT CONVERT(varchar, CR.Fecha, 23) AS Fecha, COUNT(*) AS RecuentoCruces, SUM(CR.Importe) AS ImporteTotal
FROM cruces CR
WHERE CR.Fecha BETWEEN DATEFROMPARTS(2025, 04, 01) AND DATEFROMPARTS(2025, 05, 01)
GROUP BY CONVERT(varchar, CR.Fecha, 23)
ORDER BY CONVERT(varchar, CR.Fecha, 23) ASC


--Recuento de cruces por mes, según el año seleccionado
SELECT MONTH(CR.Fecha) AS Mes, COUNT(*) AS RecuentoCruces, SUM(CR.Importe) AS ImporteTotal
FROM cruces CR
WHERE YEAR(CR.Fecha) = 2025
GROUP BY MONTH(CR.Fecha)
ORDER BY MONTH(CR.Fecha) ASC

--Recuento de cruces por año
SELECT YEAR(CR.Fecha) AS Anio, COUNT(*) AS RecuentoCruces, SUM(CR.Importe) AS ImporteTotal
FROM cruces CR
GROUP BY YEAR(CR.Fecha)
ORDER BY YEAR(CR.Fecha) ASC

--Recuento de importes cobrados vs importes oficiales agrupados por rutas (Origen-Destino)
SELECT TRN.Id_Ruta, PO.Poblacion AS Origen, PD.Poblacion AS Destino, COUNT(*) AS RecuentoCruces, SUM(CR.Importe) AS ImporteCobrado, SUM(CR.ImporteOficial) AS ImporteOficial, (SUM(CR.ImporteOficial) - SUM(CR.Importe)) AS diferencia
FROM cruces CR
    INNER JOIN Orden_traslados OT
    ON CR.id_orden = OT.ID_orden
    INNER JOIN Tipo_de_ruta_N TRN
    ON OT.Id_tipo_ruta = TRN.id_Tipo_ruta
    INNER JOIN Poblaciones PO
    ON TRN.id_origen = PO.ID_poblacion
    INNER JOIN Poblaciones PD
    ON TRN.id_destino = PD.ID_poblacion
GROUP BY TRN.Id_Ruta, PO.Poblacion, PD.Poblacion
ORDER BY diferencia DESC