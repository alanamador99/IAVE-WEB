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
    ( '4982', '66', DATEFROMPARTS(2025,12,30), 'IAVE', 4901);



--Ejemplo de consulta de los primeros 10 registros de las casetas por ruta
SELECT TOP(10)
    *
from PCasetasporruta
ORDER BY ID DESC;
-- Ejemplo de Actualización en la tabla de PCasetasporruta
UPDATE PCasetasporruta
SET Captor = '65'
WHERE ID = 57916;



--Ejemplo de consulta de los primeros 10 registros de Tipo_de_ruta_N
SELECT TOP(10)    *  from casetas_Plantillas;
SELECT TOP(10)    *  from Tipo_de_ruta_N;
SELECT TOP(10)    *  from PCasetasporruta;
ORDER BY Tipo_de_ruta_N.id_Tipo_ruta DESC;
-- Ejemplo de inserción en la tabla de Tipo_de_ruta_N
INSERT INTO Tipo_de_ruta_N
    ( Id_Ruta, PoblacionOrigen, PoblacionDestino, Latinos, Nacionales, Exportacion, Otros, Alterna, observaciones, fecha_Alta, id_destino, id_origen, Km_reales, Km_oficiales, Km_de_pago, Km_Tabulados,Peaje_Dos_Ejes,Peaje_Tres_Ejes, Cemex)
VALUES
    ( '4982', '8112', '8346', 0, 1, 0, 0, 0, 'Ruta de prueba', DATEFROMPARTS(2025,12,30), '1514', '1506', 200.5, 210.0, 205.0, 208.0, 150.00, 250.00, 0);


SELECT CPorRuta.consecutivo, Casetas.Nombre_IAVE, PobO.Poblacion as 'Origen', PobD.Poblacion as 'Destino', TRN.* FROM Tipo_de_ruta_N as TRN
INNER JOIN 
Poblaciones PobO ON PobO.ID_poblacion=TRN.id_origen 
INNER JOIN 
Poblaciones PobD ON PobD.ID_poblacion=TRN.id_destino 
INNER JOIN
PCasetasporruta CPorRuta ON CPorRuta.id_Tipo_ruta=TRN.id_Tipo_ruta
INNER JOIN
casetas_Plantillas Casetas ON Casetas.ID_Caseta=CPorRuta.Id_Caseta
WHERE TRN.id_Tipo_ruta=865 ORDER BY CPorRuta.consecutivo ASC

-- Ejemplo de Actualización en la tabla de PCasetasporruta
UPDATE Tipo_de_ruta_N
SET Observaciones = 'Ruta de prueba actualizada'
WHERE id_Tipo_ruta = 4903;


SELECT DISTINCT YEAR(Fecha) as 'AÑO'
FROM cruces


SELECT [TRN].[id_Tipo_ruta],
PobO.Poblacion as PoblacionOrigen,
PobD.Poblacion as PoblacionDestino,
[TRN].[Id_Ruta],
[TRN].[observaciones],
[TRN].[fecha_Alta],
[TRN].[Km_reales],
[TRN].[Km_oficiales],
[TRN].[Km_de_pago],
[TRN].[Km_Tabulados],
[TRN].[Peaje_Dos_Ejes],
[TRN].[Peaje_Tres_Ejes],
[TRN].[Cemex]
FROM Tipo_de_ruta_N as TRN
INNER JOIN 
Poblaciones PobO ON TRN.id_origen = PobO.ID_poblacion
INNER JOIN 
Poblaciones PobD ON TRN.id_destino = PobD.ID_poblacion
INNER JOIN
PCasetasporruta PCR ON PCR.id_Tipo_ruta = TRN.id_Tipo_ruta
WHERE TRN.Id_Ruta =4982 AND TRN.id_Tipo_ruta=4901



DELETE FROM PCasetasporruta WHERE Id_Ruta =4982 AND id_Tipo_ruta=4901 AND consecutivo IS NULL;