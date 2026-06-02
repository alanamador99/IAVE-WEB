import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Table, Button, Form, InputGroup, Spinner, Modal, Badge } from 'react-bootstrap';
import { Search, Save, CheckCircle, XCircle, Link2, ExternalLink, Filter } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

const CasetasPaseLinker = () => {
    const [casetas, setCasetas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchResults, setSearchResults] = useState({}); // { [id]: [resultados] }
    const [selectedPaseId, setSelectedPaseId] = useState({}); // { [id]: 'ID_SELECCIONADO' }
    const [savingStatus, setSavingStatus] = useState({}); // { [id]: 'saving' | 'success' | 'error' }
    const [showPendingOnly, setShowPendingOnly] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        fetchCasetas();
    }, []);

    const fetchCasetas = async () => {
        setLoading(true);
        try {
            // Endpoint que definimos en el backend
            const { data } = await axios.get(`${API_URL}/api/casetas/pase/cat-entidad`);
            setCasetas(data);

            // Inicializar seleccionados si ya existen en BD
            const initialSelected = {};
            data.forEach(c => {
                if (c.ID_PASE) initialSelected[c.ID_EntidadCaseta] = c.ID_PASE;
            });
            setSelectedPaseId(initialSelected);
        } catch (error) {
            console.error("Error cargando casetas:", error);
            alert("Error al cargar la lista de casetas");
        } finally {
            setLoading(false);
        }
    };

    // Buscar en API PASE (vía proxy backend)
    const handleSearch = async (casetaId, nombreBusqueda) => {
        if (!nombreBusqueda) return;

        setSearchResults(prev => ({ ...prev, [casetaId]: { loading: true, data: [] } }));

        try {
            const { data } = await axios.get(`${API_URL}/api/casetas/pase/search`, {
                params: { nombre: nombreBusqueda }
            });

            // Ensure data is an array
            const results = Array.isArray(data) ? data : [];

            setSearchResults(prev => ({
                ...prev,
                [casetaId]: { loading: false, data: results }
            }));
        } catch (error) {
            console.error("Error buscando en PASE:", error);
            setSearchResults(prev => ({
                ...prev,
                [casetaId]: { loading: false, error: true, data: [] }
            }));
        }
    };

    // Guardar ID seleccionado en BD
    const handleSave = async (casetaId) => {
        const paseId = selectedPaseId[casetaId];
        if (!paseId) return;

        setSavingStatus(prev => ({ ...prev, [casetaId]: 'saving' }));

        try {
            await axios.patch(`${API_URL}/api/casetas/pase/${casetaId}/update-id`, {
                paseId: paseId
            });
            setSavingStatus(prev => ({ ...prev, [casetaId]: 'success' }));

            // Actualizar estado local principal
            setCasetas(prev => prev.map(c =>
                c.ID_EntidadCaseta === casetaId ? { ...c, ID_PASE: paseId } : c
            ));

            setTimeout(() => {
                setSavingStatus(prev => {
                    const newState = { ...prev };
                    delete newState[casetaId];
                    return newState;
                });
            }, 2000);

        } catch (error) {
            console.error("Error guardando:", error);
            setSavingStatus(prev => ({ ...prev, [casetaId]: 'error' }));
        }
    };

    // Auto-buscar para todas las filas visibles que no tengan link
    const autoSearchAll = async () => {
        const sinLink = casetas.filter(c => !c.ID_PASE);
        if (!sinLink.length) return alert("Todas las casetas ya están vinculadas");

        if (!window.confirm(`Se buscarán coincidencias para ${sinLink.length} casetas. Esto puede tardar. ¿Continuar?`)) return;

        // Ejecutar en serie o lotes pequeños para no saturar
        for (const caseta of sinLink) {
            // Usar nombre de plantilla si existe, sino nombre de caseta
            const query = caseta.NombrePlantilla || caseta.NombreCaseta;
            await handleSearch(caseta.ID_EntidadCaseta, query);
            // Pequeña pausa
            await new Promise(r => setTimeout(r, 500));
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <div className="container-fluid">
            <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex justify-content-between align-items-center">
                    <h6 className="m-0 font-weight-bold text-primary">Vinculación de Casetas con PASE</h6>
                    <div>
                        <Button variant="info" size="sm" onClick={autoSearchAll} className="me-2">
                            <Search size={16} className="me-2" />
                            Auto-Buscar Pendientes
                        </Button>

                        <Button 
                            variant={showPendingOnly ? "warning" : "secondary"} 
                            size="sm" 
                            onClick={() => setShowPendingOnly(!showPendingOnly)}
                        >
                            <Filter size={16} className="me-2" />
                            {showPendingOnly ? 'Mostrar Todos' : 'Filtrar Pendientes'}
                        </Button>
                    </div>
                </div>
                <div className="card-body">
                    <div className="table-responsive table-container table-scroll">
                        <Table striped bordered hover size="sm">
                            <thead>
                                <tr>
                                    <th>ID Local</th>
                                    <th>Nombre Local (Catálogo)</th>
                                    <th>Costo Camion2Ejes</th>
                                    <th>Nombre Plantilla (Referencia)</th>
                                    <th>ID PASE (IAVE)</th>
                                    <th>Búsqueda y Selección</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {casetas
                                    .filter(c => !showPendingOnly || !c.ID_PASE) // Filtro condicional
                                    .map((caseta, idx) => {

                                    const searchState = searchResults[caseta.ID_EntidadCaseta] || {};
                                    const isSaved = caseta.ID_PASE === selectedPaseId[caseta.ID_EntidadCaseta];
                                    const tempSelection = selectedPaseId[caseta.ID_EntidadCaseta];

                                    return (
                                        <tr key={caseta.ID_EntidadCaseta + (caseta.ID_PASE || '') + (idx)} className={caseta.ID_PASE ? "table-success" : ""}>
                                            <td>{caseta.ID_EntidadCaseta}</td>
                                            <td>{caseta.NombreCaseta}</td>
                                            <td className="text-muted small">{'$' + (caseta.Camion2Ejes?.toFixed(2)) || '-'}</td>
                                            <td className="text-muted small">{caseta.NombrePlantilla || '-'}</td>
                                            <td>
                                                {caseta.ID_PASE ? (
                                                    <Badge bg="success">{caseta.ID_PASE}</Badge>
                                                ) : (
                                                    <Badge bg="secondary text-light">Sin vincular</Badge>
                                                )}
                                            </td>

                                            <td style={{ minWidth: '350px' }}>
                                                <InputGroup size="sm" className="mb-2">
                                                    <Form.Control
                                                        placeholder="Buscar en API PASE..."
                                                        defaultValue={caseta.NombreCaseta || caseta.NombrePlantilla || ''}
                                                        id={`search-${caseta.ID_EntidadCaseta}`}
                                                    />
                                                    <Button
                                                        variant="outline-secondary"
                                                        onClick={() => handleSearch(
                                                            caseta.ID_EntidadCaseta,
                                                            document.getElementById(`search-${caseta.ID_EntidadCaseta}`).value
                                                        )}
                                                    >
                                                        <Search size={14} />
                                                    </Button>
                                                </InputGroup>

                                                {searchState.loading && <div className="text-center small"><Spinner size="sm" animation="border" /> Buscando...</div>}

                                                {searchState.data && Array.isArray(searchState.data) && searchState.data.length > 0 && (
                                                    <Form.Select
                                                        size="sm"
                                                        value={tempSelection || ''}
                                                        onChange={(e) => setSelectedPaseId(prev => ({ ...prev, [caseta.ID_EntidadCaseta]: e.target.value }))}
                                                        className="border-primary"
                                                    >
                                                        <option value="">Seleccione una coincidencia...</option>
                                                        {searchState.data.map((res, idx) => (
                                                            <option key={idx} value={res.id}>
                                                                {res.nombre} (ID: {res.id}) {res.costoT2 ? `[$${res.costoT2}]` : ''} - {res.concesionaria?.nombre}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                )}

                                                {searchState.data && Array.isArray(searchState.data) && searchState.data.length === 0 && !searchState.loading && (
                                                    <div className="text-danger small">No se encontraron resultados</div>
                                                )}
                                            </td>
                                            <td>
                                                <Button
                                                    variant={savingStatus[caseta.ID_EntidadCaseta] === 'success' ? 'success' : 'primary'}
                                                    size="sm"
                                                    disabled={!tempSelection || tempSelection === caseta.ID_PASE}
                                                    onClick={() => handleSave(caseta.ID_EntidadCaseta)}
                                                >
                                                    {savingStatus[caseta.ID_EntidadCaseta] === 'saving' ? <Spinner size="sm" /> : <Save size={16} />}
                                                </Button>

                                                {caseta.ID_PASE && (
                                                    <a
                                                        href={`https://apps.pase.com.mx/sp-web/api/cobertura/casetas/${caseta.ID_PASE}/tarifas`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn btn-sm btn-link btn btn-secondary text-light ml-2 ms-1"
                                                        title="Ver tarifas (JSON)"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CasetasPaseLinker;
