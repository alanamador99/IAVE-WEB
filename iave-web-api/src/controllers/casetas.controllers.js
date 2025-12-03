/**
 * @module casetas.controllers
 * @description
 * Controlador para gestión de CASETAS (estaciones de peaje) en el sistema IAVE.
 * Las casetas son puntos de cobro de peaje distribuidos en las carreteras del país.
 * 
 * Funcionalidades principales:
 * - Obtener información de casetas (ubicación, precios, disponibilidad)
 * - Integración con API INEGI Sakbe v3.1 para cálculo de rutas
 * - Consulta de rutas de transporte con sus casetas asociadas
 * - Cálculo de coordenadas para mapas interactivos
 * - Validación y categorización de rutas de transporte
 * 
 * @requires ../database/connection.js - Conexión a base de datos MSSQL
 */

import { getConnection, sql } from "../database/connection.js";

/**
 * Mapeo de claves SCT a campos de importe en tabla casetas_Plantillas
 * @type {Object<string, string>}
 * @constant
 * @example
 * 'A ' → 'Automovil'
 * 'C-3 ' → 'Camion3Ejes'
 */
const claveToImporteField = {
  'A ': 'Automovil',
  'B ': 'Autobus2Ejes',
  'C-2 ': 'Camion2Ejes',
  'C-3 ': 'Camion3Ejes',
  'C-4 ': 'Camion3Ejes',
  'C-5 ': 'Camion5Ejes',
  'C-9 ': 'Camion9Ejes'
};

/**
 * Normaliza nombres de ciudades para comparación.
 * Convierte a mayúsculas y remueve caracteres especiales y acentos.
 * @function normalize
 * @param {string} nombre - Nombre de ciudad a normalizar
 * @returns {string} Nombre normalizado (mayúsculas, sin acentos)
 * @example
 * normalize('San Luis Potosí') // 'SAN LUIS POTOSI'
 * normalize('Hidalgo-Mexico') // 'HILDALGOMEXICO'
 */
function normalize(nombre) {
  return nombre.toUpperCase().replace(/[-.]/g, '').trim().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
}

/**
 * Obtiene el token de autenticación para API INEGI Sakbe v3.1
 * Este token es necesario para todas las consultas de rutas a INEGI.
 * @function getToken
 * @returns {string} Token de autenticación
 * @private
 */
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
/**
 * Obtiene la lista completa de todas las casetas del sistema.
 * @async
 * @function getCasetas
 * @param {Object} req - Objeto de solicitud (sin parámetros requeridos)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de casetas en formato JSON
 * @throws {Error} Error 500 si falla la conexión a la base de datos
 * @example
 * // GET /api/casetas
 * // Response (200 OK)
 * [
 *   {
 *     "ID_Caseta": 1,
 *     "Nombre": "Caseta Tlanalapa",
 *     "Carretera": "Mex 105",
 *     "Estado": "HIDALGO",
 *     "Automovil": 50.50,
 *     "Autobus2Ejes": 75.25,
 *     "Camion2Ejes": 100.00,
 *     "Camion3Ejes": 150.00,
 *     "Camion5Ejes": 200.00,
 *     "Camion9Ejes": 280.00,
 *     "IAVE": true,
 *     "latitud": "20.3456",
 *     "longitud": "-99.1234",
 *     "Nombre_IAVE": "Tlanalapa"
 *   },
 *   {...}
 * ]
 */
export const getCasetas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * from casetas_Plantillas ORDER BY ID_Caseta ASC;");
    res.json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



/**
 * Obtiene casetas con información enriquecida de INEGI para cada ruta.
 * Consulta las casetas y mapea origen/destino a IDs del INEGI.
 * @async
 * @function getCasetasByID
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de casetas enriquecidas
 * @throws {Error} Error 500 si falla la consulta
 * @description
 * Proceso:
 * 1. Obtiene todas las casetas con sus rutas asociadas (primera por fecha)
 * 2. Normaliza origen/destino a IDs del INEGI
 * 3. Consulta API INEGI para cada par origen-destino
 * @example
 * // GET /api/casetas/byid
 * // Response
 * [
 *   {
 *     "ID_Caseta": 1,
 *     "Nombre_IAVE": "Tlanalapa",
 *     "Origen": "HIDALGO",
 *     "Destino": "MEXICO DF",
 *     "OrigenINEGI": 30655,
 *     "DestinoINEGI": 2486,
 *     "ID_orden": "OT-12345",
 *     "Camion2Ejes": 100.00
 *   }
 * ]
 */
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



/**
 * Configura/actualiza casetas (función en desarrollo)
 * @async
 * @function setCasetasByID
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con casetas configuradas
 * @throws {Error} Error 500 si falla
 * @note Esta función está en construcción y no tiene implementación completa
 */
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
/**
 * Obtiene el ID del INEGI correspondiente a una ciudad.
 * @function obtenerIdINEGI
 * @param {string} nombreCiudad - Nombre de la ciudad
 * @returns {number|null} ID del INEGI o null si no se encuentra
 * @description
 * Consulta el objeto `poblaciones` que contiene un mapeo de ciudades
 * mexicanas a sus códigos INEGI. Normaliza el nombre antes de buscar.
 * @example
 * obtenerIdINEGI('San Luis Potosí')  // 262188
 * obtenerIdINEGI('Monterrey')         // 263915
 * obtenerIdINEGI('Ciudad No Existe')  // null
 */
function obtenerIdINEGI(nombreCiudad) {
  const ciudadNormalizada = normalize(nombreCiudad);
  return poblaciones[ciudadNormalizada] || null;
}




/**
 * Obtiene detalles de casetas y rutas desde la API INEGI Sakbe v3.1
 * @async
 * @function getCasetasDetails
 * @param {Object} req - Objeto de solicitud
 * @param {number} req.body.originId - ID INEGI de ciudad origen
 * @param {number} req.body.finalId - ID INEGI de ciudad destino
 * @param {number} [req.body.vehicleType=5] - Tipo de vehículo (ej: 5=camión 5 ejes)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con detalles de casetas en ruta
 * @throws {Error} 500 si falla la consulta a INEGI
 * @description
 * Consulta la API INEGI Sakbe v3.1 con parámetros de origen, destino y tipo de vehículo.
 * Retorna información detallada de casetas y costos en la ruta.
 * @example
 * // POST /api/casetas/details
 * // Body
 * {
 *   "originId": 30655,    // HIDALGO
 *   "finalId": 2486,      // MEXICO DF
 *   "vehicleType": 5      // Camión 5 ejes
 * }
 * // Response
 * JSON con estructura de INEGI:
 * {
 *   "resultados": [...],
 *   "distancia": 125.5,
 *   "casetas": [...]
 * }
 */
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

/**
 * Obtiene estadísticas de todas las casetas del sistema.
 * @async
 * @function getStatsCasetas
 * @param {Object} req - Objeto de solicitud (sin parámetros)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de todas las casetas
 * @throws {Error} Error 500 si falla la conexión
 * @description
 * Actualmente retorna el mismo resultado que getCasetas().
 * Diseñado para futuras agregaciones y estadísticas.
 * @example
 * // GET /api/casetas/stats
 * // Response
 * [
 *   {"ID_Caseta": 1, "Nombre": "Tlanalapa", ...},
 *   {...}
 * ]
 */
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



/**
 * Consulta la API INEGI Sakbe v3.1 para obtener detalles de casetas.
 * @async
 * @function getCasetasINEGI
 * @param {number} originId - ID INEGI de ciudad origen
 * @param {number} finalId - ID INEGI de ciudad destino  
 * @param {number} [vehicleType=5] - Tipo de vehículo (por defecto camión 5 ejes)
 * @returns {Promise<string>} JSON stringificado con datos de casetas
 * @throws {string} String con mensaje de error si falla
 * @description
 * Realiza POST a endpoint INEGI: https://gaia.inegi.org.mx/sakbe_v3.1/detalle_c
 * Requiere token de autenticación válido.
 * Tipos de vehículo:
 * - 1: Automóvil
 * - 2: Autobús (2 ejes)
 * - 3: Camión (2 ejes)
 * - 4: Camión (3 ejes)
 * - 5: Camión (5 ejes) - DEFAULT
 * - 6: Camión (9 ejes)
 * @example
 * const resultado = await getCasetasINEGI(30655, 2486, 5);
 * // Retorna JSON con información de casetas en la ruta
 */
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



/**
 * Obtiene todas las rutas del sistema TUSA con categorización.
 * @async
 * @function getRutasTUSA_TRN
 * @param {Object} req - Objeto de solicitud (sin parámetros)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de rutas TUSA categorizadas
 * @throws {Error} Error 500 si falla
 * @description
 * Consulta tabla Tipo_de_ruta_N y calcula Categoria según lógica:
 * - Si 1 campo booleano activo: esa categoría (Latinos, Nacionales, etc)
 * - Si 2 campos activos + Alterna: el otro campo es categoría
 * - Otros casos: null
 * \n * Categorías disponibles:
 * - Latinos: Transporte de latinoamericanos
 * - Nacionales: Transporte nacional
 * - Exportacion: Transporte de exportación
 * - Otros: Otros tipos
 * - Cemex: Transporte CEMEX
 * - Alterna: Ruta alternativa (combinada con otra)
 * @example
 * // GET /api/rutas/tusa-trn
 * // Response
 * [
 *   {
 *     "ID_ruta": 1,
 *     "id_Tipo_ruta": 100,
 *     "Categoria": "Nacionales",
 *     "Km_reales": 125.5,
 *     "peaje_dos_ejes": 450.00,
 *     "PoblacionOrigen": "Tlanalapa",
 *     "PoblacionDestino": "Mexico DF"
 *   }
 * ]
 */
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



/**
 * Obtiene todas las casetas en una ruta específica del sistema TUSA.
 * @async
 * @function getCasetas_por_RutaTUSA_TRN
 * @param {Object} req - Objeto de solicitud
 * @param {number} req.params.IDTipoRuta - ID del tipo de ruta en TUSA
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con array de casetas en orden de aparición
 * @throws {Error} 404 si no hay casetas para la ruta; 500 si falla BD
 * @description
 * Retorna casetas ordenadas por consecutivo (orden en la ruta).
 * Incluye:
 * - Tarifas por tipo de vehículo
 * - Ubicación (latitud/longitud redondeada a 4 decimales)
 * - Validación del uso del dispositivo IAVE en la caseta
 * @example
 * // GET /api/casetas/ruta/3
 * // Response
 * [
 *     {
 *    "ID_Caseta": 223,
 *    "Nombre": "Costa Rica",
 *    "Carretera": "Mex 015D",
 *    "Estado": "Sinaloa",
 *    "Automovil": 218,
 *    "Autobus2Ejes": 355,
 *    "Camion2Ejes": 368,
 *    "Camion3Ejes": 368,
 *    "Camion5Ejes": 418,
 *    "Camion9Ejes": 525,
 *    "IAVE": true,
 *    "latitud": "24.5703",
 *    "longitud": "-107.4302",
 *    "Nombre_IAVE": "Costa Rica I",
 *    "Notas": "Ent. La Cruz - Costa Rica",
 *    "consecutivo": 1
 *  },
 *   {...}
 * ]
 */
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
              WHERE TRN.id_Tipo_ruta = @IDTipoRuta 
              ORDER BY PCR.consecutivo;
        `);

    result.recordset.forEach(row => {
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
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};




/**
 * Obtiene coordenadas (latitud/longitud) de origen y destino de una ruta.
 * @async
 * @function getCoordenadasOrigenDestino
 * @param {Object} req - Objeto de solicitud
 * @param {number} req.params.IDTipoRuta - ID del tipo de ruta
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con objeto conteniendo origenCoords, destinoCoords y mensajes
 * @throws {Error} Error 500 si falla
 * @description
 * Obtiene coordenadas del Directorio para la ruta solicitada en req.params (IDTipoRuta).
 * Redondea a 5 decimales y valida que no sean 0 o NULL.
 * Retorna arrays de coordenadas [lat, lon] y mensajes de alertas.
 * @example
 * // GET /api/casetas/coordenadas/100
 * // Response
* {
*   "origen": [
*     [
*       "24.77338",
*       "-107.43676"
*     ]
*   ],
*   "destino": [
*     [
*       "19.78228",
*       "-98.58594"
*     ]
*   ],
*   "mensajes": []
* }
 */
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
      `);
    const origenCoords = [];
    const destinoCoords = [];
    const mensajes = [];

    // Redondea a 5 decimales si existe y no es número 0

    const latOrigen = (result.recordset[0].LatitudOrigen) ? parseFloat(result.recordset[0].LatitudOrigen).toFixed(5) : result.recordset[0].LatitudOrigen;
    const lonOrigen = (result.recordset[0].LongitudOrigen) ? parseFloat(result.recordset[0].LongitudOrigen).toFixed(5) : result.recordset[0].LongitudOrigen;
    const latDestino = (result.recordset[0].LatitudDestino) ? parseFloat(result.recordset[0].LatitudDestino).toFixed(5) : result.recordset[0].LatitudDestino;
    const lonDestino = (result.recordset[0].LongitudDestino) ? parseFloat(result.recordset[0].LongitudDestino).toFixed(5) : result.recordset[0].LongitudDestino;

    const origen = [latOrigen, lonOrigen];
    const destino = [latDestino, lonDestino];

    if (origen[0] == 0 || origen[1] == 0 || origen[0] == null || origen[1] == null) {
      mensajes.push(`Coordenadas de origen no cargadas para id_Tipo_ruta: ${IDTipoRuta}`);
    } else {
      origenCoords.push(origen);
    }

    if (destino[0] == 0 || destino[1] == 0 || destino[0] == null || destino[1] == null) {
      mensajes.push(`Coordenadas de destino no cargadas para id_Tipo_ruta: ${IDTipoRuta}`);
    } else {
      destinoCoords.push(destino);
    }

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


/**
 * Obtiene nombres concatenados de origen y destino de una ruta.
 * @async
 * @function getNombresOrigenDestino
 * @param {Object} req - Objeto de solicitud
 * @param {number} req.params.IDTipoRuta - ID del tipo de ruta
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con string con formato "Origen - Destino"
 * @throws {Error} Error 500 si falla
 * @description
 * Concatena nombres del Directorio en formato útil para UI.
 * @example
 * // GET /api/casetas/nombres/1
 * // Response
 * "Gemi Pachuca - UNNE Morelos"
 */
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
/**
 * Busca una ruta en el sistema TUSA por ciudades origen y destino.
 * @async
 * @function getRutaPorOrigen_Destino
 * @param {Object} req - Objeto de solicitud
 * @param {string} req.body.origen - Nombre de ciudad origen (búsqueda parcial OK)
 * @param {string} req.body.destino - Nombre de ciudad destino (búsqueda parcial OK)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con objeto conteniendo:
 *   - success: boolean
 *   - data: array de rutas encontradas
 *   - total: número de rutas
 *   - enTUSA: boolean indicando si la ruta existe en TUSA
 *   - mensaje: descripción del resultado
 * @throws {Error} 400 si faltan origen o destino; 500 si falla BD
 * @description
 * Busca en TUSA usando LIKE sobre Ciudad_SCT.
 * Calcula automáticamente:
 * - Categoría de ruta (Latinos, Nacionales, etc)
 * - Si es ruta alternativa (Alterna=true + otro campo)
 * \n * Retorna 200 OK incluso si no hay resultados, permitiendo que
 * el frontend caiga a INEGI automáticamente.
 * \n * Lógica de categorización:
 * - 1 campo booleano activo → esa categoría
 * - 2 campos activos + Alterna → el otro campo es categoría
 * - Otros → null
 * @example
 * // POST /api/casetas/ruta/buscar
 * // Body
 * {
 *   "origen": "Hidalgo",
 *   "destino": "Mexico"
 * }
 * // Response (200 OK)
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id_Tipo_ruta": 100,
 *       "Origen": "HIDALGO",
 *       "Destino": "MEXICO DF",
 *       "Categoria": "Nacionales",
 *       "RutaAlterna": false,
 *       "RazonOrigen": "Tlanalapa",
 *       "RazonDestino": "Mexico DF"
 *     }
 *   ],
 *   "total": 1,
 *   "enTUSA": true,
 *   "mensaje": "Ruta encontrada en TUSA"
 * }
 */
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
    if (hayResultados) {
      result.recordset.push()
    }

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


