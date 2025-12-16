import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ModalSelector, CustomToast, parsearMinutos, formatearDinero, RouteOption, formatearEnteros } from '../components/shared/utils';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerATM from 'leaflet/dist/images/ATM__.png';
import markerA from 'leaflet/dist/images/A.png';
import markerCaseta from 'leaflet/dist/images/MapPinGreen.png';
import markerB from 'leaflet/dist/images/B.png';
import markerPin from 'leaflet/dist/images/pin_intermedio.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Container } from 'react-bootstrap';

// ===== CONSTANTES =====
const API_KEY = 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';
const API_URL = process.env.REACT_APP_API_URL;
const DEBOUNCE_DELAY = 500;
const MIN_SEARCH_LENGTH = 3;

// Iconos de marcadores (fuera del componente para evitar recreación)
const markerIcons = {
    ATM: L.icon({
        iconUrl: markerATM,
        shadowUrl: markerShadow,
        iconSize: [25, 15],
        shadowSize: [64, 40],
    }),
    caseta: L.icon({
        iconUrl: markerCaseta,
        shadowUrl: markerShadow,
        iconSize: [24, 24],
        shadowSize: [40, 40],
    }),
    pin: L.icon({
        iconUrl: markerPin,
        shadowUrl: markerShadow,
        iconSize: [40, 40],
        shadowSize: [20, 30],
    }),
    A: L.icon({
        iconUrl: markerA,
        shadowUrl: markerShadow,
        iconSize: [24, 24],
        shadowSize: [40, 40],
    }),
    B: L.icon({
        iconUrl: markerB,
        shadowUrl: markerShadow,
        iconSize: [24, 24],
        shadowSize: [64, 40],
    }),
};

// ===== UTILIDADES =====
const normalizarNombre = (lugar) => {
    if (!lugar?.nombre) return '';
    const partes = lugar.nombre.split(',');
    const tmp = partes[0]?.trim() || lugar.nombre.trim();
    const sinAcentos = tmp.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return sinAcentos.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
};

const convertirCoordenadasGeoJSON = (geojsonString) => {
    const geojson = typeof geojsonString === 'string' ? JSON.parse(geojsonString) : geojsonString;
    
    if (geojson.type === 'MultiLineString') {
        return geojson.coordinates.map(lineString =>
            lineString.map(([lng, lat]) => [lat, lng])
        );
    } else if (geojson.type === 'LineString') {
        return [geojson.coordinates.map(([lng, lat]) => [lat, lng])];
    }
    return geojson;
};

// ===== CUSTOM HOOKS =====
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

const useDestinationSearch = (searchTerm, tipo) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, DEBOUNCE_DELAY);

    useEffect(() => {
        const searchDestinations = async () => {
            if (!debouncedSearch || debouncedSearch.length < MIN_SEARCH_LENGTH) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const formData = new URLSearchParams({
                    buscar: debouncedSearch,
                    type: 'json',
                    num: 10,
                    key: API_KEY
                });

                const response = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/buscadestino', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                const data = await response.json();
                setResults(data.data || []);
            } catch (error) {
                console.error(`Error al buscar ${tipo}:`, error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        searchDestinations();
    }, [debouncedSearch, tipo]);

    return { results, loading };
};

// ===== COMPONENTE PRINCIPAL =====
const RutasModule = () => {
    // Estados de búsqueda
    const [txtOrigen, setTxtOrigen] = useState('');
    const [txtPuntoIntermedio, setTxtPuntoIntermedio] = useState('');
    const [txtDestino, setTxtDestino] = useState('');
    const [tipoVehiculo, setTipoVehiculo] = useState(5);

    // Estados de selección
    const [origen, setOrigen] = useState(null);
    const [destino, setDestino] = useState(null);
    const [puntoIntermedio, setPuntoIntermedio] = useState(null);

    // Estados de rutas
    const [rutaTusa, setRutaTusa] = useState([]);
    const [casetasEnRutaTusa, setCasetasEnRutaTusa] = useState([]);
    const [rutas_OyL, setRutas_OyL] = useState(null);
    const [rutaSeleccionada, setRutaSeleccionada] = useState([]);
    const [rutaTusaSelected, setRutaTusaSelected] = useState(null);

    // Estados de UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingRutas, setLoadingRutas] = useState(false);
    const [loadingRutaSeleccionada, setLoadingRutaSeleccionada] = useState(false);
    const [boolExiste, setBoolExiste] = useState('Consultando ruta');

    // Custom hooks para búsqueda
    const { results: origenes, loading: loadingOrigen } = useDestinationSearch(txtOrigen, 'Origen');
    const { results: destinos, loading: loadingDestino } = useDestinationSearch(txtDestino, 'Destino');
    const { results: puntosIntermedios, loading: loadingPuntoIntermedio } = useDestinationSearch(txtPuntoIntermedio, 'Intermedio');

    // ===== HANDLERS MEMOIZADOS =====
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;

        switch (name) {
            case 'txtOrigen':
                setTxtOrigen(value);
                break;
            case 'txtDestino':
                setTxtDestino(value);
                break;
            case 'txtIntermedio':
                setTxtPuntoIntermedio(value);
                break;
            case 'selectTipoVehiculo':
                setTipoVehiculo(value);
                break;
            case 'SelectOrigen':
                setOrigen(origenes.find(item => item.nombre === value) || null);
                break;
            case 'SelectDestino':
                setDestino(destinos.find(item => item.nombre === value) || null);
                break;
            case 'SelectIntermedio':
                setPuntoIntermedio(puntosIntermedios.find(item => item.nombre === value) || null);
                break;
            default:
                break;
        }
    }, [origenes, destinos, puntosIntermedios]);

    const handlerRetirarIntermedio = useCallback(() => {
        setPuntoIntermedio(null);
        calcularRutaHandler('SinIntermedio');
    }, []);

    // ===== FUNCIONES DE API =====
    const getRouteDetails = useCallback(async (tipoDetalleOoL) => {
        if (!origen?.id_dest || !destino?.id_dest) {
            alert('Por favor ingresa los IDs de origen y destino');
            return;
        }

        try {
            setLoadingRutaSeleccionada(true);
            
            // Primera petición
            const formData1 = new URLSearchParams({
                dest_i: origen.id_dest,
                dest_f: puntoIntermedio ? puntoIntermedio.id_dest : destino.id_dest,
                v: tipoVehiculo,
                type: 'json',
                key: API_KEY
            });

            const response1 = await fetch(
                `https://gaia.inegi.org.mx/sakbe_v3.1/${tipoDetalleOoL}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData1
                }
            );

            const data1 = await response1.json();

            // Si hay punto intermedio, hacer segunda petición
            if (puntoIntermedio) {
                const formData2 = new URLSearchParams({
                    dest_i: puntoIntermedio.id_dest,
                    dest_f: destino.id_dest,
                    v: tipoVehiculo,
                    e: '0',
                    type: 'json',
                    key: API_KEY
                });

                const response2 = await fetch(
                    `https://gaia.inegi.org.mx/sakbe_v3.1/${tipoDetalleOoL}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData2
                    }
                );

                if (!response2.ok) {
                    throw new Error(`Error en la respuesta del servidor: ${response2.status}`);
                }

                const data2 = await response2.json();

                // Combinar datos
                if (Array.isArray(data1) && Array.isArray(data2)) {
                    return [...data1, ...data2];
                } else if (data1?.data && data2?.data && Array.isArray(data1.data) && Array.isArray(data2.data)) {
                    return { ...data1, data: [...data1.data, ...data2.data] };
                } else if (typeof data1 === 'object' && typeof data2 === 'object') {
                    return { ...data1, ...data2 };
                }
            }

            return data1;
        } catch (error) {
            console.error('Error al obtener detalles de ruta:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoadingRutaSeleccionada(false);
        }
    }, [origen, destino, puntoIntermedio, tipoVehiculo]);

    const getDetalleRuta = useCallback(async (params) => {
        const response = await getRouteDetails(params);

        if (params === 'detalle_o') {
            const selectedRoute = [
                rutas_OyL?.optima,
                response.data?.filter(item => item.costo_caseta != 0) || []
            ];
            setRutaSeleccionada(selectedRoute);
        }
        if (params === 'detalle_l') {
            const selectedRoute = [
                rutas_OyL?.libre,
                response.data?.filter(item => item.costo_caseta != 0) || []
            ];
            setRutaSeleccionada(selectedRoute);
        }
        setBoolExiste(prev => prev.replace(', selecciona una ruta', ''));
    }, [rutas_OyL, getRouteDetails]);

    const calcularRutaHandler = useCallback(async (e) => {
        if (!origen?.id_dest || !destino?.id_dest) {
            alert('Por favor selecciona un origen y destino válidos');
            return;
        }

        setLoadingRutas(true);
        setRutaSeleccionada([]);
        setRutas_OyL(null);

        try {
            const crearFormDataINEGI = (idOrigen, idDestino) => new URLSearchParams({
                dest_i: idOrigen,
                dest_f: idDestino,
                v: tipoVehiculo,
                e: '0',
                type: 'json',
                key: API_KEY
            });

            const procesarRuta = (data) => ({
                distancia: data?.data?.long_km || 0,
                tiempo: data?.data?.tiempo_min || 0,
                costoCasetas: data?.data?.costo_caseta || 0,
                tienePeaje: data?.data?.peaje === 't',
                advertencias: data?.data?.advertencia || [],
                geometria: data?.data?.geometria || null,
                geojson: data?.data?.geojson || null
            });

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

            // Fetch TUSA
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
                    throw new Error(`Error en servidor TUSA: ${response.status}`);
                }

                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return text;
                }
            };

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

                return response.json();
            };

            const hayIntermedio = puntoIntermedio && e !== 'SinIntermedio';
            const idDestFinal = hayIntermedio ? puntoIntermedio.id_dest : destino.id_dest;
            const formData1 = crearFormDataINEGI(origen.id_dest, idDestFinal);

            const promesas = [
                fetchRutaINEGI(formData1, 'optima'),
                fetchRutaINEGI(formData1, 'libre'),
                fetchRutaTUSA()
            ];

            if (hayIntermedio) {
                const formData2 = crearFormDataINEGI(puntoIntermedio.id_dest, destino.id_dest);
                promesas.push(
                    fetchRutaINEGI(formData2, 'optima'),
                    fetchRutaINEGI(formData2, 'libre')
                );
            }

            const [rutaOptima1, rutaLibre1, dataTusa, rutaOptima2, rutaLibre2] = await Promise.all(promesas);

            const rutaTUSAData = dataTusa?.data || dataTusa || [];
            const existeEnTUSA = Array.isArray(rutaTUSAData) ? rutaTUSAData.length > 0 : dataTusa?.enTUSA;

            setRutaTusa(rutaTUSAData);

            if (dataTusa.total === 1) {
                const casetasEnTUSA = await axios.get(
                    `${API_URL}/api/casetas/rutas/${rutaTUSAData[0]?.id_Tipo_ruta}/casetasPorRuta`
                );
                setCasetasEnRutaTusa(casetasEnTUSA.data);
            }
            
            if (dataTusa.total > 0) {
                setIsModalOpen(true);
            }

            if (!existeEnTUSA) {
                console.warn('⚠️ Ruta no encontrada en TUSA');
            }

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

            const stringifyGeoJSON = (geojson) => 
                typeof geojson === 'string' ? geojson : JSON.stringify(geojson);

            setRutas_OyL({
                optima: rutaOptimaFinal,
                libre: rutaLibreFinal,
                polilineaOptima: convertirCoordenadasGeoJSON(stringifyGeoJSON(rutaOptimaFinal.geojson)),
                polilineaLibre: convertirCoordenadasGeoJSON(stringifyGeoJSON(rutaLibreFinal.geojson))
            });

            const mensaje = dataTusa?.[0]?.Categoria ? 'Ruta existente' : 'Creando ruta';
            setBoolExiste(`${mensaje}, selecciona una ruta`);

        } catch (error) {
            console.error('Error al calcular la ruta:', error);
            setBoolExiste('Error al calcular la ruta');
            alert(`Error: ${error.message}`);
        } finally {
            setLoadingRutas(false);
        }
    }, [origen, destino, puntoIntermedio, tipoVehiculo]);

    // ===== VALORES MEMOIZADOS =====
    const origenCoords = useMemo(() => {
        if (!origen?.geojson) return null;
        const coords = JSON.parse(origen.geojson).coordinates;
        return [coords[1], coords[0]];
    }, [origen]);

    const destinoCoords = useMemo(() => {
        if (!destino?.geojson) return null;
        const coords = JSON.parse(destino.geojson).coordinates;
        return [coords[1], coords[0]];
    }, [destino]);

    const intermedioCoords = useMemo(() => {
        if (!puntoIntermedio?.geojson) return null;
        const coords = JSON.parse(puntoIntermedio.geojson).coordinates;
        return [coords[1], coords[0]];
    }, [puntoIntermedio]);

    return (
        <div className="container-fluid py-0">
            <div className="container-fluid py-0 rounded-top">
                <div className="header-RC py-2 rounded-top">
                    <h1>🚛 Creador de Rutas - Propuesta IAVE-WEB</h1>
                    <div className="header-actions-RC">
                        <button className="btn btn-success">💾 Guardar Ruta</button>
                    </div>
                </div>

                <div className="container-fluid py-1 border">
                    <div className="alert alert-info border-left-info my-2" role="alert">
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>Estado:</strong> {loadingRutas || loadingRutaSeleccionada ? 'Cargando rutas...' : boolExiste}
                    </div>

                    <div className="table-container py-0 my-2" style={{ maxHeight: '12rem' }}>
                        <table 
                            className='table table-bordered table-scroll table-sm table-hover align-middle mt-2' 
                            style={{ display: casetasEnRutaTusa?.length > 0 ? 'table' : 'none' }}
                        >
                            <thead>
                                <tr>
                                    <th>ID_Caseta</th>
                                    <th>Nombre</th>
                                    <th>Estado</th>
                                    <th>Latitud</th>
                                    <th>Longitud</th>
                                    <th>Auto</th>
                                    <th>Bus 2 Ejes</th>
                                    <th>C 2 Ejes</th>
                                    <th>C 3 Ejes</th>
                                    <th>C 5 Ejes</th>
                                    <th>C 9 Ejes</th>
                                    <th>Consecutivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {casetasEnRutaTusa?.map((caseta, index) => (
                                    <tr key={caseta.ID_Caseta || index} className='text-center'>
                                        <td className='text-right'>
                                            {caseta.ID_Caseta}{' '}
                                            <span 
                                                style={{ cursor: 'help' }} 
                                                title={caseta.IAVE ? 'SI Acepta el pago con TAG' : 'NO admite el pago con TAG'}
                                            >
                                                {caseta.IAVE ? '✅' : '❌'}
                                            </span>
                                        </td>
                                        <td>{caseta.Nombre}</td>
                                        <td>{caseta.Estado}</td>
                                        <td>{caseta.latitud}</td>
                                        <td>{caseta.longitud}</td>
                                        <td>$ {formatearEnteros(caseta.Automovil)}</td>
                                        <td>$ {formatearEnteros(caseta.Autobus2Ejes)}</td>
                                        <td>$ {formatearEnteros(caseta.Camion2Ejes)}</td>
                                        <td>$ {formatearEnteros(caseta.Camion3Ejes)}</td>
                                        <td>$ {formatearEnteros(caseta.Camion5Ejes)}</td>
                                        <td>$ {formatearEnteros(caseta.Camion9Ejes)}</td>
                                        <td style={{ placeItems: 'center' }}>
                                            <input 
                                                style={{ maxWidth: '3rem', textAlign: 'center' }} 
                                                className="form-control form-control-sm" 
                                                maxLength={2} 
                                                type="text" 
                                                name="txtCasetaConsecutivo" 
                                                id={`txtCasetaConsecutivo_${caseta.ID_Caseta}`} 
                                                defaultValue={caseta.consecutivo || ''} 
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="main-content-RC">
                    <div className="sidebar-RC px-3">
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
                                            {txtOrigen.length < MIN_SEARCH_LENGTH
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Origen (fuente INEGI)'}
                                        </option>
                                    )}
                                    {!loadingOrigen && origenes.length > 0 && (
                                        <>
                                            <option value="">Selecciona un origen</option>
                                            {origenes.map((item, index) => (
                                                <option key={index} value={item.nombre}>
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
                                            {txtDestino.length < MIN_SEARCH_LENGTH
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Destino (fuente INEGI)'}
                                        </option>
                                    )}
                                    {!loadingDestino && destinos.length > 0 && (
                                        <>
                                            <option value="">Selecciona un destino</option>
                                            {destinos.map((item, index) => (
                                                <option key={index} value={item.nombre}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="form-group py-0" style={{ justifySelf: 'center' }}>
                                <label className='py-0 my-0 mr-2'>Tipo de unidad:</label>
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
                                            {txtPuntoIntermedio.length < MIN_SEARCH_LENGTH
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Fuente oficial (INEGI)'}
                                        </option>
                                    )}
                                    {!loadingPuntoIntermedio && puntosIntermedios.length > 0 && (
                                        <>
                                            <option value="">Selecciona el punto intermedio</option>
                                            {puntosIntermedios.map((item, index) => (
                                                <option key={index} value={item.nombre}>
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
                                        fontWeight: rutaTusa[0]?.RazonOrigen ? 'bold' : 'normal',
                                        color: rutaTusa[0]?.RazonOrigen ? 'green' : 'black',
                                    }}>
                                        {rutaTusa[0]?.RazonOrigen || origen?.nombre || 'Selecciona un origen valido.'}
                                    </small>
                                </div>
                            </div>
                            <div className="route-point-RC py-1">
                                <div className="route-icon-RC waypoint-RC"></div>
                                <div>
                                    <strong>Punto Intermedio</strong><br />
                                    <small>
                                        {puntoIntermedio?.nombre || 'Selecciona un punto intermedio valido.'}
                                    </small>
                                </div>
                            </div>
                            <div className="route-point-RC destination-RC py-1">
                                <div className="route-icon-RC destination-RC"></div>
                                <div>
                                    <strong>Destino</strong><br />
                                    <small style={{
                                        fontWeight: rutaTusa[0]?.RazonDestino ? 'bold' : 'normal',
                                        color: rutaTusa[0]?.RazonDestino ? 'red' : 'black',
                                    }}>
                                        {rutaTusa[0]?.RazonDestino || destino?.nombre || 'Selecciona un destino valido.'}
                                    </small>
                                </div>
                            </div>
                            <div className="container text-center my-3">
                                <button className="btn btn-success container-fluid" onClick={calcularRutaHandler}>
                                    Calcular ruta
                                </button>
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
                        {/* Botón de descarga */}
                        <div className="container-fluid pb-3"
                            style={{
                                zIndex: 999,
                                display: rutas_OyL ? 'block' : 'none',
                                borderRadius: '0.6rem',
                                position: 'relative',
                                top: '1vh',
                                justifySelf: 'flex-end',
                                marginRight: '0px',
                                maxWidth: 'fit-content',
                                padding: '0px',
                            }}>
                            <button className="btn btn-warning">⬇️ Descargar indicaciones</button>
                        </div>

                        {/* Loading overlay */}
                        {loadingRutas && (
                            <div className="container-fluid pb-3"
                                style={{
                                    zIndex: 999999,
                                    backgroundColor: '#127ddb9d',
                                    width: '40%',
                                    height: '7vh',
                                    textAlign: 'center',
                                    padding: '0px',
                                    position: 'absolute',
                                    display: 'block',
                                    alignContent: 'center',
                                    placeSelf: 'anchor-center',
                                    borderRadius: '1rem',
                                }}>
                                <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#083b86ff', alignContent: 'center' }}>
                                    <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                                        <span className="visually-hidden"></span>
                                    </div>
                                    <h1 className="text-center font-weight-bold ml-4">Cargando</h1>
                                </div>
                            </div>
                        )}

                        {/* Selector de rutas */}
                        {rutas_OyL && !loadingRutas && (
                            <div className="container-fluid row px-0 ml-2 text-center rounded-top pb-3"
                                style={{
                                    zIndex: 999,
                                    left: '0px',
                                    backgroundColor: '#f0f8ff96',
                                    width: '50%',
                                    textAlign: 'center',
                                    bottom: '0px',
                                    position: 'absolute',
                                }}>
                                <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#5a5c69' }}>
                                    <h6 className="text-center font-weight-bold">Selecciona la ruta</h6>
                                </div>

                                <div className='row container-fluid pr-0'>
                                    <div className='col-md mr-1 p-0'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => getDetalleRuta('detalle_o')}
                                    >
                                        <RouteOption
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
                                        onClick={() => getDetalleRuta('detalle_l')}
                                    >
                                        <RouteOption
                                            tipo={'Libre'}
                                            distance={rutas_OyL?.libre?.distancia.toFixed(2)}
                                            time={parsearMinutos(rutas_OyL?.libre?.tiempo)}
                                            costs={{ 
                                                label: 'Casetas', 
                                                value: rutas_OyL?.libre?.costoCasetas 
                                                    ? formatearDinero(rutas_OyL?.libre?.costoCasetas) 
                                                    : 'Sin costo' 
                                            }}
                                            advertencias={rutas_OyL?.libre?.advertencias}
                                            color={'red'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors || IAVE-WEB ⭐🚌'
                        />

                        <Marker position={[19.782283538009626, -98.58592613126075]} icon={markerIcons.ATM}>
                            <Popup>Base Sahagún</Popup>
                        </Marker>

                        {origenCoords && (
                            <Marker position={origenCoords} icon={markerIcons.A}>
                                <Popup>Origen</Popup>
                            </Marker>
                        )}

                        {intermedioCoords && (
                            <Marker position={intermedioCoords} icon={markerIcons.pin}>
                                <Popup>
                                    <span style={{ cursor: 'pointer', alignContent: 'center', textAlign: 'center' }} onClick={handlerRetirarIntermedio}>
                                        <strong>Punto intermedio</strong>
                                        <br />
                                        <small>Haz clic para retirarlo</small>
                                    </span>
                                </Popup>
                            </Marker>
                        )}

                        {destinoCoords && (
                            <Marker position={destinoCoords} icon={markerIcons.B}>
                                <Popup>Destino</Popup>
                            </Marker>
                        )}

                        {/* Polylines */}
                        {rutaTusa?.polilinea && (
                            <Polyline color='green' positions={rutaTusa.polilinea} weight={4} opacity={0.4}>
                                <Popup>Ruta establecida en TUSA, de acuerdo a las casetas</Popup>
                            </Polyline>
                        )}

                        {rutas_OyL?.polilineaLibre?.map((arreglo, i) => (
                            <Polyline key={`libre-${i}`} color='red' positions={arreglo} weight={3} opacity={0.4}>
                                <Popup>Ruta Libre</Popup>
                            </Polyline>
                        ))}

                        {rutas_OyL?.polilineaOptima?.map((arreglo, i) => (
                            <Polyline key={`optima-${i}`} color='blue' positions={arreglo} weight={3} opacity={0.4}>
                                <Popup>Ruta Cuota</Popup>
                            </Polyline>
                        ))}

                        {rutaSeleccionada[0]?.map((item, index) => (
                            <Marker 
                                key={item?.id || item?.cve_caseta || index} 
                                position={[JSON.parse(item?.geojson).coordinates[1], JSON.parse(item?.geojson).coordinates[0]]} 
                                icon={markerIcons.caseta}
                            >
                                <Popup>
                                    {item?.direccion.replace('Cruce la caseta ', '')}
                                    <br />
                                    <strong style={{ color: 'green' }}>${item?.costo_caseta.toFixed(2)}</strong>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Panel de detalles */}
                    {loadingRutaSeleccionada && (
                        <div className="container-fluid border border-dark mx-4 py-5"
                            style={{
                                textAlign: 'center',
                                padding: '0px',
                                display: 'block',
                                alignContent: 'center',
                                placeSelf: 'anchor-center',
                                borderRadius: '15px',
                                height: '100%'
                            }}>
                            <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#083b86ff', alignContent: 'center' }}>
                                <div className="spinner-border text-primary" role="status" style={{ height: '3rem', width: '3rem' }}>
                                    <span className="visually-hidden"></span>
                                </div>
                                <h1 className="text-center font-weight-bold ml-4">Cargando</h1>
                            </div>
                        </div>
                    )}

                    <div className="details-panel-RC py-0" style={{ display: loadingRutaSeleccionada ? 'none' : 'block' }}>
                        <div className="route-summary-RC pt-2">
                            <h3 className='pb-0 mb-0' style={{ marginBottom: '15px', color: '#2c3e50' }}>📊 Resumen de Ruta</h3>
                            <center className='pb-3 text-primary'>
                                <small>
                                    <strong>
                                        {rutaTusa[0]?.Categoria 
                                            ? `Esta ruta YA existe en TUSA ${rutaTusa[0]?.Categoria}` 
                                            : ''}
                                    </strong>
                                </small>
                            </center>

                            <div className="form-group py-0" style={{ justifySelf: 'center' }}>
                                <label className='py-0 my-0 mr-2'>Tipo de traslado:</label>
                                <select 
                                    className='form-select form-select-sm custom-select' 
                                    name="selectTipoTraslado" 
                                    id='selectTipoTraslado' 
                                    style={{ width: 'auto', height: '2.5rem' }} 
                                    disabled={!!rutaTusa[0]?.Categoria} 
                                    value={rutaTusa[0]?.Categoria || ''} 
                                    onChange={handleChange}
                                >
                                    <option value="">Selecciona</option>
                                    <option value="Latinos">Latinos</option>
                                    <option value="Nacionales">Nacionales</option>
                                    <option value="Exportacion">Exportación</option>
                                    <option value="Cemex">Cemex</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>

                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Distancia Total:</span>
                                <span className="summary-value-RC">
                                    {rutaSeleccionada[0]?.distancia ? `${rutaSeleccionada[0].distancia.toFixed(2)} Km` : '-'}
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Tiempo Estimado:</span>
                                <span className="summary-value-RC">
                                    {rutaSeleccionada[0]?.tiempo ? parsearMinutos(rutaSeleccionada[0].tiempo) : '-'}
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Costo Estimado:</span>
                                <span className="summary-value-RC">
                                    {rutaSeleccionada[0]?.costoCasetas ? `$${formatearDinero(rutaSeleccionada[0].costoCasetas)}` : '-'}
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Estado:</span>
                                <span className="summary-value-RC">
                                    <span className={`status-indicator-RC ${
                                        (boolExiste.includes('Ruta calculada') || boolExiste.includes('Ruta existente')) 
                                            ? 'status-active-RC' 
                                            : 'status-pendiente-RC'
                                    }`}></span>
                                    <span style={{ fontSize: boolExiste?.length > 12 ? '0.8rem' : '1rem' }}>
                                        {boolExiste}
                                    </span>
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">ID origen:</span>
                                <span className="summary-value-RC">
                                    {origen?.id_dest ? `${origen.id_dest} IdDestino: ${destino?.id_dest}` : ''}
                                </span>
                            </div>
                            <div className="form-floating">
                                <textarea 
                                    className="form-control" 
                                    placeholder="Observaciones" 
                                    id="floatingTextarea2" 
                                    style={{ height: '3.3rem', fontSize: '0.8rem' }}
                                ></textarea>
                                <label htmlFor="floatingTextarea2">Observaciones:</label>
                            </div>
                        </div>

                        <div className="route-table-RC">
                            <div className="table-header-RC text-center py-0" style={{ fontSize: '1.2rem', lineHeight: '2.5rem' }}>
                                {rutaSeleccionada[1]?.length ? `${rutaSeleccionada[1].length} ` : ' '}Casetas en la ruta seleccionada:
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
                                        {rutaSeleccionada[1]?.map((item, index) => (
                                            <tr key={item?.id || item?.cve_caseta || index} className='text-center'>
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

            {/* MODAL PARA SELECCIONAR RUTA */}
            {isModalOpen && (
                <ModalSelector
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSelect={async (rutaSeleccionadaDelModal) => {
                        setRutaTusaSelected(rutaSeleccionadaDelModal);
                        console.log('✅ Ruta TUSA seleccionada:', rutaSeleccionadaDelModal);
                        
                        try {
                            const casetasResponse = await axios.get(
                                `${API_URL}/api/casetas/rutas/${rutaSeleccionadaDelModal}/casetasPorRuta`
                            );
                            setCasetasEnRutaTusa(casetasResponse.data);
                            console.log('✅ Casetas cargadas:', casetasResponse.data);
                            
                            setIsModalOpen(false);
                            setRutaTusa(rutaTusa.filter(ruta => ruta.id_Tipo_ruta === rutaSeleccionadaDelModal));
                        } catch (error) {
                            console.error('❌ Error al cargar casetas:', error);
                        }
                    }}
                    campo="Se han encontrado múltiples rutas en TUSA. Por favor selecciona la ruta que deseas validar"
                    valorCampo={''}
                    valoresSugeridos={rutaTusa}
                    tituloDelSelect='Rutas'
                    titulo={`Rutas TUSA encontradas (${rutaTusa.length})`}
                />
            )}

            {/* ESPACIO PARA NOTIFICACIONES */}
            <Container style={{ position: 'fixed', bottom: 20, right: '-30px', zIndex: 99999, maxWidth: 'max-content' }}>
                <Container style={{ maxWidth: 'max-content' }}>
                    {rutas_OyL && rutaSeleccionada && !loadingRutas && rutaTusa.length === 0 && (
                        <CustomToast 
                            color={'text-warning'} 
                            mensaje={'No existe una ruta creada con las poblaciones origen y destino seleccionadas'} 
                            tiempo={5000} 
                            titulo={'⚠️ Advertencia'} 
                            onClick={() => { alert('Advertencia') }} 
                            mostrar={1} 
                        />
                    )}
                    {rutas_OyL && rutaSeleccionada && !loadingRutas && rutaTusa.length === 1 && (
                        <CustomToast 
                            color={'text-success'} 
                            mensaje={'Ruta TUSA encontrada y vinculada'} 
                            tiempo={5000} 
                            titulo={'✅ Éxito'} 
                            onClick={() => { alert('Advertencia') }} 
                            mostrar={1} 
                        />
                    )}
                </Container>
            </Container>
        </div>
    );
};

export default RutasModule