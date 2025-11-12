import React, { useState, useEffect, useRef } from 'react';
import { parsearMinutos, formatearDinero, RouteOption } from '../components/shared/utils';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerATM from 'leaflet/dist/images/ATM__.png';
import markerA from 'leaflet/dist/images/A.png';
import markerCaseta from 'leaflet/dist/images/MapPinGreen.png';
import markerB from 'leaflet/dist/images/B.png';
import markerPin from 'leaflet/dist/images/pin_intermedio.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { set } from 'lodash';

const API_KEY = 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';

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

    // Estados, para el listado de los Origenes/Destinos/Puntos intermedios.
    const [origenes, setOrigenes] = useState([]);
    const [destinos, setDestinos] = useState([]);
    const [puntosIntermedios, setPuntosIntermedios] = useState([]);


    const [tipoVehiculo, setTipoVehiculo] = useState(5);


    const [puntoIntermedio, setPuntoIntermedio] = useState(null);
    const [origen, setOrigen] = useState([]);
    const [destino, setDestino] = useState([]);

    // Estados de carga
    const [loadingOrigen, setLoadingOrigen] = useState(false);
    const [loadingPuntoIntermedio, setLoadingPuntoIntermedio] = useState(false);
    const [loadingDestino, setLoadingDestino] = useState(false);
    const [loadingRutas, setLoadingRutas] = useState(false);

    // Estados adicionales
    const [rutas_OyL, setRutas_OyL] = useState(null); //Rutas Optima y Libre
    const [rutaSeleccionada, setRutaSeleccionada] = useState([]); //Ruta Seleccionada, después de presentar las opciones.
    const [boolExiste, setBoolExiste] = useState('Creando ruta');

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
    };



    // Función para obtener el detalle de la ruta libre
    async function getDetalleRuta(params) {
        const response = await (getRouteDetails(params)).then();
        alert("Si es este");
        response.data.filter(item => (item.costo_caseta != 0)).forEach(element => {
        });


        if (params == 'detalle_o') {
            const selectedRoute = [rutas_OyL?.optima, response.data.filter(item => (item.costo_caseta != 0))];
            setRutaSeleccionada(selectedRoute);
            alert('Retirar la ruta Libre')
        }
        if (params == 'detalle_l') {
            const selectedRoute = [rutas_OyL?.libre, response.data.filter(item => (item.costo_caseta != 0))];
            setRutaSeleccionada(selectedRoute);
            alert('Retirar la ruta de Cuota')
        }
        console.log(rutaSeleccionada);
    };

    // Handler testing
    function handlerRetirarIntermedio() {
        setPuntoIntermedio(null);

    };

    async function getRouteDetails(tipoDetalleOoL) {


        if (!origen?.id_dest || !destino?.id_dest) {
            alert('Por favor ingresa los IDs de origen y destino');
            return;
        }

        try {
            const formData = new URLSearchParams({
                dest_i: origen.id_dest,
                dest_f: destino.id_dest,
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

            return (data);

        } catch (error) {
            alert('Error: ' + error.message);
        }
    }



    async function calcularRutaHandler(e) {
        // Validate inputs
        if (!origen?.id_dest || !destino?.id_dest) {
            alert('Por favor selecciona un origen y destino válidos');
            return;
        }
        setLoadingRutas(true);
        try {
            const formData = new URLSearchParams({
                dest_i: origen.id_dest,
                dest_f: (puntoIntermedio) ? puntoIntermedio.id_dest : destino.id_dest,
                v: tipoVehiculo,
                e: '0',
                type: 'json',
                key: API_KEY
            });

            const fetchRouteData = async (tipoRutaOoL) => {
                const response = await fetch(`https://gaia.inegi.org.mx/sakbe_v3.1/${tipoRutaOoL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Error en la respuesta del servidor: ${response.status}`);
                }

                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error('Error al procesar la respuesta del servidor');
                }
            };

            const [rutaOptima, rutaLibre] = await Promise.all([
                fetchRouteData('optima'),
                fetchRouteData('libre')
            ]);

            let rutaOptimaData, rutaLibreData;

            // Función helper para procesar datos de ruta
            const processRouteData = (data) => ({
                distancia: data?.data?.long_km || 0,
                tiempo: data?.data?.tiempo_min || 0,
                costoCasetas: data?.data?.costo_caseta || 0,
                tienePeaje: data?.data?.peaje === 't',
                advertencias: data?.data?.advertencia || [],
                geometria: data?.data?.geometria || null,
                geojson: data?.data?.geojson || null
            });

            // Función para combinar dos rutas
            const combinarRutas = (ruta1, ruta2) => {
                return {
                    distancia: ruta1.distancia + ruta2.distancia,
                    tiempo: ruta1.tiempo + ruta2.tiempo,
                    costoCasetas: ruta1.costoCasetas + ruta2.costoCasetas,
                    tienePeaje: ruta1.tienePeaje || ruta2.tienePeaje,
                    advertencias: [...ruta1.advertencias, ...ruta2.advertencias],
                    geometria: ruta1.geometria && ruta2.geometria
                        ? ruta1.geometria + ruta2.geometria
                        : (ruta1.geometria || ruta2.geometria),
                    geojson: combinarGeoJSON(ruta1.geojson, ruta2.geojson)
                };
            };

            // Función para combinar GeoJSON
            const combinarGeoJSON = (geojson1, geojson2) => {
                if (!geojson1) return geojson2;
                if (!geojson2) return geojson1;

                // Si ambos son strings, los parseamos
                const geo1 = typeof geojson1 === 'string' ? JSON.parse(geojson1) : geojson1;
                const geo2 = typeof geojson2 === 'string' ? JSON.parse(geojson2) : geojson2;

                // Combinamos las coordenadas
                return {
                    ...geo1,
                    coordinates: [...geo1.coordinates, ...geo2.coordinates]
                };
            };

            if (puntoIntermedio) {
                const formData2 = new URLSearchParams({
                    dest_i: puntoIntermedio.id_dest,
                    dest_f: destino.id_dest,
                    v: tipoVehiculo,
                    e: '0',
                    type: 'json',
                    key: API_KEY
                });

                const fetchRouteData2 = async (tipoRutaOoL) => {
                    const response = await fetch(`https://gaia.inegi.org.mx/sakbe_v3.1/${tipoRutaOoL}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData2
                    });

                    if (!response.ok) {
                        throw new Error(`Error en la respuesta del servidor: ${response.status}`);
                    }

                    const text = await response.text();
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        throw new Error('Error al procesar la respuesta del servidor');
                    } finally {
                        setLoadingRutas(false);
                    }
                };

                const [rutaOptima2, rutaLibre2] = await Promise.all([
                    fetchRouteData2('optima'),
                    fetchRouteData2('libre')
                ]);

                // Procesar ambos segmentos
                const rutaOptima1Procesada = processRouteData(rutaOptima);
                const rutaOptima2Procesada = processRouteData(rutaOptima2);
                const rutaLibre1Procesada = processRouteData(rutaLibre);
                const rutaLibre2Procesada = processRouteData(rutaLibre2);

                // Combinar los dos segmentos
                rutaOptimaData = combinarRutas(rutaOptima1Procesada, rutaOptima2Procesada);
                rutaLibreData = combinarRutas(rutaLibre1Procesada, rutaLibre2Procesada);

            } else {
                rutaOptimaData = processRouteData(rutaOptima);
                rutaLibreData = processRouteData(rutaLibre);
            }


            setRutas_OyL({
                optima: rutaOptimaData,
                libre: rutaLibreData,
                polilineaOptima: convertirCoordenadasGeoJSON(
                    typeof rutaOptimaData.geojson === 'string'
                        ? rutaOptimaData.geojson
                        : JSON.stringify(rutaOptimaData.geojson)
                ),
                polilineaLibre: convertirCoordenadasGeoJSON(
                    typeof rutaLibreData.geojson === 'string'
                        ? rutaLibreData.geojson
                        : JSON.stringify(rutaLibreData.geojson)
                ),
            });
            setBoolExiste('Ruta calculada');

        } catch (error) {
            console.error('Error al calcular la ruta:', error);
            setBoolExiste('Error al calcular la ruta');
            alert(`Error: ${error.message}`);
        }
        finally {
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

                <div className="main-content-RC row">
                    {/* Sidebar donde se selecciona origen, destino y punto intermedio. */}
                    <div className="sidebar-RC col-3">
                        <div className="form-section-RC">
                            <h3>ℹ️ Información General</h3>



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
                                <select className='form-select form-select-sm custom-select' name="selectTipoVehiculo" onChange={handleChange} value={tipoVehiculo} id='selectTipoVehiculo' style={{ width: 'auto', height: '2.5rem' }}>
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
                                    <small>{JSON.stringify(origen?.nombre)?.replaceAll('"', '') || 'Selecciona un origen valido.'}</small>
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
                                    <small>{(JSON.stringify(destino?.nombre) || 'Selecciona un destino valido.').replaceAll('"', '')}</small>
                                </div>
                            </div>
                            <div className="container text-center my-3">
                                <button className="btn btn-success container-fluid" onClick={calcularRutaHandler}>Calcular ruta</button>
                            </div>
                        </div>

                    </div>

                    {/* MAPA */}
                    <div className="col-9 px-3">
                        <div className="row">
                            <div className="col-7">
                                <MapContainer center={[19.4326, -99.1332]} zoom={9} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} >
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
                                            <div className="spinner-border text-primary" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
                                                <span className="visually-hidden">

                                                </span>
                                            </div>
                                            <h2 className="text-center font-weight-bold ml-4">Cargando</h2>
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
                                                display: `${(rutas_OyL) ? 'block' : 'none'}`
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

                                        <Marker position={[(JSON.parse(item?.geojson)).coordinates[1], (JSON.parse(item?.geojson)).coordinates[0]]} icon={markerIconCaseta}>
                                            <Popup>{item?.direccion.replace('Cruce la caseta ', '')}
                                                <br /><strong style={{ color: 'green' }}> ${item?.costo_caseta.toFixed(2)}</strong>
                                            </Popup>
                                        </Marker>
                                    ))}



                                </MapContainer>
                            </div>
                            <div className="col-5">
                                {/* PANEL DE DETALLES */}
                                <div className="details-panel-RC py-0 pt-2 col">
                                    <div className="route-summary-RC">
                                        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>📊 Resumen de Ruta </h3>
                                        <div className="form-group py-0" style={{ justifySelf: 'center' }}>
                                            <label className='py-0 my-0 mr-2'>Tipo de traslado: </label>
                                            <select className='form-select form-select-sm custom-select' name="selectTipoTraslado" id='selectTipoTraslado' style={{ width: 'auto', height: '2.5rem' }}>
                                                <option value="latinos"> Latinos </option>
                                                <option value="nacionales"> Nacionales </option>
                                                <option value="exportacion"> Exportación </option>
                                                <option value="cemex"> Cemex </option>
                                                <option value="otros"> Otros </option>

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
                                                <span className={`status-indicator-RC ${(boolExiste === 'Ruta calculada') ? 'status-active-RC' : 'status-pendiente-RC'}`}></span>
                                                {boolExiste}
                                            </span>
                                        </div>
                                        <div className="summary-item-RC">
                                            <span className="summary-label-RC">ID origen:</span>
                                            <span className="summary-value-RC">{origen?.id_dest + ' IdDestino:  ' + destino?.id_dest}</span>
                                        </div>
                                        <div className="form-floating">
                                            <textarea className="form-control" placeholder="Observaciones" id="floatingTextarea2" style={{ height: '8.5vh', fontSize: '0.8rem' }}></textarea>
                                            <label htmlFor="floatingTextarea2">Observaciones:</label>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="route-table-RC col">
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
            </div>
        </div >
    );
};

export default RutasModule;