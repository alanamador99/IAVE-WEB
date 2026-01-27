CREATE TABLE cruces
(
    ID VARCHAR(24) NOT NULL PRIMARY KEY,
    Caseta VARCHAR(64),
    No_Economico VARCHAR(15),
    Fecha DATETIME,
    Importe NUMERIC(12,3),
    Tag VARCHAR(15),
    Carril VARCHAR(50),
    Clase VARCHAR(15),
    Consecar VARCHAR(20),
    FechaAplicacion DATETIME,
    Estatus VARCHAR(30) DEFAULT 'Pendiente',
    id_orden VARCHAR(30),
    observaciones VARCHAR(255),
    Estatus_Secundario VARCHAR(100),
    Aplicado BIT DEFAULT 'false',
    FechaDictamen date,
    ImporteOficial NUMERIC(12,3),
    NoAclaracion varchar(20),
    montoDictaminado NUMERIC(12,3),
    idCaseta VARCHAR (10)
);
CREATE TABLE ImportacionesCruces
(
    Id int IDENTITY(1,1) NOT NULL,
    Usuario nvarchar(50),
    FechaImportacion datetime,
    TotalInsertados int
)


SELECT *
FROM cruces
WHERE Estatus = 'Abuso'

SELECT *
FROM personal



SELECT TOP(10)
    *
FROM Poblaciones


DECLARE @Poblacion NVARCHAR(100) = '%Tepeapulco%';
SELECT
    Dir.*, Pob.Poblacion as ID_poblacion
FROM Directorio as Dir
    INNER JOIN
    Poblaciones Pob ON Pob.ID_poblacion = Dir.ID_poblacion
WHERE Dir.Direccion LIKE @Poblacion or Pob.Poblacion LIKE @Poblacion



SELECT TOP(10)
    *
from PCasetasporruta
ORDER BY ID DESC;

-- Ejemplo de inserción en la tabla de PCasetasporruta
INSERT INTO PCasetasporruta
    ( Id_Ruta, Id_Caseta, F_Captura, Captor, id_Tipo_ruta)
VALUES
    ( '4982', '66', DATEFROMPARTS(2027,01,08), 'IAVE', 4901);



--Ejemplo de consulta de los primeros 10 registros de las casetas por ruta
SELECT
    *
from PCasetasporruta
WHERE id_Tipo_ruta = '1709'
ORDER BY ID DESC;
-- Ejemplo de Actualización en la tabla de PCasetasporruta
UPDATE PCasetasporruta
SET Captor = '65'
WHERE ID = 57916;



--Ejemplo de consulta de los primeros 10 registros de Tipo_de_ruta_N
SELECT TOP(10)
    *
from casetas_Plantillas;
SELECT TOP(10)
    *
from Tipo_de_ruta_N;
SELECT TOP(10)
    *
from PCasetasporruta
ORDER BY PCasetasporruta.ID DESC;
-- Ejemplo de inserción en la tabla de Tipo_de_ruta_N
INSERT INTO
    ( Id_Ruta, PoblacionOrigen, PoblacionDestino, Latinos, Nacionales, Exportacion, Otros, Alterna, observaciones, fecha_Alta, id_destino, id_origen, Km_reales, Km_oficiales, Km_de_pago, Km_Tabulados,Peaje_Dos_Ejes,Peaje_Tres_Ejes, Cemex)
VALUES
    ( '4982', '8112', '8346', 0, 1, 0, 0, 0, 'Ruta de prueba', DATEFROMPARTS(2025,12,30), '1514', '1506', 200.5, 210.0, 205.0, 208.0, 150.00, 250.00, 0);


SELECT TOP 1
    *
FROM Tipo_de_ruta_N
ORDER BY Id_Ruta DESC;

SELECT TOP(10)
    CPorRuta.consecutivo, Casetas.Nombre_IAVE, PobO.Poblacion as 'Origen', PobD.Poblacion as 'Destino', TRN.*, TRN.id_Tipo_ruta
FROM Tipo_de_ruta_N as TRN
    INNER JOIN
    Poblaciones PobO ON PobO.ID_poblacion=TRN.PoblacionOrigen
    INNER JOIN
    Poblaciones PobD ON PobD.ID_poblacion=TRN.PoblacionDestino
    LEFT JOIN
    PCasetasporruta CPorRuta ON CPorRuta.id_Tipo_ruta=TRN.id_Tipo_ruta
    LEFT JOIN
    casetas_Plantillas Casetas ON Casetas.ID_Caseta=CPorRuta.Id_Caseta

ORDER BY TRN.Id_Ruta DESC

-- Ejemplo de Actualización en la tabla de PCasetasporruta
UPDATE Tipo_de_ruta_N
SET Observaciones = 'Ruta de prueba actualizada'
WHERE id_Tipo_ruta = 4903;


SELECT DISTINCT YEAR(Fecha) as 'AÑO'
FROM cruces


SELECT TOP(1)
    


FROM Tipo_de_ruta_N as TRN
    INNER JOIN
    Directorio Dir ON Dir.ID_entidad = TRN.PoblacionOrigen
    INNER JOIN
    Poblaciones Pob ON Pob.ID_poblacion = Dir.ID_poblacion
    INNER JOIN

    WHERE TRN  .id_Tipo_ruta = 14



SELECT *
from Cat_EntidadCaseta


-- OrigenInmediato  DestinoInmediato

-- DELETE FROM PCasetasporruta WHERE Id_Ruta =4982 AND id_Tipo_ruta=4901 AND PCasetasporruta.ID IN 
SELECT DISTINCT PCasetasporruta.id_Tipo_ruta, COUNT(Id_Caseta)
FROM PCasetasporruta
WHERE consecutivo IS NULL
GROUP BY id_Tipo_ruta;

SELECT COUNT(PCasetasporruta.Id_Caseta)
FROM PCasetasporruta
SELECT *
FROM PCasetasporruta
WHERE id_Tipo_ruta = 600




DECLARE @latitud FLOAT = 17.9101386;
DECLARE @longitud FLOAT = -94.93727412;
DECLARE @costo FLOAT = 320;
DECLARE @nombre VARCHAR(100) = 'Ocozocoautla';

SELECT
    casetas_Plantillas.ID_Caseta,
    casetas_Plantillas.Nombre,
    casetas_Plantillas.Carretera,
    casetas_Plantillas.Estado,
    casetas_Plantillas.Automovil,
    casetas_Plantillas.Autobus2Ejes,
    casetas_Plantillas.Camion2Ejes,
    casetas_Plantillas.Camion3Ejes,
    casetas_Plantillas.Camion5Ejes,
    casetas_Plantillas.Camion9Ejes,
    casetas_Plantillas.IAVE,
    casetas_Plantillas.latitud,
    casetas_Plantillas.longitud,
    casetas_Plantillas.Nombre_IAVE,
    casetas_Plantillas.Notas,
    (
            6371 * ACOS(
              COS(RADIANS(@latitud)) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT))) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(longitud)), CHAR(9), ''), ' ', '') AS FLOAT)) - RADIANS(@longitud)) 
              + SIN(RADIANS(@latitud)) 
              * SIN(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT)))
            )
          ) AS distancia_km
FROM casetas_Plantillas
WHERE TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT) IS NOT NULL
    AND TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(longitud)), CHAR(9), ''), ' ', '') AS FLOAT) IS NOT NULL
    AND (
            6371 * ACOS(
              COS(RADIANS(@latitud)) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT))) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(longitud)), CHAR(9), ''), ' ', '') AS FLOAT)) - RADIANS(@longitud)) 
              + SIN(RADIANS(@latitud)) 
              * SIN(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT)))
            )
          ) <= 100
    AND (casetas_Plantillas.Camion2Ejes - @costo) BETWEEN -20 AND 20

ORDER BY distancia_km




DECLARE @idCaseta INT = 66;
DECLARE @costoActualizadoAutomovil FLOAT = 50.00;
DECLARE @costoActualizadoCamion2Ejes FLOAT = 80.00;
DECLARE @costoActualizadoCamion3Ejes FLOAT = 120.00;
DECLARE @costoActualizadoCamion5Ejes FLOAT = 150.00;
DECLARE @costoActualizadoCamion9Ejes FLOAT = 200.00;
DECLARE @costoActualizadoAutobus2Ejes FLOAT = 90.00;
DECLARE @OrigenINEGI INT = 1506;
DECLARE @DestinoINEGI INT = 1514;
UPDATE casetas_Plantillas 
      SET   
        Automovil = @costoActualizadoAutomovil,
        Camion2Ejes = @costoActualizadoCamion2Ejes,
        Camion3Ejes = @costoActualizadoCamion3Ejes,
        Camion5Ejes = @costoActualizadoCamion5Ejes,
        Camion9Ejes = @costoActualizadoCamion9Ejes,
        Autobus2Ejes = @costoActualizadoAutobus2Ejes
      WHERE ID_Caseta = @idCaseta;

UPDATE Cat_EntidadCaseta
      SET 
        DestinoInmediato = @DestinoINEGI, 
        OrigenInmediato = @OrigenINEGI
      WHERE Id_caseta = @idCaseta;

    -- Ejemplo de consulta para verificar la actualización
SELECT *
FROM Cat_EntidadCaseta as CEC
WHERE CEC.Id_caseta = 1;

-- OTORGAMOS PERMISOS DE UPDATE E INSERCIÓN AL USUARIO DE LA APLICACIÓN
GRANT UPDATE, INSERT ON Cat_EntidadCaseta TO IAVE;





select * from Cat_EntidadCaseta where Id_caseta=11;