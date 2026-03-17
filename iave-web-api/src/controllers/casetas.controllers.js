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
import axios from 'axios';
import xml2js from 'xml2js';

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

const switchTipoVehiculo = (tvehiculo) => {
  let resultado;
  switch (tvehiculo) {
    case "1":
      resultado = "Automovil";
      break;
    case "2":
      resultado = "Autobus2Ejes";
      break;
    case "5":
      resultado = "Camion2Ejes";
      break;
    case "6":
      resultado = "Camion3Ejes";
      break;
    case "7":
      resultado = "Camion3Ejes";
      break;
    case "8":
      resultado = "Camion5Ejes";
      break;
    case "9":
      resultado = "Camion5Ejes";
      break;
    case "10":
      resultado = "Camion9Ejes";
      break;
    case "11":
      resultado = "Camion9Ejes";
      break;
    case "12":
      resultado = "Camion9Ejes";
      break;
    default:
      resultado = "Error";
      break;
  }
  return resultado;
}

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


export const getCasetaByID = async (req, res) => {
  try {
    const IDcaseta = req.params.IDcaseta;

    // ✅ Validar parámetro
    if (!IDcaseta || isNaN(IDcaseta)) {
      return res.status(400).json({ error: "ID_Caseta inválido" });
    }

    const pool = await getConnection();

    // ✅ Selecciona SOLO las columnas que necesitas
    const result = await pool.request()
      .input('id', sql.Int, IDcaseta)
      .query(`
        SELECT 
          CP.*, CEC.OrigenInmediato, CEC.DestinoInmediato
        FROM casetas_Plantillas  CP
        INNER JOIN 
        Cat_EntidadCaseta as CEC
        ON CP.ID_Caseta = CEC.Id_caseta
        WHERE CP.ID_Caseta = @id

      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Caseta no encontrada" });
    }

    res.json(result.recordset[0]); // Una caseta, no array

  } catch (error) {
    res.status(500).json({ error: error.message });
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
 * 
 * 
 * 
 */
export const updateCasetaByID = async (req, res) => {
  try {
    const {
      ID_Caseta,
      API_peajeAutomovil,
      API_peajeBusDosEjes,
      API_peajeCincoEjes,
      API_peajeDosEjes,
      API_peajeNueveEjes,
      API_peajeTresEjes,
      API_OrigenINEGI,
      API_DestinoINEGI
    } = req.body;

    const pool = await getConnection();

    const result = await pool.request()
      .input('idCaseta', sql.Int, ID_Caseta)
      .input('costoActualizadoAutomovil', sql.Float, API_peajeAutomovil)
      .input('costoActualizadoCamion2Ejes', sql.Float, API_peajeDosEjes)
      .input('costoActualizadoCamion3Ejes', sql.Float, API_peajeTresEjes)
      .input('costoActualizadoCamion5Ejes', sql.Float, API_peajeCincoEjes)
      .input('costoActualizadoCamion9Ejes', sql.Float, API_peajeNueveEjes)
      .input('costoActualizadoAutobus2Ejes', sql.Float, API_peajeBusDosEjes)
      .input('OrigenINEGI', sql.Int, API_OrigenINEGI || null)
      .input('DestinoINEGI', sql.Int, API_DestinoINEGI || null)
      .query(`
      UPDATE casetas_Plantillas 
      SET   
        Automovil = @costoActualizadoAutomovil,
        Camion2Ejes = @costoActualizadoCamion2Ejes,
        Camion3Ejes = @costoActualizadoCamion3Ejes,
        Camion5Ejes = @costoActualizadoCamion5Ejes,
        Camion9Ejes = @costoActualizadoCamion9Ejes,
        Autobus2Ejes = @costoActualizadoAutobus2Ejes
      WHERE ID_Caseta = @idCaseta;
        -- Actualizamos el valor de Destino y origen inmediato en Cat_EntidadCaseta solo si tienen información
        
        ${(API_OrigenINEGI && API_DestinoINEGI) ? `
      UPDATE Cat_EntidadCaseta
      SET 
        DestinoInmediato = @DestinoINEGI, 
        OrigenInmediato = @OrigenINEGI
      WHERE Id_caseta = @idCaseta;` : ''}
    `);


    res.json({
      message: "Caseta actualizada correctamente.",
      affectedRows: result.rowsAffected,
      result: result
    });

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
              SELECT 
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
                  TRN.Id_Ruta,
                  PCR.ID
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
      //Creamos un 204 No Content si no hay casetas para la ruta pero rellenamos con recordset vacío
      return res.status(204).json({ message: "No se encontraron casetas para la ruta proporcionada." });
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



/**
 * Crea una nueva ruta en el sistema TUSA
 * @async
 * @function crearNuevaRutaTUSA
 * @param {Object} req - Objeto de solicitud
 * @param {Object} req.body - Parámetros de la ruta
 * @param {number} req.body.id_origen - ID de población origen
 * @param {number} req.body.id_destino - ID de población destino
 * @param {number} req.body.PoblacionOrigen - ID entidad origen (Directorio)
 * @param {number} req.body.PoblacionDestino - ID entidad destino (Directorio)
 * @param {string} req.body.Categoria - Categoría (Latinos, Nacionales, Exportacion, Otros, Cemex)
 * @param {number} req.body.Km_reales - Kilómetros reales
 * @param {number} req.body.Km_oficiales - Kilómetros oficiales INEGI
 * @param {number} req.body.Km_de_pago - Kilómetros de pago
 * @param {number} req.body.Km_Tabulados - Kilómetros tabulados
 * @param {number} req.body.Peaje_Dos_Ejes - Tarifa peaje 2 ejes
 * @param {number} req.body.Peaje_Tres_Ejes - Tarifa peaje 3 ejes
 * @param {string} [req.body.observaciones=""] - Observaciones (opcional)
 * @param {boolean} [req.body.Alterna=false] - Es ruta alterna (opcional)
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<void>} Responde con la ruta creada
 * @throws {Error} 400 si faltan parámetros requeridos; 500 si falla BD
 * @description
 * Valida que todos los parámetros requeridos estén presentes.
 * Mapea la categoría a los campos booleanos de la tabla.
 * Inserta la nueva ruta y retorna los datos guardados.
 * @example
 * // POST /api/rutas/crear
 * // Body
 * {
 *   "id_origen": 30655,
 *   "id_destino": 2486,
 *   "PoblacionOrigen": 100,
 *   "PoblacionDestino": 200,
 *   "Categoria": "Nacionales",
 *   "Km_reales": 250.5,
 *   "Km_oficiales": 260.0,
 *   "Km_de_pago": 255.0,
 *   "Km_Tabulados": 258.0,
 *   "Peaje_Dos_Ejes": 450.00,
 *   "Peaje_Tres_Ejes": 650.00,
 *   "observaciones": "Ruta nueva 2025",
 *   "Alterna": false
 * }
 * // Response (201 Created)
 * {
 *   "success": true,
 *   "message": "Ruta creada exitosamente",
 *   "data": {
 *     "id_Tipo_ruta": 150,
 *     "id_origen": 30655,
 *     "id_destino": 2486,
 *     "Categoria": "Nacionales",
 *     "Km_reales": 250.5,
 *     "fecha_Alta": "2025-01-14T..."
 *   }
 * }
 */
export const crearNuevaRutaTUSA = async (req, res) => {
  try {
    const {
      id_origen,
      id_destino,
      PoblacionOrigen,
      PoblacionDestino,
      Categoria,
      Km_reales,
      Km_oficiales,
      Km_de_pago,
      Km_Tabulados,
      Peaje_Dos_Ejes,
      Peaje_Tres_Ejes,
      observaciones = '',
      Alterna = false
    } = req.body;

    // Validación de parámetros requeridos
    const camposRequeridos = [
      'id_origen',
      'id_destino',
      'PoblacionOrigen',
      'PoblacionDestino',
      'Categoria',
      'Km_reales',
      'Km_oficiales',
      'Km_de_pago',
      'Km_Tabulados',
      'Peaje_Dos_Ejes',
      'Peaje_Tres_Ejes'
    ];

    const camposFaltantes = camposRequeridos.filter(campo => req.body[campo] === undefined || req.body[campo] === null);

    if (camposFaltantes.length > 0) {
      console.log('Campos faltantes:', camposFaltantes);
      console.log('Cuerpo recibido:', req.body);
      return res.status(400).json({
        success: false,
        message: `Faltan campos requeridos: ${camposFaltantes.join(', ')}`
      });
    }

    // Mapear categoría a campos booleanos
    const camposBooleanos = {
      latinos: false,
      nacionales: false,
      exportacion: false,
      otros: false,
      cemex: false,
      alterna: Boolean(Alterna)
    };

    // Asignar la categoría seleccionada
    if (Categoria && camposBooleanos.hasOwnProperty(Categoria)) {
      camposBooleanos[Categoria] = true;
    } else {
      console.log('Categoría inválida:', Categoria);
      return res.status(400).json({
        success: false,
        message: `Categoría inválida. Debe ser una de: ${Object.keys(camposBooleanos).join(', ')}`
      });
    }

    const pool = await getConnection();
    let nuevoIDRuta = 1;

    //antes de insertar verificar si existe un IDruta (alguna ruta con el mismo origen y destino)
    const verificarRuta = await pool.request()
      .input('PoblacionOrigen', sql.Int, PoblacionOrigen)
      .input('PoblacionDestino', sql.Int, PoblacionDestino)
      .query(`
        SELECT TOP 1 Id_Ruta, id_Tipo_ruta
        FROM Tipo_de_ruta_N
        WHERE (id_origen = @PoblacionOrigen AND id_destino = @PoblacionDestino) OR (PoblacionOrigen = @PoblacionDestino AND PoblacionDestino = @PoblacionOrigen);
      `);
    if (verificarRuta.recordset.length > 0) {
      console.log('Ruta existente con mismo origen y destino. ID Ruta:', verificarRuta.recordset[0].Id_Ruta);
      nuevoIDRuta = parseFloat(verificarRuta.recordset[0].Id_Ruta);
      return res.status(208).json({
        success: false,
        message: `Ya existe una ruta con el mismo origen y destino. ID Ruta existente: ${nuevoIDRuta}`,
        id_Tipo_ruta: parseFloat(verificarRuta.recordset[0].id_Tipo_ruta)
      });
    }
    else {
      console.log('No existe ruta con mismo origen y destino. Procediendo a crear nueva ruta.');
      const verificarUltimoID = await pool.request()
        .query(`
          SELECT TOP 1 Id_Ruta
          FROM Tipo_de_ruta_N
          ORDER BY Id_Ruta DESC;
        `);
      if (verificarUltimoID.recordset.length > 0) {
        nuevoIDRuta = parseFloat(verificarUltimoID.recordset[0].Id_Ruta) + 1;
      }
      console.log('Nuevo ID Ruta asignado:', nuevoIDRuta);
    }
    // Insertar nueva ruta
    const result = await pool.request()
      .input('Id_Ruta', sql.Int, nuevoIDRuta)
      .input('id_origen', sql.Int, PoblacionOrigen)
      .input('id_destino', sql.Int, PoblacionDestino)
      .input('PoblacionOrigen', sql.Int, id_origen)
      .input('PoblacionDestino', sql.Int, id_destino)
      .input('latinos', sql.Bit, camposBooleanos.latinos)
      .input('nacionales', sql.Bit, camposBooleanos.nacionales)
      .input('exportacion', sql.Bit, camposBooleanos.exportacion)
      .input('otros', sql.Bit, camposBooleanos.otros)
      .input('cemex', sql.Bit, camposBooleanos.cemex)
      .input('alterna', sql.Bit, camposBooleanos.alterna)
      .input('observaciones', sql.VarChar(sql.MAX), observaciones)
      .input('Km_reales', sql.Float, Km_reales)
      .input('Km_oficiales', sql.Float, Km_oficiales)
      .input('Km_de_pago', sql.Float, Km_de_pago)
      .input('Km_Tabulados', sql.Float, Km_Tabulados)
      .input('Peaje_Dos_Ejes', sql.Float, Peaje_Dos_Ejes)
      .input('Peaje_Tres_Ejes', sql.Float, Peaje_Tres_Ejes)
      .query(`
        INSERT INTO Tipo_de_ruta_N (
        Id_Ruta,
          id_origen, 
          id_destino, 
          PoblacionOrigen, 
          PoblacionDestino, 
          latinos, 
          nacionales, 
          exportacion, 
          otros, 
          cemex, 
          alterna, 
          Observaciones, 
          fecha_Alta, 
          Km_reales, 
          Km_oficiales, 
          Km_de_pago, 
          Km_Tabulados, 
          peaje_dos_ejes, 
          peaje_tres_ejes
        )
        VALUES (
          @Id_Ruta,
          @id_origen,
          @id_destino,
          @PoblacionOrigen,
          @PoblacionDestino,
          @latinos,
          @nacionales,
          @exportacion,
          @otros,
          @cemex,
          @alterna,
          @observaciones,
          GETDATE(),
          @Km_reales,
          @Km_oficiales,
          @Km_de_pago,
          @Km_Tabulados,
          @Peaje_Dos_Ejes,
          @Peaje_Tres_Ejes
        );
        
        -- Retornar la ruta creada con su ID
        SELECT 
          SCOPE_IDENTITY() AS id_Tipo_ruta,
          id_origen,
          id_destino,
          PoblacionOrigen,
          PoblacionDestino,
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
          END AS RutaAlterna,
          Observaciones,
          fecha_Alta,
          Km_reales,
          Km_oficiales,
          Km_de_pago,
          Km_Tabulados,
          peaje_dos_ejes,
          peaje_tres_ejes
        FROM Tipo_de_ruta_N TRN
        WHERE id_Tipo_ruta = SCOPE_IDENTITY();
      `);

    // Extraer la ruta creada
    const rutaCreada = result?.recordset[0];

    if (!rutaCreada) {
      console.log('No se pudo recuperar la ruta creada.');
      console.log('Resultado completo de la inserción:', result);
      return res.status(500).json({
        success: false,
        message: 'Error al recuperar los datos de la ruta creada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ruta creada exitosamente',
      id_Tipo_ruta: parseFloat(rutaCreada.id_Tipo_ruta)
    });

  } catch (error) {
    console.error('Error al crear ruta TUSA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la ruta',
      error: error.message
    });
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
 * Busca una ruta en el sistema TUSA por ciudades origen y destino, contemplandolas como string (cadenas de texto).
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
          (PB.Ciudad_SCT LIKE @Origen 
          AND PBD.Ciudad_SCT LIKE @Destino) OR
          (PB.Ciudad_SCT LIKE @Destino 
          AND PBD.Ciudad_SCT LIKE @Origen)
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
        : 'Ruta no encontrada en TUSA. Mostrando solo información de INEGI  ' + "origen:" + origen + "destino:" + destino,
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
export const getCoincidenciasPoblacion = async (req, res) => {
  const { Poblacion } = req.params;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("Poblacion", sql.VarChar, "%" + Poblacion + "%")
      .query(`
    SELECT
      Dir.ID_entidad,
      Dir.Grupo,
      Dir.Nombre,
      Dir.Razon_social,
      Dir.Direccion,

      Dir.Correo_electronico,
      Dir.Fecha_captura,
      Dir.ID_Usuario,
      Dir.ID_poblacion as 'ID_PoblacionTUSA',
      Pob.Poblacion as 'ID_poblacion',
      Dir.Contacto,
      Dir.Celular,
      Dir.latitud,
      Dir.longitud
    FROM Directorio as Dir
    INNER JOIN
    Poblaciones Pob ON Pob.ID_poblacion = Dir.ID_poblacion
    WHERE Dir.Direccion LIKE @Poblacion or Pob.Poblacion LIKE @Poblacion
    Order BY Dir.ID_entidad ASC
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
      return res.status(204).json({ message: "No se encontraron casetas para la ruta proporcionada. → " + Poblacion, recordset: [] });
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};



export const updateCasetasEnRuta = async (req, res) => {
  const { ID } = req.params;
  const { nuevoComentario } = req.body;

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input("nuevoComentario", sql.VarChar, nuevoComentario)
      .input("ID", sql.VarChar, ID)
      .query(`UPDATE cruces SET observaciones = @nuevoComentario WHERE ID = @ID`);
    res.status(200).json({ message: 'Comentario actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando estatus:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const deleteCasetaDeLaRuta = async (req, res) => {
  const { IDcaseta } = req.params;
  const { IDTipoRuta } = req.body;

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input("IDCaseta", sql.Int, IDcaseta)
      .input("IDTipoRuta", sql.Int, IDTipoRuta)
      .query(` cruces SET observaciones = @nuevoComentario WHERE ID = @ID`);
    res.status(200).json({ message: 'Comentario actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando estatus:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};


export const getNearDirectorios = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Latitud y longitud requeridas' });
  }

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('latitud', sql.Float, parseFloat(lat))
      .input('longitud', sql.Float, parseFloat(lng))
      .query(`
        SELECT 
          Dir.ID_entidad,
      Dir.Grupo,
      Dir.Nombre,
      Dir.Razon_social,
      Dir.Direccion,

      Dir.Correo_electronico,
      Dir.Fecha_captura,
      Dir.ID_Usuario,
      Dir.ID_poblacion as 'ID_PoblacionTUSA',
      Pob.Poblacion as 'ID_poblacion',
      Dir.Contacto,
      Dir.Celular,
      Dir.latitud,
      Dir.longitud,
          (
            6371 * ACOS(
              COS(RADIANS(@latitud)) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT))) 
              * COS(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(longitud)), CHAR(9), ''), ' ', '') AS FLOAT)) - RADIANS(@longitud)) 
              + SIN(RADIANS(@latitud)) 
              * SIN(RADIANS(TRY_CAST(REPLACE(REPLACE(LTRIM(RTRIM(latitud)), CHAR(9), ''), ' ', '') AS FLOAT)))
            )
          ) AS distancia_km
        FROM Directorio as Dir
        INNER JOIN Poblaciones Pob ON Pob.ID_poblacion = Dir.ID_poblacion
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
          ) <= 10
        ORDER BY distancia_km
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener directorio cercano' });
  }
};



export const GuardarCambiosEnRuta = async (req, res) => {
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    const {
      id_Tipo_ruta,
      casetasActualizadas,
      casetasAEliminar,
      casetasAAgregar
    } = req.body;
    let Id_Ruta = req.body.Id_Ruta;
    // Validaciones
    if (!id_Tipo_ruta) {
      return res.status(400).json({
        success: false,
        message: 'El id_Tipo_ruta es requerido'
      });
    }

    console.log('📥 Recibiendo cambios para ruta:', id_Tipo_ruta);
    console.log('🗑️ Casetas a eliminar:', casetasAEliminar?.length || 0);
    console.log('➕ Casetas a agregar:', casetasAAgregar?.length || 0);
    console.log('🔄 Casetas a actualizar:', casetasActualizadas?.length || 0);

    // Iniciar transacción
    await transaction.begin();

    // ===== 0. VERIFICAR Id_Ruta =====
    if (!Id_Ruta) {
      const request0 = new sql.Request(transaction);
      const resultRuta = await request0
        .input('id_Tipo_ruta', sql.Int, id_Tipo_ruta)
        .query(`
                SELECT TOP 1 Id_Ruta 
                FROM Tipo_de_ruta_N 
                WHERE id_Tipo_ruta = @id_Tipo_ruta
            `);
      if (resultRuta.recordset.length === 0) {
        throw new Error(`No se encontró Id_Ruta para id_Tipo_ruta: ${id_Tipo_ruta}`);
      }
      console.log(`🔍 Id_Ruta encontrado: ${resultRuta.recordset[0].Id_Ruta} para id_Tipo_ruta: ${id_Tipo_ruta}`);
      Id_Ruta = resultRuta.recordset[0].Id_Ruta;

    }
    // ===== 1. ELIMINAR CASETAS =====
    if (casetasAEliminar && casetasAEliminar.length > 0) {
      const request1 = new sql.Request(transaction);

      // Construir lista de IDs para el WHERE IN 
      const idsEliminar = casetasAEliminar.map(c => c.ID_Caseta).join(',');

      const deleteQuery = `
                DELETE FROM PCasetasporruta 
                WHERE ID_Caseta IN (${idsEliminar})
                AND id_Tipo_ruta = @id_Tipo_ruta
            `;

      request1.input('id_Tipo_ruta', sql.Int, id_Tipo_ruta);
      const deleteResult = await request1.query(deleteQuery);

      console.log(`✅ Eliminadas ${deleteResult.rowsAffected[0]} casetas`);
    }

    // ===== 2. AGREGAR NUEVAS CASETAS =====
    if (casetasAAgregar && casetasAAgregar.length > 0) {
      for (const caseta of casetasAAgregar) {
        const request2 = new sql.Request(transaction);

        const insertQuery = `
                    INSERT INTO PCasetasporruta (ID_Caseta, id_Tipo_ruta, consecutivo, Id_Ruta, F_Captura, Captor)
                    VALUES (@ID_Caseta, @id_Tipo_ruta, @consecutivo, @Id_Ruta, GETDATE(), 'IAVE')
                `;

        request2.input('ID_Caseta', sql.Int, caseta.ID_Caseta);
        request2.input('id_Tipo_ruta', sql.Int, id_Tipo_ruta);
        request2.input('consecutivo', sql.Int, caseta.consecutivo);
        request2.input('Id_Ruta', sql.Int, Id_Ruta);

        await request2.query(insertQuery);
      }

      console.log(`✅ Agregadas ${casetasAAgregar.length} casetas`);
    }

    // ===== 3. ACTUALIZAR CONSECUTIVOS =====
    if (casetasActualizadas && casetasActualizadas.length > 0) {
      for (const caseta of casetasActualizadas) {
        const request3 = new sql.Request(transaction);

        const updateQuery = `
                    UPDATE PCasetasporruta 
                    SET consecutivo = @consecutivo 
                    WHERE ID_Caseta = @ID_Caseta 
                    AND id_Tipo_ruta = @id_Tipo_ruta
                `;

        request3.input('consecutivo', sql.Int, caseta.consecutivo);
        request3.input('ID_Caseta', sql.Int, caseta.ID_Caseta);
        request3.input('id_Tipo_ruta', sql.Int, id_Tipo_ruta);

        await request3.query(updateQuery);
      }

      console.log(`✅ Actualizados ${casetasActualizadas.length} consecutivos`);
    }

    // Commit de la transacción
    await transaction.commit();

    // Obtener las casetas actualizadas de la ruta
    const requestFinal = new sql.Request(pool);
    requestFinal.input('id_Tipo_ruta', sql.Int, id_Tipo_ruta);

    const resultFinal = await requestFinal.query(`
            SELECT 
                cpr.*,
                c.Nombre,
                c.Nombre_IAVE,
                c.Estado,
                c.latitud,
                c.longitud,
                c.IAVE,
                c.Automovil,
                c.Autobus2Ejes,
                c.Camion2Ejes,
                c.Camion3Ejes,
                c.Camion5Ejes,
                c.Camion9Ejes
            FROM PCasetasporruta cpr
            INNER JOIN casetas_Plantillas c ON cpr.ID_Caseta = c.ID_Caseta
            WHERE cpr.id_Tipo_ruta = @id_Tipo_ruta
            ORDER BY cpr.consecutivo ASC
        `);

    res.json({
      success: true,
      message: 'Cambios guardados exitosamente',
      data: {
        casetasEliminadas: casetasAEliminar?.length || 0,
        casetasAgregadas: casetasAAgregar?.length || 0,
        consecutivosActualizados: casetasActualizadas?.length || 0,
        casetasEnRuta: resultFinal.recordset
      }
    });

  } catch (error) {
    // Rollback en caso de error - solo si la transacción comenzó
    try {
      if (transaction && transaction._begun) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      console.error('❌ Error al hacer rollback:', rollbackError);
    }

    console.error('❌ Error al guardar cambios:', error);

    res.status(500).json({
      success: false,
      message: 'Error al guardar los cambios de la ruta',
      error: error.message
    });
  }
}

// Este controlador es un esqueleto para la devolución de varias casetas, hace lo mismo que getCasetaFromInegi, pero con por cada uno de las casetas en el array
export const getCasetasTUSACoincidentes = async (req, res) => {
  console.log('📥 Solicitud de casetas TUSA coincidentes recibida');
  const pool = await getConnection();
  const vehiculoColumn = switchTipoVehiculo("5"); // Se deja fijo el tipo de vehiculo en 5 (Camion de 2 ejes) para este ejemplo

  try {
    const { casetasLimpias } = req.body;

    // ===== Recorriendo las casetas del objeto para encontrar las coincidencias por cada caseta =====
    if (casetasLimpias && casetasLimpias.length > 0) {
      // Procesar casetas secuencialmente para evitar saturar el pool
      for (const caseta of casetasLimpias) {
        try {
          console.log(`🔍 Buscando coincidencias para caseta: ${caseta.nombre}`);
          const busquedaDeCaseta = await pool.request()
            .input('latitud', sql.Float, parseFloat(caseta.lat))
            .input('longitud', sql.Float, parseFloat(caseta.lng))
            .input('costo', sql.Float, parseFloat(caseta.costo))
            .input('nombreCasetaINEGI', sql.VarChar, caseta.nombre)
            .query(`
            SELECT TOP 1
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
              ) AS distancia_km,
               ABS((casetas_Plantillas.[${vehiculoColumn}] - @costo)) AS diferencia_costo
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
                ) <= 10
                AND ABS((casetas_Plantillas.[${vehiculoColumn}] - @costo)) <= 20
            ORDER BY diferencia_costo, distancia_km
          `);

          // Se agregan al objeto que se va a devolver las casetas encontradas
          caseta.resultado = busquedaDeCaseta.recordset;
          console.log(`✅ Caseta procesada: ${caseta.nombre}, coincidencias encontradas: ${busquedaDeCaseta.recordset.length}`);
        } catch (casetaError) {
          console.error(`❌ Error procesando caseta ${caseta.nombre}:`, casetaError.message);
          caseta.resultado = [];
          caseta.error = casetaError.message;
        }
      }

      console.log(`✅ Procesadas ${casetasLimpias.length} casetas`);
    }

    res.json({
      success: true,
      message: 'Casetas encontradas:',
      data: {
        casetasTusaEncontradas: casetasLimpias?.length,
        casetas: casetasLimpias
      }
    });

  } catch (error) {
    console.error('❌ Error al consultar las casetas.:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las casetas coincidentes.',
      error: error.message
    });
  }
}

export const getCasetaFromInegi = async (req, res) => {
  try {
    const {
      lat,
      lng,
      costo,
      ejes,
      nombre

    } = req.body;

    const pool = await getConnection();
    const vehiculoColumn = switchTipoVehiculo(ejes);

    const result = await pool.request()
      .input('latitud', sql.Float, parseFloat(lat))
      .input('longitud', sql.Float, parseFloat(lng))
      .input('costo', sql.Float, parseFloat(costo))
      .input('nombreCasetaINEGI', sql.VarChar, nombre)
      .query(`
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
          ) <= 10
    AND (casetas_Plantillas.[${vehiculoColumn}] - @costo) BETWEEN -20 AND 20
ORDER BY distancia_km
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al consultar caseta desde INEGI:', error);
    res.status(500).json({ msg: 'Error al consultar caseta desde INEGI', error: error.message });
  }
};


export const searchPaseCasetas = async (req, res) => {
  try {
    const { nombre } = req.query;
    if (!nombre) return res.status(400).json({ msg: "Falta parámetro nombre" });

    // PASE API parece fallar con ciertos caracteres, limpiamos un poco
    const nombreLimpio = nombre.trim();

    // Proxy a API PASE
    const url = `https://apps.pase.com.mx/sp-web/api/cobertura/casetas?nombre=${encodeURIComponent(nombreLimpio)}`;

    // Configuración de Headers para simular navegador real (Bypass WAF/Radware)
    const config = {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate', 
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      responseType: 'text', // Force text to handle XML manually if needed
      timeout: 10000 // 10s timeout
    };

    const response = await axios.get(url, config);
    const data = response.data;

    // A veces devuelve HTML de error (WAF/Captcha)
    if (typeof data === 'string' && (data.includes('<!DOCTYPE html>') || data.includes('<html'))) {
         console.log("PASE API retornó HTML (posible bloqueo WAF). Se retorna vacío.");
         return res.json([]);
    }

    const isXML = typeof data === 'string' && data.trim().startsWith('<');

    if (isXML) {
       console.log("Procesando XML de PASE...");
       // FIX: La API de PASE devuelve XML inválido.
       // 1. Reemplazamos '&' sueltos
       let cleanData = data.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
       // 2. Reemplazamos '<' sueltos que no sean tags (ej. " < [" -> " &lt; [")
       // Busca '<' que NO va seguido de letra, '/', '!' (cdata/comment) o '?' (xml decl)
       cleanData = cleanData.replace(/<(?![a-zA-Z\/\!\?])/g, '&lt;');

       const parser = new xml2js.Parser({ explicitArray: false });
       try {
          const result = await parser.parseStringPromise(cleanData);
          
          let items = [];
          if (result.List && result.List.item) {
              items = Array.isArray(result.List.item) ? result.List.item : [result.List.item];
          }

          // ENRIQUECIMIENTO: Obtener costo T2 para los primeros resultados (para comparar con Camion2Ejes)
          // Limitamos a 5 para no saturar ni ser bloqueados
          const enrichedItems = await Promise.all(items.slice(0, 5).map(async (item) => {
             try {
                 const tUrl = `https://apps.pase.com.mx/sp-web/api/cobertura/casetas/${item.id}/tarifas`;
                 const tRes = await axios.get(tUrl, config);
                 let tData = tRes.data;
                 
                 // Limpieza básica de respuesta tarifas (igual que la principal)
                 if (typeof tData === 'string') {
                    if (tData.includes('<!DOCTYPE html>')) throw new Error("WAF Block on Tariffs");
                    tData = tData.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
                    tData = tData.replace(/<(?![a-zA-Z\/\!\?])/g, '&lt;');
                 }

                 const tResult = await parser.parseStringPromise(tData);
                 
                 // Buscar T2 en la estructura
                 let costoT2 = null;
                 const tItems = tResult.List?.item ? (Array.isArray(tResult.List.item) ? tResult.List.item : [tResult.List.item]) : [];
                 
                 for (const tItem of tItems) {
                     const tarifasArr = tItem.tarifas?.tarifas ? (Array.isArray(tItem.tarifas.tarifas) ? tItem.tarifas.tarifas : [tItem.tarifas.tarifas]) : [];
                     const t2 = tarifasArr.find(t => t.clase === 'T2');
                     if (t2) {
                         costoT2 = t2.costo;
                         break; // Encontramos uno, suficiente referencia
                     }
                 }
                 return { ...item, costoT2 };

             } catch (err) {
                 // Si falla tarifas, devolvemos el item sin costo extra
                 return item;
             }
          }));

          // Unimos los enriquecidos con el resto (sin enriquecer)
          const finalItems = [...enrichedItems, ...items.slice(5)];
          
          return res.json(finalItems);

       } catch (parseError) {
          console.error("Error parseando XML depurado:", parseError.message);
          // Si falla incluso depurado, devolvemos vacío para no romper flujo
          return res.json([]);
       }
    } else if (Array.isArray(data)) {
        return res.json(data);
    } else if (typeof data === 'object') {
        // En caso de que sea un objeto JSON pero no un array
        return res.json([data]);
    }

    // Si no es nada conocido
    res.json([]);

  } catch (error) {
    console.error("Error consultando PASE:", error.message);
    if (error.response && error.response.status === 404) {
      return res.json([]); // Si no encuentra, retorna vacío
    }
    // Return empty array on error to prevent frontend crash
    res.json([]);
  }
};

export const getCatEntidadCasetas = async (req, res) => {
  try {
    const pool = await getConnection();
    // Obtenemos lista de casetas locales.
    // Usamos LEFT JOIN con Cat_EntidadCaseta para ver si ya tienen ID de PASE (OrigenInmediato)
    // Corregimos nombres de columnas según schema real:
    // ID_EntidadCaseta -> Id_caseta
    // NombreCaseta -> NombreRelacionado

    const result = await pool.request().query(`
      SELECT 
        Cat_EntidadCaseta.Id_caseta AS ID_EntidadCaseta,
        Cat_EntidadCaseta.NombreRelacionado AS NombreCaseta,
        Cat_EntidadCaseta.OrigenInmediato AS ID_PASE,
        cp.Nombre_IAVE AS NombrePlantilla,
        cp.Camion2Ejes AS Camion2Ejes
      FROM Cat_EntidadCaseta  
      LEFT JOIN casetas_Plantillas CP ON Cat_EntidadCaseta.Id_caseta = CP.ID_Caseta
      ORDER BY Cat_EntidadCaseta.Id_caseta ASC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener catálogo local" });
  }
};

export const updatePaseID = async (req, res) => {
  const { id } = req.params;
  const { paseId } = req.body;

  try {
    const pool = await getConnection();
    await pool.request()
      .input("Id", sql.Int, id)
      .input("PaseId", sql.VarChar, paseId) // OrigenInmediato suele ser nvarchar
      .query("UPDATE Cat_EntidadCaseta SET OrigenInmediato = @PaseId WHERE Id_caseta = @Id");

    res.json({ msg: "ID PASE actualizado", id, paseId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar BD" });
  }
};