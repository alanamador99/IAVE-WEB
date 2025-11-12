import { getConnection, sql } from "../database/connection.js";
const claveToImporteField = {
  'A ': 'Automovil',
  'B ': 'Autobus2Ejes',
  'C-2 ': 'Camion2Ejes',
  'C-3 ': 'Camion3Ejes',
  'C-4 ': 'Camion3Ejes',
  'C-5 ': 'Camion5Ejes',
  'C-9 ': 'Camion9Ejes'
};

function normalize(nombre) {
  return nombre.toUpperCase().replace(/[-.]/g, '').trim().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
}

function getToken() {
  return 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';
}

const poblaciones = {
  "HIDALGO": 30655,
  "PUEBLA": 104888,
  "CD SAHAGUN": 235030,
  "HUEHUETOCA": 278858,
  "TAPACHULA": 236799,
  "REYNOSA": 22634,
  "PUENTE GRANDE": 150512,
  "TLAQUEPAQUE": 223844,
  "TEPEYAHUALCO": 104192,
  "ACAPULCO": 78070,
  "CD DE MEXICO (ZOCALO)": 2486,
  "QUERETARO": 275979,
  "TOLUCA": 62147,
  "CULIACAN": 155388,
  "HERMOSILLO": 103329,
  "CD OBREGON": 272430,
  "TEPOTZOTLAN": 276630,
  "AGUASCALIENTES": 175577,
  "JESUS MARIA": 108250,
  "CUAUTLA": 100000,
  "GOMEZ PALACIO": 273084,
  "URUAPAN": 92592,
  "ZINACANTEPEC": 281546,
  "HUEYPOXTLA": 103357,
  "ALTAMIRA": 134275,
  "GARCIA": 162117,
  "TIZAYUCA": 108978,
  "CALPULALPAN": 298114,
  "PACHUCA": 35390,
  "ALCHICHICA": 205324,
  "TULA DE ALLENDE": 233843,
  "VILLAHERMOSA": 172000,
  "SAN LUIS POTOSI": 262188,
  "MONTERREY": 263915,
  "LA PIEDAD": 289373,
  "TULTEPEC": 65932,
  "CANCUN": 169264,
  "JIUTEPEC": 195746,
  "SAN NICOLAS DE LOS GARZA": 171602,
  "LEON": 51982,
  "LAZARO CARDENAS": 171633,
  "CHOLULA": 81574,
  "CD GUZMAN": 270436,
  "POZA RICA": 252661,
  "NAUCALPAN DE JUAREZ": 204910,
  "TEPATITLAN": 281781,
  "ECATEPEC": 274917,
  "TEXCOCO": 130767,
  "CADEREYTA": 72644,
  "MATAMOROS": 227857,
  "SAN JUAN TEOTIHUACAN": 96050,
  "ORIZABA": 62244,
  "GUADALAJARA": 150211,
  "METEPEC": 198830,
  "APODACA": 183723,
  "TOLCAYUCA": 289771,
  "SOLEDAD DE GRACIANOS SANCHEZ": 284331,
  "TEPEAPULCO": 110316,
  "ZAPOPAN": 189460,
  "ATOTONILCO DE TULA": 129760,
  "ZAMORA": 288958,
  "CD MANTE": 275572,
  "XOXOCOTLA - MORELOS": 78238,
  "TULANCINGO": 92449,
  "TORREON": 203081,
  "TEOLOYUCAN": 227509,
  "MERIDA": 246683,
  "TLAJOMULCO": 193415,
  "PLAYA DEL CARMEN": 108594,
  "VERACRUZ": 158701,
  "MANZANILLO": 12447,
  "TIJUANA": 183756,
  "CIUDAD VICTORIA": 12968,
  "GUADALUPE ETLA": 150956,
  "SAN PABLO ETLA": 186421,
  "CHIHUAHUA": 10562,
  "ENSENADA": 172568,
  "PUERTO VALLARTA": 31008,
  "ZACAPU": 106127,
  "MEXICALI": 192356,
  "COYUCA DE BENITEZ": 266518,
  "IRAPUATO": 197296,
  "TEQUIXQUIAC": 260420,
  "PROGRESO DE OBREGON": 157403,
  "MORELIA": 299531,
  "TEPATEPEC": 9810,
  "ATITALAQUIA": 42554,
  "SAN DIEGO DE LA UNION": 230120,
  "APIZACO": 285088,
  "QUERETARO": 275979,
  "ZUMPANGO": 250127,
  "TLALNEPANTLA": 59099,
  "CELAYA": 109356,
  "MAZATLAN": 285525,
  "ACOLMAN": 61198,
  "POLOTITLAN": 16147,
  "SABINAS HIDALGO": 59659,
  "CD ACUNA": 237006,
  "TUXTEPEC": 142305,
  "CIUDAD DEL CARMEN": 199744,
  "LA PAZ": 12710,
  "CD VALLES": 55389,
  "CHIAUTEMPAN": 89935,
  "ZAPOTLANEJO": 226547,
  "CIENEGA DE FLORES": 286148,
  "TLATLAUQUITEPEC": 21673,
  "MARTINEZ DE LA TORRE": 149983,
  "YAUTEPEC": 164718,
  "GENERAL CEPEDA": 187749,
  "RAMOS ARIZPE": 215027,
  "DURANGO": 35981,
  "ZACATECAS": 287640,
  "TAMPICO": 148918,
  "APAXCO DE OCAMPO": 19592,
  "SINGUILUCAN": 182550,
  "HUETAMO": 274258,
  "TUXTLA GUTIERREZ": 45677,
  "TEMPOAL": 92063,
  "TEPIC": 38483,
  "SOMBRERETE": 27549,
  "OCOTLAN JALISCO": 15274,
  "TECAMAC": 20632,
  "COATZACOALCOS": 210608,
  "ANAHUAC": 8248,
  "IGUALA": 294961,
  "LAGOS DE MORENO": 189883,
  "CHAPALA": 214029,
  "SAN GREGORIO ATZOMPA": 244753,
  "BENITO JUAREZ": 188006,
  "ZACAZONAPAN": 28954,
  "SAN MIGUEL XOXTLA": 247109,
  "SANTIAGO PINOTEPA NACIONAL": 113816,
  "NUEVO LAREDO": 192143,
  "NOGALES": 113418,
  "CABO SAN LUCAS": 164768,
  "TAMUIN": 239072,
  "TEPOTZOTLAN": 276630,
  "ZITACUARO": 173986,
  "SAN JUAN DE LOS LAGOS": 276730,
}



export const getCasetas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * from casetas_Plantillas ORDER BY ID_Caseta ASC;");
    for (const row of result.recordset) {
    }
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



export const getCasetasByID = async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      WITH CasetaRutas AS (
        SELECT 
            CP.ID_Caseta,
            CP.Nombre_IAVE,
            CP.Camion2Ejes,
            PB.Ciudad_SCT AS Origen,
            PBD.Ciudad_SCT AS Destino,
            OT.ID_orden,
            ROW_NUMBER() OVER (PARTITION BY CP.ID_Caseta ORDER BY OT.Fecha_traslado) AS rn
        FROM Cat_EntidadCaseta CEC
        INNER JOIN casetas_Plantillas CP ON CP.ID_Caseta = CEC.Id_caseta
        INNER JOIN PCasetasporruta PCR ON CP.ID_Caseta = PCR.Id_Caseta
        INNER JOIN Tipo_de_ruta_N TRN ON PCR.Id_Ruta = TRN.Id_Ruta
        INNER JOIN Orden_traslados OT ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
        INNER JOIN Poblaciones PB ON TRN.id_origen = PB.ID_poblacion
        INNER JOIN Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
      )
      SELECT ID_Caseta, Nombre_IAVE,ID_orden, Camion2Ejes, Origen, Destino
      FROM CasetaRutas
      WHERE rn = 1
      ORDER BY ID_Caseta;
    `);

    // Aquí ya tienes una lista [{ ID_Caseta, Nombre_IAVE, Origen, Destino }]
    const casetas = result.recordset;


    // 🔹 Paso siguiente: obtener el ID del INEGI para cada origen/destino
    // Hacemos el map async para poder usar await
    const casetasConINEGI = await Promise.all(casetas.map(async (c, idx) => {
      const origenID = obtenerIdINEGI(c.Origen);
      const destinoID = obtenerIdINEGI(c.Destino);
      const l = await getCasetasINEGI(origenID, destinoID);
      if (idx % 200 === 0) {
        l.array.forEach(element => {
          console.log(element);
        });
      }
      return {
        ...c,
        OrigenINEGI: origenID,
        DestinoINEGI: destinoID,
      };
    }));

    res.json(casetasConINEGI);

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};



export const setCasetasByID = async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      WITH CasetaRutas AS (
        SELECT 
            CP.ID_Caseta,
            CP.Nombre_IAVE,
            CP.Camion2Ejes,
            PB.Ciudad_SCT AS Origen,
            PBD.Ciudad_SCT AS Destino,
            OT.ID_orden,
            ROW_NUMBER() OVER (PARTITION BY CP.ID_Caseta ORDER BY OT.Fecha_traslado) AS rn
        FROM Cat_EntidadCaseta CEC
        INNER JOIN casetas_Plantillas CP ON CP.ID_Caseta = CEC.Id_caseta
        INNER JOIN PCasetasporruta PCR ON CP.ID_Caseta = PCR.Id_Caseta
        INNER JOIN Tipo_de_ruta_N TRN ON PCR.Id_Ruta = TRN.Id_Ruta
        INNER JOIN Orden_traslados OT ON OT.Id_tipo_ruta = TRN.Id_Tipo_ruta
        INNER JOIN Poblaciones PB ON TRN.id_origen = PB.ID_poblacion
        INNER JOIN Poblaciones PBD ON TRN.id_destino = PBD.ID_poblacion
      )
      SELECT ID_Caseta, Nombre_IAVE,ID_orden, Camion2Ejes, Origen, Destino
      FROM CasetaRutas
      WHERE rn = 1
      ORDER BY ID_Caseta;
    `);

    // Aquí ya tienes una lista [{ ID_Caseta, Nombre_IAVE, Origen, Destino }]
    const casetas = result.recordset;

    // 🔹 Paso siguiente: obtener el ID del INEGI para cada origen/destino
    const casetasConINEGI = casetas.map(c => {
      const origenID = obtenerIdINEGI(c.Origen);
      const destinoID = obtenerIdINEGI(c.Destino);
      return {

      };
    });

    res.json(casetasConINEGI);

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};
// 🔹 Función para obtener ID del INEGI (ejemplo)
function obtenerIdINEGI(nombreCiudad) {
  const ciudadNormalizada = normalize(nombreCiudad);
  return poblaciones[ciudadNormalizada] || null;
}




export const getCasetasDetails = async (req, res) => {

  const { originId, finalId, vehicleType } = req.body;


  try {
    const formData = new URLSearchParams({
      dest_i: originId,
      dest_f: finalId,
      v: vehicleType,
      type: 'json',
      key: getToken()
    });

    const response = await fetch(`https://gaia.inegi.org.mx/sakbe_v3.1/detalle_c`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    const data = await response.json();

    return (JSON.stringify(data, null, 2));

  } catch (error) {
    return ('Error: ' + error.message);
  }
}

export const getStatsCasetas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM casetas_Plantillas");
    for (const row of result.recordset) {
    }
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



async function getCasetasINEGI(originId, finalId, vehicleType = 5) {
  try {
    const formData = new URLSearchParams({
      dest_i: originId,
      dest_f: finalId,
      v: vehicleType,
      type: 'json',
      key: getToken()
    });

    const response = await fetch(`https://gaia.inegi.org.mx/sakbe_v3.1/detalle_c`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    const data = await response.json();

    return (JSON.stringify(data, null, 2));

  } catch (error) {
    return ('Error: ' + error.message);
  }
}



export const getRutasTUSA_TRN = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
  
SELECT
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



export const getCasetas_por_RutaTUSA_TRN = async (req, res) => {
  const { IDTipoRuta } = req.params;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("IDTipoRuta", sql.Int, IDTipoRuta)
      .query(`
              SELECT DISTINCT 
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
                  PCR.consecutivo

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
              WHERE TRN.id_Tipo_ruta = @IDTipoRuta 
              ORDER BY PCR.consecutivo;
        `);

    result.recordset.forEach(row => {
      // Redondea a 4 decimales si existe y es número
      try {
        row.latitud = parseFloat(row.latitud).toFixed(4)
        row.longitud = parseFloat(row.longitud).toFixed(4)
      } catch (error) {
        console.log(error);
      }
    });
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontraron casetas para la ruta proporcionada." });
    }
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};




export const getCoordenadasOrigenDestino = async (req, res) => {
  const { IDTipoRuta } = req.params;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("IDTipoRuta", sql.Int, IDTipoRuta)
      .query(`
        SELECT
          DIR_O.latitud as "LatitudOrigen", 
          DIR_O.longitud as "LongitudOrigen", 
          DIR_D.latitud as "LatitudDestino",  
          DIR_D.longitud as "LongitudDestino" 
        FROM Tipo_de_ruta_N TRN
        INNER JOIN 
          Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
        INNER JOIN 
          Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
        WHERE 
          TRN.id_Tipo_ruta=@IDTipoRuta
        ORDER BY
          TRN.id_Tipo_ruta ASC
      `);
    const origenCoords = [];
    const destinoCoords = [];
    const mensajes = [];

    result.recordset.forEach(row => {
      // Redondea a 4 decimales si existe y es número
      const latOrigen = (typeof row.LatitudOrigen === 'number') ? Number(row.LatitudOrigen.toFixed(4)) : row.LatitudOrigen;
      const lonOrigen = (typeof row.LongitudOrigen === 'number') ? Number(row.LongitudOrigen.toFixed(4)) : row.LongitudOrigen;
      const latDestino = (typeof row.LatitudDestino === 'number') ? Number(row.LatitudDestino.toFixed(4)) : row.LatitudDestino;
      const lonDestino = (typeof row.LongitudDestino === 'number') ? Number(row.LongitudDestino.toFixed(4)) : row.LongitudDestino;

      const origen = [latOrigen, lonOrigen];
      const destino = [latDestino, lonDestino];

      if (origen[0] == 0 || origen[1] == 0 || origen[0] == null || origen[1] == null) {
        mensajes.push(`Coordenadas de origen no cargadas para id_Tipo_ruta`);
      } else {
        origenCoords.push(origen);
      }

      if (destino[0] == 0 || destino[1] == 0 || destino[0] == null || destino[1] == null) {
        mensajes.push(`Coordenadas de destino no cargadas para id_Tipo_ruta`);
      } else {
        destinoCoords.push(destino);
      }
    });

    const responseObj = {
      origen: origenCoords,
      destino: destinoCoords,
      mensajes
    };
    res.json(responseObj);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};


export const getNombresOrigenDestino = async (req, res) => {
  const { IDTipoRuta } = req.params;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("IDTipoRuta", sql.Int, IDTipoRuta)
      .query(`
SELECT
        CONCAT(DIR_O.Nombre, ' - ', DIR_D.Nombre) AS 'Nombre'
        FROM Tipo_de_ruta_N TRN
        INNER JOIN 
          Directorio DIR_O ON TRN.PoblacionOrigen = DIR_O.ID_entidad
        INNER JOIN 
          Directorio DIR_D ON TRN.PoblacionDestino = DIR_D.ID_entidad
        WHERE 
          TRN.id_Tipo_ruta=@IDTipoRuta
        ORDER BY
          TRN.id_Tipo_ruta ASC
      `);
    res.json(result.recordset[0].Nombre);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
export const getRutaPorOrigen_Destino = async (req, res) => {
  const { origen, destino } = req.body;
  
  // Validación de entrada
  if (!origen || !destino) {
    return res.status(400).json({ 
      error: 'Los campos origen y destino son requeridos' 
    });
  }

  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input("Origen", sql.VarChar, `%${origen}%`)
      .input("Destino", sql.VarChar, `%${destino}%`)
      .query(`
        SELECT
          PB.Poblacion AS Origen,
          PBD.Poblacion AS Destino,
          DirO.Razon_social AS RazonOrigen,
          DirD.Razon_social AS RazonDestino,
          TRN.id_Tipo_ruta,
          -- Procesar categoría directamente en SQL
          CASE 
            -- Un solo campo activo
            WHEN (CAST(TRN.Latinos AS INT) + CAST(TRN.Nacionales AS INT) + 
                  CAST(TRN.Exportacion AS INT) + CAST(TRN.Otros AS INT) + 
                  CAST(TRN.Cemex AS INT) + CAST(TRN.Alterna AS INT)) = 1 
            THEN 
              CASE 
                WHEN TRN.Latinos = 1 THEN 'Latinos'
                WHEN TRN.Nacionales = 1 THEN 'Nacionales'
                WHEN TRN.Exportacion = 1 THEN 'Exportacion'
                WHEN TRN.Otros = 1 THEN 'Otros'
                WHEN TRN.Cemex = 1 THEN 'Cemex'
                WHEN TRN.Alterna = 1 THEN 'Alterna'
              END
            -- Dos campos activos y uno es Alterna
            WHEN (CAST(TRN.Latinos AS INT) + CAST(TRN.Nacionales AS INT) + 
                  CAST(TRN.Exportacion AS INT) + CAST(TRN.Otros AS INT) + 
                  CAST(TRN.Cemex AS INT) + CAST(TRN.Alterna AS INT)) = 2 
                 AND TRN.Alterna = 1
            THEN 
              CASE 
                WHEN TRN.Latinos = 1 THEN 'Latinos'
                WHEN TRN.Nacionales = 1 THEN 'Nacionales'
                WHEN TRN.Exportacion = 1 THEN 'Exportacion'
                WHEN TRN.Otros = 1 THEN 'Otros'
                WHEN TRN.Cemex = 1 THEN 'Cemex'
              END
            ELSE NULL
          END AS Categoria,
          -- Determinar si es ruta alterna
          CASE 
            WHEN (CAST(TRN.Latinos AS INT) + CAST(TRN.Nacionales AS INT) + 
                  CAST(TRN.Exportacion AS INT) + CAST(TRN.Otros AS INT) + 
                  CAST(TRN.Cemex AS INT) + CAST(TRN.Alterna AS INT)) = 2 
                 AND TRN.Alterna = 1
            THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
          END AS RutaAlterna
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
          PB.Ciudad_SCT LIKE @Origen 
          AND PBD.Ciudad_SCT LIKE @Destino
      `);

    // Siempre responder con 200, incluso si no hay resultados
    // Esto permite que el frontend procese la ruta INEGI sin errores
    const hayResultados = result.recordset.length > 0;
    
    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length,
      mensaje: hayResultados 
        ? 'Ruta encontrada en TUSA' 
        : 'Ruta no encontrada en TUSA. Mostrando solo información de INEGI',
      enTUSA: hayResultados // Flag para que el frontend sepa si está en TUSA
    });

  } catch (error) {
    console.error('Error al obtener ruta:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al procesar la solicitud',
      mensaje: error.message 
    });
  }
};