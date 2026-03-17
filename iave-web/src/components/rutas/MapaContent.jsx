import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Container } from 'react-bootstrap';
import { CustomToast, formatearEnteros } from '../shared/utils';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerATM from 'leaflet/dist/images/ATM__.png';
import markerTarget from 'leaflet/dist/images/target__.png';
import markerStartingPoint from 'leaflet/dist/images/starting-point__.png';
import markerIconTollB from 'leaflet/dist/images/LittleTollBoth.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const API_URL = process.env.REACT_APP_API_URL;

// Fix leaflet's default icon issue with webpack
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Memoizar los iconos para evitar recrearlos
const markerIconTollBs = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIconTollB,
    shadowUrl: markerShadow,
});

const markerIconATM = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerATM,
    shadowUrl: markerShadow,
});

const markerIconTarget = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerTarget,
    shadowUrl: markerShadow,
});

const markerIconStartingPoint = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerStartingPoint,
    shadowUrl: markerShadow,
});

// Componente optimizado con React.memo
const CasetasPoint = React.memo(({ infoCaseta }) => {
    if (!infoCaseta.latitud) return null;

    return (
        <Marker position={[infoCaseta.latitud, infoCaseta.longitud]} icon={markerIconTollBs}>
            <Popup>
                {infoCaseta.Nombre_IAVE}
                <br />
                {infoCaseta.IAVE ? '✅ TAG' : '❌ NO TAG'}
            </Popup>
        </Marker>
    );
});

const MapaContent = ({ rutaSeleccionada, origenDestino }) => {
    const [loading, setLoading] = useState(true);
    const [casetasEnRutaSeleccionada, setCasetasEnRutaSeleccionada] = useState([]);
    const [coordenadasOrigenDestino, setCoordenadasOrigenDestino] = useState(null);
    const [nombresOrigenDestino, setNombresOrigenDestino] = useState(null);

    const [error, setError] = useState(null);

    // Ref para cancelar requests
    const abortControllerRef = useRef(null);

    // Calcular polylines de forma memoizada (incluyendo origen y destino)
    const polylines = useMemo(() => {
        const casetasCoords = casetasEnRutaSeleccionada
            .filter(caseta => caseta.latitud && caseta.longitud)
            .map(caseta => [caseta.latitud, caseta.longitud]);

        const result = [];

        // Agregar origen al inicio si existe
        if (coordenadasOrigenDestino?.origen && Array.isArray(coordenadasOrigenDestino.origen[0])) {
            result.push(coordenadasOrigenDestino.origen[0]);
        }

        // Agregar coordenadas de casetas
        result.push(...casetasCoords);

        // Agregar destino al final si existe
        if (coordenadasOrigenDestino?.destino && Array.isArray(coordenadasOrigenDestino.destino[0])) {
            result.push(coordenadasOrigenDestino.destino[0]);
        }

        return result;
    }, [casetasEnRutaSeleccionada, coordenadasOrigenDestino]);

    // Verificar si hay origen/destino válidos
    const hasValidOrigen = useMemo(() => 
        coordenadasOrigenDestino?.origen && Array.isArray(coordenadasOrigenDestino.origen[0]),
        [coordenadasOrigenDestino]
    );

    const hasValidDestino = useMemo(() => 
        coordenadasOrigenDestino?.destino && Array.isArray(coordenadasOrigenDestino.destino[0]),
        [coordenadasOrigenDestino]
    );

    // Parsear origen y destino del string
    const [origenNombre, destinoNombre] = useMemo(() => {
        if (!origenDestino) return ['', ''];
        const parts = origenDestino.split('→');
        return [parts[0] || '', parts[1] || ''];
    }, [origenDestino]);

    useEffect(() => {
        // Cancelar requests anteriores
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Validación temprana
        if (!rutaSeleccionada || rutaSeleccionada === 0) {
            setLoading(true);
            setCasetasEnRutaSeleccionada([]);
            setCoordenadasOrigenDestino(null);
            setError(null);
            return;
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Ejecutar ambas llamadas en paralelo
                const [casetasRes, coordenadasRes, nombresOrigenDestino] = await Promise.all([
                    axios.get(`${API_URL}/api/casetas/rutas/${rutaSeleccionada}/casetasPorRuta`, { signal }),
                    axios.get(`${API_URL}/api/casetas/rutas/${rutaSeleccionada}/CoordenadasOrigenDestino`, { signal }),
                    axios.get(`${API_URL}/api/casetas/rutas/${rutaSeleccionada}/NombresOrigenDestino`, { signal })

                ]);

                setCasetasEnRutaSeleccionada(casetasRes.data || []);
                setCoordenadasOrigenDestino(coordenadasRes.data || null);
                setNombresOrigenDestino(nombresOrigenDestino.data || null);
            } catch (err) {
                // Ignorar errores de cancelación
                if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                    return;
                }

                console.error('Error al obtener datos de la ruta:', err);
                setError('Error al cargar la información de la ruta: ' + (err.response?.data?.message || err.message));
                setCasetasEnRutaSeleccionada([]);
                setCoordenadasOrigenDestino(null);
                setNombresOrigenDestino(null);

            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Cleanup: cancelar request al desmontar o cambiar rutaSeleccionada
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [rutaSeleccionada]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "15vh" }}>
                <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="wrapper card shadow">
            <div className="card-header py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between">
                <h6 className="m-0 font-weight-bold text-primary ml-3 text-center text-secondary" style={{ flex: 'auto' }}>
                    🚛 Casetas de la ruta: "
                    <span className='text-primary'>{ origenDestino || JSON.stringify(nombresOrigenDestino).replaceAll('-','→') || ''} </span>
                    <span className='text-success'>(Id_Tipo_Ruta: {rutaSeleccionada || ''})</span>
                    "
                </h6>
            </div>

            <div className="card-body p-0 container-fluid">
                <div className='row p-0 rounded'>
                    <div className="table-responsive table-container col-8" style={{ maxHeight: '75vh' }}>
                        <table className="table table-sm table-scroll table-bordered table-hover table-striped" id="dataTable" width="100%" cellSpacing="0">
                            <thead>
                                <tr className='text-center'>
                                    <th colSpan="5" className='text-center table-info'>Información de la Caseta</th>
                                    <th colSpan="6" className='text-center table-primary'>TARIFAS</th>
                                </tr>
                                <tr className='text-center'>
                                    <th className='table-primary'>Id</th>
                                    <th>Nombre</th>
                                    <th>Estado</th>
                                    <th>Latitud</th>
                                    <th>Longitud</th>
                                    <th>Auto</th>
                                    <th>Bus 2 Ej</th>
                                    <th>C 2 Ej</th>
                                    <th>C 3 Ejes</th>
                                    <th>C 5 Ejes</th>
                                    <th>C 9 Ejes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {casetasEnRutaSeleccionada.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="text-center table-warning text-danger font-weight-bolder">
                                            No hay casetas dentro de la ruta seleccionada.
                                        </td>
                                    </tr>
                                ) : (
                                    casetasEnRutaSeleccionada.map((caseta, index) => (
                                        <tr key={caseta.ID_Caseta || index} className='text-center'>
                                            <td className='text-right'>{caseta.ID_Caseta} <span style={{cursor:'help'}} title={caseta.IAVE ? 'SI Acepta el pago con TAG':'NO admite el pago con TAG'}>{caseta.IAVE ? '✅':'❌'}</span></td>
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="col-4 border border-info rounded m-0 p-0">
                        <MapContainer 
                            center={[19.4326, -99.1332]} 
                            zoom={9} 
                            scrollWheelZoom={true} 
                            style={{ height: '75vh', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors || IAVE-WEB ⭐🚌'
                            />
                            
                            {polylines.length > 0 && (
                                <Polyline color='red' positions={polylines}>
                                    <Popup>Ruta</Popup>
                                </Polyline>
                            )}

                            {casetasEnRutaSeleccionada.map((caseta, index) => (
                                <CasetasPoint infoCaseta={caseta} key={caseta.ID_Caseta || index} />
                            ))}

                            <Marker position={[19.782283538009626, -98.58592613126075]} icon={markerIconATM}>
                                <Popup>Base Sahagún</Popup>
                            </Marker>

                            {hasValidOrigen && (
                                <Marker position={coordenadasOrigenDestino.origen[0]} icon={markerIconStartingPoint}>
                                    <Popup>Origen</Popup>
                                </Marker>
                            )}

                            {hasValidDestino && (
                                <Marker position={coordenadasOrigenDestino.destino[0]} icon={markerIconTarget}>
                                    <Popup>Destino</Popup>
                                </Marker>
                            )}
                        </MapContainer>

                        <Container style={{ position: 'fixed', bottom: 20, right: '-30px', zIndex: 99999, maxWidth: 'max-content' }}>
                            <Container style={{ maxWidth: 'max-content' }}>
                                {!hasValidDestino && destinoNombre && (
                                    <CustomToast titulo={'⚠️ ATENCIÓN'} color={'text-warning'}  mostrar={true} mensaje={`¡No existen cargadas las coordenadas del DESTINO en sistema ("${destinoNombre.trim()}")!`} />
                                )}
                                {!hasValidOrigen && origenNombre && (
                                    <CustomToast titulo={'⚠️ ATENCIÓN'} color={'text-warning'} mostrar={true} mensaje={`¡No existen cargadas las coordenadas del ORIGEN en sistema ("${origenNombre.trim()}")!`} />
                                )}
                            </Container>
                        </Container>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapaContent;