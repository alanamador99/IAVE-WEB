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


SELECT TOP(1)
    *
FROM Personal;





SELECT *
FROM casetas_Plantillas;

SELECT *
FROM Estado_del_personal;

SELECT *
FROM cruces
WHERE Estatus != 'Pendiente';

SELECT *
FROM cruces
WHERE Estatus = 'Pendiente';

SELECT COUNT(*)
FROM cruces;
DELETE FROM cruces;

SELECT *
FROM cruces;

SELECT *
FROM cruces
WHERE Estatus='Aclaración';


UPDATE cruces SET Estatus_Secundario = 'resuelto' WHERE Carril='ESPERANZA-HORNOS 1'
SELECT *
FROM Estado_del_personal
where ID_matricula = '1867';


select *
from casetas_Plantillas

select *
from Orden_traslados
where Fecha_traslado > DATEFROMPARTS(2025,01,01)

SELECT *
FROM Estado_del_personal
WHERE Descripcion = 'Platica Lilia';

SELECT *
FROM PCasetasporruta
WHEre F_Captura > DATEFROMPARTS(2025,1,1)

SELECT *
FROM Tipo_de_ruta_N
WHEre fecha_Alta > DATEFROMPARTS(2025,1,1)


ALTER TABLE cruces ADD  Aplicado BIT DEFAULT 'false';

SELECT *
FROM cruces
WHERE ID='250601_214910_28159585';



update cruces set Caseta ='HOLAHOLA' WHERE ID='250601_214910_28159585'



SELECT COALESCE(Estatus_Secundario, Caseta, '10') as 'Hello', Estatus_Secundario, COUNT(*) AS total
FROM cruces
WHERE Estatus = 'Aclaración'
GROUP BY Estatus_Secundario
ORDER BY Estatus_Secundario ASC;
SELECT SUM(cruces.Importe - cruces.ImporteOficial) AS Diferencia
FROM cruces
WHERE Estatus='Aclaración'
SELECT Estatus_Secundario, COUNT(*) AS total, SUM(cruces.Importe - cruces.ImporteOficial) AS 'SumaImporte'
FROM cruces
WHERE Estatus = 'Aclaración'
GROUP BY Estatus_Secundario
ORDER BY Estatus_Secundario ASC



UPDATE cruces SET ImporteOficial = 20;

SELECT Estatus_Secundario, COUNT(*) AS total
FROM cruces
WHERE Estatus = 'Aclaración'
GROUP BY Estatus_Secundario
ORDER BY Estatus_Secundario ASC;


-- Genera una query que permita conocer los operadores distintos de la tabla de cruces, cuyo dictamen (estatus) sea "Abuso" --

SELECT

    Estatus_secundario,
    COUNT(*) AS Total_Abusos
FROM
    Cruces
WHERE 
    Estatus = 'Abuso'
GROUP BY
    Estatus_secundario
ORDER BY
    Total_Abusos DESC;

SELECT *
from Cruces
WHERE Estatus = 'Abuso';

SELECT COUNT(*) AS Total_Abusos
FROM Cruces
WHERE      Estatus = 'Aclaración'


SELECT *
FROM Cruces
WHERE (Estatus_Secundario !='')
SELECT *
FROM cruces

SELECT *
FROM Orden_traslados
where (Origen=8126 AND Destino = 469) OR (Origen=4008 AND Destino = 469)

SELECT *
FROM cruces;

UPDATE cruces SET aplicado = 'Hola' where ID = '250601_172943_29083618';

select *
from Orden_traslados
where Orden_traslados.ID_orden  = 'OT-5071253'

SELECT *
FROM orden_status
WHERE fk_orden = 'OT-5071253'






SELECT
    OT.ID_orden,
    CP.ID_Caseta,
    CP.Nombre,
    PCR.consecutivo
FROM
    Orden_traslados OT
    INNER JOIN
    Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN
    PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN
    casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta
ORDER BY 
    OT.ID_orden, PCR.consecutivo;


SELECT DISTINCT
    CP.ID_Caseta,
    CP.Nombre_IAVE,
    PCR.consecutivo,
    CP.IAVE,
    cp.Automovil,
    cp.Autobus2Ejes,
    CP.Camion2Ejes,
    CP.Camion3Ejes,
    CP.Camion5Ejes,
    cp.Camion9Ejes
FROM
    Orden_traslados OT
    INNER JOIN
    Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN
    PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN
    casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta
WHERE 
    CP.ID_Caseta = '109'
ORDER BY 
    PCR.consecutivo;

select *
from Poblaciones;

SELECT DISTINCT
    CP.Nombre_IAVE,
    CP.Camion2Ejes,
    TRN.Id_Ruta,
    PB.Ciudad_SCT as Origen,
    PB.ID_poblacion as Origen_ID,
    PBD.Ciudad_SCT as Destino,
    PBD.ID_poblacion as Destino_ID,
    CP.ID_Caseta
FROM
    Orden_traslados OT
    INNER JOIN
    Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN
    PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN
    casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta
    INNER JOIN
    Poblaciones PB ON TRN.id_origen = PB.ID_poblacion
    INNER JOIN
    Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
WHERE 
    CP.ID_Caseta=111



SELECT *
FROM Poblaciones
WHERE ID_poblacion = 73
SELECT *
FROM Poblaciones
WHERE ID_poblacion = 5





SELECT TOP 1
    OT.ID_orden,
    OT.ID_clave,
    OS.fk_orden
FROM
    Orden_traslados OT
    INNER JOIN
    orden_status OS ON OT.ID_orden = OS.fk_orden
WHERE
    OT.ID_orden = 'OT-5050517'

ALTER TABLE cruces ADD NoAclaracion VARCHAR(30);
ALTER TABLE cruces ADD ImporteOficial DECIMAL(5,2);


SELECT *
FROM cruces
WHERE Estatus='Aclaración'
UPDATE cruces SET Estatus_Secundario='dictaminado' WHERE Estatus='Aclaración' AND Caseta='CUENCAME'

SELECT *
FROM cruces
WHERE Estatus='Abuso'


SELECT *
FROM Personal;


ALTER TABLE Cat_EntidadCaseta  ADD Origen VARCHAR(100);
ALTER TABLE Cat_EntidadCaseta  ADD Destino VARCHAR(100);
ALTER TABLE Cat_EntidadCaseta  ADD Circuito VARCHAR(50);






SELECT CP.*
FROM Cat_EntidadCaseta CMA INNER JOIN casetas_Plantillas CP ON CMA.ID_Caseta = CP.ID_Caseta
WHERE UPPER(CMA.NombreRelacionado) = UPPER('NombreCruce');



SELECT *
FROM cruces
WHERE Estatus = 'Abuso'

DELETE FROM cruces



SELECT DISTINCT
    OT.ID_orden,
    CP.Nombre_IAVE,
    CP.Camion2Ejes AS 'Importe',
    PCR.consecutivo
FROM
    Orden_traslados OT
    INNER JOIN
    Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN
    PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN
    casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta
WHERE 
              OT.ID_orden = '' AND PCR.consecutivo IS NOT NULL
ORDER BY 
              PCR.consecutivo;


SELECT *
FROM Orden_traslados
where ID_orden = 'OT-5050532';

SELECT CR.*, OT.ID_clave
FROM cruces CR

    INNER JOIN
    Orden_traslados OT ON OT.ID_orden = CR.id_orden
WHERE 
                CR.Estatus = 'Aclaración'
ORDER BY 
                CR.Fecha DESC;




SELECT DISTINCT

    PCR.consecutivo
FROM
    Orden_traslados OT
    INNER JOIN
    Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN
    PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN
    casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta
WHERE 
              OT.ID_orden = '' AND PCR.consecutivo IS NOT NULL
ORDER BY 
              PCR.consecutivo;








/*La siguiente consulta es para obtener el estatus del personal, en base a los primeros digitos antes del primer espacio del campo de CR.No_Economico */
SELECT
    SUBSTRING(CR.No_Economico, 1, CHARINDEX(' ', CR.No_Economico) - 1) AS ID_Matricula,
    DATEFROMPARTS(YEAR(CR.Fecha), MONTH(CR.Fecha), DAY(CR.Fecha)) AS Fecha_Cruce,
    CR.*,
    EP.Descripcion AS Estado_Personal
FROM cruces CR
    LEFT JOIN Estado_del_personal EP
    ON SUBSTRING(CR.No_Economico, 1, CHARINDEX(' ', CR.No_Economico) - 1) = EP.ID_matricula
        AND DATEFROMPARTS(YEAR(CR.Fecha), MONTH(CR.Fecha), DAY(CR.Fecha)) = EP.ID_fecha
WHERE CR.Estatus = 'Abuso'




SELECT *
FROM Cruces
WHERE Estatus = 'Aclaración'





/*Estoy viendo que cuando una caseta está registrada en más de una ocasión en la tabla de casetas_Plantillas, se retornan todas las coincidencias de esa caseta, pero me gustaría que se hiciera una validación de la caseta que aparece en la ruta de la OT*/
/*En esta consulta se devuelven 62 registros*/
SELECT DISTINCT CR.*, OT.ID_clave, CP.Nombre_IAVE, CP.Automovil, CP.Camion2Ejes, CP.Camion3Ejes, CP.Camion5Ejes, CP.Camion9Ejes, CP.latitud, CP.longitud
FROM cruces CR
    INNER JOIN Orden_traslados OT ON OT.ID_orden = CR.id_orden
    INNER JOIN Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta AND CR.Caseta = CP.Nombre_IAVE
WHERE CR.Estatus = 'Aclaración'
ORDER BY  CR.Fecha DESC;

/* Pero en esta consulta se devuelven 38 registros */
SELECT *
from cruces
WHERE Estatus = 'Aclaración'

SELECT *
from casetas_Plantillas
ORDER BY ID_Caseta ASC;

UPDATE casetas_Plantillas SET Nombre_IAVE = 'Esperanza' WHERE ID_Caseta = 1;

SELECT *
FROM cruces
WHERE ID='250601_161314_28967171'

select *
from Poblaciones
where ID_poblacion = 330;

SELECT CR.*, OT.ID_clave
FROM cruces CR INNER JOIN Orden_traslados OT ON OT.ID_orden = CR.id_orden
WHERE CR.Estatus = 'Aclaración'
ORDER BY  CR.Fecha DESC;

ALTER TABLE Cat_EntidadCaseta ADD OrigenInmediato VARCHAR(100), DestinoInmediato varChar(100);


SELECT *
FROM cruces
WHERE Estatus = 'Aclaración'
ORDER BY Fecha DESC;




ALTER TABLE cruces ALTER COLUMN Importe DECIMAL(10,2);

SELECT Ps.Nombres, Ps.Ap_paterno, Ps.Ap_materno, CT.*
FROM Control_Tags CT INNER JOIN Personal Ps ON CT.id_matricula = Ps.ID_matricula
ORDER BY CT.Activa DESC;



SELECT Ps.Nombres, Ps.Ap_paterno, Ps.Ap_materno, CT.*
FROM Control_Tags CT INNER JOIN Personal Ps ON CT.id_matricula = Ps.ID_matricula
ORDER BY CT.Activa DESC;


SELECT *
from cruces
WHERE Estatus='Abuso';



Select top(200)
    *
from geo_op
WHERE fecha > '2025-01-08'
ORDER BY fecha DESC;


DELETE FROM cruces




SELECT *
FROM Control_Tags


SELECT OT.Fecha_traslado
FROM Orden_traslados OT



SELECT *
FROM Control_Tags
WHERE  Control_Tags.Dispositivo = 'IMDM28598870'



SELECT *
FROM Personal


SELECT TOP (1)
    *
FROM Estado_del_personal





DECLARE @FechaBuscada DATE = '2025-08-01';

SELECT
    p.ID_matricula,
    p.Ap_paterno,
    p.Ap_materno,
    p.Nombres,
    ep.Descripcion,
    ep.Fecha_captura,
    ep.ID_fecha,
    ep.Captor,
    ep.ID_orden
FROM Personal p
    INNER JOIN Estado_del_personal ep
    ON p.ID_matricula = ep.ID_matricula
WHERE 
    p.Fecha_de_baja IS NULL -- Operadores activos
    AND p.Puesto = 'O'
    AND ep.ID_fecha = @FechaBuscada
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
ORDER BY p.ID_matricula


SELECT TOP (100)
    *
FROM geo_op
WHERE fecha = DATEFROMPARTS(2025,7,8) AND fk_op='216'
ORDER BY fecha DESC;



SELECT TOP (100)
    *
FROM Casetas

SELECT Estatus_Secundario, COUNT(*)
FROM cruces
WHERE Estatus='Abuso'
GROUP BY Estatus_Secundario






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




SELECT
    SUM(CASE WHEN Estatus_Secundario = 'pendiente_reporte' THEN 1 ELSE 0 END) AS pendiente_reporte,
    SUM(CASE WHEN Estatus_Secundario = 'reporte_enviado_todo_pendiente' THEN 1 ELSE 0 END) AS reporte_enviado_todo_pendiente,
    SUM(CASE WHEN Estatus_Secundario = 'descuento_aplicado_pendiente_acta_levantada' THEN 1 ELSE 0 END) AS descuento_aplicado_pendiente_acta_levantada,
    SUM(CASE WHEN Estatus_Secundario = 'acta_aplicada_pendiente_descuento' THEN 1 ELSE 0 END) AS acta_aplicada_pendiente_descuento,
    SUM(CASE WHEN Estatus_Secundario = 'completado' THEN 1 ELSE 0 END) AS completado
    , COUNT(*) AS total_abusos
FROM cruces
WHERE Estatus = 'abuso'


SELECT
    -- Conteos por estatus
    SUM(CASE WHEN Estatus_Secundario = 'pendiente_reporte' THEN 1 ELSE 0 END) AS pendiente_reporte_count,
    SUM(CASE WHEN Estatus_Secundario = 'reporte_enviado_todo_pendiente' THEN 1 ELSE 0 END) AS reporte_enviado_todo_pendiente_count,
    SUM(CASE WHEN Estatus_Secundario = 'adescuento_aplicado_pendiente_actacta_levantada' THEN 1 ELSE 0 END) AS adescuento_aplicado_pendiente_actacta_levantada_count,
    SUM(CASE WHEN Estatus_Secundario = 'acta_aplicada_pendiente_descuento' THEN 1 ELSE 0 END) AS acta_aplicada_pendiente_descuento_count,
    SUM(CASE WHEN Estatus_Secundario = 'completado' THEN 1 ELSE 0 END) AS completado_count,

    -- Montos por estatus
    SUM(CASE WHEN Estatus_Secundario = 'pendiente_reporte' THEN Importe ELSE 0 END) AS pendiente_reporte_monto,
    SUM(CASE WHEN Estatus_Secundario = 'reporte_enviado_todo_pendiente' THEN Importe ELSE 0 END) AS reporte_enviado_todo_pendiente_monto,
    SUM(CASE WHEN Estatus_Secundario = 'adescuento_aplicado_pendiente_actacta_levantada' THEN Importe ELSE 0 END) AS adescuento_aplicado_pendiente_actacta_levantada_monto,
    SUM(CASE WHEN Estatus_Secundario = 'acta_aplicada_pendiente_descuento' THEN Importe ELSE 0 END) AS acta_aplicada_pendiente_descuento_monto,
    SUM(CASE WHEN Estatus_Secundario = 'completado' THEN Importe ELSE 0 END) AS completado_monto,

    -- Totales generales
    COUNT(*) AS total_count,
    SUM(Importe) AS total_monto

FROM Cruces
WHERE Estatus = 'abuso';




-- AGRUPADO POR MATRICULA + FECHA (solo fecha)
DECLARE @start DATE = '2025-07-01';
DECLARE @end   DATE = '2025-07-31';

SELECT
    No_Economico AS Eco,
    CAST(Fecha AS date) AS Fecha_Cruce,
    COUNT(*) AS NumAbusos,
    SUM(Importe) AS TotalImporte,
    MIN(No_Economico) AS No_Economico
FROM cruces
    INNER JOIN Estado_del_personal ep
    ON ep.ID_matricula = ep.ID_matricula
WHERE Estatus = 'Abuso'
    AND CAST(Fecha AS date) BETWEEN @start AND @end
GROUP BY No_Economico, CAST(Fecha AS date)
ORDER BY No_Economico;






WITH
    PrimerEstado
    AS
    (
        SELECT *,
            ROW_NUMBER() OVER(PARTITION BY ID_matricula, ID_fecha 
                             ORDER BY ID_fecha ASC) AS rn
        FROM Estado_del_personal
    )
SELECT
    SUBSTRING(CR.No_Economico, 1, CHARINDEX(' ', CR.No_Economico) - 1) AS ID_Matricula,
    CAST(CR.Fecha AS date) AS FechaAbuso,
    CR.*,
    EP.Descripcion AS Descripcion
FROM cruces CR
    LEFT JOIN PrimerEstado EP
    ON SUBSTRING(CR.No_Economico, 1, CHARINDEX(' ', CR.No_Economico) - 1) = EP.ID_matricula
        AND CAST(CR.Fecha AS date) = EP.ID_fecha
        AND EP.rn = 1
-- <-- Solo el primer estado por operador y fecha
WHERE CR.Estatus = 'Abuso';


SELECT *
FROM cruces
WHERE Estatus = 'Abuso'


SELECT *
FROM cruces
WHERE Estatus='Abuso' AND SUBSTRING(No_Economico, 1, CHARINDEX(' ', No_Economico) - 1) = '1224'


SELECT Ubi.*, ps.Nombres, ps.Ap_paterno, ps.Ap_materno, cruces.*
FROM cruces
    INNER JOIN Personal Ps
    ON PS.ID_matricula= SUBSTRING(No_Economico, 1, CHARINDEX(' ', No_Economico) - 1)
    INNER JOIN geo_op Ubi
    ON Ubi.fk_op = PS.ID_matricula AND DATEFROMPARTS(YEAR(cruces.Fecha),MONTH(cruces.Fecha), DAY(cruces.Fecha)) = DATEFROMPARTS(YEAR(Ubi.fecha),MONTH(Ubi.fecha), DAY(Ubi.fecha))
WHERE  Estatus='Abuso' AND cruces.ID = '250708_14119_28598882'



SELECT ps.Nombres, ps.Ap_paterno, ps.Ap_materno, cruces.*
FROM cruces
    INNER JOIN Personal Ps
    ON PS.ID_matricula= SUBSTRING(No_Economico, 1, CHARINDEX(' ', No_Economico) - 1)
WHERE  Estatus='Abuso' AND cruces.ID = '250708_123946_28598882'


SELECT OT.ID_clave, OS.iniciada, OS.finalizada, cruces.*
FROM cruces
    INNER JOIN orden_status OS ON cruces.id_orden = OS.fk_orden
    INNER JOIN Orden_traslados OT ON OS.fk_orden = OT.ID_orden
WHERE cruces.Tag = 'IMDM28598883' AND cruces.id_orden = 'OT-5070248'

DELETE FROM cruces WHERE cruces.Tag = 'IMDM28598883' AND cruces.id_orden = 'OT-5070248' AND Estatus = 'Se cobró menos'
SELECT *
FROM cruces
WHERE cruces.Tag='Condonado'





SELECT *
FROM cruces
WHERE Estatus = 'Aclaración'

UPDATE cruces SET Estatus_Secundario = 'pendiente'


SELECT
    -- Conteos por estatus
    SUM(CASE WHEN Estatus_Secundario = 'pendiente' THEN 1 ELSE 0 END) AS pendiente_count,
    SUM(CASE WHEN Estatus_Secundario = 'aclaracion_levantada' THEN 1 ELSE 0 END) AS aclaracion_levantada_count,
    SUM(CASE WHEN Estatus_Secundario = 'dictaminado' THEN 1 ELSE 0 END) AS dictaminado_count,

    -- Montos por estatus
    SUM(CASE WHEN Estatus_Secundario = 'pendiente' THEN (cruces.Importe - cruces.ImporteOficial) ELSE 0 END) AS pendiente_monto,
    SUM(CASE WHEN Estatus_Secundario = 'aclaracion_levantada' THEN (cruces.Importe - cruces.ImporteOficial) ELSE 0 END) AS aclaracion_levantada_monto,
    SUM(CASE WHEN Estatus_Secundario = 'dictaminado' THEN (cruces.Importe - cruces.ImporteOficial) ELSE 0 END) AS dictaminado_monto,

    -- Totales generales
    COUNT(*) AS total_count,
    SUM(Importe) AS total_monto

FROM cruces
WHERE Estatus = 'Aclaración';

SELECT *
FROM cruces
WHERE Estatus = 'Aclaración'



UPDATE cruces SET Estatus_Secundario = 'pendiente_reporte' WHERE Estatus='Abuso'




WITH
    PrimerEstado
    AS
    (
        SELECT *,
            ROW_NUMBER() OVER(PARTITION BY ID_matricula, ID_fecha 
                             ORDER BY ID_fecha ASC) AS rn
        FROM Estado_del_personal
    )
SELECT DISTINCT
    SUBSTRING(CR.No_Economico, 1, CHARINDEX(' ', CR.No_Economico) - 1) AS ID_Matricula,
    CONCAT(Per.nombres, ' ', Per.Ap_paterno,' ', Per.Ap_materno) AS NombreCompleto,
    CAST(CR.Fecha AS date) AS FechaAbuso,
    CR.*,
    EP.Descripcion AS Estado_Personal
FROM cruces CR
    LEFT JOIN PrimerEstado EP
    ON SUBSTRING(CR.No_Economico, 1, CHARINDEX(' ', CR.No_Economico) - 1) = EP.ID_matricula
        AND CAST(CR.Fecha AS date) = EP.ID_fecha
        AND EP.rn = 1 -- <-- Solo el primer estado por operador y fecha
    INNER JOIN
    Personal Per on Per.ID_matricula = EP.ID_matricula
WHERE CR.Estatus = 'Abuso'
ORDER BY CR.ID DESC;





SELECT *
FROM cruces
WHERE Estatus='Abuso'


WITH
    PrimerEstado
    AS
    (
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
    EP.Descripcion AS Estado_Personal
FROM cruces CR
    LEFT JOIN PrimerEstado EP
    ON TRY_CONVERT(int, LEFT(CR.No_Economico, CHARINDEX(' ', CR.No_Economico+' ')-1)) = EP.ID_matricula
        AND CAST(CR.Fecha AS date) = EP.ID_fecha
        AND EP.rn = 1 -- <-- Solo el primer estado por operador y fecha
    INNER JOIN
    Personal Per on Per.ID_matricula = EP.ID_matricula
WHERE CR.Estatus = 'Abuso'
ORDER BY CR.ID DESC;




DECLARE @IDCruce VARCHAR = '250803_14748_25967541'
SELECT Ubi.*, ps.Nombres, ps.Ap_paterno, ps.Ap_materno, cruces.*
FROM cruces
    left JOIN Personal Ps
    ON Ps.ID_matricula= SUBSTRING(cruces.No_Economico, 1, CHARINDEX(' ', cruces.No_Economico) - 1)
    left JOIN geo_op Ubi
    ON Ubi.fk_op = Ps.ID_matricula AND DATEFROMPARTS(YEAR(cruces.Fecha),MONTH(cruces.Fecha), DAY(cruces.Fecha)) = DATEFROMPARTS(YEAR(Ubi.fecha),MONTH(Ubi.fecha), DAY(Ubi.fecha))
WHERE  cruces.ID = @IDCruce
ORDER BY Ubi.fecha ASC

SELECT *
FROM cruces
    INNER JOIN geo_op Ubi
    ON Ubi.fk_op = '2266' AND Ubi.fecha = DATEFROMPARTS(2025,8,2)
WHERE cruces.ID='250803_14748_25967541'


SELECT TOP (100)
    *
FROM geo_op
ORDER BY fecha DESC;




SELECT *
FROM Personal



SELECT *
FROM cruces


SELECT *
FROM dbo.Control_Tags_Historico




SELECT TOP 1
    CTHistorico.id_matricula
FROM Control_Tags_Historico CTHistorico
    INNER JOIN Control_Tags CTags
    ON CTags.id_control_tags = CTHistorico.id_control_tags
WHERE CTags.id_control_tags = '66'
    AND DATEFROMPARTS(2019,10,08) BETWEEN CTHistorico.Fecha_Alta_Tag AND CTHistorico.Fecha_Baja_Tag





SELECT TOP 1
    CTHistorico.id_matricula, Per.Nombres, Per.Ap_paterno
FROM Control_Tags_Historico CTHistorico
    INNER JOIN Control_Tags CTags
    ON CTags.id_control_tags = CTHistorico.id_control_tags
    INNER JOIN Personal Per
    ON Per.ID_matricula = CTags.id_matricula
WHERE CTags.Dispositivo = 'IMDM23141445'
    AND DATEFROMPARTS(2019,10,08) BETWEEN CTHistorico.Fecha_Alta_Tag AND CTHistorico.Fecha_Baja_Tag




SELECT *
FROM dbo.Control_Tags_Historico
SELECT TOP(840)
    *
FROM dbo.Control_Tags
WHERE Dispositivo = 'IMDM27753705';


SELECT TOP 1
    LEFT(
        CAST(CTHistorico.id_matricula AS VARCHAR(15)) + ' ' +
        UPPER(LEFT(Per.Nombres, 1)) + LOWER(SUBSTRING(Per.Nombres, 2, 1))  + 
        ' ' +
        UPPER(LEFT(Per.Ap_paterno,1)) + LOWER(SUBSTRING(Per.Ap_paterno,2,LEN(Per.Ap_paterno))),
        15
    ) AS Matricula_Formateada
FROM Control_Tags_Historico CTHistorico
    INNER JOIN Control_Tags CTags
    ON CTags.id_control_tags = CTHistorico.id_control_tags
    INNER JOIN Personal Per
    ON Per.ID_matricula = CTags.id_matricula
WHERE CTags.Dispositivo = 'IMDM27753705'
    AND DATEFROMPARTS(2022,12,08) BETWEEN CTHistorico.Fecha_Alta_Tag AND CTHistorico.Fecha_Baja_Tag;


SELECT *
FROM cruces
WHERE Estatus = 'Aclaración'


SELECT *
FROM cruces
WHERE Estatus_Secundario='Segunda vuelta'


WITH
    PrimerEstado
    AS
    (
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
        AND EP.rn = 1 -- <-- Solo el primer estado por operador y fecha
    LEFT JOIN
    Personal Per on Per.ID_matricula = EP.ID_matricula
WHERE CR.Estatus = 'Abuso'
ORDER BY CR.ID DESC;




SELECT *
FROM cruces
WHERE Estatus='Abuso'


DECLARE @tag VARCHAR(20) = 'IMDM28967200'
SELECT
    LEFT(
        CAST(CTHistorico.id_matricula AS VARCHAR(15)) + ' ' +
        UPPER(LEFT(Per.Nombres, 1)) + LOWER(SUBSTRING(Per.Nombres, 2, 1))  + 
        ' ' +
        UPPER(LEFT(Per.Ap_paterno,1)) + LOWER(SUBSTRING(Per.Ap_paterno,2,LEN(Per.Ap_paterno))),
        15
    ) AS Matricula_Formateada,
    CTHistorico.*
FROM Control_Tags_Historico CTHistorico
    INNER JOIN Control_Tags CTags
    ON CTags.id_control_tags = CTHistorico.id_control_tags
    INNER JOIN Personal Per
    ON Per.ID_matricula = CTHistorico.id_matricula
WHERE RTRIM(LTRIM(CTags.Dispositivo)) = RTRIM(LTRIM(@tag))
ORDER BY CTHistorico.Fecha_Alta_Tag DESC;




SELECT *
FROM Control_Tags_Historico
WHERE (DATEFROMPARTS(2025,7,1) >= Control_Tags_Historico.Fecha_Alta_Tag AND Control_Tags_Historico.Fecha_Baja_Tag is NULL) OR (DATEFROMPARTS(2025,7,1) BETWEEN Control_Tags_Historico.Fecha_Alta_Tag AND Control_Tags_Historico.Fecha_Baja_Tag)

SELECT *
FROM Control_Tags_Historico



SELECT *
FROM Control_Tags_Historico
WHERE id_control_tags = '745'


SELECT *
FROM Control_Tags
WHERE Dispositivo = 'IMDM28285078'




DECLARE @tag VARCHAR(20) = 'IMDM28285078'
SELECT TOP 1
    LEFT(
        CAST(CTHistorico.id_matricula AS VARCHAR(20)) + ' ' +
        UPPER(LEFT(Per.Nombres, 1)) + LOWER(SUBSTRING(Per.Nombres, 2, 1))  + 
        ' ' +
        UPPER(LEFT(Per.Ap_paterno,1)) + LOWER(SUBSTRING(Per.Ap_paterno,2,LEN(Per.Ap_paterno))),
        15
    ) AS Matricula_Formateada
FROM Control_Tags_Historico CTHistorico
    INNER JOIN Control_Tags CTags
    ON CTags.id_control_tags = CTHistorico.id_control_tags
    INNER JOIN Personal Per
    ON Per.ID_matricula = CTHistorico.id_matricula
WHERE CTags.Dispositivo = 'IMDM28285078'
    AND @fechaCruce BETWEEN CTHistorico.Fecha_Alta_Tag AND CTHistorico.Fecha_Baja_Tag;















DECLARE @fechaCruce DATE = DATEFROMPARTS(2025,7,1)
DECLARE @tag VARCHAR(20) = 'IMDM28967179'
SELECT TOP (1)
    LEFT(
        CAST(CTHistorico.id_matricula AS VARCHAR(15)) + ' ' +
        -- Primer nombre (si hay espacio, toma el primero; si no, todo)
        CASE WHEN CHARINDEX(' ', Per.Nombres) > 0 
            THEN LEFT(Per.Nombres, CHARINDEX(' ', Per.Nombres) - 1)
            ELSE Per.Nombres
        END
        + ' ' +
        UPPER(LEFT(Per.Ap_paterno,1)) + LOWER(SUBSTRING(Per.Ap_paterno,2,LEN(Per.Ap_paterno))),
        15
    ) AS Matricula_Formateada
FROM Control_Tags_Historico CTHistorico
    INNER JOIN Control_Tags CTags
    ON CTags.id_control_tags = CTHistorico.id_control_tags
    INNER JOIN Personal Per
    ON Per.ID_matricula = CTags.id_matricula
WHERE RTRIM(LTRIM(CTags.Dispositivo)) = RTRIM(LTRIM(@tag))
    AND ((@fechaCruce >= CTHistorico.Fecha_Alta_Tag AND CTHistorico.Fecha_Baja_Tag is NULL) OR (@fechaCruce BETWEEN CTHistorico.Fecha_Alta_Tag AND CTHistorico.Fecha_Baja_Tag))



DECLARE @nombreRelacionado VARCHAR(30) = 'ZINAPECUARO'
SELECT TOP (1)
    CMA.NombreRelacionado, CP.*
FROM Cat_EntidadCaseta CMA
    INNER JOIN casetas_Plantillas CP ON CMA.ID_Caseta = CP.ID_Caseta
WHERE UPPER(REPLACE(REPLACE(CMA.NombreRelacionado, '-', ''), '.', '')) = @nombreRelacionado
    AND CMA.OrigenIAVE = 1




DECLARE @IDOrden VARCHAR(30) = 'OT-5061314'
SELECT DISTINCT
    OT.ID_orden,
    CP.Nombre_IAVE,
    CP.Camion2Ejes AS Importe,
    PCR.consecutivo,
    CP.ID_Caseta
FROM
    Orden_traslados OT
    INNER JOIN
    Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN
    PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN
    casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta
WHERE 
              OT.ID_orden = @IDOrden AND PCR.consecutivo IS NOT NULL
ORDER BY 
              PCR.consecutivo;

SELECT TOP (10)
    *
FROM casetas_Plantillas


DECLARE @matricula VARCHAR(30) = '2039'
DECLARE @FECHATRUNCADA DATE = DATEFROMPARTS(2025,7,1)

SELECT ID_matricula, ID_ordinal, Descripcion, ID_orden, Fecha_captura, Captor
FROM Estado_del_personal
WHERE ID_matricula = @matricula
    AND ID_fecha = @FECHATRUNCADA



SELECT *
FROM cruces
WHERE ID = '250730_153156_28484539'

SELECT *
FROM cruces

SELECT TOP(1)
    *
FROM Control_Tags_Historico;















WITH
    PrimerEstado
    AS
    (
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
        AND EP.rn = 1 -- <-- Solo el primer estado por operador y fecha
    LEFT JOIN
    Personal Per on Per.ID_matricula = EP.ID_matricula
WHERE CR.Estatus = 'Abuso'
ORDER BY CR.ID DESC;








SELECT DISTINCT CR.*, OT.ID_clave, CP.Nombre_IAVE, CP.Automovil, CP.Camion2Ejes, CP.Camion3Ejes, CP.Camion5Ejes, CP.Camion9Ejes, CP.latitud, CP.longitud, CP.Estado
FROM cruces CR
    INNER JOIN Orden_traslados OT
    ON OT.ID_orden = CR.id_orden
    INNER JOIN Tipo_de_ruta_N TRN
    ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN PCasetasporruta PCR
    ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN casetas_Plantillas CP
    ON PCR.Id_Caseta = CP.ID_Caseta AND CR.Caseta = CP.Nombre_IAVE
WHERE CR.Estatus = 'Aclaración'
ORDER BY  CR.Fecha DESC;









WITH
    PrimerEstado
    AS
    (
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
        AND EP.rn = 1 -- <-- Solo el primer estado por operador y fecha
    LEFT JOIN
    Personal Per on Per.ID_matricula = EP.ID_matricula
WHERE CR.Estatus = 'Abuso'
ORDER BY CR.ID DESC;



SELECT *
FROM cruces



SELECT DISTINCT CR.*, OT.ID_clave, CP.Nombre_IAVE, CP.Automovil, CP.Camion2Ejes, CP.Camion3Ejes, CP.Camion5Ejes, CP.Camion9Ejes, CP.latitud, CP.longitud, CP.Estado
FROM cruces CR
    INNER JOIN Orden_traslados OT
    ON CR.id_orden = OT.ID_orden
    INNER JOIN Tipo_de_ruta_N TRN
    ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN PCasetasporruta PCR
    ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN casetas_Plantillas CP
    ON PCR.Id_Caseta = CP.ID_Caseta AND CR.Caseta = CP.Nombre_IAVE
WHERE CR.Estatus = 'Aclaración'
ORDER BY  CR.Fecha DESC;


SELECT *
FROM cruces
WHERE Estatus='Aclaración'



SELECT DISTINCT CR.ID
FROM cruces CR
    INNER JOIN Orden_traslados OT ON CR.id_orden = OT.ID_orden
    INNER JOIN Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
    INNER JOIN casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta AND CR.Caseta = CP.Nombre_IAVE
WHERE CR.Estatus = 'Aclaración'


SELECT ID
FROM cruces
WHERE Estatus='Aclaración'
    AND ID NOT IN (
  SELECT DISTINCT CR.ID
    FROM cruces CR
        INNER JOIN Orden_traslados OT ON CR.id_orden = OT.ID_orden
        INNER JOIN Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
        INNER JOIN PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta
        INNER JOIN casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta AND CR.Caseta = CP.Nombre_IAVE
    WHERE CR.Estatus = 'Aclaración'
)
;


SELECT *
FROM casetas_Plantillas CP
    INNER JOIN
    INNER JOIN PCasetasporruta PCR
    ON PCR.Id_Caseta = CP.ID_Caseta AND UPPER(REPLACE(REPLACE(CR.Caseta, '-', ''), '.', '')) = UPPER(REPLACE(REPLACE(CP.Nombre_IAVE , '-', ''), '.', '')) 
;




SELECT DISTINCT CR.*, OT.*, TRN.*
FROM cruces CR
    LEFT JOIN Orden_traslados OT
    ON CR.id_orden = OT.ID_orden
    INNER JOIN Tipo_de_ruta_N TRN
    ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN PCasetasporruta PCR
    ON TRN.Id_Ruta = PCR.Id_Ruta
WHERE CR.Estatus = 'Aclaración'
LEFT JOIN casetas_Plantillas CP 
      ON PCR.Id_Caseta = CP.ID_Caseta AND UPPER
(REPLACE
(REPLACE
(CR.Caseta, '-', ''), '.', '')) = UPPER
(REPLACE
(REPLACE
(CP.Nombre_IAVE , '-', ''), '.', ''))
      WHERE CR.Estatus = 'Aclaración' 
      ORDER BY  CR.Fecha DESC;



SELECT TOP 10
    *
FROM casetas_Plantillas
ORDER BY LEN(casetas_Plantillas.ID_Caseta) DESC;


Alter table cruces ADD idCaseta VARCHAR(10);

SELECT ps.Nombres, ps.Ap_paterno, ps.Ap_materno, cruces.*
FROM cruces
    INNER JOIN Personal Ps
    ON PS.ID_matricula= SUBSTRING(No_Economico, 1, CHARINDEX(' ', No_Economico) - 1)
WHERE  Estatus='Abuso' AND cruces.ID = '250805_43323_28967194'




SELECT *
FROM cruces



SELECT DISTINCT CR.*, OT.ID_clave, CP.Nombre_IAVE, CP.Automovil, CP.Camion2Ejes, CP.Camion3Ejes, CP.Camion5Ejes, CP.Camion9Ejes, CP.latitud, CP.longitud, CP.Estado
FROM cruces CR
    INNER JOIN Orden_traslados OT
    ON CR.id_orden = OT.ID_orden
    INNER JOIN casetas_Plantillas CP
    ON CR.idCaseta = CP.ID_Caseta
WHERE CR.Estatus = 'Aclaración'
ORDER BY  CR.Fecha DESC;










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
    CR.id_orden = 'OT-5061148'
    AND PCR.consecutivo IS NOT NULL
ORDER BY 
    CR.Fecha DESC;





SELECT *
FROM cruces
WHERE ID = '250708_14945_28598882'
Estatus_Secundario


SELECT *
FROM cruces
WHERE cruces.Tag='IMDM29083607' AND Caseta='Marmol'







DECLARE @matricula VARCHAR(30) = '2039'
DECLARE @fechaCruce DATE = DATEFROMPARTS(2025,7,1)
SELECT
    OT.ID_clave, OS.fk_orden
FROM Orden_traslados OT INNER JOIN orden_status OS ON OT.ID_orden = OS.fk_orden
WHERE OS.fk_matricula = @matricula
    AND OS.iniciada IS NOT NULL
    AND OS.finalizada IS NOT NULL
    AND @fechaCruce BETWEEN OS.iniciada AND OS.finalizada


--Esta query nos permite conocer cuales casetas están pendientes de "vinculación" del nombre de la caseta dentro de la ruta de TUSA
SELECT cruces.Caseta, TRN.id_Tipo_ruta, cruces.Importe, CONCAT(PBO.Poblacion, ' - ', PBD.Poblacion) AS Ruta, COUNT(*) as Ocurrencias, SUM(cruces.Importe) AS TotalImporte
FROM cruces
    INNER JOIN Orden_traslados OT ON cruces.id_orden = OT.ID_orden
    INNER JOIN Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN Poblaciones PBO ON TRN.id_origen = PBO.ID_poblacion
    INNER JOIN Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
WHERE Estatus = 'CasetaNoEncontradaEnRuta'
GROUP BY cruces.Caseta, PBO.Poblacion, PBD.Poblacion, TRN.id_Tipo_ruta, cruces.Importe
ORDER BY TotalImporte DESC;




SELECT COUNT(*) as "CasetaNoEncontradaEnRuta_count", SUM(cruces.Importe) AS "CasetaNoEncontradaEnRuta_monto"
FROM cruces
WHERE Estatus = 'CasetaNoEncontradaEnRuta'


SELECT COUNT(cruces.idCaseta) as "CasetaNoEncontradaEnRuta_count"
FROM cruces
WHERE Estatus = 'CasetaNoEncontradaEnRuta'

SELECT *
FROM Control_Tags
WHERE Dispositivo = 'IMDM27739900'





SELECT count(*)
FROM cruces


-- Otro ejemplo: obtener los operadores (Personal) que tienen al menos un cruce con estatus 'Abuso'
SELECT *
FROM Personal
WHERE ID_matricula IN (
    SELECT DISTINCT SUBSTRING(No_Economico, 1, CHARINDEX(' ', No_Economico) - 1)a
FROM cruces
WHERE Estatus = 'Abuso'
);


SELECT


    [casetas_Plantillas].[Notas],
    [casetas_Plantillas].[Fecha_Captura],
    [casetas_Plantillas].[Id_Estado],
    [casetas_Plantillas].[Pais],
    [casetas_Plantillas].[tipo_geocerca],
    [casetas_Plantillas].[Poblacion]
FROM casetas_Plantillas;

SELECT OS.*, 2222 as "| Separación |", OT.*
FROM orden_status OS
    INNER JOIN Orden_traslados OT on OS.fk_orden = OT.ID_orden
WHERE OS.iniciada IS NULL AND OS.finalizada IS NULL AND OT.Traslado_cancelado = 0





--Esta consulta nos va a servir para una vez que hayamos encontrado o seleccionado la ruta de la cuál queremos ver en el mapa.
DECLARE @IDTipoRuta INT = 2941
DECLARE @ID_ruta INT = 753
SELECT DISTINCT TOP(100)
    CP.ID_Caseta,
    CP.Nombre,
    CP.Carretera,
    CP.Estado,
    CP.Automovil,
    CP.Autobus2Ejes,
    CP.Camion2Ejes,
    CP.Camion3Ejes,
    CP.Camion5Ejes,
    CP.Camion9Ejes,
    CP.IAVE, -- Campo booleano
    CP.latitud,
    CP.longitud,
    CP.Nombre_IAVE,
    CP.Notas,
    PCR.consecutivo,
    --Estos campos podríamos dejarlos en la consulta de la ruta, para que no sean tantos duplicados.
    PBO.Poblacion AS "Población Origen",
    PBD.Poblacion AS "Población Destino",
    DIR_O.latitud AS "LatitudClienteOrigen",
    DIR_O.longitud AS "LongitudClienteOrigen",
    DIR_O.Nombre AS 'Cliente Origen',
    DIR_D.Nombre AS 'Cliente Destino',
    DIR_D.latitud AS "LatitudClienteDestino",
    DIR_D.longitud AS "LongitudClienteDestino"
FROM
    Tipo_de_ruta_N TRN
    INNER JOIN
    PCasetasporruta PCR ON TRN.Id_Ruta = PCR.Id_Ruta AND TRN.id_Tipo_ruta = PCR.id_Tipo_ruta
    INNER JOIN
    casetas_Plantillas CP ON PCR.Id_Caseta = CP.ID_Caseta
    INNER JOIN
    Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
    INNER JOIN
    Poblaciones PBO ON TRN.id_origen = PBO.ID_poblacion
    INNER JOIN
    Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
    INNER JOIN
    Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
WHERE TRN.id_Tipo_ruta = @IDTipoRuta AND TRN.Id_Ruta = @ID_ruta
ORDER BY PCR.consecutivo;



SELECT TRN.*, PBO.Poblacion AS "PoblacionOrigen", PBD.Poblacion AS "PoblacionDestino", DIR_O.Razon_social as "RazonOrigen", DIR_D.Razon_social as "RazonDestino"
FROM Tipo_de_ruta_N TRN
    INNER JOIN
    Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
    INNER JOIN
    Poblaciones PBO ON TRN.id_origen = PBO.ID_poblacion
    INNER JOIN
    Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
    INNER JOIN
    Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad



SELECT *
from Directorio
WHERE Directorio.ID_entidad = 70







SELECT
    DIR_O.latitud as "LatitudOrigen",
    DIR_O.longitud as "LongitudOrigen",
    DIR_D.latitud as "LatitudDestino",
    DIR_D.longitud as "LongitudDestino",
    trn.id_Tipo_ruta
FROM Tipo_de_ruta_N TRN
    INNER JOIN
    Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
    INNER JOIN
    Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
ORDER BY
    TRN.id_Tipo_ruta ASC


SELECT *
FROM Tipo_de_ruta_N

SELECT
    CONCAT(DIR_O.Nombre, ' - ', DIR_D.Nombre)
FROM Tipo_de_ruta_N TRN
    INNER JOIN
    Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
    INNER JOIN
    Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
WHERE 
          TRN.id_Tipo_ruta=4888
ORDER BY
          TRN.id_Tipo_ruta ASC


























--Esta query nos permite conocer cuales casetas están pendientes de "vinculación" del nombre de la caseta dentro de la ruta de TUSA
SELECT cruces.Caseta, TRN.id_Tipo_ruta, cruces.Importe, CONCAT(PBO.Poblacion, ' - ', PBD.Poblacion) AS Ruta, COUNT(*) as Ocurrencias, SUM(cruces.Importe) AS TotalImporte
FROM cruces
    INNER JOIN Orden_traslados OT ON cruces.id_orden = OT.ID_orden
    INNER JOIN Tipo_de_ruta_N TRN ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
    INNER JOIN Poblaciones PBO ON TRN.id_origen = PBO.ID_poblacion
    INNER JOIN Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
WHERE Estatus = 'CasetaNoEncontradaEnRuta'
GROUP BY cruces.Caseta, PBO.Poblacion, PBD.Poblacion, TRN.id_Tipo_ruta, cruces.Importe
ORDER BY TotalImporte DESC;



--Esta Query nos permite conocer todas las rutas que tienen alguna caseta que en los cruces no fue encontrado el nombre de la caseta dentro de la ruta
SELECT DISTINCT
    TRN.ID_ruta,
    TRN.id_Tipo_ruta
FROM Tipo_de_ruta_N TRN
    INNER JOIN
    Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
    INNER JOIN
    Poblaciones PBO ON TRN.id_origen = PBO.ID_poblacion
    INNER JOIN
    Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
    INNER JOIN
    Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
    INNER JOIN
    Orden_traslados OT ON OT.Id_tipo_ruta = TRN.id_Tipo_ruta
    INNER JOIN
    cruces CR ON CR.id_orden = OT.ID_orden
WHERE
    CR.Estatus = 'CasetaNoEncontradaEnRuta'
ORDER BY
    TRN.id_Tipo_ruta ASC

--Esta Query nos devuelve toda la información necesaria de la ruta para que se pinte en pantalla una tabla con los datos de cada una de las rutas (sin filtros)
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
    INNER JOIN
    Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
    INNER JOIN
    Poblaciones PBO ON TRN.id_origen = PBO.ID_poblacion
    INNER JOIN
    Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
    INNER JOIN
    Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
ORDER BY
    TRN.id_Tipo_ruta ASC






SELECT *
FROM Personal;




WITH
    RutasConCasetasNoEncontradas
    AS
    (
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
WHERE TRN.id_Tipo_ruta IN (SELECT id_Tipo_ruta
FROM RutasConCasetasNoEncontradas)
ORDER BY TRN.id_Tipo_ruta ASC



SELECT *
FROM cruces
WHERE Estatus='Aclaración'




SELECT *
FROM Tipo_de_ruta_N
WHERE Id_tipo_ruta='727'


SELECT *
FROM cruces
WHERE  Estatus LIKE '%Ruta Sin Casetas%'
WITH
    PrimerEstado
    AS
    (
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
        AND EP.rn = 1 -- <-- Solo el primer estado por operador y fecha
    LEFT JOIN
    Personal Per on Per.ID_matricula = EP.ID_matricula
WHERE CR.Estatus = 'Abuso'







SELECT *
FROM Cat_EntidadCaseta




SELECT *
FROM Control_Tags_Historico
WHERE id_control_tags = 852


SELECT *
FROM Control_Tags
where Dispositivo = 'IMDM28967200'









SELECT
    PB.Poblacion AS Origen,
    PBD.Poblacion AS Destino,
    DirO.Razon_social AS RazonOrigen,
    DirD.Razon_social AS RazonDestino,
    TRN.id_Tipo_ruta,
    TRN.Latinos,
    TRN.Nacionales,
    TRN.Exportacion,
    TRN.Otros,
    TRN.Cemex,
    TRN.Alterna
FROM
    Tipo_de_ruta_N TRN
    INNER JOIN
    Poblaciones PB ON TRN.id_origen = PB.ID_poblacion
    INNER JOIN
    Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
    INNER JOIN
    Directorio DirO ON DirO.ID_entidad = TRN.PoblacionOrigen
    INNER JOIN
    Directorio DirD ON DirD.ID_entidad = TRN.PoblacionDestino

WHERE 
          PB.Ciudad_SCT LIKE '%huehue%'
    AND PBD.Ciudad_SCT LIKE '%Hermo%'
