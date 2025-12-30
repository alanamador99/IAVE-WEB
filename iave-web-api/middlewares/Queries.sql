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
