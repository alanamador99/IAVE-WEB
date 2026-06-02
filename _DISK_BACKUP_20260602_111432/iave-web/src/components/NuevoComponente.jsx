import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet when using Webpack/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const TrackingModule = () => {
    // State
    const [matriculasText, setMatriculasText] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [escala, setEscala] = useState(8000); // Default scale
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // Lista de Operadores
    const [operadores, setOperadores] = useState([]);
    const [selectedOpDropdown, setSelectedOpDropdown] = useState("");

    // Map Modal State
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedOperator, setSelectedOperator] = useState(null);

    // API URL from environment or default
    const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.104:3001";

    useEffect(() => {
        // Cargar lista de operadores al montar el componente
        const fetchOperadores = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/tracking/operadores`);
                setOperadores(response.data);
            } catch (err) {
                console.error("Error cargando operadores:", err);
            }
        };
        fetchOperadores();
    }, [API_URL]);

    const handleSelectOperatorChange = (e) => {
        const matricula = e.target.value;
        if (matricula) {
            setMatriculasText(prev => prev ? `${prev}\n${matricula}` : `${matricula}`);
            // Resetear el select visualmente
            setSelectedOpDropdown("");
        }
    };

    const handleAddAllOperators = () => {
        if (operadores.length > 0) {
            const todasLasMatriculas = operadores.map(op => op.id).join('\n');
            setMatriculasText(prev => prev ? `${prev}\n${todasLasMatriculas}` : todasLasMatriculas);
        }
    };

    const handleOpenMap = (operator) => {
        if (operator && operator.latitud && operator.longitud) {
            setSelectedOperator(operator);
            setShowMapModal(true);
        } else {
            console.warn("Attempted to open map for operator without coordinates");
        }
    };

    const handleCloseMap = () => {
        setShowMapModal(false);
        // No limpiamos el operador seleccionado inmediatamente para evitar errores de desmontaje del mapa
        // setSelectedOperator(null); 
    };

    // Helpers
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        // Haversine formula
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371; // Radio de la tierra en km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distancia en km
        return d;
    }

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180)
    }

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedResults = React.useMemo(() => {
        let sortableItems = [...results];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Manejo especial para objetos anidados (ot_prev/ot_next)
                if (sortConfig.key === 'ot_prev' || sortConfig.key === 'ot_next') {
                    aValue = aValue ? aValue.id : '';
                    bValue = bValue ? bValue.id : '';
                }

                // Manejo especial para progreso (numérico)
                if (sortConfig.key === 'progress') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                }

                // Intentar ordenar numéricamente si es posible
                if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue)) && isFinite(aValue) && isFinite(bValue)) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                } else {
                    // Si son strings, minúsculas para case-insensitive
                    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [results, sortConfig]);

    const getSortIcon = (name) => {
        if (sortConfig.key !== name) {
            return <i className="fas fa-sort text-muted ml-1" style={{ opacity: 0.5 }}></i>;
        }
        if (sortConfig.direction === 'ascending') {
            return <i className="fas fa-sort-up text-primary ml-1"></i>;
        }
        return <i className="fas fa-sort-down text-primary ml-1"></i>;
    };

    const handleTrack = async () => {
        setLoading(true);
        setError(null);
        setResults([]);

        // Limpiar entrada: dividir por saltos de línea y eliminar vacíos
        const matriculas = matriculasText.split(/\r?\n/).map(m => m.trim()).filter(m => m);

        if (matriculas.length === 0) {
            setError("Por favor, ingresa al menos una matrícula.");
            setLoading(false);
            return;
        }

        try {
            // 1. Obtener estatus inicial desde API propia
            const response = await axios.post(`${API_URL}/api/tracking/status`, { matriculas });
            let trackingData = response.data;

            // 2. Enriquecer con municipio y cálculo de progreso
            // Se hace en paralelo con Promise.all() para mejorar rendimiento
            const enrichedData = await Promise.all(trackingData.map(async (item) => {
                // Priorizar la ubicación detallada que viene del backend (OpenCage)
                let municipio = item.ubicacion_detallada && item.ubicacion_detallada !== "Ubicación no disponible"
                    ? item.ubicacion_detallada
                    : "Buscando ubicación...";

                let progress = 0;
                let distTotal = 0;
                let distRecorrida = 0;
                let distanceCalculated = false;

                // Si hay coordenadas GPS
                if (item.latitud && item.longitud) {

                    // Solo consultar INEGI si NO tenemos ubicación detallada de OpenCage
                    if (municipio === "Buscando ubicación..." || municipio === "Ubicación no disponible") {
                        try {
                            const muniRes = await axios.get(`${API_URL}/api/tracking/municipality`, {
                                params: {
                                    lat: item.latitud,
                                    lon: item.longitud,
                                    escala: escala // Sending current scale from slider
                                }
                            });

                            const inegiData = muniRes.data;
                            if (inegiData && inegiData.data && inegiData.data.length > 0) {
                                const lugar = inegiData.data[0];
                                municipio = `${lugar.nombre_geografico}, ${lugar.entidad_federativa}`;
                            } else if (inegiData.data && inegiData.data.nombre) {
                                municipio = inegiData.data.nombre;
                            } else {
                                // Fallback final
                                municipio = "Ubicación desconocida";
                                console.log(`Respuesta inesperada de INEGI para ${item.matricula}:`, inegiData);
                            }
                        } catch (e) {
                            console.error(`Error obteniendo municipio para ${item.matricula}`, e);
                            municipio = "Error de Red (INEGI)";
                        }
                    }

                    // Calcular Progreso si hay ruta definida (coords origen/destino)
                    if (item.lat_origen && item.lon_origen && item.lat_destino && item.lon_destino) {
                        distTotal = calculateDistance(item.lat_origen, item.lon_origen, item.lat_destino, item.lon_destino);

                        // Distancia restante al destino (lineal)
                        const distRestante = calculateDistance(item.latitud, item.longitud, item.lat_destino, item.lon_destino);

                        // Progreso lineal: (Total - Restante) / Total
                        if (distTotal > 0) {
                            progress = ((distTotal - distRestante) / distTotal) * 100;
                        }

                        // Ajustes visuales (clip)
                        if (progress < 0) progress = 0;
                        if (progress > 100) progress = 100;

                        // Calculamos distancia recorrida "estimada"
                        distRecorrida = distTotal - distRestante;
                        if (distRecorrida < 0) distRecorrida = 0;
                    }
                } else {
                    municipio = "Sin señal GPS";
                }

                return {
                    ...item,
                    municipio,
                    progress: progress.toFixed(1),
                    distTotal: distTotal ? distTotal.toFixed(1) : 0,
                    distRecorrida: distRecorrida ? distRecorrida.toFixed(1) : 0
                };
            }));

            // Actualizamos el estado con los datos enriquecidos
            setResults(enrichedData);

        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al consultar el servicio de rastreo. Verifica tu conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <h1 className="h3 mb-4 text-gray-800">Función para rastreo de Operadores <b>(Auxiliar)</b></h1>

            <div className="row">
                {/* Panel de Entrada */}
                <div className="col-xl-4 col-lg-5">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 className="m-0 font-weight-bold text-primary">Búsqueda de Unidades</h6>
                        </div>
                        <div className="card-body">
                            <form onSubmit={(e) => { e.preventDefault(); handleTrack(); }}>
                                <div className="form-group">
                                    <label style={{ 'fontSize': '.875rem', }}>Selecciona el operador de la siguiente lista (para agregarlo en la consulta):</label>
                                    <select
                                        className="form-control mb-3"
                                        value={selectedOpDropdown}
                                        onChange={handleSelectOperatorChange}
                                    >
                                        <option value="">-- Selecciona un operador --</option>
                                        {operadores.map(op => (
                                            <option key={op.id} value={op.id}>
                                                {op.nombre} ({op.id})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="d-flex justify-content-end mb-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm mb-3"
                                            onClick={handleAddAllOperators}
                                        >
                                            Agregar todas las matrículas ({operadores.length})
                                        </button>


                                    </div>
                                    <label htmlFor="matriculasInput">Ingrese Matrículas (una por línea):</label>
                                    <textarea
                                        className="form-control"
                                        id="matriculasInput"
                                        rows="10"
                                        placeholder="Ejemplo:&#10;2333&#10;1818&#10;2358"
                                        value={matriculasText}
                                        onChange={(e) => setMatriculasText(e.target.value)}
                                        style={{ fontFamily: 'monospace' }}
                                    ></textarea>
                                    <small className="form-text text-muted">Coloca las matrículas de los operadores.</small>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span><i className="fas fa-spinner fa-spin"></i> Consultando...</span>
                                    ) : (
                                        <span><i className="fas fa-search-location"></i> Rastrear Unidades</span>
                                    )}
                                </button>
                            </form>

                            {error && (
                                <div className="alert alert-danger mt-3" role="alert">
                                    <i className="fas fa-exclamation-circle"></i> {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel de Resultados */}
                <div className="col-xl-8 col-lg-7">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 font-weight-bold text-primary">Resultados del Rastreo</h6>
                        </div>
                        <div className="card-body">
                            {results.length > 0 ? (
                                <div className="table-responsive table-container table-scroll">
                                    <table className="table table-bordered table-striped" width="100%" cellSpacing="0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th onClick={() => requestSort('matricula')} style={{ cursor: 'pointer' }}>
                                                    Operador {getSortIcon('matricula')}
                                                </th>
                                                <th onClick={() => requestSort('ot')} style={{ cursor: 'pointer' }}>
                                                    Ruta / OT {getSortIcon('ot')}
                                                </th>
                                                <th onClick={() => requestSort('municipio')} style={{ cursor: 'pointer' }}>
                                                    Ubicación Actual {getSortIcon('municipio')}
                                                </th>
                                                <th onClick={() => requestSort('progress')} style={{ cursor: 'pointer' }}>
                                                    Progreso Estimado {getSortIcon('progress')}
                                                </th>
                                                <th onClick={() => requestSort('ot_prev')} style={{ cursor: 'pointer' }}>
                                                    Último traslado realizado {getSortIcon('ot_prev')}
                                                </th>
                                                <th onClick={() => requestSort('ot_next')} style={{ cursor: 'pointer' }}>
                                                    Traslado programado {getSortIcon('ot_next')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedResults.map((item, index) => (
                                                <tr key={item.matricula || index}>
                                                    <td className="align-middle">
                                                        {item.latitud && item.longitud ? (
                                                            <>
                                                                <div className="font-weight-bold text-primary">
                                                                    <i className="fas fa-map-marker-alt mr-1"></i>
                                                                    {item.matricula}
                                                                </div>
                                                                <div className="small text-gray-600">{item.nombre}</div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="font-weight-bold text-secondary">{item.matricula}</div>
                                                                <div className="small text-gray-600">{item.nombre}</div>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="align-middle">
                                                        {item.ot && item.ot !== "Sin Asignar" ? (
                                                            <>
                                                                <span className="badge badge-primary mb-1">OT: {item.ot}</span>
                                                                <div className="small">
                                                                    <strong>{item.origen}</strong> <i className="fas fa-arrow-right text-gray-400 mx-1"></i> <strong>{item.destino}</strong>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span className="badge badge-secondary">Sin Asignación</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.latitud ? (
                                                            <button
                                                                className="btn btn-link p-0 text-left text-decoration-none"
                                                                onClick={() => handleOpenMap(item)}
                                                                title="Ver en mapa"
                                                            >
                                                                <div className="text-dark font-weight-bold">
                                                                    <i className="fas fa-map-marker-alt text-danger mr-1"></i>
                                                                    {item.municipio}
                                                                </div>
                                                                <div className="small text-muted" title={item.fecha_gps}>
                                                                    {item.fecha_gps ? new Date(item.fecha_gps).toLocaleString('es-MX') : ''}
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <div className="text-warning small">
                                                                <i className="fas fa-exclamation-triangle"></i> Sin señal GPS
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ minWidth: '150px' }}>
                                                        {item.latitud && item.distTotal > 0 ? (
                                                            <div>
                                                                <div className="progress mb-1" style={{ height: '20px' }}>
                                                                    <div
                                                                        className={`progress-bar ${item.progress >= 95 ? 'bg-success' : 'bg-info'} progress-bar-striped progress-bar-animated`}
                                                                        role="progressbar"
                                                                        style={{ width: `${item.progress}%` }}
                                                                        aria-valuenow={item.progress}
                                                                        aria-valuemin="0"
                                                                        aria-valuemax="100"
                                                                    >
                                                                        {item.progress}%
                                                                    </div>
                                                                </div>
                                                                <div className="small text-muted d-flex justify-content-between">
                                                                    <span>{item.distRecorrida} km</span>
                                                                    <span>{item.distTotal} km</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="small text-muted font-italic text-center">
                                                                N/A
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="align-middle border-left">
                                                        {item.ot_prev ? (
                                                            <>
                                                                <span className="badge badge-secondary mb-1">OT: {item.ot_prev.id}</span>
                                                                <div className="small text-muted">
                                                                    {item.ot_prev.origen} <i className="fas fa-arrow-right mx-1"></i> {item.ot_prev.destino}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span className="small text-muted font-italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="align-middle">
                                                        {item.ot_next ? (
                                                            <>
                                                                <span className="badge badge-info mb-1">OT: {item.ot_next.id}</span>
                                                                <div className="small text-primary">
                                                                    {item.ot_next.origen} <i className="fas fa-arrow-right mx-1"></i> {item.ot_next.destino}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span className="small text-muted font-italic">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <div className="mb-3">
                                        <span className="fa-stack fa-2x">
                                            <i className="fas fa-circle fa-stack-2x text-gray-200"></i>
                                            <i className="fas fa-truck fa-stack-1x text-gray-500"></i>
                                        </span>
                                    </div>
                                    <p className="text-gray-500 mb-0">Ingrese matrículas para ver su ubicación y estatus.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Mapa */}
            <Modal show={showMapModal} onHide={handleCloseMap} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-satellite-dish mr-2"></i>
                        Ubicación: {selectedOperator?.matricula}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: '500px' }}>
                    {showMapModal && selectedOperator && selectedOperator.latitud && selectedOperator.longitud && (
                        <MapContainer
                            key={selectedOperator.matricula}
                            center={[parseFloat(selectedOperator.latitud), parseFloat(selectedOperator.longitud)]}
                            zoom={9}
                            style={{ height: '450px', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[parseFloat(selectedOperator.latitud), parseFloat(selectedOperator.longitud)]}>
                                <Popup>
                                    <div>
                                        <strong>{selectedOperator.matricula}</strong> <br />
                                        {selectedOperator.nombre} <br />
                                        <hr className="my-1" />
                                        {selectedOperator.municipio} <br />
                                        <small className="text-muted">{selectedOperator.fecha_gps ? new Date(selectedOperator.fecha_gps).toLocaleString('es-MX') : ''}</small>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    )}
                    {(!selectedOperator || !selectedOperator.latitud) && (
                        <div className="text-center py-5">
                            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                            <p>No hay coordenadas disponibles para este operador.</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="mr-auto text-muted small">
                        {selectedOperator?.municipio}
                    </div>
                    <Button variant="secondary" onClick={handleCloseMap}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default TrackingModule;