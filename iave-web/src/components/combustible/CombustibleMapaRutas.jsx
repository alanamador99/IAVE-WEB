import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Card, Badge, Spinner, Alert, Button, Modal, Form
} from 'react-bootstrap';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Fuel, Upload, Settings, Download, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

// ── helpers ─────────────────────────────────────────────────────────────────

const formatNum = (n) =>
    n == null ? '—' : Number(n).toLocaleString('es-MX');

const formatLitros = (n) => {
    if (n == null) return '—';
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k L` : `${n} L`;
};

// ── geo helpers ──────────────────────────────────────────────────────────────
const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
            + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
            * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Distance (km) from point P to line segment A→B (approximate, Euclidean projection)
const distPointToSegmentKm = (pLat, pLon, aLat, aLon, bLat, bLon) => {
    const dx = bLon - aLon, dy = bLat - aLat;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return haversineKm(pLat, pLon, aLat, aLon);
    const t = Math.max(0, Math.min(1, ((pLon - aLon) * dx + (pLat - aLat) * dy) / lenSq));
    return haversineKm(pLat, pLon, aLat + t * dy, aLon + t * dx);
};

const getRouteStyle = (trips, maxTrips) => {
    const ratio = maxTrips > 0 ? trips / maxTrips : 0;
    if (ratio >= 0.75) return { color: '#dc3545', weight: 7, opacity: 0.95 };
    if (ratio >= 0.5)  return { color: '#fd7e14', weight: 5, opacity: 0.9  };
    if (ratio >= 0.25) return { color: '#ffc107', weight: 3, opacity: 0.85 };
    return                    { color: '#17a2b8', weight: 2, opacity: 0.75 };
};

const getBadgeVariant = (ratio) => {
    if (ratio >= 0.75) return 'danger';
    if (ratio >= 0.5)  return 'warning';
    if (ratio >= 0.25) return 'secondary';
    return 'info';
};

const SAKBE_KEY = 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';

// Converts INEGI Sakbe GeoJSON (MultiLineString/LineString) → Leaflet [[lat,lng],...] segment arrays
const convertirCoordenadasGeoJSON = (geojsonInput) => {
    try {
        const geojson = typeof geojsonInput === 'string' ? JSON.parse(geojsonInput) : geojsonInput;
        if (!geojson) return null;
        if (geojson.type === 'MultiLineString') {
            return geojson.coordinates.map(line => line.map(([lng, lat]) => [lat, lng]));
        }
        if (geojson.type === 'LineString') {
            return [geojson.coordinates.map(([lng, lat]) => [lat, lng])];
        }
    } catch { /* ignore */ }
    return null;
};

// Modal para seleccionar manualmente las poblaciones INEGI de una ruta
function RouteInegiModal({ route, onConfirm, onClose }) {
    const [origenQuery,   setOrigenQuery]   = useState(route?.Origen  || '');
    const [destinoQuery,  setDestinoQuery]  = useState(route?.Destino || '');
    const [origenResults, setOrigenResults] = useState([]);
    const [destinoResults,setDestinoResults]= useState([]);
    const [origenSel,     setOrigenSel]     = useState(null);
    const [destinoSel,    setDestinoSel]    = useState(null);
    const [loadingO,      setLoadingO]      = useState(false);
    const [loadingD,      setLoadingD]      = useState(false);
    const [submitting,    setSubmitting]    = useState(false);

    // Reset whenever a new route is loaded into the modal
    useEffect(() => {
        if (!route) return;
        setOrigenQuery(route.Origen  || '');
        setDestinoQuery(route.Destino || '');
        setOrigenSel(null);
        setDestinoSel(null);
        setOrigenResults([]);
        setDestinoResults([]);
    }, [route?.id_Tipo_ruta]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced INEGI search – origin
    useEffect(() => {
        if (!origenQuery || origenQuery.length < 2) { setOrigenResults([]); return; }
        const t = setTimeout(async () => {
            setLoadingO(true);
            try {
                const fd = new URLSearchParams({ buscar: origenQuery, type: 'json', num: 8, key: SAKBE_KEY });
                const res = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/buscadestino', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: fd,
                });
                const d = await res.json();
                setOrigenResults(d.data || []);
            } catch { setOrigenResults([]); }
            finally  { setLoadingO(false); }
        }, 380);
        return () => clearTimeout(t);
    }, [origenQuery]);

    // Debounced INEGI search – destination
    useEffect(() => {
        if (!destinoQuery || destinoQuery.length < 2) { setDestinoResults([]); return; }
        const t = setTimeout(async () => {
            setLoadingD(true);
            try {
                const fd = new URLSearchParams({ buscar: destinoQuery, type: 'json', num: 8, key: SAKBE_KEY });
                const res = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/buscadestino', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: fd,
                });
                const d = await res.json();
                setDestinoResults(d.data || []);
            } catch { setDestinoResults([]); }
            finally  { setLoadingD(false); }
        }, 380);
        return () => clearTimeout(t);
    }, [destinoQuery]);

    const handleConfirm = async () => {
        if (!origenSel || !destinoSel || submitting) return;
        setSubmitting(true);
        try {
            await onConfirm(origenSel.id_dest, destinoSel.id_dest);
            // onConfirm closes the modal (unmounts component) — do NOT reset state here
        } catch {
            // Only reset if fetch failed and the modal stays open
            setSubmitting(false);
        }
    };

    const ResultList = ({ results, loading, selected, onSelect }) => (
        <div style={{
            border: '1px solid #dee2e6', borderRadius: 4,
            maxHeight: 195, overflowY: 'auto', background: '#fff',
            fontSize: '11px',
        }}>
            {loading && (
                <div className="text-center p-2">
                    <Spinner animation="border" size="sm" style={{ width: 14, height: 14 }} />
                </div>
            )}
            {!loading && results.length === 0 && (
                <div className="text-muted text-center py-3" style={{ fontSize: '11px' }}>
                    Sin resultados
                </div>
            )}
            {results.map(item => (
                <div
                    key={item.id_dest}
                    onClick={() => onSelect(item)}
                    style={{
                        padding: '5px 8px',
                        cursor: 'pointer',
                        background: selected?.id_dest === item.id_dest ? '#cce5ff' : 'transparent',
                        borderBottom: '1px solid #f3f3f3',
                    }}
                >
                    <strong>{item.nombre}</strong>
                    {(item.nombre_mun || item.nombre_ent) && (
                        <span className="text-muted ml-1">
                            {[item.nombre_mun, item.nombre_ent].filter(Boolean).join(', ')}
                        </span>
                    )}
                    {item.tipo && (
                        <Badge variant="light" className="ml-1 border" style={{ fontSize: '9px' }}>
                            {item.tipo}
                        </Badge>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <Modal show={!!route} onHide={onClose} size="lg">
            <Modal.Header closeButton style={{ paddingBottom: '8px' }}>
                <Modal.Title style={{ fontSize: '14px' }}>
                    <i className="fas fa-map-marked-alt mr-2 text-primary" />
                    Seleccionar poblaciones INEGI
                    {route && (
                        <span className="text-muted ml-2" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                            — {route.Origen} → {route.Destino}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
                <div className="row">
                    {/* ── Origin ── */}
                    <div className="col-md-6 mb-2">
                        <Form.Label className="mb-1 font-weight-bold" style={{ fontSize: '11px', color: '#0069d9' }}>
                            <i className="fas fa-circle mr-1" style={{ fontSize: 7 }} />
                            Origen INEGI
                            <span className="text-muted font-weight-normal ml-1">({route?.Origen})</span>
                        </Form.Label>
                        <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Buscar ciudad, municipio..."
                            value={origenQuery}
                            onChange={e => { setOrigenQuery(e.target.value); setOrigenSel(null); }}
                            className="mb-1"
                        />
                        {origenSel && (
                            <div className="mb-1 px-2 py-1 rounded" style={{ background: '#cce5ff', fontSize: '11px' }}>
                                ✓ <strong>{origenSel.nombre}</strong>
                                <span className="text-muted ml-1">
                                    {[origenSel.nombre_mun, origenSel.nombre_ent].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                        <ResultList
                            results={origenResults}
                            loading={loadingO}
                            selected={origenSel}
                            onSelect={setOrigenSel}
                        />
                    </div>

                    {/* ── Destination ── */}
                    <div className="col-md-6 mb-2">
                        <Form.Label className="mb-1 font-weight-bold" style={{ fontSize: '11px', color: '#28a745' }}>
                            <i className="fas fa-map-pin mr-1" style={{ fontSize: 7 }} />
                            Destino INEGI
                            <span className="text-muted font-weight-normal ml-1">({route?.Destino})</span>
                        </Form.Label>
                        <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Buscar ciudad, municipio..."
                            value={destinoQuery}
                            onChange={e => { setDestinoQuery(e.target.value); setDestinoSel(null); }}
                            className="mb-1"
                        />
                        {destinoSel && (
                            <div className="mb-1 px-2 py-1 rounded" style={{ background: '#d4edda', fontSize: '11px' }}>
                                ✓ <strong>{destinoSel.nombre}</strong>
                                <span className="text-muted ml-1">
                                    {[destinoSel.nombre_mun, destinoSel.nombre_ent].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                        <ResultList
                            results={destinoResults}
                            loading={loadingD}
                            selected={destinoSel}
                            onSelect={setDestinoSel}
                        />
                    </div>
                </div>
                <small className="text-muted">
                    <i className="fas fa-info-circle mr-1" />
                    Busca y selecciona la localidad correcta para cada extremo.
                    INEGI usa nombres de ciudades, municipios o estados de México.
                </small>
            </Modal.Body>
            <Modal.Footer className="py-2">
                <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
                <Button
                    variant="primary"
                    size="sm"
                    disabled={!origenSel || !destinoSel || submitting}
                    onClick={handleConfirm}
                >
                    <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-route'} mr-1`} />
                    <span>{submitting ? 'Trazando...' : 'Trazar ruta'}</span>
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

// Forces Leaflet to recalculate map size after container resize (e.g. fullscreen toggle)
function MapResizer({ trigger }) {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 120);
        return () => clearTimeout(t);
    }, [trigger, map]);
    return null;
}

// Renders all checked routes; the focused one gets flyTo + auto-popup
function MapRoutesLayer({ checkedRoutes, focusedRoute, maxTrips, nearbyStations, routePolylines }) {
    const map         = useMap();
    const focusRef    = useRef(null);
    const prevFocusId = useRef(null);

    useEffect(() => {
        if (!focusedRoute) return;
        if (prevFocusId.current === focusedRoute.id_Tipo_ruta) return;
        prevFocusId.current = focusedRoute.id_Tipo_ruta;

        const midLat = (focusedRoute.LatOrigen  + focusedRoute.LatDestino) / 2;
        const midLng = (focusedRoute.LonOrigen + focusedRoute.LonDestino) / 2;
        if (midLat && midLng) map.flyTo([midLat, midLng], 7, { duration: 1.0 });

        const t = setTimeout(() => {
            if (focusRef.current) focusRef.current.openPopup();
        }, 350);
        return () => clearTimeout(t);
    }, [focusedRoute, map]);

    if (checkedRoutes.length === 0 && (!nearbyStations || nearbyStations.length === 0)) return null;

    return (
        <React.Fragment>
            {checkedRoutes.map(r => {
                const isFocused = focusedRoute?.id_Tipo_ruta === r.id_Tipo_ruta;
                const style     = getRouteStyle(r.TotalViajes2025, maxTrips);
                const color     = isFocused ? '#6f42c1' : style.color;
                const weight    = isFocused ? style.weight + 3 : style.weight;
                const opacity   = isFocused ? 1 : style.opacity;

                // Use real road polyline from INEGI if available, else straight-line fallback
                const polyData  = routePolylines?.[r.id_Tipo_ruta];
                const isReal    = polyData?.status === 'ready';
                const isLoading = polyData?.status === 'loading';
                const segments  = isReal
                    ? polyData.coords
                    : [[[r.LatOrigen, r.LonOrigen], [r.LatDestino, r.LonDestino]]];
                // Dashed while still loading; dotted when permanently using straight-line fallback
                const dashArray = isLoading ? '8 6' : (isReal ? undefined : '5 4');

                return (
                    <React.Fragment key={r.id_Tipo_ruta}>
                        {segments.map((seg, si) => (
                            <Polyline
                                key={`seg-${si}`}
                                ref={isFocused && si === 0 ? focusRef : null}
                                positions={seg}
                                pathOptions={{ color, weight, opacity, dashArray }}
                            >
                                {si === 0 && (
                                    <Popup>
                                <div style={{ minWidth: '200px', fontSize: '12px' }}>
                                    <strong style={{ fontSize: '13px' }}>
                                        {r.Origen} → {r.Destino}
                                    </strong>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                        {r.NombreOrigen} → {r.NombreDestino}
                                    </div>
                                    <hr style={{ margin: '5px 0' }} />
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {[
                                                ['Viajes 2025',    <strong>{r.TotalViajes2025}</strong>],
                                                ['Distancia',      `${r.Km_reales || '?'} km`],
                                                ['Km totales',     formatNum(Math.round((parseFloat(r.Km_reales) || 0) * r.TotalViajes2025)) + ' km'],
                                                ['Est. Acumulado', <span style={{ color: '#17a2b8' }}><strong>{formatNum(r.estAcum)} L</strong></span>],
                                                ['Est. por viaje', `${formatNum(r.estProm)} L`],
                                                ...(r.realAcum != null ? [['Real acumulado', <span style={{ color: '#28a745' }}><strong>{formatNum(r.realAcum)} L</strong></span>]] : []),
                                                ...(r.realProm != null ? [['Real por viaje',  <span style={{ color: '#28a745' }}><strong>{formatNum(r.realProm)} L</strong></span>]] : []),
                                                ['ID Ruta',        r.id_Tipo_ruta],
                                                ...(r.Alterna ? [['Tipo', <Badge variant="warning" style={{ fontSize: '10px' }}>Alterna</Badge>]] : []),
                                            ].map(([lbl, val], i) => (
                                                <tr key={i}>
                                                    <td style={{ paddingRight: '8px', color: '#6c757d' }}>{lbl}:</td>
                                                    <td>{val}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                    </Popup>
                                )}
                            </Polyline>
                        ))}
                        <CircleMarker
                            center={[r.LatOrigen, r.LonOrigen]}
                            radius={isFocused ? 8 : 5}
                            pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
                        />
                        <CircleMarker
                            center={[r.LatDestino, r.LonDestino]}
                            radius={isFocused ? 8 : 5}
                            pathOptions={{ color, fillColor: '#fff', fillOpacity: 1, weight: isFocused ? 3 : 2 }}
                        />
                    </React.Fragment>
                );
            })}
            {/* ── OXXO Gas stations ── */}
            {nearbyStations && nearbyStations.map((st, idx) => (
                <CircleMarker
                    key={`st-${idx}`}
                    center={[st.lat, st.lon]}
                    radius={6}
                    pathOptions={{ color: '#e65100', fillColor: '#ff6f00', fillOpacity: 0.9, weight: 1.5 }}
                >
                    <Popup>
                        <div style={{ fontSize: '12px', minWidth: '140px' }}>
                            <strong style={{ color: '#e65100' }}>⛽ OXXO Gas</strong>
                            <div style={{ marginTop: 4 }}>{st.name}</div>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </React.Fragment>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

const CombustibleMapaRutas = () => {
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [routes, setRoutes]                 = useState([]);
    const [rendimiento, setRendimiento]       = useState(2.5); // km/L (rendimiento del vehículo)
    const [selectedRoute, setSelectedRoute]   = useState(null);
    const [checkedIds, setCheckedIds]         = useState(new Set()); // ids mostrados en el mapa
    const [showSettings, setShowSettings]     = useState(false);
    const [filterText, setFilterText]         = useState('');
    const [sortConfig, setSortConfig]         = useState({ key: 'TotalViajes2025', dir: 'desc' });

    // OXXO stations state
    const [stations, setStations]             = useState([]);
    const [loadingStations, setLoadingStations] = useState(false);
    const [showStations, setShowStations]     = useState(false);
    const [corridorKm, setCorridorKm]         = useState(50);  // km corridor radius
    const [mapFullscreen, setMapFullscreen]   = useState(false);

    // INEGI Sakbe road polyline cache: { [id_Tipo_ruta]: { status: 'loading'|'ready'|'error', coords? } }
    const [routePolylines, setRoutePolylines] = useState({});
    const fetchingIdsRef                      = useRef(new Set());
    const [inegiModalRoute, setInegiModalRoute] = useState(null); // route shown in INEGI selector modal

    // Close fullscreen on Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setMapFullscreen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Excel import state
    const fileInputRef                        = useRef(null);
    const [excelHeaders, setExcelHeaders]     = useState([]);
    const [excelRows, setExcelRows]           = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [colRuta, setColRuta]               = useState('');
    const [colLitros, setColLitros]           = useState('');
    const [excelMapped, setExcelMapped]       = useState(null); // { routeKey -> litros acumulados }

    // ── fetch ──────────────────────────────────────────────────────────────
    const fetchRoutes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_URL}/api/casetas/analisis/combustible-2025`);
            setRoutes(data);
            setCheckedIds(new Set());
            setSelectedRoute(null);
        } catch (err) {
            setError('Error al cargar datos: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

    // ── OXXO stations fetch (lazy: only when user enables the layer) ───────
    useEffect(() => {
        if (!showStations || stations.length > 0) return;
        const load = async () => {
            setLoadingStations(true);
            try {
                const { data } = await axios.get(`${API_URL}/api/casetas/analisis/oxxo-stations`);
                setStations(data);
            } catch (err) {
                console.error('Error cargando estaciones OXXO:', err);
            } finally {
                setLoadingStations(false);
            }
        };
        load();
    }, [showStations, stations.length]);

    // ── INEGI Sakbe polyline fetching ──────────────────────────────────────
    const fetchPolylineForRoute = useCallback(async (route) => {
        const id = route.id_Tipo_ruta;
        if (fetchingIdsRef.current.has(id)) return;
        fetchingIdsRef.current.add(id);
        setRoutePolylines(prev => ({ ...prev, [id]: { status: 'loading' } }));
        try {
            const sakbeSearch = async (query) => {
                const fd = new URLSearchParams({ buscar: query, type: 'json', num: 5, key: SAKBE_KEY });
                const res = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/buscadestino', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: fd
                });
                const d = await res.json();
                return d.data || [];
            };

            const [origenes, destinos] = await Promise.all([
                sakbeSearch(route.Origen),
                sakbeSearch(route.Destino)
            ]);

            const origenId  = origenes?.[0]?.id_dest;
            const destinoId = destinos?.[0]?.id_dest;
            if (!origenId || !destinoId) throw new Error(`IDs no encontrados (${route.Origen}→${route.Destino})`);

            const fd = new URLSearchParams({ dest_i: origenId, dest_f: destinoId, v: '5', e: '0', type: 'json', key: SAKBE_KEY });
            const res = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/optima', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: fd
            });
            const data    = await res.json();
            const geojson = data?.data?.geojson;
            if (!geojson) throw new Error('Sin geojson en respuesta INEGI');

            const coords = convertirCoordenadasGeoJSON(geojson);
            if (!coords) throw new Error('GeoJSON no reconocido');

            setRoutePolylines(prev => ({ ...prev, [id]: { status: 'ready', coords } }));
        } catch (err) {
            console.warn(`Ruta real no disponible (${route.Origen}→${route.Destino}): ${err.message}`);
            setRoutePolylines(prev => ({ ...prev, [id]: { status: 'error' } }));
        } finally {
            fetchingIdsRef.current.delete(id);
        }
    }, []);

    // Trigger polyline fetch whenever a new route is checked
    useEffect(() => {
        checkedRoutes.forEach(r => {
            if (!routePolylines[r.id_Tipo_ruta] && !fetchingIdsRef.current.has(r.id_Tipo_ruta)) {
                fetchPolylineForRoute(r);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkedIds, fetchPolylineForRoute]);

    // Fetch polyline from INEGI using explicitly-provided locality IDs (from the modal)
    const fetchPolylineWithIds = useCallback(async (route, origenId, destinoId) => {
        const id = route.id_Tipo_ruta;
        fetchingIdsRef.current.add(id);
        setRoutePolylines(prev => ({ ...prev, [id]: { status: 'loading' } }));
        try {
            const fd = new URLSearchParams({ dest_i: origenId, dest_f: destinoId, v: '5', e: '0', type: 'json', key: SAKBE_KEY });
            const res = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/optima', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: fd,
            });
            const data    = await res.json();
            const geojson = data?.data?.geojson;
            if (!geojson) throw new Error('Sin geojson en respuesta INEGI');
            const coords = convertirCoordenadasGeoJSON(geojson);
            if (!coords) throw new Error('GeoJSON no reconocido');
            setRoutePolylines(prev => ({ ...prev, [id]: { status: 'ready', coords } }));
        } catch (err) {
            console.warn(`Error al trazar ruta con IDs (${route.Origen}→${route.Destino}):`, err.message);
            setRoutePolylines(prev => ({ ...prev, [id]: { status: 'error' } }));
        } finally {
            fetchingIdsRef.current.delete(id);
        }
    }, []);

    // ── derived data ────────────────────────────────────────────────────────
    const maxTrips = useMemo(
        () => Math.max(...routes.map(r => r.TotalViajes2025 || 0), 1),
        [routes]
    );

    const processedRoutes = useMemo(() => routes.map(r => {
        const km    = parseFloat(r.Km_reales)  || 0;
        const trips = r.TotalViajes2025        || 0;
        // rendimiento en km/L → litros por viaje = km / rendimiento
        const estProm = (km > 0 && rendimiento > 0) ? Math.round(km / rendimiento) : 0;
        const estAcum = Math.round(trips * estProm);

        let realAcum = null;
        let realProm = null;
        if (excelMapped) {
            const key = `${(r.Origen || '').toLowerCase()}_${(r.Destino || '').toLowerCase()}`;
            realAcum = excelMapped[key] ?? null;
            realProm = (realAcum != null && trips > 0) ? Math.round(realAcum / trips) : null;
        }
        return { ...r, estAcum, estProm, realAcum, realProm,
                 LatOrigen: parseFloat(r.LatOrigen), LonOrigen: parseFloat(r.LonOrigen),
                 LatDestino: parseFloat(r.LatDestino), LonDestino: parseFloat(r.LonDestino) };
    }), [routes, rendimiento, excelMapped]);

    // Bounding box República Mexicana
    const inMexico = (lat, lon) =>
        lat  >= 14.5  && lat  <= 32.7  &&
        lon  >= -118.5 && lon  <= -86.7;

    const validRoutes = useMemo(
        () => processedRoutes.filter(r =>
            r.LatOrigen  && r.LonOrigen  &&
            r.LatDestino && r.LonDestino &&
            inMexico(r.LatOrigen, r.LonOrigen) &&
            inMexico(r.LatDestino, r.LonDestino)
        ),
        [processedRoutes]
    );

    const validIds = useMemo(
        () => new Set(validRoutes.map(r => r.id_Tipo_ruta)),
        [validRoutes]
    );

    const checkedRoutes = useMemo(
        () => validRoutes.filter(r => checkedIds.has(r.id_Tipo_ruta)),
        [validRoutes, checkedIds]
    );

    const filteredRoutes = useMemo(() => {
        if (!filterText) return processedRoutes;
        const q = filterText.toLowerCase();
        return processedRoutes.filter(r =>
            (r.Origen || '').toLowerCase().includes(q) ||
            (r.Destino || '').toLowerCase().includes(q) ||
            (r.NombreOrigen || '').toLowerCase().includes(q) ||
            (r.NombreDestino || '').toLowerCase().includes(q)
        );
    }, [processedRoutes, filterText]);

    const sortedRoutes = useMemo(() => {
        const { key, dir } = sortConfig;
        return [...filteredRoutes].sort((a, b) => {
            let aVal = key === 'Km_reales' ? (parseFloat(a[key]) || 0)
                     : key === 'Ruta'     ? `${a.Origen}_${a.Destino}`
                     : (a[key] ?? 0);
            let bVal = key === 'Km_reales' ? (parseFloat(b[key]) || 0)
                     : key === 'Ruta'     ? `${b.Origen}_${b.Destino}`
                     : (b[key] ?? 0);
            if (aVal < bVal) return dir === 'asc' ? -1 : 1;
            if (aVal > bVal) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredRoutes, sortConfig]);

    // OXXO stations within corridorKm of any checked route
    const nearbyStations = useMemo(() => {
        if (!showStations || stations.length === 0) return [];
        // No routes checked → show all stations so the network is visible
        if (checkedRoutes.length === 0) return stations;
        // Routes checked → filter to corridor using real polyline when available
        return stations.filter(st =>
            checkedRoutes.some(r => {
                const polyData = routePolylines[r.id_Tipo_ruta];
                if (polyData?.status === 'ready' && polyData.coords?.length > 0) {
                    // Check against each segment of the real road polyline
                    return polyData.coords.some(line =>
                        line.some((pt, i) => {
                            if (i === 0) return false;
                            return distPointToSegmentKm(
                                st.lat, st.lon,
                                line[i - 1][0], line[i - 1][1],
                                pt[0], pt[1]
                            ) <= corridorKm;
                        })
                    );
                }
                // Fallback: straight line between endpoints
                return distPointToSegmentKm(
                    st.lat, st.lon,
                    r.LatOrigen, r.LonOrigen,
                    r.LatDestino, r.LonDestino
                ) <= corridorKm;
            })
        );
    }, [showStations, stations, checkedRoutes, corridorKm, routePolylines]);

    const handleSort = (key) =>
        setSortConfig(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));

    const SortIcon = ({ col }) => (
        <span style={{ marginLeft: 3, opacity: sortConfig.key === col ? 1 : 0.25, fontSize: '9px' }}>
            {sortConfig.key === col ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
    );

    const kpis = useMemo(() => {
        // When routes are checked → show stats for selection; otherwise show totals
        const src = checkedIds.size > 0 ? checkedRoutes : processedRoutes;
        const isFiltered = checkedIds.size > 0;
        return {
            isFiltered,
            totalViajes:  src.reduce((s, r) => s + (r.TotalViajes2025 || 0), 0),
            totalKm:      Math.round(src.reduce((s, r) => s + (parseFloat(r.Km_reales) || 0) * (r.TotalViajes2025 || 0), 0)),
            totalEstLit:  src.reduce((s, r) => s + r.estAcum, 0),
            totalRealLit: excelMapped ? src.reduce((s, r) => s + (r.realAcum || 0), 0) : null,
            rutasActivas: isFiltered ? checkedIds.size : processedRoutes.length,
        };
    }, [checkedIds, checkedRoutes, processedRoutes, excelMapped]);

    // ── Excel import ───────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb   = XLSX.read(evt.target.result, { type: 'binary' });
            const ws   = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (data.length > 1) {
                setExcelHeaders(data[0].map(String));
                setExcelRows(data.slice(1));
                setColRuta('');
                setColLitros('');
                setShowImportModal(true);
            }
        };
        reader.readAsBinaryString(file);
        // Reset input so the same file can be re-imported
        e.target.value = '';
    };

    const applyMapping = () => {
        if (!colRuta || !colLitros) return;
        const rIdx = excelHeaders.indexOf(colRuta);
        const lIdx = excelHeaders.indexOf(colLitros);
        if (rIdx < 0 || lIdx < 0) return;

        // Aggregate Excel data by route name
        const rawMap = {};
        excelRows.forEach(row => {
            const rutaRaw = String(row[rIdx] || '').trim().toLowerCase();
            const litros  = parseFloat(row[lIdx]) || 0;
            if (rutaRaw) rawMap[rutaRaw] = (rawMap[rutaRaw] || 0) + litros;
        });

        // Match Excel keys to route Origen/Destino by substring
        const finalMap = {};
        processedRoutes.forEach(r => {
            const key     = `${(r.Origen || '').toLowerCase()}_${(r.Destino || '').toLowerCase()}`;
            const origenL = (r.Origen  || '').toLowerCase();
            const destiL  = (r.Destino || '').toLowerCase();
            Object.entries(rawMap).forEach(([exKey, litros]) => {
                if (exKey.includes(origenL) || exKey.includes(destiL)) {
                    finalMap[key] = (finalMap[key] || 0) + litros;
                }
            });
        });

        setExcelMapped(Object.keys(finalMap).length > 0 ? finalMap : rawMap);
        setShowImportModal(false);
    };

    // ── Excel export ───────────────────────────────────────────────────────
    const handleExport = () => {
        const rows = filteredRoutes.map((r, i) => ({
            '#': i + 1,
            'ID Ruta': r.id_Tipo_ruta,
            Origen: r.Origen,
            Destino: r.Destino,
            'Terminal Origen': r.NombreOrigen,
            'Terminal Destino': r.NombreDestino,
            'Km Reales': r.Km_reales || 0,
            'Viajes 2025': r.TotalViajes2025,
            'Km Totales': Math.round((parseFloat(r.Km_reales) || 0) * r.TotalViajes2025),
            [`Est. Litros/Viaje (${rendimiento}km/L)`]: r.estProm,
            [`Est. Litros Acum. (${rendimiento}km/L)`]: r.estAcum,
            'Real Litros Acum. (Excel)': r.realAcum ?? '',
            'Real Litros/Viaje (Excel)': r.realProm ?? '',
            Alterna: r.Alterna ? 'Sí' : 'No',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Combustible 2025');
        XLSX.writeFile(wb, `Consumo_Combustible_Rutas_2025_${rendimiento}kmL.xlsx`);
    };

    // ── render ─────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
                <Spinner animation="border" variant="primary" style={{ width: '3.5rem', height: '3.5rem' }} />
                <p className="mt-3 text-muted">Cargando rutas 2025...</p>
            </div>
        </div>
    );

    return (
        <div className="container-fluid px-3 py-2">

            {/* ── Header ── */}
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                <div>
                    <h4 className="mb-0 text-gray-800 font-weight-bold">
                        <i className="fas fa-gas-pump mr-2 text-primary" />
                        Mapa de Consumo — Rutas 2025
                    </h4>
                    <small className="text-muted">
                        Rendimiento a <strong>{rendimiento} km/L</strong>&nbsp;·&nbsp;
                        {routes.length} rutas&nbsp;·&nbsp;
                        {validRoutes.length} con coordenadas
                        {excelMapped && <Badge variant="success" className="ml-2">Excel cargado</Badge>}
                    </small>
                </div>
                <div className="mt-1">
                    <Button variant="outline-secondary" size="sm" className="mr-1"
                        onClick={() => setShowSettings(s => !s)}>
                        <Settings size={13} className="mr-1" /> Config.
                    </Button>
                    <Button variant="outline-success" size="sm" className="mr-1"
                        onClick={() => fileInputRef.current?.click()}>
                        <Upload size={13} className="mr-1" /> Importar Excel
                    </Button>
                    <Button variant="outline-info" size="sm" className="mr-1"
                        onClick={handleExport} disabled={filteredRoutes.length === 0}>
                        <Download size={13} className="mr-1" /> Exportar
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={fetchRoutes}>
                        <RefreshCw size={13} />
                    </Button>
                    <Button
                        variant={showStations ? 'warning' : 'outline-warning'}
                        size="sm"
                        className="ml-1"
                        title="Mostrar estaciones OXXO Gas en el corredor de las rutas seleccionadas"
                        onClick={() => setShowStations(s => !s)}
                    >
                        {loadingStations
                            ? <Spinner animation="border" size="sm" style={{ width: 13, height: 13 }} />
                            : <>⛽</>}
                        {' '}{showStations ? `${nearbyStations.length} estaciones` : 'OXXO Gas'}
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
                        className="d-none" onChange={handleFileChange} />
                </div>
            </div>

            {/* ── Settings panel ── */}
            {showSettings && (
                <Card className="mb-2 border-primary shadow-sm">
                    <Card.Body className="py-2">
                        <div className="d-flex align-items-center flex-wrap" style={{ gap: '12px' }}>
                            <label className="mb-0 font-weight-bold text-nowrap" style={{ fontSize: '13px' }}>
                                <Fuel size={13} className="mr-1 text-primary" />
                                Rendimiento del vehículo:
                            </label>
                            <input type="range" min="1" max="6" step="0.1"
                                value={rendimiento}
                                onChange={e => setRendimiento(Number(e.target.value))}
                                style={{ width: '200px' }} />
                            <Badge variant="primary" className="px-2" style={{ fontSize: '13px' }}>
                                {rendimiento} km/L
                            </Badge>
                            <small className="text-muted">
                                (Referencia: ~2–3 km/L camión 5 ejes cargado)
                            </small>
                        </div>
                        {showStations && (
                            <div className="d-flex align-items-center flex-wrap mt-2" style={{ gap: '12px' }}>
                                <label className="mb-0 font-weight-bold text-nowrap" style={{ fontSize: '13px' }}>
                                    ⛽ Radio del corredor OXXO:
                                </label>
                                <input type="range" min="10" max="200" step="5"
                                    value={corridorKm}
                                    onChange={e => setCorridorKm(Number(e.target.value))}
                                    style={{ width: '160px' }} />
                                <Badge variant="warning" className="px-2" style={{ fontSize: '13px' }}>
                                    {corridorKm} km
                                </Badge>
                                <small className="text-muted">
                                    Estaciones a ≤{corridorKm} km del trazado de la ruta
                                </small>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {/* ── KPI Cards ── */}
            <div className="row mb-2">
                {[
                    {
                        label: kpis.isFiltered ? 'Viajes (Selección)' : 'Viajes 2025',
                        value: formatNum(kpis.totalViajes),
                        color: 'primary', icon: 'fa-truck'
                    },
                    {
                        label: kpis.isFiltered ? 'Km (Selección)' : 'Km Recorridos',
                        value: `${formatNum(kpis.totalKm)} km`,
                        color: 'success', icon: 'fa-road'
                    },
                    {
                        label: kpis.isFiltered ? 'Litros Est. (Selección)' : 'Litros Est. (Acum.)',
                        value: formatNum(kpis.totalEstLit) + ' L',
                        color: 'info', icon: 'fa-gas-pump'
                    },
                    {
                        label: excelMapped
                            ? (kpis.isFiltered ? 'Litros Real (Selección)' : 'Litros Real (Excel)')
                            : (kpis.isFiltered ? `${checkedIds.size} de ${processedRoutes.length} rutas` : 'Rutas Activas'),
                        value: excelMapped
                            ? formatNum(kpis.totalRealLit) + ' L'
                            : kpis.rutasActivas,
                        color: excelMapped ? 'warning' : (kpis.isFiltered ? 'primary' : 'secondary'),
                        icon: excelMapped ? 'fa-chart-bar' : (kpis.isFiltered ? 'fa-check-square' : 'fa-map-marked-alt')
                    },
                ].map(({ label, value, color, icon }) => (
                    <div key={label} className="col-6 col-md-3 mb-2">
                        <Card className={`border-left-${color} shadow-sm h-100`}>
                            <Card.Body className="py-2 px-3">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div className={`text-xs font-weight-bold text-${color} text-uppercase mb-1`}
                                            style={{ fontSize: '10px' }}>{label}</div>
                                        <div className="h6 mb-0 font-weight-bold text-gray-800">{value}</div>
                                    </div>
                                    <i className={`fas ${icon} fa-lg text-${color}`} style={{ opacity: 0.3 }} />
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>

            {/* ── Main content: Map + Table ── */}
            <div className="row" style={{ height: '62vh', minHeight: '450px' }}>

                {/* Map */}
                <div
                    className={mapFullscreen ? '' : 'col-lg-7 h-100 pr-lg-1 mb-2 mb-lg-0'}
                    style={mapFullscreen ? {
                        position: 'fixed', inset: 0,
                        zIndex: 9999,
                        background: '#fff',
                        padding: 0,
                    } : {}}
                >
                    <Card className="shadow h-100">
                        <Card.Body className="p-0 h-100" style={{ position: 'relative' }}>
                            <MapContainer
                                center={[23.6, -102.5]}
                                zoom={5}
                                style={{ height: '100%', width: '100%', borderRadius: '0 0 4px 4px' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <MapResizer trigger={mapFullscreen} />
                                <MapRoutesLayer
                                    checkedRoutes={checkedRoutes}
                                    focusedRoute={selectedRoute}
                                    maxTrips={maxTrips}
                                    nearbyStations={nearbyStations}
                                    routePolylines={routePolylines}
                                />
                            </MapContainer>

                            {/* Fullscreen toggle button */}
                            <button
                                onClick={() => setMapFullscreen(f => !f)}
                                title={mapFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}
                                style={{
                                    position: 'absolute',
                                    top: 10, right: 10,
                                    zIndex: 1000,
                                    background: 'rgba(255,255,255,0.92)',
                                    border: '1px solid #ced4da',
                                    borderRadius: 4,
                                    padding: '4px 7px',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                                    lineHeight: 1,
                                }}
                            >
                                {mapFullscreen
                                    ? <Minimize2 size={15} style={{ color: '#495057' }} />
                                    : <Maximize2 size={15} style={{ color: '#495057' }} />}
                            </button>

                            {/* Placeholder when nothing is checked */}
                            {checkedIds.size === 0 && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    pointerEvents: 'none', zIndex: 500,
                                }}>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.88)',
                                        borderRadius: '8px',
                                        padding: '10px 18px',
                                        fontSize: '13px',
                                        color: '#6c757d',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                        textAlign: 'center',
                                    }}>
                                        <i className="fas fa-hand-pointer mr-2 text-primary" />
                                        Selecciona una ruta del panel para visualizarla
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>

                {/* Stats / Route Table */}
                <div className="col-lg-5 h-100 pl-lg-1">
                    <Card className="shadow h-100 d-flex flex-column">
                        <Card.Header className="py-2 px-3">
                            <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '6px' }}>
                                <h6 className="mb-0 font-weight-bold text-primary" style={{ fontSize: '13px' }}>
                                    Rutas por Viajes — 2025
                                </h6>
                                <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Buscar..."
                                        style={{ width: '110px' }}
                                        value={filterText}
                                        onChange={e => setFilterText(e.target.value)}
                                    />
                                    {checkedIds.size > 0 && (
                                        <button
                                            className="btn btn-outline-danger btn-sm py-0 px-1"
                                            style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                                            title="Quitar todas las rutas del mapa"
                                            onClick={() => { setCheckedIds(new Set()); setSelectedRoute(null); }}
                                        >
                                            ✕ {checkedIds.size}
                                        </button>
                                    )}
                                    {/* Color legend */}
                                    <div className="d-flex align-items-center" style={{ gap: '3px', fontSize: '10px' }}>
                                        {[['#17a2b8','<25%'],['#ffc107','25-50%'],['#fd7e14','50-75%'],['#dc3545','>75%']].map(([c, l]) => (
                                            <span key={c} title={l} style={{ background: c, display: 'inline-block', width: 10, height: 10, borderRadius: 2, cursor: 'help' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card.Header>
                        {/* Tabla de las rutas */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table className="table table-sm table-hover mb-0" style={{ fontSize: '11px' }}>
                                <thead className="thead-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr>
                                        <th style={{ width: '26px', textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                title="Seleccionar / deseleccionar todas las visibles con coordenadas"
                                                style={{ cursor: 'pointer' }}
                                                checked={
                                                    filteredRoutes.filter(r => validIds.has(r.id_Tipo_ruta)).length > 0 &&
                                                    filteredRoutes.filter(r => validIds.has(r.id_Tipo_ruta)).every(r => checkedIds.has(r.id_Tipo_ruta))
                                                }
                                                onChange={e => {
                                                    const visibles = filteredRoutes.filter(r => validIds.has(r.id_Tipo_ruta));
                                                    setCheckedIds(prev => {
                                                        const next = new Set(prev);
                                                        visibles.forEach(r => e.target.checked ? next.add(r.id_Tipo_ruta) : next.delete(r.id_Tipo_ruta));
                                                        return next;
                                                    });
                                                }}
                                            />
                                        </th>
                                        <th style={{ width: '22px' }}>#</th>
                                        <th style={{ cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleSort('Ruta')}>
                                            Ruta<SortIcon col="Ruta" />
                                        </th>
                                        <th className="text-center" style={{ cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleSort('TotalViajes2025')}>
                                            Viajes<SortIcon col="TotalViajes2025" />
                                        </th>
                                        <th className="text-right" style={{ cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleSort('Km_reales')}>
                                            Km<SortIcon col="Km_reales" />
                                        </th>
                                        <th className="text-right" style={{ cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleSort('estAcum')}>
                                            Est. L<SortIcon col="estAcum" />
                                        </th>
                                        {excelMapped && (
                                            <th className="text-right" style={{ cursor: 'pointer', userSelect: 'none' }}
                                                onClick={() => handleSort('realAcum')}>
                                                Real L<SortIcon col="realAcum" />
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRoutes.map((r, i) => {
                                        const ratio      = r.TotalViajes2025 / maxTrips;
                                        const style      = getRouteStyle(r.TotalViajes2025, maxTrips);
                                        const isFocused  = selectedRoute?.id_Tipo_ruta === r.id_Tipo_ruta;
                                        const isChecked  = checkedIds.has(r.id_Tipo_ruta);
                                        const hasCoords  = validIds.has(r.id_Tipo_ruta);
                                        return (
                                            <tr
                                                key={r.id_Tipo_ruta}
                                                className={isFocused ? 'table-primary' : isChecked ? 'table-active' : ''}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    setSelectedRoute(r);
                                                    // Auto-check on click so the route appears on map
                                                    if (hasCoords) {
                                                        setCheckedIds(prev => {
                                                            if (prev.has(r.id_Tipo_ruta)) return prev;
                                                            return new Set([...prev, r.id_Tipo_ruta]);
                                                        });
                                                    }
                                                }}
                                                title={`${r.NombreOrigen} → ${r.NombreDestino}`}
                                            >
                                                <td
                                                    style={{ textAlign: 'center', verticalAlign: 'middle' }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        style={{ cursor: hasCoords ? 'pointer' : 'not-allowed' }}
                                                        disabled={!hasCoords}
                                                        checked={isChecked}
                                                        title={!hasCoords ? 'Sin coordenadas válidas en México' : ''}
                                                        onChange={e => {
                                                            setCheckedIds(prev => {
                                                                const next = new Set(prev);
                                                                if (e.target.checked) {
                                                                    next.add(r.id_Tipo_ruta);
                                                                } else {
                                                                    next.delete(r.id_Tipo_ruta);
                                                                    if (isFocused) setSelectedRoute(null);
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <span style={{
                                                        background: style.color,
                                                        display: 'inline-block',
                                                        width: 8, height: 8,
                                                        borderRadius: '50%', marginRight: 3
                                                    }} />
                                                    {i + 1}
                                                </td>
                                                <td>
                                                    <span className="text-primary">{r.Origen}</span>
                                                    {' → '}
                                                    <span className="text-success">{r.Destino}</span>
                                                    {r.Alterna && (
                                                        <Badge variant="warning" className="ml-1"
                                                            style={{ fontSize: '9px', padding: '1px 3px' }}>Alt</Badge>
                                                    )}
                                                    {isChecked && (() => {
                                                        const pd = routePolylines[r.id_Tipo_ruta];
                                                        const isLoading = pd?.status === 'loading';
                                                        const btnVariant = !pd || pd.status === 'error'
                                                            ? 'outline-warning'
                                                            : pd.status === 'ready'
                                                                ? 'outline-success'
                                                                : 'secondary';
                                                        const btnTitle = !pd
                                                            ? 'Consultando INEGI...'
                                                            : pd.status === 'ready'
                                                                ? 'Ruta real trazada ✓  Clic para corregir poblaciones'
                                                                : pd.status === 'loading'
                                                                    ? 'Consultando INEGI...'
                                                                    : 'No se pudo trazar. Clic para seleccionar poblaciones INEGI';
                                                        return (
                                                            <button
                                                                className={`btn btn-${btnVariant} btn-sm py-0 px-1 ml-1`}
                                                                style={{ fontSize: '9px', lineHeight: '1.3', verticalAlign: 'middle' }}
                                                                title={btnTitle}
                                                                disabled={isLoading}
                                                                onClick={e => { e.stopPropagation(); setInegiModalRoute(r); }}
                                                            >
                                                                {isLoading
                                                                    ? <Spinner animation="border" style={{ width: 8, height: 8, borderWidth: 1 }} />
                                                                    : pd?.status === 'ready' ? '🗺️'
                                                                    : pd?.status === 'error'  ? '⚠️'
                                                                    : '📍'}
                                                            </button>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="text-center">
                                                    <Badge variant={getBadgeVariant(ratio)} className='text-success bg-light' style={{ fontSize: '0.8rem' }}>
                                                        {r.TotalViajes2025}
                                                    </Badge>
                                                </td>
                                                <td className="text-right">{r.Km_reales || '—'}</td>
                                                <td className="text-right text-info font-weight-bold">
                                                    {r.estProm > 0 ? formatLitros(r.estAcum) : '—'}
                                                </td>
                                                {excelMapped && (
                                                    <td className="text-right text-success">
                                                        {r.realAcum != null ? formatLitros(Math.round(r.realAcum)) : '—'}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <Card.Footer className="py-1 px-3 text-muted d-flex justify-content-between" style={{ fontSize: '10px' }}>
                            <span>
                                {checkedIds.size > 0 && (
                                    <span className="text-primary font-weight-bold mr-2">
                                        {checkedIds.size} en mapa
                                    </span>
                                )}
                            </span>
                            <span>
                                {filteredRoutes.length} de {routes.length} rutas&nbsp;·&nbsp;
                                {rendimiento} km/L&nbsp;·&nbsp;
                                {routes.length - validRoutes.length} sin coords.
                            </span>
                        </Card.Footer>
                    </Card>
                </div>
            </div>

            {/* ── Excel Import Modal ── */}
            <Modal show={showImportModal} onHide={() => setShowImportModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: '15px' }}>
                        <Upload size={15} className="mr-2" />
                        Mapear columnas del Excel de combustible
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info" className="py-2" style={{ fontSize: '12px' }}>
                        Se detectaron <strong>{excelHeaders.length} columnas</strong> y{' '}
                        <strong>{excelRows.length} filas</strong> en la primera hoja.
                        Selecciona qué columnas corresponden a la ruta y a los litros consumidos.
                    </Alert>
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                    Columna de Ruta / Origen-Destino
                                </Form.Label>
                                <Form.Control as="select" size="sm" value={colRuta}
                                    onChange={e => setColRuta(e.target.value)}>
                                    <option value="">— Seleccionar —</option>
                                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                </Form.Control>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                    Columna de Litros / Combustible
                                </Form.Label>
                                <Form.Control as="select" size="sm" value={colLitros}
                                    onChange={e => setColLitros(e.target.value)}>
                                    <option value="">— Seleccionar —</option>
                                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                </Form.Control>
                            </Form.Group>
                        </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px' }}>
                        Vista previa (primeras 5 filas):
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm table-bordered mb-0" style={{ fontSize: '10px' }}>
                            <thead className="thead-light">
                                <tr>{excelHeaders.map(h => <th key={h}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {excelRows.slice(0, 5).map((row, i) => (
                                    <tr key={i}>
                                        {excelHeaders.map((_, j) => (
                                            <td key={j}>{row[j] ?? ''}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowImportModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" size="sm"
                        onClick={applyMapping}
                        disabled={!colRuta || !colLitros}>
                        Aplicar y cruzar datos
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── INEGI population selector modal ── */}
            <RouteInegiModal
                route={inegiModalRoute}
                onConfirm={async (origenId, destinoId) => {
                    await fetchPolylineWithIds(inegiModalRoute, origenId, destinoId);
                    setInegiModalRoute(null);
                }}
                onClose={() => setInegiModalRoute(null)}
            />

        </div>
    );
};

export default CombustibleMapaRutas;
