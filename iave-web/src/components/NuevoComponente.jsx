import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { Rnd } from 'react-rnd';
import EditRutaPanel from './shared/EditRutaPanel';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet when using Webpack/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const claveToImporteField = {
    'A': 'Automovil',
    'B': 'Autobus2Ejes',
    'C-2': 'Camion2Ejes',
    'C-3': 'Camion3Ejes',
    'C-4': 'Camion3Ejes',
    'C-5': 'Camion5Ejes',
    'C-9': 'Camion9Ejes'
};

const TrackingModule = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

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
    const [openMapWindows, setOpenMapWindows] = useState([]);
    const [selectedRouteFilter, setSelectedRouteFilter] = useState(null);

    // Directory Detail Modal State
    const [showDirModal, setShowDirModal] = useState(false);
    const [selectedDirEntry, setSelectedDirEntry] = useState(null);

    // Casetas Modal State
    const [showCasetasModal, setShowCasetasModal] = useState(false);
    const [casetasData, setCasetasData] = useState({ expected: [], crossed: [], tagCruces: [], loading: false, ot: '', id_tipo_ruta: '', id_clave: '', id_usuario: '', tag: '', error: '' });
    const [manualLinks, setManualLinks] = useState({});
    const [savingLinks, setSavingLinks] = useState(false);

    // TAG Cruces Modal State
    const [showTagModal, setShowTagModal] = useState(false);
    const [tagModalData, setTagModalData] = useState({ tag: '', cruces: [], loading: false, error: '' });
    const [tagOTInputs, setTagOTInputs] = useState({});   // { [cruceId]: string } — valor del input de OT por cruce
    const [tagSavingOT, setTagSavingOT] = useState(new Set()); // IDs de cruces en proceso de guardado

    // Edit Ruta Panel State
    const [showEditRutaPanel, setShowEditRutaPanel] = useState(false);

    // Table Filters State
    const [tableFilters, setTableFilters] = useState({ matricula: '', ot: '', municipio: '', progreso: '', estadoPersonal: '', ot_prev: '', ot_next: '' });

    // API URL from environment or default
    const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.252:3001";

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

        // Si la URL contiene ?ot=, abrir el modal de casetas para esa OT
        const otFromUrl = new URLSearchParams(window.location.search).get('ot');
        if (otFromUrl) {
            handleOpenCasetasByOT(otFromUrl);
        }

        // Si la URL contiene ?matriculas=, pre-cargar el textarea y lanzar rastreo
        const matriculasFromUrl = new URLSearchParams(window.location.search).get('matriculas');
        if (matriculasFromUrl) {
            const texto = matriculasFromUrl.split(',').join('\n');
            setMatriculasText(texto);
            // Lanzar búsqueda con las matrículas de la URL después de establecer el estado
            setTimeout(() => handleTrackWithMatriculas(matriculasFromUrl.split(',').map(m => m.trim()).filter(Boolean)), 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL]);

    const handleSelectOperatorChange = (e) => {
        const matricula = e.target.value;
        if (matricula) {
            setMatriculasText(prev => prev ? `${prev}\n${matricula}` : `${matricula}`);
            // Resetear el select visualmente
            setSelectedOpDropdown("");
        }
    };

    const handleFilterGPSInactive = () => {
        const gpsInactivos = results.filter(r => !r.latitud || !r.longitud);
        if (gpsInactivos.length === 0) {
            alert("No hay unidades con GPS inactivo.");
            return;
        }
        const gpsInactivosIds = gpsInactivos.map(r => r.id).join('\n');
        alert(`Unidades con GPS inactivo:\n${gpsInactivosIds}`);
    };



    const handleAddAllOperators = () => {
        if (operadores.length > 0) {
            const todasLasMatriculas = operadores.map(op => op.id).join('\n');
            setMatriculasText(prev => prev ? `${prev}\n${todasLasMatriculas}` : todasLasMatriculas);
        }
    };

    const handleOpenDirModal = (detalle, tipo) => {
        setSelectedDirEntry({ ...detalle, tipo });
        setShowDirModal(true);
    };

    const handleOpenTagModal = async (tag) => {
        setShowTagModal(true);
        setTagModalData({ tag, cruces: [], loading: true, error: '' });
        try {
            const res = await axios.get(`${API_URL}/api/cruces/tag/${tag}?dias=90`);
            setTagModalData({ tag, cruces: res.data || [], loading: false, error: '' });
        } catch (err) {
            setTagModalData({ tag, cruces: [], loading: false, error: 'Error al cargar los registros del TAG' });
        }
    };

    const handleOpenCasetasByOT = async (otId) => {
        if (!otId) return;
        setShowCasetasModal(true);
        setCasetasData({ expected: [], crossed: [], loading: true, ot: otId, id_tipo_ruta: '', id_clave: '', id_usuario: '', tag: '', error: '', otDetails: null });
        try {
            const resOT = await axios.get(`${API_URL}/api/tracking/ot/${otId}`);
            const { info } = resOT.data;
            if (!info) {
                setCasetasData(prev => ({ ...prev, loading: false, error: `La OT "${otId}" no fue encontrada.` }));
                return;
            }
            if (!info.Id_tipo_ruta) {
                setCasetasData(prev => ({ ...prev, loading: false, error: `La OT "${otId}" no tiene una ruta asignada.` }));
                return;
            }
            handleOpenCasetas(otId, info.Id_tipo_ruta, null, info.ID_Clave || null, info.ID_usuario || null);
        } catch (err) {
            const msg = err.response?.status === 404
                ? `La OT "${otId}" no fue encontrada.`
                : 'Error al buscar la OT en el servidor.';
            setCasetasData(prev => ({ ...prev, loading: false, error: msg }));
        }
    };

    const handleOpenCasetas = async (otId, id_tipo_ruta, tag, id_clave, id_usuario) => {
        if (!otId || otId === 'Sin Asignar' || !id_tipo_ruta) return;
        setShowCasetasModal(true);
        setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('ot', otId); return next; });
        setCasetasData({ expected: [], crossed: [], loading: true, ot: otId, id_tipo_ruta: id_tipo_ruta, id_clave: id_clave, id_usuario: id_usuario, tag: tag, error: '', otDetails: null });

        try {
            // 1. Primero obtener detalles de la OT para conocer el rango de fechas
            let otDetails = null;
            try {
                const resTracking = await axios.get(`${API_URL}/api/tracking/ot/${otId}`);
                otDetails = resTracking.data;
            } catch (err) {
                console.error('Error fetching OT tracking details:', err);
            }

            // 2. Construir parámetros de fecha para filtrar cruces dentro del rango de la OT
            const fechaInicio = otDetails?.info?.iniciada;
            const fechaFin = otDetails?.info?.en_sitio || otDetails?.info?.finalizada;
            const crucesParams = new URLSearchParams();
            if (fechaInicio) crucesParams.append('fechaInicio', fechaInicio);
            if (fechaFin) crucesParams.append('fechaFin', fechaFin);
            const crucesUrl = `${API_URL}/api/cruces/ot/${otId}${crucesParams.toString() ? '?' + crucesParams.toString() : ''}`;

            // 3. Obtener casetas y cruces (ya filtrados por fecha) en paralelo
            const [resCasetas, resCruces] = await Promise.all([
                axios.get(`${API_URL}/api/casetas/rutas/${id_tipo_ruta}/casetasPorRuta`),
                axios.get(crucesUrl)
            ]);

            setCasetasData({
                expected: resCasetas.data || [],
                crossed: resCruces.data || [],
                tagCruces: [],
                otDetails,
                loading: false,
                ot: otId,
                id_tipo_ruta: id_tipo_ruta,
                id_clave: id_clave,
                id_usuario: id_usuario,
                tag: tag,
                error: ''
            });

            // 4. Si hay un TAG disponible, obtener sus cruces con ventana extendida
            //    para detectar cruces fuera del rango de la OT (ej: operador cerró antes de tiempo)
            const resolvedTag = tag || resCruces.data?.find(c => c.Tag)?.Tag;
            if (resolvedTag) {
                try {
                    const tagRes = await axios.get(`${API_URL}/api/cruces/tag/${resolvedTag}?dias=20`);
                    setCasetasData(prev => ({ ...prev, tagCruces: tagRes.data || [] }));
                } catch (e) {
                    console.warn('No se pudo cargar cruces del TAG para ventana extendida:', e);
                }
            }
        } catch (error) {
            console.error('Error fetching casetas/cruces:', error);
            setCasetasData(prev => ({ ...prev, loading: false, error: 'Error al cargar los datos de casetas' }));
        }
    };

    const handleOpenEditRuta = () => {
        setShowEditRutaPanel(true);
    };

    const handleOpenMap = (operator) => {
        if (operator && operator.latitud && operator.longitud) {
            setOpenMapWindows(prev => {
                // If this window is already open, move it to the top (end of the array)
                const isAlreadyOpen = prev.some(op => op.matricula === operator.matricula);
                if (isAlreadyOpen) {
                    const filtered = prev.filter(op => op.matricula !== operator.matricula);
                    return [...filtered, prev.find(op => op.matricula === operator.matricula)];
                }
                return [...prev, operator];
            });
        } else {
            console.warn("Attempted to open map for operator without coordinates");
        }
    };

    const handleCloseMap = (matricula) => {
        setOpenMapWindows(prev => prev.filter(op => op.matricula !== matricula));
    };

    // Using openMapWindowsRef to safely read current state inside the setInterval closure without passing full dependency array
    const openMapWindowsRef = useRef([]);
    useEffect(() => { openMapWindowsRef.current = openMapWindows; }, [openMapWindows]);

    // Auto-refresh coordinates for the selected operators in the Map Modals
    useEffect(() => {
        let intervalId;

        if (openMapWindows.length > 0) {
            // Fetch updated location
            const fetchLatestLocation = async () => {
                try {
                    const currentWindows = openMapWindowsRef.current;
                    const matriculasToUpdate = currentWindows.map(op => op.matricula);
                    if (matriculasToUpdate.length === 0) return;

                    const response = await axios.post(`${API_URL}/api/tracking/status`, { matriculas: matriculasToUpdate });
                    const data = response.data;

                    if (data && data.length > 0) {
                        // Update openMapWindows state to reflect on the maps
                        setOpenMapWindows(prevWindows => {
                            let changed = false;
                            const newWindows = prevWindows.map(prev => {
                                const item = data.find(d => d.matricula === prev.matricula);
                                if (!item) return prev;

                                if (prev.latitud === item.latitud && prev.longitud === item.longitud && prev.fecha_gps === item.fecha_gps) {
                                    return prev;
                                }

                                changed = true;
                                return {
                                    ...prev,
                                    latitud: item.latitud || prev.latitud,
                                    longitud: item.longitud || prev.longitud,
                                    fecha_gps: item.fecha_gps || prev.fecha_gps,
                                    municipio: item.ubicacion_detallada && item.ubicacion_detallada !== "Ubicación no disponible"
                                        ? item.ubicacion_detallada
                                        : prev.municipio
                                };
                            });

                            return changed ? newWindows : prevWindows;
                        });

                        // Update the results table so the distance and time reflect the latest
                        setResults(prevResults => prevResults.map(r => {
                            const item = data.find(d => d.matricula === r.matricula);
                            return item ? {
                                ...r,
                                latitud: item.latitud || r.latitud,
                                longitud: item.longitud || r.longitud,
                                fecha_gps: item.fecha_gps || r.fecha_gps
                            } : r;
                        }));
                    }
                } catch (error) {
                    console.error("Error al actualizar la ubicación de los operadores:", error);
                }
            };

            // Run every 20 seconds while any modal is open
            intervalId = setInterval(fetchLatestLocation, 20000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [openMapWindows.length, API_URL]); // Solo dependemos de .length y API_URL para que no se reinicie el intervalo cada que recibimos actualizacion de coordenadas.

    // Calculate distance helper
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

        // Filtering by route
        if (selectedRouteFilter) {
            sortableItems = sortableItems.filter(item =>
                item.origen === selectedRouteFilter.origen &&
                item.destino === selectedRouteFilter.destino
            );
        }

        // Table filters
        if (tableFilters.matricula) {
            const val = tableFilters.matricula.toLowerCase();
            sortableItems = sortableItems.filter(i => (i.matricula?.toLowerCase().includes(val) || i.nombre?.toLowerCase().includes(val)));
        }
        if (tableFilters.ot) {
            const val = tableFilters.ot.toLowerCase();
            sortableItems = sortableItems.filter(i => (i.ot?.toLowerCase().includes(val) || i.origen?.toLowerCase().includes(val) || i.destino?.toLowerCase().includes(val)));
        }
        if (tableFilters.municipio) {
            const val = tableFilters.municipio.toLowerCase();
            sortableItems = sortableItems.filter(i => i.municipio?.toLowerCase().includes(val));
        }
        if (tableFilters.estadoPersonal) {
            const val = tableFilters.estadoPersonal.toLowerCase();
            sortableItems = sortableItems.filter(i => i.estadoPersonal?.toLowerCase().includes(val));
        }
        if (tableFilters.progreso) {
            if (tableFilters.progreso === 'sin_coordenadas') {
                sortableItems = sortableItems.filter(i => i.ot && i.ot !== "Sin Asignar" && (!i.latitud || !(i.distTotal > 0)));
            } 
            else if (tableFilters.progreso === 'correctas') {
                sortableItems = sortableItems.filter(i => i.ot && i.ot !== "Sin Asignar" && i.latitud && i.longitud && i.distTotal > 0);
            }
            else {
                const val = parseFloat(tableFilters.progreso);
                if (!isNaN(val)) {
                    sortableItems = sortableItems.filter(i => i.progress !== undefined && i.progress !== null && i.progress >= val);
                }
            }
        }
        if (tableFilters.ot_prev) {
            const val = tableFilters.ot_prev.toLowerCase();
            sortableItems = sortableItems.filter(i => (i.ot_prev?.id?.toLowerCase().includes(val) || i.ot_prev?.origen?.toLowerCase().includes(val) || i.ot_prev?.destino?.toLowerCase().includes(val)));
        }
        if (tableFilters.ot_next) {
            const val = tableFilters.ot_next.toLowerCase();
            sortableItems = sortableItems.filter(i => (i.ot_next?.id?.toLowerCase().includes(val) || i.ot_next?.origen?.toLowerCase().includes(val) || i.ot_next?.destino?.toLowerCase().includes(val)));
        }

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
    }, [results, sortConfig, selectedRouteFilter, tableFilters]);

    // Estadísticas
    const statistics = React.useMemo(() => {
        if (!results || results.length === 0) return null;

        let mtyCount = 0;
        let sahagunCount = 0;
        const routeCounts = {};

        results.forEach(item => {
            if (item.ot && item.ot !== "Sin Asignar") {
                // Lógica para bases según 4to dígito
                const otStr = item.ot.toString().trim();
                const numPart = otStr.replace(/^(OT-|OT)/i, '');

                // "4to dígito" -> índice 3 
                if (numPart.length >= 4) {
                    const digit = numPart.charAt(3);
                    if (digit === '0') mtyCount++;
                    else if (digit === '1') sahagunCount++;
                }

                // Stats de Rutas (Origen -> Destino)
                if (item.origen && item.destino) {
                    const key = `${item.origen}|${item.destino}`;
                    routeCounts[key] = (routeCounts[key] || 0) + 1;
                }
            }
        });

        // Rutas Agrupadas
        const rutasAgrupadas = Object.entries(routeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => {
                const [origen, destino] = key.split('|');
                return { origen, destino, count };
            });

        return {
            total: results.length,
            withGPS: results.filter(r => r.latitud && r.longitud).length,
            active: results.filter(r => r.ot && r.ot !== "Sin Asignar").length,
            mty: mtyCount,
            sahagun: sahagunCount,
            rutasAgrupadas: rutasAgrupadas
        };
    }, [results]);

    const getSortIcon = (name) => {
        if (sortConfig.key !== name) {
            return <span key="sort-none"><i className="fas fa-sort text-muted ml-1" style={{ opacity: 0.5 }}></i></span>;
        }
        if (sortConfig.direction === 'ascending') {
            return <span key="sort-up"><i className="fas fa-sort-up text-primary ml-1"></i></span>;
        }
        return <span key="sort-down"><i className="fas fa-sort-down text-primary ml-1"></i></span>;
    };

    const handleTableFilterChange = (field, value) => {
        setTableFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearTableFilters = () => {
        setTableFilters({ matricula: '', ot: '', municipio: '', progreso: '', estadoPersonal: '', ot_prev: '', ot_next: '' });
        setSelectedRouteFilter(null);
    };

    const handleTrackWithMatriculas = async (matriculas) => {
        if (!matriculas || matriculas.length === 0) {
            setError("Por favor, ingresa al menos una matrícula.");
            return;
        }
        setLoading(true);
        setError(null);
        setResults([]);
        setSelectedRouteFilter(null);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('matriculas', matriculas.join(','));
            return next;
        });
        // Continuar con la lógica de rastreo usando las matrículas recibidas
        await handleTrackCore(matriculas);
    };

    const handleTrack = async () => {
        setLoading(true);
        setError(null);
        setResults([]);
        setSelectedRouteFilter(null);

        // Limpiar entrada: dividir por saltos de línea y eliminar vacíos
        const matriculas = matriculasText.split(/\r?\n/).map(m => m.trim()).filter(m => m);

        if (matriculas.length === 0) {
            setError("Por favor, ingresa al menos una matrícula.");
            setLoading(false);
            return;
        }

        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('matriculas', matriculas.join(','));
            return next;
        });

        await handleTrackCore(matriculas);
    };

    const handleTrackCore = async (matriculas) => {
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

    const handleLinkCruce = (cruceId, casetaEsperadaId) => {
        setManualLinks(prev => {
            const newLinks = { ...prev };
            if (casetaEsperadaId) {
                newLinks[cruceId] = casetaEsperadaId;
            } else {
                delete newLinks[cruceId];
            }
            return newLinks;
        });
    };

    const handleSaveLinks = async () => {
        if (Object.keys(manualLinks).length === 0) return;
        setSavingLinks(true);
        
        try {
            const payload = {
                ot: casetasData.ot,
                id_clave: casetasData.id_clave, // Ocupamos la clave para sacar el importe
                vinculos: Object.entries(manualLinks).map(([cruceId, idCasetaNueva]) => {
                    return {
                        cruceId: cruceId, // Ya es un varChar en DB
                        nuevoIdCaseta: idCasetaNueva // numeric de la caseta oficial
                    };
                })
            };

            console.log("Datos listos para enviar al backend:", payload);

            await axios.put(`${API_URL}/api/cruces/vincularManual`, payload);
            
            // Notificamos éxito y reseteamos el estado
            setManualLinks({});
            
            // Recargar la info para ver actualizados los estatus del backend:
            handleOpenCasetas(casetasData.ot, casetasData.id_tipo_ruta, null, casetasData.id_clave, casetasData.id_usuario);

        } catch (error) {
            console.error("Error guardando vinculaciones:", error);
            alert("Hubo un error al guardar los vínculos. Asegúrate de tener red.");
        } finally {
            setSavingLinks(false);
        }
    };

    // Opción 1: Asignar OT manualmente a un cruce desde el modal del TAG
    const handleAssignOTtoTagCruce = async (cruceId, otValue) => {
        const ot = otValue?.trim();
        if (!ot) return;
        const otRegex = /^OT-\d+$/;
        if (!otRegex.test(ot)) {
            alert('Formato inválido. Usa el formato: OT-XXXXX (ejemplo: OT-605092)');
            return;
        }
        setTagSavingOT(prev => new Set([...prev, cruceId]));
        try {
            await axios.patch(`${API_URL}/api/cruces/${cruceId}/setOT`, { OT: ot });
            setTagOTInputs(prev => { const n = { ...prev }; delete n[cruceId]; return n; });
            // Recargar el modal del TAG para reflejar el cambio
            handleOpenTagModal(tagModalData.tag);
        } catch (err) {
            alert('Error al asignar la OT. Intenta de nuevo.');
        } finally {
            setTagSavingOT(prev => { const s = new Set(prev); s.delete(cruceId); return s; });
        }
    };

    return (
        <div className="container-fluid">
            <h1 className="h3 mb-4 text-gray-800">Función para rastreo de Operadores <b>(Auxiliar)</b></h1>

            <div className="row" style={{ marginBottom: '-2rem', }}>
                {/* Panel de Entrada */}
                <div className="col-xl-3 col-lg-4">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 className="m-0 font-weight-bold text-primary">Búsqueda de Unidades</h6>
                        </div>
                        <div className="card-body">
                            <form onSubmit={(e) => { e.preventDefault(); handleTrack(); }}>
                                <div className="form-group">
                                    <label style={{ 'fontSize': '.875rem', }}>Selecciona el operador de la siguiente lista <br/>(para agregarlo en la consulta):</label>
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
                                    <label htmlFor="matriculasInput">Ingresa las matrículas que deseas rastrear. <br/><i className='text-muted'>(una por línea):</i></label>
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
                                        <span key="loading"><i className="fas fa-spinner fa-spin"></i> Consultando...</span>
                                    ) : (
                                        <span key="search"><i className="fas fa-search-location"></i> Rastrear Unidades</span>
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
                <div className="col-xl-9 col-lg-7">
                    <div className="row">
                        {/* Sección de Estadísticas */}
                        {statistics && results.length > 0 && (
                            <>
                                <div className="col-6 mb-2">
                                    {/* Card MTY */}
                                    <div className="col-xl-8 col-md-12 mb-2">
                                        <div className="card border-left-primary shadow py-0" style={{ minHeight: 'auto' }}>
                                            <div className="card-body p-2">
                                                <div className="row no-gutters align-items-center">
                                                    <div className="col mr-2">
                                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-0">
                                                            Base Monterrey</div>
                                                        <div className="h6 mb-0 font-weight-bold text-gray-800">{statistics.mty}</div>
                                                    </div>
                                                    <div className="col-auto">
                                                        <i className="fas fa-industry fa-lg text-gray-300"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Sahagún */}
                                    <div className="col-xl-8 col-md-12 mb-2">
                                        <div className="card border-left-success shadow py-0" style={{ minHeight: 'auto' }}>
                                            <div className="card-body p-2">
                                                <div className="row no-gutters align-items-center">
                                                    <div className="col mr-2">
                                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-0">
                                                            Base Sahagún</div>
                                                        <div className="h6 mb-0 font-weight-bold text-gray-800">{statistics.sahagun}</div>
                                                    </div>
                                                    <div className="col-auto">
                                                        <i className="fas fa-warehouse fa-lg text-gray-300"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Resumen */}
                                    <div className="col-xl-8 col-md-12 mb-2">
                                        <div className="card border-left-info shadow py-0" style={{ minHeight: 'auto' }}>
                                            <div className="card-body p-2">
                                                <div className="row no-gutters align-items-center">
                                                    <div className="col mr-2">
                                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-0">Resumen</div>
                                                        <div className="h6 mb-0 font-weight-bold text-gray-800">
                                                            {statistics.active} <span className="text-xs text-gray-500 font-weight-light">En ruta</span>
                                                            <span className="mx-1 text-gray-300">|</span>
                                                            <span className="text-xs text-gray-500 font-weight-light">{statistics.withGPS}/{statistics.total} GPS</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-auto">
                                                        {/* Al darle clic al icono de resumen de GPSs vamos a filtrar las matriculas que tienen GPS inactivo */}

                                                        <i onClick={handleFilterGPSInactive} className="fas fa-chart-pie fa-lg text-gray-300"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rutas Agrupadas */}
                                {statistics.rutasAgrupadas.length > 0 && (
                                    <div className="col-5 mb-2">
                                        <div className="wrapper" style={{ maxHeight: '11.5rem', overflow: 'auto', paddingBottom: '1rem' }}>


                                            <div className="card shadow" style={{minHeight:'5rem'}}>
                                                <div className="card-header py-2 d-flex flex-row align-items-center justify-content-between" style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
                                                    <h6 className="m-0 font-weight-bold text-secondary text-xs">
                                                        <i className="fas fa-route mr-2"></i> Rutas agrupadas
                                                    </h6>
                                                </div>
                                                <ul className="list-group list-group-flush small">
                                                    {statistics.rutasAgrupadas.map((route, idx) => {
                                                        const isSelected = selectedRouteFilter && selectedRouteFilter.origen === route.origen && selectedRouteFilter.destino === route.destino;
                                                        return (
                                                            <li
                                                                key={idx}
                                                                className={`list-group-item d-flex justify-content-between align-items-center py-1 ${isSelected ? 'bg-gray-200' : ''}`}
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => setSelectedRouteFilter(isSelected ? null : { origen: route.origen, destino: route.destino })}
                                                                title="Filtrar por esta ruta"
                                                            >
                                                                <div>
                                                                    <strong>{route.origen}</strong>
                                                                    <i className="fas fa-arrow-right mx-2 text-gray-400"></i>
                                                                    <strong>{route.destino}</strong>
                                                                </div>
                                                                <span className={`badge badge-pill ${isSelected ? 'badge-primary' : 'badge-secondary'}`} style={{ fontSize: '0.8rem' }}>{route.count}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                )}
                            </>
                        )}
                    </div>
                    <div className="card shadow mb-4">
                        <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 className="m-0 font-weight-bold text-primary">Resultados del Rastreo - <span className='text-muted font-weight-bolder'>({sortedResults.length})</span></h6> 
                            {(Object.values(tableFilters).some(v => v !== '') || selectedRouteFilter) && (
                                <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2 font-weight-bold" title="Limpiar filtros" onClick={clearTableFilters}>
                                    <i className="fas fa-times"></i> Limpiar Filtros
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            {results.length > 0 ? (
                                <div key="results" className="table-responsive table-container table-scroll">
                                    <table className="table table-bordered table-striped" width="100%" cellSpacing="0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th onClick={() => requestSort('matricula')} style={{ cursor: 'pointer' }}>
                                                    Operador {getSortIcon('matricula')}
                                                </th>
                                                <th onClick={() => requestSort('estadoPersonal')} style={{ cursor: 'pointer' }}>
                                                    Estado del personal {getSortIcon('estadoPersonal')}
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
                                            <tr className="bg-light shadow-sm">
                                                <th className="p-1">
                                                    <input type="text" className="form-control form-control-sm" placeholder=" Filtrar..." value={tableFilters.matricula} onChange={(e) => handleTableFilterChange('matricula', e.target.value)} />
                                                </th>
                                                <th className="p-1">
                                                    <input type="text" className="form-control form-control-sm" placeholder=" Filtrar..." value={tableFilters.estadoPersonal} onChange={(e) => handleTableFilterChange('estadoPersonal', e.target.value)} />
                                                </th>
                                                <th className="p-1">
                                                    <input type="text" className="form-control form-control-sm" placeholder=" Filtrar..." value={tableFilters.ot} onChange={(e) => handleTableFilterChange('ot', e.target.value)} />
                                                </th>
                                                <th className="p-1">
                                                    <input type="text" className="form-control form-control-sm" placeholder=" Filtrar..." value={tableFilters.municipio} onChange={(e) => handleTableFilterChange('municipio', e.target.value)} />
                                                </th>
                                                <th className="p-1 text-center text-muted small align-middle">
                                                    <select 
                                                        className="form-control form-control-sm" 
                                                        value={tableFilters.progreso} 
                                                        onChange={(e) => handleTableFilterChange('progreso', e.target.value)}
                                                    >
                                                        <option value="">Todos</option>
                                                        <option value="sin_coordenadas">Por corregir</option>
                                                        <option value="correctas">Correctas</option>
                                                    </select>
                                                </th>
                                                <th className="p-1">
                                                    <input type="text" className="form-control form-control-sm" placeholder=" Filtrar..." value={tableFilters.ot_prev} onChange={(e) => handleTableFilterChange('ot_prev', e.target.value)} />
                                                </th>
                                                <th className="p-1">
                                                    <input type="text" className="form-control form-control-sm" placeholder=" Filtrar..." value={tableFilters.ot_next} onChange={(e) => handleTableFilterChange('ot_next', e.target.value)} />
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
                                                    <td className="align-middle text-center">
                                                        {item.estadoPersonal ? (
                                                            item.estadoPersonal.split('|').map((estado, idx) => (
                                                                <span key={idx} className="badge badge-info d-block mb-1 text-wrap">
                                                                    {estado.trim()}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="small text-muted font-italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="align-middle">
                                                        {item.ot && item.ot !== "Sin Asignar" ? (
                                                            <>
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <span className="badge badge-primary mr-2" style={{ fontSize: '0.8rem' }}>OT: {item.ot}</span>
                                                                    {item.id_tipo_ruta && (
                                                                        <button
                                                                            onClick={() => handleOpenCasetas(item.ot, item.id_tipo_ruta, item.tag, item.id_clave, item.id_usuario)}
                                                                            className="btn btn-sm btn-outline-info py-0 px-1 ml-1"
                                                                            title="Ver Casetas"
                                                                        >
                                                                            <i className="fas fa-road"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="small">
                                                                    <strong
                                                                        className={item.origen_detalle ? "text-primary" : ""}
                                                                        style={item.origen_detalle ? { cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: '2px' } : {}}
                                                                        onClick={item.origen_detalle ? () => handleOpenDirModal(item.origen_detalle, 'Origen') : undefined}
                                                                        title={item.origen_detalle ? `Detalle: ${item.origen_detalle.razon_social || item.origen_detalle.nombre}` : ""}
                                                                    >{item.origen}</strong>
                                                                    <i className="fas fa-arrow-right text-gray-400 mx-1"></i>
                                                                    <strong
                                                                        className={item.destino_detalle ? "text-primary" : ""}
                                                                        style={item.destino_detalle ? { cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: '2px' } : {}}
                                                                        onClick={item.destino_detalle ? () => handleOpenDirModal(item.destino_detalle, 'Destino') : undefined}
                                                                        title={item.destino_detalle ? `Detalle: ${item.destino_detalle.razon_social || item.destino_detalle.nombre}` : ""}
                                                                    >{item.destino}</strong>
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
                                                                    {item.fecha_gps ? new Date(item.fecha_gps).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : ''}
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
                                                        ) : item.ot && item.ot !== "Sin Asignar" ? (
                                                            <div className="text-center">
                                                                <div className="small text-warning font-italic mb-1">
                                                                    <i className="fas fa-exclamation-circle text-warning mr-1"></i> Faltan geocoordenadas
                                                                </div>
                                                                <div className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                                    <strong>IDs Directorio:</strong> {item.id_origen || '?'} <i className="fas fa-arrow-right mx-1"></i> {item.id_destino || '?'}
                                                                </div>
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary py-0"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    onClick={() => {
                                                                        if (item.origen_detalle) handleOpenDirModal(item.origen_detalle, 'Origen');
                                                                        else if (item.destino_detalle) handleOpenDirModal(item.destino_detalle, 'Destino');
                                                                    }}
                                                                    title="Verificar direcciones"
                                                                >
                                                                    Ajustar ruta
                                                                </button>
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
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <span className="badge badge-secondary mr-2" style={{ fontSize: '0.8rem' }}>OT: {item.ot_prev.id}</span>
                                                                    {item.ot_prev.id_tipo_ruta && (
                                                                        <button
                                                                            onClick={() => handleOpenCasetas(item.ot_prev.id, item.ot_prev.id_tipo_ruta, item.tag, item.ot_prev.id_clave, item.ot_prev.id_usuario)}
                                                                            className="btn btn-sm btn-outline-secondary py-0 px-1 ml-1"
                                                                            title="Ver Casetas"
                                                                        >
                                                                            <i className="fas fa-road"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
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
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <span className="badge badge-info mr-2" style={{ fontSize: '0.8rem' }}>OT prog: {item.ot_next.id}</span>
                                                                    {item.ot_next.id_tipo_ruta && (
                                                                        <button
                                                                            onClick={() => handleOpenCasetas(item.ot_next.id, item.ot_next.id_tipo_ruta, item.tag, item.ot_next.id_clave, item.ot_next.id_usuario)}
                                                                            className="btn btn-sm btn-outline-info py-0 px-1 ml-1"
                                                                            title="Ver Casetas"
                                                                        >
                                                                            <i className="fas fa-road"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
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
                            ) : (loading)? (
                                <div key="loading" className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="sr-only">Cargando...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Rastreando unidades, por favor espere...</p>
                                </div>
                            ) :
                            (
                                <div key="empty" className="text-center py-5">
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

            {/* Ventanas Móviles de Mapa */}
            {openMapWindows.map((selectedOperator, index) => (
                <Rnd
                    key={`map-window-${selectedOperator.matricula}`}
                    default={{
                        x: window.innerWidth > 600 ? ((window.innerWidth - 600) / 2) + (index * 30) : 10,
                        y: window.innerHeight > 550 ? ((window.innerHeight - 550) / 2) + (index * 30) : 10,
                        width: window.innerWidth > 600 ? 600 : window.innerWidth - 20,
                        height: window.innerHeight > 550 ? 550 : window.innerHeight - 20,
                    }}
                    minWidth={300}
                    minHeight={300}
                    bounds="window"
                    dragHandleClassName="handle-drag"
                    cancel=".close"
                    style={{ zIndex: 1060 + index, position: 'fixed' }}
                    enableResizing={{ top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }}
                >
                    <div className="card shadow-lg h-100" style={{ border: '1px solid rgba(0,0,0,.2)', borderRadius: '0.3rem', overflow: 'hidden', backgroundColor: '#fff' }}>
                        <div 
                            className="card-header bg-white d-flex align-items-center justify-content-between handle-drag" 
                            style={{ cursor: 'move', userSelect: 'none', padding: '0.75rem 1rem', borderBottom: '1px solid #e3e6f0' }}
                            onMouseDown={() => {
                                // Traer al frente al hacer clic en el header
                                setOpenMapWindows(prev => {
                                    const filtered = prev.filter(op => op.matricula !== selectedOperator.matricula);
                                    return [...filtered, prev.find(op => op.matricula === selectedOperator.matricula)];
                                });
                            }}
                        >
                            <h6 className="m-0 font-weight-bold text-primary">
                                <i className="fas fa-satellite-dish mr-2"></i>
                                Ubicación: {selectedOperator?.matricula} - {selectedOperator?.nombre}
                            </h6>
                            <button type="button" className="close" aria-label="Close" onClick={() => handleCloseMap(selectedOperator.matricula)}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="card-body p-0 d-flex flex-column h-100" style={{ position: 'relative' }}>
                            {selectedOperator && selectedOperator.latitud && selectedOperator.longitud ? (
                                <MapContainer
                                    key={selectedOperator.matricula}
                                    center={[parseFloat(selectedOperator.latitud), parseFloat(selectedOperator.longitud)]}
                                    zoom={9}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    {selectedOperator.rutas && selectedOperator.rutas.length > 0 && (
                                        <Polyline positions={selectedOperator.rutas.map(p => [parseFloat(p.latitud), parseFloat(p.longitud)])} color="blue" />
                                    )}
                                    <Marker position={[parseFloat(selectedOperator.latitud), parseFloat(selectedOperator.longitud)]}>
                                        <Popup>
                                            <div>
                                                <strong>{selectedOperator.matricula}</strong> <br />
                                                {selectedOperator.nombre} <br />
                                                <hr className="my-1" />
                                                {selectedOperator.municipio} <br />
                                                <small className="text-muted">{selectedOperator.fecha_gps ? new Date(selectedOperator.fecha_gps).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : ''}</small>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                                    <p>No hay coordenadas disponibles para este operador.</p>
                                </div>
                            )}
                        </div>
                        <div className="card-footer py-2 d-flex justify-content-between align-items-center bg-light">
                            <span className="text-muted small text-truncate mr-2" title={selectedOperator?.municipio}>{selectedOperator?.municipio}</span>
                            <Button variant="secondary" size="sm" onClick={() => handleCloseMap(selectedOperator.matricula)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </Rnd>
            ))}

            {/* Modal de Detalle del Directorio (Origen / Destino) */}
            <Modal show={showDirModal} onHide={() => setShowDirModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-building mr-2"></i>
                        {selectedDirEntry?.tipo}:{' '}
                        <span className="text-primary">{selectedDirEntry?.nombre || '—'}</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedDirEntry && (
                        <dl className="row mb-0 small">
                            {selectedDirEntry.razon_social && (
                                <>
                                    <dt className="col-sm-4 text-muted">Razón Social</dt>
                                    <dd className="col-sm-8">{selectedDirEntry.razon_social}</dd>
                                </>
                            )}
                            {selectedDirEntry.direccion && (
                                <>
                                    <dt className="col-sm-4 text-muted">Dirección</dt>
                                    <dd className="col-sm-8">
                                        {selectedDirEntry.direccion}
                                        {selectedDirEntry.colonia ? `, Col. ${selectedDirEntry.colonia}` : ''}
                                    </dd>
                                </>
                            )}
                            {selectedDirEntry.contacto && (
                                <>
                                    <dt className="col-sm-4 text-muted">Contacto</dt>
                                    <dd className="col-sm-8">{selectedDirEntry.contacto}</dd>
                                </>
                            )}
                            {selectedDirEntry.celular && (
                                <>
                                    <dt className="col-sm-4 text-muted">Celular</dt>
                                    <dd className="col-sm-8">
                                        <a href={`tel:${selectedDirEntry.celular}`}>
                                            <i className="fas fa-phone mr-1"></i>{selectedDirEntry.celular}
                                        </a>
                                    </dd>
                                </>
                            )}
                            {selectedDirEntry.correo && (
                                <>
                                    <dt className="col-sm-4 text-muted">Correo</dt>
                                    <dd className="col-sm-8">
                                        <a href={`mailto:${selectedDirEntry.correo}`}>
                                            <i className="fas fa-envelope mr-1"></i>{selectedDirEntry.correo}
                                        </a>
                                    </dd>
                                </>
                            )}
                            {!selectedDirEntry.razon_social && !selectedDirEntry.direccion && !selectedDirEntry.contacto && !selectedDirEntry.celular && !selectedDirEntry.correo && (
                                <dd className="col-12 text-muted font-italic">Sin información de contacto en el directorio.</dd>
                            )}
                        </dl>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDirModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de registros del TAG en TUSA */}
            <Modal show={showTagModal} onHide={() => setShowTagModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-tag mr-2"></i>
                        Registros del TAG: <span className="text-info">{tagModalData.tag}</span>
                        <small className="text-muted ml-2" style={{ fontSize: '0.75rem' }}>(últimos 90 días)</small>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                    {tagModalData.loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-info" role="status"><span className="sr-only">Cargando...</span></div>
                            <p className="mt-2 text-muted">Consultando registros...</p>
                        </div>
                    ) : tagModalData.error ? (
                        <div className="alert alert-danger">{tagModalData.error}</div>
                    ) : tagModalData.cruces.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="fas fa-inbox fa-2x mb-2"></i>
                            <p>Sin registros en los últimos 90 días.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-muted small mb-2"><strong>{tagModalData.cruces.length}</strong> registros encontrados.</p>
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered table-striped" style={{ fontSize: '0.8rem' }}>
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Caseta</th>
                                            <th>Clase</th>
                                            <th>OT</th>
                                            <th>Estatus</th>
                                            <th className="text-right">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tagModalData.cruces.map(c => (
                                            <tr key={c.ID}>
                                                <td className="text-nowrap">{c.Fecha ? new Date(c.Fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                                                <td>{c.Caseta}</td>
                                                <td className="text-muted">{c.Clase || '-'}</td>
                                                <td>
                                    {c.id_orden ? (
                                        <span className="text-muted">{c.id_orden}</span>
                                    ) : (
                                        <div className="d-flex align-items-center" style={{ gap: '4px', minWidth: '180px' }}>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="OT-XXXXX"
                                                value={tagOTInputs[c.ID] || ''}
                                                onChange={e => setTagOTInputs(prev => ({ ...prev, [c.ID]: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && handleAssignOTtoTagCruce(c.ID, tagOTInputs[c.ID])}
                                                disabled={tagSavingOT.has(c.ID)}
                                                style={{ width: '110px', flexShrink: 0 }}
                                            />
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleAssignOTtoTagCruce(c.ID, tagOTInputs[c.ID])}
                                                disabled={!tagOTInputs[c.ID] || tagSavingOT.has(c.ID)}
                                                title="Asignar OT a este cruce"
                                            >
                                                {tagSavingOT.has(c.ID)
                                                    ? <i className="fas fa-spinner fa-spin"></i>
                                                    : <i className="fas fa-link"></i>}
                                            </button>
                                        </div>
                                    )}
                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        c.Estatus === 'Confirmado' ? 'badge-success' :
                                                        c.Estatus === 'Abuso' ? 'badge-danger' :
                                                        c.Estatus === 'Aclaración' ? 'badge-warning' :
                                                        'badge-secondary'
                                                    } text-wrap`}>{c.Estatus}</span>
                                                </td>
                                                <td className="text-right font-weight-bold">${parseFloat(c.Importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="thead-light">
                                        <tr>
                                            <td colSpan="5" className="text-right font-weight-bold">Total:</td>
                                            <td className="text-right font-weight-bold text-primary">${tagModalData.cruces.reduce((sum, c) => sum + parseFloat(c.Importe || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTagModal(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Casetas */}
            <Modal show={showCasetasModal} onHide={() => { setShowCasetasModal(false); setManualLinks({}); setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('ot'); return next; }); }} size="lg" centered enforceFocus={false}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-road mr-2"></i>
                        Detalle de Casetas - OT: <span className="text-primary">{casetasData.ot} </span>
                        {casetasData.id_tipo_ruta && (
                            <span 
                                className="badge badge-dark ml-2" 
                                style={{ fontSize: '1rem', cursor: 'pointer' }}
                                onClick={() => navigate(`/rutas?ruta=${casetasData.id_tipo_ruta}`)}
                                title="Ver ruta en visor"
                            >
                                Ruta: {casetasData.id_tipo_ruta}
                            </span>
                        )}
                        {casetasData.id_clave && <span className="badge badge-info ml-2" style={{ fontSize: '1rem' }}>{casetasData.id_clave}</span>}
                        {casetasData.id_usuario && (
                            <span className="badge badge-secondary ml-2" style={{ fontSize: '1rem' }}>
                                Tráfico: {casetasData.id_usuario}
                            </span>
                        )}
                        {(() => {
                            const tagVal = casetasData.tag || casetasData.crossed?.find(c => c.Tag)?.Tag;
                            return tagVal ? (
                                <a 
                                    href={`https://apps.pase.com.mx/uc/detalletag/IMDM/${tagVal.replace("IMDM", "")}`} 
                                    className="btn btn-sm btn-outline-primary ml-3" 
                                    style={{ fontSize: '.9rem' }}
                                    target="_blank" 
                                    rel="noreferrer"
                                    title="Ver TAG en PASE"
                                >
                                    <i className="fas fa-tag mr-1"></i> TAG: {tagVal}
                                </a>
                            ) : null;
                        })()}
                        {casetasData.id_tipo_ruta && (
                            <button
                                className="btn btn-sm btn-outline-warning ml-2"
                                style={{ fontSize: '.9rem' }}
                                onClick={handleOpenEditRuta}
                                title="Editar casetas de la ruta"
                            >
                                <i className="fas fa-edit mr-1"></i> Editar ruta
                            </button>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {casetasData.otDetails && casetasData.otDetails.info && (
                        <div className="card shadow-sm mb-3">
                            <div className="card-body p-3">
                                <h6 className="card-title text-primary"><i className="fas fa-info-circle mr-2"></i>Detalles Rápidos de la Orden</h6>
                                <div className="row small">
                                    <div className="col-12 col-md-6">
                                        <p className="mb-1"><strong>Operador:</strong> {casetasData.otDetails.info.OperadorNombre} (Matricula: {casetasData.otDetails.info.ID_matricula})</p>
                                        <p className="mb-1"><strong>Asignada:</strong> <span className={casetasData.otDetails.info.asignada ? "text-success" : "text-muted"}>{casetasData.otDetails.info.asignada ? new Date(casetasData.otDetails.info.asignada).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : 'Pendiente'}</span></p>
                                        <p className="mb-1"><strong>En Origen:</strong> <span className={casetasData.otDetails.info.origen_status ? "text-success" : "text-muted"}>{casetasData.otDetails.info.origen_status ? new Date(casetasData.otDetails.info.origen_status).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : 'Pendiente'}</span></p>
                                        
                                        {(() => {
                                            const tagVal = casetasData.tag || casetasData.crossed?.find(c => c.Tag)?.Tag;
                                            return <p className='mb-1'><strong>TAG:</strong> <span className={tagVal ? "text-info" : "text-muted"}>{tagVal ? <button className="btn btn-link p-0 text-info" style={{ fontSize: 'inherit', verticalAlign: 'baseline' }} onClick={() => handleOpenTagModal(tagVal)} title="Ver registros del TAG en TUSA">{tagVal}</button> : 'N/A'}</span></p>;
                                        })()}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <p className="mb-1"><strong>Iniciada:</strong> <span className={casetasData.otDetails.info.iniciada ? "text-success" : "text-muted"}>{casetasData.otDetails.info.iniciada ? new Date(casetasData.otDetails.info.iniciada).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : 'Pendiente'}</span></p>
                                        <p className="mb-1"><strong>En Destino:</strong> <span className={casetasData.otDetails.info.en_sitio ? "text-success" : "text-muted"}>{casetasData.otDetails.info.en_sitio ? new Date(casetasData.otDetails.info.en_sitio).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : 'Pendiente'}</span></p>
                                        <p className="mb-1"><strong>Finalizada:</strong> <span className={casetasData.otDetails.info.finalizada ? "text-success" : "text-muted"}>{casetasData.otDetails.info.finalizada ? new Date(casetasData.otDetails.info.finalizada).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : 'Pendiente'}</span></p>
                                    </div>
                                </div>
                                {casetasData.otDetails.tracking && casetasData.otDetails.tracking.length > 0 && (
                                    <div className="mt-2 d-flex justify-content-end">
                                        <button className="btn btn-outline-info b¿tn-sm" onClick={() => {
                                            const pts = casetasData.otDetails.tracking.filter(t => t.latitud && t.longitud);
                                            if(pts.length > 0) {
                                                const lastPt = pts[pts.length - 1];
                                                const newOp = {
                                                    matricula: casetasData.otDetails.info.ID_matricula,
                                                    nombre: casetasData.otDetails.info.OperadorNombre,
                                                    latitud: lastPt.latitud,
                                                    longitud: lastPt.longitud,
                                                    fecha_gps: lastPt.fecha,
                                                    municipio: 'Última ubicación de ruta resguardada',
                                                    rutas: pts
                                                };
                                                setOpenMapWindows(prev => {
                                                    const isAlreadyOpen = prev.some(op => op.matricula === newOp.matricula);
                                                    if (isAlreadyOpen) {
                                                        const filtered = prev.filter(op => op.matricula !== newOp.matricula);
                                                        return [...filtered, newOp]; // overwrites with trace mode
                                                    }
                                                    return [...prev, newOp];
                                                });
                                            } else {
                                                alert("No hay ubicaciones registradas con coordenadas válidas para esta OT.");
                                            }
                                        }}>
                                            <i className="fas fa-map-marked-alt mr-2"></i>Ver recorrido en el mapa ({casetasData.otDetails.tracking.length} puntos)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {casetasData.loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Cargando...</span>
                            </div>
                            <p className="mt-2 text-muted">Obteniendo cruces y casetas esperadas...</p>
                        </div>
                    ) : casetasData.error ? (
                        <div className="alert alert-danger">{casetasData.error}</div>
                    ) : (
                        <div className="table-responsive table-container">
                            <table className="table table-sm table-bordered table-small table-striped table-scroll" >
                                <thead className="thead-light">
                                    <tr>
                                        <th>Orden</th>
                                        <th>Caseta Esperada</th>
                                        <th>Estado</th>
                                        <th>Detalles del Cruce</th>
                                        <th className="text-center">Consec. propuesto</th>
                                        <th>Costo estimado</th>
                                        <th>Costo del cruce</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const sortedCrossings = [...casetasData.crossed].sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
                                        return casetasData.expected.length === 0 ? (
                                        <tr><td colSpan="7" className="text-center text-muted py-3">No hay casetas registradas para esta ruta.</td></tr>
                                    ) : (
                                        casetasData.expected.map((caseta, i) => {
                                            // Buscar si hay un cruce que concuerde.
                                            const cruce = casetasData.crossed.find(c => {
                                                const manualMatch = manualLinks[c.ID] === caseta.ID_Caseta;

                                                return manualMatch || 
                                                    (c.idCaseta).toString() === (caseta.ID_Caseta).toString() ||
                                                    (c.Caseta && caseta.Nombre_IAVE && c.Caseta.toUpperCase().includes(caseta.Nombre_IAVE.toUpperCase())) ||
                                                    (c.Caseta && caseta.Nombre && c.Caseta.toUpperCase().includes(caseta.Nombre.toUpperCase()));
                                            });

                                            // Gris claro/blanco = Pendiente. Verde claro (table-success) = Cruzada.
                                            return (
                                                <tr key={i} className={cruce ? 'table-success' : 'text-muted'}>
                                                    <td className="text-center align-middle"><strong>{i + 1}</strong></td>
                                                    <td className="align-middle">
                                                        <strong>{caseta.Nombre_IAVE || caseta.Nombre || caseta.Caseta}</strong>
                                                        <div className="small font-italic">{caseta.Notas || 'N/A'}</div>
                                                    </td>
                                                    <td className="text-center align-middle">
                                                        {cruce ? (
                                                            <span className="badge badge-success"><i className="fas fa-check"></i> Cruzada</span>
                                                        ) : (
                                                            <span className="badge badge-secondary"><i className="fas fa-clock"></i> Pendiente</span>
                                                        )}
                                                    </td>
                                                    <td className="align-middle">
                                                        {cruce ? (
                                                            <div className="small">
                                                                <div><strong>Fecha:</strong> {new Date(cruce.Fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</div>
                                                                {cruce.Tag && <div><strong>TAG:</strong> {cruce.Tag}</div>}
                                                            </div>
                                                        ) : (
                                                            <span className="small font-italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center align-middle">
                                                        {cruce ? (
                                                            <span className="font-weight-bold text-info" title="Posición cronológica del cruce entre todos los registros">
                                                                {sortedCrossings.findIndex(x => x.ID === cruce.ID) + 1}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>

                                                    <td className="align-middle">
                                                        {caseta[claveToImporteField[casetasData.id_clave?.trim()]] !== undefined ? (
                                                            <div className="small">
                                                                <div>$<strong>{caseta[claveToImporteField[casetasData.id_clave?.trim()]]?.toLocaleString('es-MX')}</strong></div>
                                                            </div>
                                                        ) : (
                                                            <span className="small font-italic">-</span>
                                                        )}
                                                    </td>
                                                    {/* Columna de costo del cruce real.*/}
                                                    <td className="align-middle">
                                                        {cruce ? (
                                                            <div className="small">
                                                                <div>$<strong>{cruce?.Importe?.toLocaleString('es-MX')}</strong></div>
                                                            </div>
                                                        ) : (
                                                            <span className="small font-italic">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    );
                                    })()}
                                </tbody>
                            </table>
                            {(() => {
                                const sortedCrossingsAll = [...casetasData.crossed].sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
                                const otIniciada = casetasData.otDetails?.info?.iniciada ? new Date(casetasData.otDetails.info.iniciada) : null;
                                const otFin = casetasData.otDetails?.info?.en_sitio
                                    ? new Date(casetasData.otDetails.info.en_sitio)
                                    : (casetasData.otDetails?.info?.finalizada ? new Date(casetasData.otDetails.info.finalizada) : null);
                                const noMapeados = casetasData.crossed.filter(c => {
                                    if (manualLinks[c.ID]) return false;
                                    // Excluir cruces cuya fecha esté fuera del rango de la OT
                                    if (otIniciada || otFin) {
                                        const cruceFecha = new Date(c.Fecha);
                                        if (otIniciada && cruceFecha < otIniciada) return false;
                                        if (otFin && cruceFecha > otFin) return false;
                                    }
                                    return !casetasData.expected.some(e => 
                                        (e.ID_Caseta?.toString()) === (c.idCaseta?.toString()) || 
                                        (e.Nombre_IAVE && c.Caseta.toUpperCase().includes(e.Nombre_IAVE.toUpperCase())) ||
                                        (e.Nombre && c.Caseta.toUpperCase().includes(e.Nombre.toUpperCase()))
                                    );
                                });

                                return noMapeados.length > 0 && (
                                    <div className="mt-4">
                                        <h6 className="text-danger"><i className="fas fa-exclamation-triangle mr-1"></i> Cruces registrados no mapeados a la ruta:</h6>
                                        <table className="table table-sm table-bordered mt-2">
                                            <thead className="table-danger">
                                                <tr>
                                                    <th>Caseta Reportada</th>
                                                    <th>Fecha</th>
                                                    <th className="text-center">Consec. propuesto</th>
                                                    <th>Importe</th>
                                                    <th>Vincular a Caseta Esperada</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {noMapeados.map((cruce, i) => {
                                                    const unfulfilledExpected = casetasData.expected.filter(e => {
                                                        return !casetasData.crossed.some(c2 => {
                                                            return manualLinks[c2.ID] === e.ID_Caseta || 
                                                              (c2.idCaseta?.toString()) === (e.ID_Caseta?.toString()) || 
                                                              (c2.Caseta && e.Nombre_IAVE && c2.Caseta.toUpperCase().includes(e.Nombre_IAVE.toUpperCase())) ||
                                                              (c2.Caseta && e.Nombre && c2.Caseta.toUpperCase().includes(e.Nombre.toUpperCase()));
                                                        });
                                                    });

                                                    return (
                                                        <tr key={i}>
                                                            <td className="align-middle"><strong>{cruce.Caseta}</strong></td>
                                                            <td className="align-middle">{new Date(cruce.Fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</td>
                                                            <td className="text-center align-middle">
                                                                <span className="font-weight-bold text-info" title="Posición cronológica entre todos los cruces registrados">
                                                                    {sortedCrossingsAll.findIndex(x => x.ID === cruce.ID) + 1}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">${cruce.Importe}</td>
                                                            <td className="align-middle">
                                                                <select 
                                                                    className="form-control form-control-sm" 
                                                                    value="" 
                                                                    onChange={(e) => handleLinkCruce(cruce.ID, parseInt(e.target.value))}
                                                                >
                                                                    <option value="" disabled>Seleccione para vincular...</option>
                                                                    {unfulfilledExpected.map(pend => (
                                                                        <option key={pend.ID_Caseta} value={pend.ID_Caseta}>
                                                                            {pend.Nombre_IAVE || pend.Nombre || pend.Caseta}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}

                            {/* ── Opción 2: Cruces del TAG fuera del rango de la OT ── */}
                            {(() => {
                                const tagCruces = casetasData.tagCruces || [];
                                if (!tagCruces.length) return null;

                                const otIniciada = casetasData.otDetails?.info?.iniciada ? new Date(casetasData.otDetails.info.iniciada) : null;
                                const otFin = casetasData.otDetails?.info?.en_sitio
                                    ? new Date(casetasData.otDetails.info.en_sitio)
                                    : (casetasData.otDetails?.info?.finalizada ? new Date(casetasData.otDetails.info.finalizada) : null);

                                // Cruces del TAG: sin OT asignada + fuera del rango de la OT + no ya presentes en crossed
                                const outOfRange = tagCruces.filter(tc => {
                                    if (tc.id_orden) return false;
                                    const tcFecha = new Date(tc.Fecha);
                                    const outsideRange = (otFin && tcFecha > otFin) || (otIniciada && tcFecha < otIniciada);
                                    if (!outsideRange) return false;
                                    return !casetasData.crossed.some(c => c.ID === tc.ID);
                                });

                                if (!outOfRange.length) return null;

                                return (
                                    <div className="mt-4">
                                        <h6 className="text-warning">
                                            <i className="fas fa-exclamation-circle mr-1"></i> Cruces del TAG sin OT fuera del rango de la orden:
                                        </h6>
                                        <p className="small text-muted mb-2">
                                            Estos cruces pertenecen al mismo TAG pero ocurrieron fuera del período registrado de la OT
                                            (posiblemente porque el operador la cerró anticipadamente). Puedes vincularlos a una caseta pendiente
                                            para asignarles la OT <strong>{casetasData.ot}</strong> y conciliar el costo.
                                        </p>
                                        <table className="table table-sm table-bordered mt-1" style={{ backgroundColor: '#fff9e6' }}>
                                            <thead className="table-warning">
                                                <tr>
                                                    <th>Caseta Reportada</th>
                                                    <th>Fecha</th>
                                                    <th className="text-center">Importe</th>
                                                    <th>Vincular a Caseta Esperada (asignará la OT)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {outOfRange.map((tc, i) => {
                                                    // Casetas pendientes aún no cubiertas (ni por crossed ni por otros outOfRange ya vinculados)
                                                    const unfulfilledExpected = casetasData.expected.filter(e => {
                                                        const coveredByCrossed = casetasData.crossed.some(c2 =>
                                                            manualLinks[c2.ID] === e.ID_Caseta ||
                                                            (c2.idCaseta?.toString()) === (e.ID_Caseta?.toString()) ||
                                                            (c2.Caseta && e.Nombre_IAVE && c2.Caseta.toUpperCase().includes(e.Nombre_IAVE.toUpperCase())) ||
                                                            (c2.Caseta && e.Nombre && c2.Caseta.toUpperCase().includes(e.Nombre.toUpperCase()))
                                                        );
                                                        const coveredByOutOfRange = outOfRange.some((oc, oi) => oi < i && manualLinks[oc.ID] === e.ID_Caseta);
                                                        return !coveredByCrossed && !coveredByOutOfRange;
                                                    });

                                                    return (
                                                        <tr key={tc.ID} className={manualLinks[tc.ID] ? 'table-success' : ''}>
                                                            <td className="align-middle"><strong>{tc.Caseta}</strong></td>
                                                            <td className="align-middle text-nowrap">
                                                                {new Date(tc.Fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
                                                            </td>
                                                            <td className="text-center align-middle font-weight-bold">
                                                                ${parseFloat(tc.Importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="align-middle">
                                                                {manualLinks[tc.ID] ? (
                                                                    <div className="d-flex align-items-center">
                                                                        <span className="badge badge-success mr-2">
                                                                            <i className="fas fa-check mr-1"></i>
                                                                            {casetasData.expected.find(e => e.ID_Caseta === manualLinks[tc.ID])?.Nombre_IAVE || 'Vinculado'}
                                                                        </span>
                                                                        <button
                                                                            className="btn btn-sm btn-outline-secondary"
                                                                            onClick={() => handleLinkCruce(tc.ID, null)}
                                                                            title="Quitar vínculo"
                                                                        >
                                                                            <i className="fas fa-times"></i>
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <select
                                                                        className="form-control form-control-sm"
                                                                        value=""
                                                                        onChange={(e) => handleLinkCruce(tc.ID, parseInt(e.target.value))}
                                                                    >
                                                                        <option value="" disabled>Vincular y asignar a {casetasData.ot}...</option>
                                                                        {unfulfilledExpected.map(pend => (
                                                                            <option key={pend.ID_Caseta} value={pend.ID_Caseta}>
                                                                                {pend.Nombre_IAVE || pend.Nombre || pend.Caseta}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {Object.keys(manualLinks).length > 0 && (
                        <div className="mr-auto">
                           <span className="text-warning small"><i className="fas fa-info-circle mr-1"></i>Tienes {Object.keys(manualLinks).length} cambio(s) sin guardar</span>
                        </div>
                    )}
                    <Button variant="secondary" onClick={() => { setShowCasetasModal(false); setManualLinks({}); setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('ot'); return next; }); }} disabled={savingLinks}>
                        Cerrar
                    </Button>
                    {Object.keys(manualLinks).length > 0 && (
                        <Button variant="primary" onClick={handleSaveLinks} disabled={savingLinks}>
                            {savingLinks ? (
                                <span><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</span>
                            ) : (
                                <span><i className="fas fa-save mr-2"></i>Guardar Conciliación</span>
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Panel flotante: Editar casetas de la ruta */}
            {showEditRutaPanel && (
                <EditRutaPanel
                    id_tipo_ruta={casetasData.id_tipo_ruta}
                    ot={casetasData.ot}
                    initialCasetas={casetasData.expected}
                    onClose={() => setShowEditRutaPanel(false)}
                    onSaved={() => {
                        setShowEditRutaPanel(false);
                        handleOpenCasetas(casetasData.ot, casetasData.id_tipo_ruta, casetasData.tag, casetasData.id_clave, casetasData.id_usuario);
                    }}
                />
            )}
        </div>
    );
};

export default TrackingModule;