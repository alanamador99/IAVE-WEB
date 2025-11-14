import React, { useState, useEffect, useRef } from 'react';
import { parsearMinutos, formatearDinero, RouteOption } from '../components/shared/utils';
import Buscador from '../components/nuevocomponente.jsx';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerATM from 'leaflet/dist/images/ATM__.png';
import markerA from 'leaflet/dist/images/A.png';
import markerCaseta from 'leaflet/dist/images/MapPinGreen.png';
import markerB from 'leaflet/dist/images/B.png';
import markerPin from 'leaflet/dist/images/pin_intermedio.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const API_KEY = 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';
const API_URL = process.env.REACT_APP_API_URL;

const markerIconATM = L.icon({
    iconUrl: markerATM,
    shadowUrl: markerShadow,
    iconSize: [25, 15], // size of the icon
    shadowSize: [64, 40], // size of the shadow
});
const markerIconCaseta = L.icon({
    iconUrl: markerCaseta,
    shadowUrl: markerShadow,
    iconSize: [24, 24], // size of the icon
    shadowSize: [40, 40], // size of the shadow
});
const markerIconPIN = L.icon({
    iconUrl: markerPin,
    shadowUrl: markerShadow,
    iconSize: [40, 40], // size of the icon
    shadowSize: [20, 30], // size of the shadow
});


const markerIconA = L.icon({
    iconUrl: markerA,
    shadowUrl: markerShadow,
    iconSize: [24, 24], // size of the icon
    shadowSize: [40, 40], // size of the shadow
});

const markerIconB = L.icon({
    iconUrl: markerB,
    shadowUrl: markerShadow,
    iconSize: [24, 24], // size of the icon
    shadowSize: [64, 40], // size of the shadow
});

const RutasModule = () => {
    // Estados principales
    const [txtOrigen, setTxtOrigen] = useState('');
    const [txtPuntoIntermedio, setTxtPuntoIntermedio] = useState('');
    const [txtDestino, setTxtDestino] = useState('');
    const [tipoVehiculo, setTipoVehiculo] = useState(5);

    // Estados, para el listado de los Origenes/Destinos/Puntos intermedios.
    const [origenes, setOrigenes] = useState([]);
    const [destinos, setDestinos] = useState([]);
    const [puntosIntermedios, setPuntosIntermedios] = useState([]);


    const [puntoIntermedio, setPuntoIntermedio] = useState(null);
    const [origen, setOrigen] = useState([]);
    const [destino, setDestino] = useState([]);
    const [rutaTusa, setRutaTusa] = useState([]);

    // Estados de carga
    const [loadingOrigen, setLoadingOrigen] = useState(false);
    const [loadingPuntoIntermedio, setLoadingPuntoIntermedio] = useState(false);
    const [loadingDestino, setLoadingDestino] = useState(false);
    const [loadingRutas, setLoadingRutas] = useState(false);
    const [loadingRutaSeleccionada, setLoadingRutaSeleccionada] = useState(false);

    // Estados adicionales
    const [rutas_OyL, setRutas_OyL] = useState(null); //Rutas Optima y Libre
    const [rutaSeleccionada, setRutaSeleccionada] = useState([]); //Ruta Seleccionada, después de presentar las opciones.
    const [boolExiste, setBoolExiste] = useState('Consultando ruta');

    // Refs para debouncing
    const origenTimeoutRef = useRef(null);
    const destinoTimeoutRef = useRef(null);
    const intermediosTimeoutRef = useRef(null);

    // Función genérica para buscar destinos (poblaciones)
    const searchDestinations = async (idLocalidad, tipo) => {
        if (!idLocalidad || idLocalidad.length < 3) {
            // No buscar si hay menos de 3 caracteres
            if (tipo === 'Origen') setOrigenes([]);
            if (tipo === 'Destino') setDestinos([]);
            if (tipo === 'Intermedio') setPuntosIntermedios([]);
            return;
        }

        // Activar loading
        if (tipo === 'Origen') setLoadingOrigen(true);
        if (tipo === 'Destino') setLoadingDestino(true);
        if (tipo === 'Intermedio') setLoadingPuntoIntermedio(true);

        try {
            const formData = new URLSearchParams({
                buscar: idLocalidad,
                type: 'json',
                num: 10,
                key: API_KEY
            });

            const response = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/buscadestino', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            const data = await response.json();

            if (tipo === 'Origen') {
                setOrigenes(data.data || []);
            }
            if (tipo === 'Intermedio') {
                setPuntosIntermedios(data.data || []);
            }
            if (tipo === 'Destino') {
                setDestinos(data.data || []);
            }
        } catch (error) {
            console.error('Error al buscar destinos:', error);
            if (tipo === 'Origen') {
                setOrigenes([]);
            }
            if (tipo === 'Destino') {
                setDestinos([]);
            }
            if (tipo === 'Intermedio') {
                setPuntosIntermedios([]);
            }
        } finally {
            // Desactivar loading
            if (tipo === 'Origen') {
                setLoadingOrigen(false);
            }
            if (tipo === 'Destino') {
                setLoadingDestino(false);
            }
            if (tipo === 'Intermedio') {
                setLoadingPuntoIntermedio(false);
            }
        }
    };

    // Effect para buscar origen con debounce
    useEffect(() => {
        // Limpiar timeout anterior
        if (origenTimeoutRef.current) {
            clearTimeout(origenTimeoutRef.current);
        }

        // Crear nuevo timeout
        origenTimeoutRef.current = setTimeout(() => {
            if (txtOrigen) {
                searchDestinations(txtOrigen, 'Origen');
            } else {
                setOrigenes([]);
            }
        }, 500); // Espera 500ms después de que el usuario deje de escribir

        // Cleanup
        return () => {
            if (origenTimeoutRef.current) {
                clearTimeout(origenTimeoutRef.current);
            }
        };
    }, [txtOrigen]);

    // Effect para buscar destino con debounce
    useEffect(() => {
        // Limpiar timeout anterior
        if (destinoTimeoutRef.current) {
            clearTimeout(destinoTimeoutRef.current);
        }

        // Crear nuevo timeout
        destinoTimeoutRef.current = setTimeout(() => {
            if (txtDestino) {
                searchDestinations(txtDestino, 'Destino');
            } else {
                setDestinos([]);
            }
        }, 500); // Espera 500ms después de que el usuario deje de escribir

        // Cleanup
        return () => {
            if (destinoTimeoutRef.current) {
                clearTimeout(destinoTimeoutRef.current);
            }
        };
    }, [txtDestino]);



    // Effect para buscar punto intermedio con debounce
    useEffect(() => {
        // Limpiar timeout anterior
        if (intermediosTimeoutRef.current) {
            clearTimeout(intermediosTimeoutRef.current);
        }

        // Crear nuevo timeout
        intermediosTimeoutRef.current = setTimeout(() => {
            if (txtPuntoIntermedio) {
                searchDestinations(txtPuntoIntermedio, 'Intermedio');
            } else {
                setPuntosIntermedios([]);
            }
        }, 500); // Espera 500ms después de que el usuario deje de escribir

        // Cleanup
        return () => {
            if (intermediosTimeoutRef.current) {
                clearTimeout(intermediosTimeoutRef.current);
            }
        };
    }, [txtPuntoIntermedio]);



    const convertirCoordenadasGeoJSON = (geojsonString) => {
        const geojson = JSON.parse(geojsonString);
        const coords = geojson.coordinates;
        const data = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
        // Si es MultiLineString (array de arrays de coordenadas)
        if (geojson.type === 'MultiLineString') {
            return coords.map(lineString =>
                lineString.map(([lng, lat]) => [lat, lng])
            );
        }
        // Si es LineString (array de coordenadas)
        else if (geojson.type === 'LineString') {
            return [coords.map(([lng, lat]) => [lat, lng])];
        }
        return data;
    };




    // Handler simplificado para inputs
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'txtOrigen') setTxtOrigen(value);
        if (name === 'txtDestino') setTxtDestino(value);
        if (name === 'txtIntermedio') setTxtPuntoIntermedio(value);
        if (name === 'selectTipoVehiculo') setTipoVehiculo(value);
        if (name === 'SelectOrigen') {
            const selectedOrigin = origenes.find(item => item.nombre === value);
            setOrigen(selectedOrigin);
        }

        if (name === 'SelectDestino') {
            const selectedDestination = destinos.find(item => item.nombre === value);
            setDestino(selectedDestination);
        }

        if (name === 'SelectIntermedio') {
            const selectedIntermedio = puntosIntermedios.find(item => item.nombre === value);
            setPuntoIntermedio(selectedIntermedio); // Usar el nuevo estado
        }


        if (name === 'selectTipoTraslado') {
            // Aquí puedes manejar el cambio del tipo de traslado si es necesario
        }
    };



    // Función para obtener el detalle de la ruta libre
    async function getDetalleRuta(params) {
        const response = await (getRouteDetails(params)).then();


        if (params == 'detalle_o') {
            const selectedRoute = [rutas_OyL?.optima, response.data.filter(item => (item.costo_caseta != 0))];
            setRutaSeleccionada(selectedRoute);

        }
        if (params == 'detalle_l') {
            const selectedRoute = [rutas_OyL?.libre, response.data.filter(item => (item.costo_caseta != 0))];
            setRutaSeleccionada(selectedRoute);
        }
        setBoolExiste(boolExiste.replaceAll(', selecciona una ruta', ''))

    };

    // Handler testing
    function handlerRetirarIntermedio() {
        setPuntoIntermedio(null);
        calcularRutaHandler('SinIntermedio');


    };

    async function getRouteDetails(tipoDetalleOoL) {


        if (!origen?.id_dest || !destino?.id_dest) {
            alert('Por favor ingresa los IDs de origen y destino');
            return;
        }

        try {
            setLoadingRutaSeleccionada(true);
            const formData = new URLSearchParams({
                dest_i: origen.id_dest,
                dest_f: (puntoIntermedio) ? puntoIntermedio.id_dest : destino.id_dest,
                v: tipoVehiculo,
                type: 'json',
                key: API_KEY
            });


            const response = await fetch(`https://gaia.inegi.org.mx/sakbe_v3.1/${tipoDetalleOoL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            const data = await response.json();

            if (puntoIntermedio) {
                const formData2 = new URLSearchParams({
                    dest_i: puntoIntermedio.id_dest,
                    dest_f: destino.id_dest,
                    v: tipoVehiculo,
                    e: '0',
                    type: 'json',
                    key: API_KEY
                });

                const response2 = await fetch(`https://gaia.inegi.org.mx/sakbe_v3.1/${tipoDetalleOoL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData2
                });

                if (!response2.ok) {
                    throw new Error(`Error en la respuesta del servidor: ${response2.status}`);
                }

                const data2 = await response2.json();

                // Combinar las dos respuestas de forma robusta según su estructura
                // Casos comunes:
                // - Ambas respuestas son arrays -> concatenar arrays
                // - Ambas respuestas son objetos con propiedad `data` que es array -> concatenar data arrays y mantener resto de propiedades
                // - Ambos son objetos simples -> hacer merge shallow (props de data2 sobrescriben a data)
                let datasCombinados;
                if (Array.isArray(data) && Array.isArray(data2)) {
                    datasCombinados = [...data, ...data2];
                } else if (
                    data && data2 &&
                    Array.isArray(data.data) && Array.isArray(data2.data)
                ) {
                    datasCombinados = { ...data, data: [...data.data, ...data2.data] };
                } else if (typeof data === 'object' && typeof data2 === 'object') {
                    datasCombinados = { ...data, ...data2 };
                } else {
                    // Fallback: si uno es null/undefined, devolver el otro; si ambos son primitivos, devolverlos en un array
                    if (data == null) datasCombinados = data2;
                    else if (data2 == null) datasCombinados = data;
                    else datasCombinados = [data, data2];
                }

                return datasCombinados;
            }

            return (data);

        } catch (error) {
            alert('Error: ' + error.message);
        }
        finally {
            setLoadingRutaSeleccionada(false);
        }
    }


    async function calcularRutaHandler(e) {
        // Validación de inputs
        if (!origen?.id_dest || !destino?.id_dest) {
            alert('Por favor selecciona un origen y destino válidos');
            return;
        }

        // Inicializar estados
        setLoadingRutas(true);
        setRutaSeleccionada([]);
        setRutas_OyL([]);

        try {
            // Helper: normalizar nombres de lugares
            const normalizarNombre = (lugar) => {
                const partes = lugar?.nombre.split(',');
                return partes?.[1]?.trim() || lugar?.nombre.trim();
            };

            // Helper: crear FormData para INEGI
            const crearFormDataINEGI = (idOrigen, idDestino) => {
                return new URLSearchParams({
                    dest_i: idOrigen,
                    dest_f: idDestino,
                    v: tipoVehiculo,
                    e: '0',
                    type: 'json',
                    key: API_KEY
                });
            };

            // Helper: procesar datos de ruta
            const procesarRuta = (data) => ({
                distancia: data?.data?.long_km || 0,
                tiempo: data?.data?.tiempo_min || 0,
                costoCasetas: data?.data?.costo_caseta || 0,
                tienePeaje: data?.data?.peaje === 't',
                advertencias: data?.data?.advertencia || [],
                geometria: data?.data?.geometria || null,
                geojson: data?.data?.geojson || null
            });

            // Helper: combinar GeoJSON
            const combinarGeoJSON = (geo1, geo2) => {
                if (!geo1) return geo2;
                if (!geo2) return geo1;

                const geoJSON1 = typeof geo1 === 'string' ? JSON.parse(geo1) : geo1;
                const geoJSON2 = typeof geo2 === 'string' ? JSON.parse(geo2) : geo2;

                return {
                    ...geoJSON1,
                    coordinates: [...geoJSON1.coordinates, ...geoJSON2.coordinates]
                };
            };

            // Helper: combinar dos rutas
            const combinarRutas = (ruta1, ruta2) => ({
                distancia: ruta1.distancia + ruta2.distancia,
                tiempo: ruta1.tiempo + ruta2.tiempo,
                costoCasetas: ruta1.costoCasetas + ruta2.costoCasetas,
                tienePeaje: ruta1.tienePeaje || ruta2.tienePeaje,
                advertencias: [...ruta1.advertencias, ...ruta2.advertencias],
                geometria: ruta1.geometria && ruta2.geometria
                    ? ruta1.geometria + ruta2.geometria
                    : (ruta1.geometria || ruta2.geometria),
                geojson: combinarGeoJSON(ruta1.geojson, ruta2.geojson)
            });

            // Fetch: Ruta TUSA
            const fetchRutaTUSA = async () => {
                const formData = new URLSearchParams({
                    origen: normalizarNombre(origen),
                    destino: normalizarNombre(destino)
                });

                const response = await fetch(
                    `${API_URL}/api/casetas/rutas/BuscarRutaPorOrigen_Destino`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData
                    }
                );

                if (!response.ok) {
                    console.error('Error TUSA:', response);
                    throw new Error(`Error en servidor TUSA: ${response.status}`);
                }

                const text = await response.text();
                try {
                    const json = JSON.parse(text);
                    return json?.data || json;
                } catch {
                    return text;
                }
            };

            // Fetch: Ruta INEGI
            const fetchRutaINEGI = async (formData, tipoRuta) => {
                const response = await fetch(
                    `https://gaia.inegi.org.mx/sakbe_v3.1/${tipoRuta}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData
                    }
                );

                if (!response.ok) {
                    throw new Error(`Error INEGI (${tipoRuta}): ${response.status}`);
                }

                const text = await response.text();
                return JSON.parse(text);
            };

            // Determinar si hay punto intermedio
            const hayIntermedio = puntoIntermedio && e !== 'SinIntermedio';
            const idDestFinal = hayIntermedio ? puntoIntermedio.id_dest : destino.id_dest;

            // Crear FormData para primer segmento
            const formData1 = crearFormDataINEGI(origen.id_dest, idDestFinal);

            // Ejecutar todas las peticiones en paralelo
            const promesas = [
                fetchRutaINEGI(formData1, 'optima'),
                fetchRutaINEGI(formData1, 'libre'),
                fetchRutaTUSA()
            ];

            // Si hay punto intermedio, agregar peticiones del segundo segmento
            if (hayIntermedio) {
                const formData2 = crearFormDataINEGI(puntoIntermedio.id_dest, destino.id_dest);
                promesas.push(
                    fetchRutaINEGI(formData2, 'optima'),
                    fetchRutaINEGI(formData2, 'libre')
                );
            }

            // Esperar todas las respuestas
            const resultados = await Promise.all(promesas);
            const [rutaOptima1, rutaLibre1, dataTusa, rutaOptima2, rutaLibre2] = resultados;

            // Actualizar ruta TUSA y verificar si existe
            const rutaTUSAData = dataTusa?.data || dataTusa || [];
            const existeEnTUSA = Array.isArray(rutaTUSAData)
                ? rutaTUSAData.length > 0
                : dataTusa?.enTUSA;

            setRutaTusa(rutaTUSAData);
            console.log('rutaTusa:', rutaTUSAData);

            // Mostrar alerta si la ruta no está en TUSA
            if (!existeEnTUSA) {
                console.warn('⚠️ Ruta no encontrada en TUSA');

                //alert('⚠️ La ruta no existe en TUSA. Se está creando una nueva ruta.');
                //Aqui se va a cargar el "nuevocomponente que se está desarrollando para que muestre al usuario la opción de seleccionar el cliente al que se le asignará la ruta nueva."



            }

            // Procesar rutas según si hay punto intermedio
            let rutaOptimaFinal, rutaLibreFinal;

            if (hayIntermedio) {
                const optima1 = procesarRuta(rutaOptima1);
                const optima2 = procesarRuta(rutaOptima2);
                const libre1 = procesarRuta(rutaLibre1);
                const libre2 = procesarRuta(rutaLibre2);

                rutaOptimaFinal = combinarRutas(optima1, optima2);
                rutaLibreFinal = combinarRutas(libre1, libre2);
            } else {
                rutaOptimaFinal = procesarRuta(rutaOptima1);
                rutaLibreFinal = procesarRuta(rutaLibre1);
            }

            // Helper: convertir GeoJSON a string si es necesario
            const stringifyGeoJSON = (geojson) => {
                return typeof geojson === 'string' ? geojson : JSON.stringify(geojson);
            };

            // Actualizar estado con rutas procesadas
            setRutas_OyL({
                optima: rutaOptimaFinal,
                libre: rutaLibreFinal,
                polilineaOptima: convertirCoordenadasGeoJSON(
                    stringifyGeoJSON(rutaOptimaFinal.geojson)
                ),
                polilineaLibre: convertirCoordenadasGeoJSON(
                    stringifyGeoJSON(rutaLibreFinal.geojson)
                )
            });

            // Actualizar estado de existencia
            const mensaje = dataTusa?.[0]?.Categoria
                ? 'Ruta existente'
                : 'Creando ruta';
            setBoolExiste(`${mensaje}, <selecciona una ruta>`);

        } catch (error) {
            console.error('Error al calcular la ruta:', error);
            setBoolExiste('Error al calcular la ruta');
            alert(`Error: ${error.message}`);
        } finally {
            setLoadingRutas(false);
        }
    }

    return (
        <div className="container-fluid py-0">




            <div className="container-fluid py-0 rounded-top">
                <div className="header-RC py-2 rounded-top">
                    <h1>🚛 Creador de Rutas - Propuesta IAVE-WEB</h1>
                    <div className="header-actions-RC">
                        <button className="btn btn-success">💾 Guardar Ruta</button>
                    </div>
                </div>
                <div className="container-fluid py-1 rounded-top border ">
                    <div className="alert alert-info border-left-info my-2" role="alert" close="true" >
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>Estado:</strong> {loadingRutas || loadingRutaSeleccionada ? 'Cargando rutas...' : boolExiste}
                    </div>
                    <table className='table table-bordered table-scroll table-sm table-hover align-middle mt-2'>
                        <thead>
                            <tr>
                                <th>Tipo de Ruta</th>
                                <th>Distancia</th>
                                <th>Tiempo</th>
                                <th>Costo Casetas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingRutas && (
                                <tr>
                                    <td>Cargando rutas...</td>
                                </tr>
                            )}
                            {!loadingRutas && rutas_OyL && (
                                <>
                                    <tr>
                                        <td>Ruta Óptima: </td>
                                        <td> Distancia: {rutas_OyL.optima.distancia.toFixed(2)} km  </td>
                                        <td> Tiempo: {parsearMinutos(rutas_OyL.optima.tiempo)}  </td>
                                        <td> Costo Casetas: {formatearDinero(rutas_OyL.optima.costoCasetas)} </td>
                                    </tr>
                                    <tr>
                                        <td>Ruta Libre: </td>
                                        <td> Distancia: {rutas_OyL.libre.distancia.toFixed(2)} km  </td>
                                        <td> Tiempo: {parsearMinutos(rutas_OyL.libre.tiempo)}  </td>
                                        <td> Costo Casetas: {formatearDinero(rutas_OyL.libre.costoCasetas)} </td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="main-content-RC">
                    {/* Sidebar donde se selecciona origen, destino y punto intermedio. */}
                    <div className="sidebar-RC px-3">
                        <div className="form-section-RC">
                            <h3>ℹ️ Información General </h3>



                            {/* ORIGEN */}
                            <div className="form-group-RC py-0">
                                <label className='py-0 my-0'>Origen</label>
                                <input
                                    type="text"
                                    className="form-control-RC pt-1 pb-2"
                                    name='txtOrigen'
                                    placeholder="Huehuetoca, Huehuetoca"
                                    value={txtOrigen}
                                    onChange={handleChange}
                                />
                                <select
                                    id="SelectOrigen"
                                    className="form-select form-select-sm custom-select"
                                    style={{ width: '100%' }}
                                    disabled={loadingOrigen || origenes.length === 0}
                                    onChange={handleChange}
                                    name='SelectOrigen'
                                >
                                    {loadingOrigen && <option>Buscando...</option>}
                                    {!loadingOrigen && origenes.length === 0 && (
                                        <option value="">
                                            {txtOrigen.length < 3
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Origen (fuente INEGI)'}
                                        </option>
                                    )}
                                    {!loadingOrigen && origenes.length > 0 && (
                                        <>
                                            <option value="">Selecciona un origen</option>
                                            {origenes.map((item, index) => (
                                                <option key={index} value={item.id}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* DESTINO */}
                            <div className="form-group-RC py-0">
                                <label className='py-0 my-0'>Destino</label>
                                <input
                                    type="text"
                                    className="form-control-RC pt-1 pb-2"
                                    placeholder="Hermosillo, Hermosillo"
                                    value={txtDestino}
                                    onChange={handleChange}
                                    name='txtDestino'
                                />
                                <select
                                    id="SelectDestino"
                                    className="form-select form-select-sm custom-select"
                                    style={{ width: '100%' }}
                                    disabled={loadingDestino || destinos.length === 0}
                                    onChange={handleChange}
                                    name='SelectDestino'

                                >
                                    {loadingDestino && <option>Buscando...</option>}
                                    {!loadingDestino && destinos.length === 0 && (
                                        <option value="">
                                            {txtDestino.length < 3
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Destino (fuente INEGI)'}
                                        </option>
                                    )}
                                    {!loadingDestino && destinos.length > 0 && (
                                        <>
                                            <option value="">Selecciona un destino</option>
                                            {destinos.map((item, index) => (
                                                <option key={index} value={item.id}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="form-group py-0" style={{ justifySelf: 'center' }}>
                                <label className='py-0 my-0 mr-2'>Tipo de unidad: </label>
                                <select
                                    className='form-select form-select-sm custom-select'
                                    name="selectTipoVehiculo"
                                    onChange={handleChange}
                                    value={tipoVehiculo}
                                    id='selectTipoVehiculo'
                                    style={{ width: 'auto', height: '2.5rem' }}
                                >



                                    <option value="1">Automovil</option>
                                    <option value="2">Bus 2 Ejes</option>

                                    <option value="5">Camion 2 Ejes</option>
                                    <option value="6">Camion 3 Ejes</option>
                                    <option value="7">Camion 4 Ejes</option>
                                    <option value="8">Camion 5 Ejes</option>
                                    <option value="9">Camion 6 Ejes</option>
                                    <option value="10">Camion 7 Ejes</option>
                                    <option value="11">Camion 8 Ejes</option>
                                    <option value="12">Camion 9 Ejes</option>


                                </select>
                            </div>

                            {/* Punto intermedio */}
                            <div className="form-group-RC py-0">
                                <label className='py-0 my-0'>Punto Intermedio</label>
                                <input
                                    type="text"
                                    className="form-control-RC pt-1 pb-2"
                                    placeholder="Guadalajara, Jalisco"
                                    value={txtPuntoIntermedio}
                                    onChange={handleChange}
                                    name='txtIntermedio'
                                />
                                <select
                                    id="SelectIntermedio"
                                    className="form-select form-select-sm custom-select"
                                    style={{ width: '100%' }}
                                    disabled={loadingPuntoIntermedio || puntosIntermedios.length === 0}
                                    onChange={handleChange}
                                    name='SelectIntermedio'
                                >
                                    {loadingPuntoIntermedio && <option>Buscando...</option>}
                                    {!loadingPuntoIntermedio && puntosIntermedios.length === 0 && (
                                        <option value="">
                                            {txtPuntoIntermedio.length < 3
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Fuente oficial (INEGI)'}
                                        </option>
                                    )}
                                    {!loadingPuntoIntermedio && puntosIntermedios.length > 0 && (
                                        <>
                                            <option value="">Selecciona el punto intermedio</option>
                                            {puntosIntermedios.map((item, index) => (
                                                <option key={index} value={item.id}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>


                        </div>

                        <div className="route-points-RC">
                            <div className="route-point-RC origin-RC py-1">
                                <div className="route-icon-RC origin-RC"></div>
                                <div>
                                    <strong>Origen</strong><br />
                                    <small style={{
                                        fontWeight: `${(rutaTusa[0]?.RazonOrigen) ? 'bold' : 'normal'}`,
                                        color: `${(rutaTusa[0]?.RazonOrigen) ? 'green' : 'black'}`,
                                    }}>{rutaTusa[0]?.RazonOrigen || JSON.stringify(origen?.nombre)?.replaceAll('"', '') || 'Selecciona un origen valido.'}</small>
                                </div>
                            </div>
                            <div className="route-point-RC py-1">
                                <div className="route-icon-RC waypoint-RC"></div>
                                <div>
                                    <strong>Punto Intermedio</strong><br />
                                    <small>
                                        {JSON.stringify(puntoIntermedio?.nombre)?.replaceAll('"', '') ||
                                            'Selecciona un punto intermedio valido.'}
                                    </small>
                                </div>
                            </div>
                            <div className="route-point-RC destination-RC py-1">
                                <div className="route-icon-RC destination-RC"></div>
                                <div>
                                    <strong>Destino</strong><br />
                                    <small style={{
                                        fontWeight: `${(rutaTusa[0]?.RazonOrigen) ? 'bold' : 'normal'}`,
                                        color: `${(rutaTusa[0]?.RazonOrigen) ? 'red' : 'black'}`,
                                    }}>{rutaTusa[0]?.RazonDestino || (JSON.stringify(destino?.nombre) || 'Selecciona un destino valido.').replaceAll('"', '')}</small>
                                </div>
                            </div>
                            <div className="container text-center my-3">
                                <button className="btn btn-success container-fluid" onClick={calcularRutaHandler}>Calcular ruta</button>
                            </div>
                        </div>

                    </div>

                    {/* MAPA */}
                    <MapContainer
                        center={[19.4326, -99.1332]}
                        zoom={9}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                    >
                        {/* Ventana de carga de las rutas, (superpuesta sobre el mapcontainer)*/}
                        <div className="container-fluid pb-3"
                            style={
                                {
                                    zIndex: '999',
                                    display: `${(rutas_OyL) ? 'block' : 'none'}`,
                                    borderRadius: '0.6rem',
                                    position: 'relative',
                                    top: '1vh',
                                    justifySelf: 'flex-end',
                                    marginRight: '0px',
                                    maxWidth: 'fit-content',
                                    padding: '0px !important',
                                }}>
                            <button className="btn btn-warning"> ⬇️ Descargar indicaciones</button>


                        </div>


                        {/* Ventana de carga de las rutas, (superpuesta sobre el mapcontainer)*/}
                        <div className="container-fluid pb-3"
                            style={
                                {
                                    zIndex: 999999,
                                    backgroundColor: '#127ddb9d',
                                    width: '40%',
                                    height: '7vh',
                                    textAlign: 'center',
                                    padding: '0px',
                                    position: 'absolute',
                                    display: `${(loadingRutas) ? 'block' : 'none'}`,
                                    alignContent: 'center',
                                    placeSelf: 'anchor-center',
                                    borderRadius: '1rem',
                                }}>
                            <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#083b86ff', alignContent: 'center' }}>
                                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                                    <span className="visually-hidden">

                                    </span>
                                </div>
                                <h1 className="text-center font-weight-bold ml-4">Cargando</h1>
                            </div>

                        </div>


                        {/* Datos sobre las rutas */}
                        <div className="container-fluid row px-0 ml-2 text-center rounded-top pb-3"
                            style={
                                {
                                    zIndex: 999,
                                    left: '0px',
                                    backgroundColor: '#f0f8ff96',
                                    width: '50%',
                                    textAlign: 'center',
                                    bottom: '0px',
                                    position: 'absolute',
                                    display: `${(rutas_OyL && !loadingRutas) ? 'block' : 'none'}`
                                }}>
                            <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#5a5c69' }}>
                                <h6 className="text-center font-weight-bold">Selecciona la ruta </h6>
                            </div>

                            <div className='row container-fluid pr-0'>
                                <div className='col-md mr-1 p-0'
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => { getDetalleRuta('detalle_o') }}
                                >
                                    <RouteOption
                                        key={1}
                                        tipo={'Cuota'}
                                        distance={rutas_OyL?.optima?.distancia.toFixed(2)}
                                        time={parsearMinutos(rutas_OyL?.optima?.tiempo)}
                                        costs={{ label: 'Casetas', value: formatearDinero(rutas_OyL?.optima?.costoCasetas) }}
                                        advertencias={rutas_OyL?.optima?.advertencias}
                                        color={'blue'}
                                    />
                                </div>
                                <div className='col-md ml-1 p-0'
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => { getDetalleRuta('detalle_l') }}
                                >
                                    <RouteOption
                                        key={2}
                                        tipo={'Libre'}
                                        distance={rutas_OyL?.libre?.distancia.toFixed(2)}
                                        time={parsearMinutos(rutas_OyL?.libre?.tiempo)}
                                        costs={{ label: 'Casetas', value: (rutas_OyL?.libre?.costoCasetas) ? formatearDinero(rutas_OyL?.libre?.costoCasetas) : 'Sin costo' }}
                                        advertencias={(rutas_OyL?.libre?.advertencias)}
                                        color={'red'}
                                    />
                                </div>
                            </div>
                        </div>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors || IAVE-WEB ⭐🚌'
                        />
                        <Marker position={[19.782283538009626, -98.58592613126075]} icon={markerIconATM}>
                            <Popup>Base Sahagún</Popup>
                        </Marker>


                        {(origen?.geojson) && <Marker position={[(JSON.parse(origen?.geojson)).coordinates[1], (JSON.parse(origen?.geojson)).coordinates[0]]} icon={markerIconA}>
                            <Popup>Origen
                            </Popup>
                        </Marker>}

                        {(puntoIntermedio?.geojson) && <Marker position={[(JSON.parse(puntoIntermedio?.geojson)).coordinates[1], (JSON.parse(puntoIntermedio?.geojson)).coordinates[0]]} icon={markerIconPIN} >
                            <Popup> <span style={{ cursor: 'pointer', alignContent: 'center', textAlign: 'center' }} onClick={handlerRetirarIntermedio}>
                                <strong className='' >Punto intermedio</strong>
                                <br />
                                <small>Haz clic para retirarlo</small>
                            </span></Popup>
                        </Marker>}

                        {(destino?.geojson) && <Marker position={[(JSON.parse(destino?.geojson)).coordinates[1], (JSON.parse(destino?.geojson)).coordinates[0]]} icon={markerIconB}>
                            <Popup>Destino
                            </Popup>
                        </Marker>}


                        {/* POLILINEAS DE RUTAS */}
                        {rutas_OyL?.polilineaLibre && rutas_OyL?.polilineaLibre.map((arreglo, i) => {
                            return (<Polyline color='red' positions={arreglo} weight={3} opacity={0.4} key={'libre - ' + i}>
                                <Popup> Ruta Libre</Popup>
                            </Polyline>)
                        })}


                        {rutas_OyL?.polilineaOptima && rutas_OyL?.polilineaOptima.map((arreglo, i) => {
                            return (<Polyline color='blue' positions={arreglo} weight={3} opacity={0.4} key={'optima - ' + i}>
                                <Popup> Ruta Cuota</Popup>
                            </Polyline>)
                        })}

                        {/* Marcadores para las casetas dentro de la ruta seleccionada */}
                        {rutaSeleccionada[1] && rutaSeleccionada[1].map((item, index) => (

                            <Marker key={item?.id || item?.cve_caseta || index} position={[(JSON.parse(item?.geojson)).coordinates[1], (JSON.parse(item?.geojson)).coordinates[0]]} icon={markerIconCaseta}>
                                <Popup>{item?.direccion.replace('Cruce la caseta ', '')}
                                    <br /><strong style={{ color: 'green' }}> ${item?.costo_caseta.toFixed(2)}</strong>
                                </Popup>
                            </Marker>
                        ))}



                    </MapContainer>


                    {/* PANEL DE DETALLES */}
                    <div className="container-fluid  border border-dark mx-4 py-5"
                        style={
                            {
                                textAlign: 'center',
                                padding: '0px',
                                display: `${(loadingRutaSeleccionada) ? 'block' : 'none'}`,
                                alignContent: 'center',
                                placeSelf: 'anchor-center',
                                borderRadius: '15px',
                                height: '100%'

                            }}>
                        <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#083b86ff', alignContent: 'center', }}>
                            <div className="spinner-border text-primary" role="status" style={{ height: '3rem', width: '3rem' }}>
                                <span className="visually-hidden">

                                </span>
                            </div>
                            <h1 className="text-center font-weight-bold ml-4">Cargando</h1>
                        </div>

                    </div>


                    <div className="details-panel-RC py-0" style={{ display: `${(loadingRutaSeleccionada) ? 'none' : 'block'}` }}>

                        <div className="route-summary-RC pt-2">
                            <h3 className='pb-0 mb-0' style={{ marginBottom: '15px', color: '#2c3e50' }}>📊 Resumen de Ruta </h3>
                            <center className='pb-3 text-primary'><small><strong>{(rutaTusa[0]?.Categoria) ? 'Esta ruta YA existe en TUSA ' + rutaTusa[0]?.Categoria : ''}</strong></small></center>
                            <div className="form-group py-0" style={{ justifySelf: 'center', }}>
                                <label className='py-0 my-0 mr-2'>Tipo de traslado: </label>
                                <select className='form-select form-select-sm custom-select' name="selectTipoTraslado" id='selectTipoTraslado' style={{ width: 'auto', height: '2.5rem' }} disabled={(rutaTusa[0]?.Categoria)} value={rutaTusa[0]?.Categoria || ''} onChange={handleChange}>
                                    <option value=""  > Selecciona </option>
                                    <option value="Latinos"> Latinos </option>
                                    <option value="Nacionales"> Nacionales </option>
                                    <option value="Exportacion"> Exportación </option>
                                    <option value="Cemex" > Cemex </option>
                                    <option value="Otros" > Otros </option>

                                </select>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Distancia Total:</span>
                                <span className="summary-value-RC">{(rutaSeleccionada[0]?.distancia) ? rutaSeleccionada[0]?.distancia?.toFixed(2) + ' Km' : '-'}</span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Tiempo Estimado:</span>
                                <span className="summary-value-RC">{(rutaSeleccionada[0]?.tiempo) ? parsearMinutos(rutaSeleccionada[0]?.tiempo) : '-'}</span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Costo Estimado:</span>
                                <span className="summary-value-RC">{(rutaSeleccionada[0]?.costoCasetas) ? '$' + formatearDinero(rutaSeleccionada[0]?.costoCasetas) : '-'}</span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Estado:</span>
                                <span className="summary-value-RC">
                                    {/* Sobre este SPAN se verifica la situación actual de la ruta y se pinta el circulo junto al estatus de la ruta según corresponda (si la ruta ya está creada se pone de verde)*/}
                                    <span className={`status-indicator-RC ${(boolExiste.includes('Ruta calculada') || boolExiste.includes('Ruta existente')) ? 'status-active-RC' : 'status-pendiente-RC'}`}></span>
                                    <span style={{
                                        fontSize: `${(boolExiste?.length > 12) ? ' 0.8rem' : '1rem'}`
                                    }}>{boolExiste}</span>
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">ID origen:</span>
                                <span className="summary-value-RC">{(origen?.id_dest) ? origen?.id_dest + ' IdDestino:  ' + destino?.id_dest : ''}</span>
                            </div>
                            <div className="form-floating">
                                <textarea className="form-control" placeholder="Observaciones" id="floatingTextarea2" style={{ height: '3.3rem', fontSize: '0.8rem' }}></textarea>
                                <label htmlFor="floatingTextarea2">Observaciones:</label>
                            </div>
                        </div>

                        <div className="route-table-RC">
                            <div className="table-header-RC text-center py-0" style={{ fontSize: '1.2rem', lineHeight: '2.5rem' }}>
                                {(rutaSeleccionada[1]?.length ? rutaSeleccionada[1]?.length + ' ' : ' ')}Casetas en la ruta seleccionada:
                            </div>
                            <div className="table-container" style={{ maxHeight: '30vh' }}>
                                <table className="table table-bordered table-scroll table-sm table-hover align-middle">
                                    <thead className="table-hover">
                                        <tr className='text-center'>
                                            <th>Caseta</th>
                                            <th>Importes</th>
                                            <th>¿TAG?</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rutaSeleccionada[1] && rutaSeleccionada[1].map((item, index) => (
                                            <tr key={index} className='text-center'>
                                                <td>
                                                    <div className="d-flex" style={{ textAlign: 'left' }}>
                                                        {item?.direccion.replace('Cruce la caseta ', '')}
                                                    </div>
                                                </td>
                                                <td className='pr-0 pl-0'>
                                                    <div className="text-center">
                                                        ${item?.costo_caseta}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-center">
                                                        <button className="btn btn-sm btn-outline-success">
                                                            ✅
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <Buscador></Buscador>
            </div>
        </div >
    );
};

export default RutasModule;