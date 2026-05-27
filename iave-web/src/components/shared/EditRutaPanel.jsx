import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import axios from 'axios';
import EditCasetaCostoModal from './EditCasetaCostoModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.252:3001';

/**
 * Panel flotante (Rnd) para editar las casetas de una ruta.
 *
 * Props:
 *  - id_tipo_ruta   {number|string}  Requerido. ID de la ruta a editar.
 *  - ot             {string}         OT asociada (solo para mostrar en título).
 *  - initialCasetas {Array}          Lista de casetas ya cargadas. Si se omite, el
 *                                    componente las carga automáticamente via API.
 *  - onClose        {Function}       Callback al cerrar el panel (sin guardar).
 *  - onSaved        {Function}       Callback después de guardar exitosamente.
 */
function EditRutaPanel({ id_tipo_ruta, ot, initialCasetas, onClose, onSaved }) {
    const [casetas, setCasetas] = useState(initialCasetas ? [...initialCasetas] : []);
    const [originalCasetas, setOriginalCasetas] = useState(initialCasetas ? [...initialCasetas] : []);
    const [loadingCasetas, setLoadingCasetas] = useState(!initialCasetas);

    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [saving, setSaving] = useState(false);
    const searchRef = useRef(null);

    // Modal de edición de costos
    const [showCostoModal, setShowCostoModal] = useState(false);
    const [selectedCasetaForCosto, setSelectedCasetaForCosto] = useState(null);

    // Si no se pasan casetas iniciales, cargarlas desde la API
    useEffect(() => {
        if (!initialCasetas && id_tipo_ruta) {
            setLoadingCasetas(true);
            axios.get(`${API_URL}/api/casetas/rutas/${id_tipo_ruta}/casetasPorRuta`)
                .then(res => {
                    const data = res.data || [];
                    setCasetas(data);
                    setOriginalCasetas(data);
                })
                .catch(() => setAddError('Error al cargar las casetas de la ruta'))
                .finally(() => setLoadingCasetas(false));
        }
    }, [id_tipo_ruta]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleMoveUp = (i) => {
        if (i === 0) return;
        setCasetas(prev => {
            const arr = [...prev];
            [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
            return arr;
        });
    };

    const handleMoveDown = (i) => {
        setCasetas(prev => {
            if (i === prev.length - 1) return prev;
            const arr = [...prev];
            [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
            return arr;
        });
    };

    const handleRemove = (i) => {
        setCasetas(prev => prev.filter((_, idx) => idx !== i));
    };

    const handleOpenCostoModal = (caseta) => {
        setSelectedCasetaForCosto(caseta);
        setShowCostoModal(true);
    };

    const handleCloseCostoModal = () => {
        setShowCostoModal(false);
        setSelectedCasetaForCosto(null);
    };

    const handleCostoSaved = async () => {
        // Recargar datos de casetas para reflejar cambios
        try {
            const res = await axios.get(`${API_URL}/api/casetas/rutas/${id_tipo_ruta}/casetasPorRuta`);
            setCasetas(res.data || []);
        } catch (err) {
            console.error('Error al recargar casetas:', err);
        }
    };

    const handleSearchChange = async (val) => {
        setSearch(val);
        setAddError('');
        if (val.trim().length < 2) { setSuggestions([]); return; }
        setSearchLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/casetas/search`, { params: { q: val.trim() } });
            setSuggestions(res.data);
        } catch {
            setSuggestions([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectSuggestion = (caseta) => {
        if (casetas.some(c => c.ID_Caseta === caseta.ID_Caseta)) {
            setAddError('Esta caseta ya está en la ruta');
            setSuggestions([]);
            setSearch('');
            return;
        }
        setCasetas(prev => [...prev, caseta]);
        setSearch('');
        setSuggestions([]);
        setAddError('');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const originalIds = new Set(originalCasetas.map(c => c.ID_Caseta));
            const newIds = new Set(casetas.map(c => c.ID_Caseta));
            const withConsecutivos = casetas.map((c, i) => ({ ...c, consecutivo: i + 1 }));

            const casetasAEliminar = originalCasetas.filter(c => !newIds.has(c.ID_Caseta));
            const casetasAAgregar = withConsecutivos.filter(c => !originalIds.has(c.ID_Caseta));
            const casetasActualizadas = withConsecutivos.filter(c => {
                if (!originalIds.has(c.ID_Caseta)) return false;
                const orig = originalCasetas.find(o => o.ID_Caseta === c.ID_Caseta);
                return orig && orig.consecutivo !== c.consecutivo;
            });

            await axios.post(`${API_URL}/api/casetas/rutas/guardar-cambios`, {
                id_Tipo_ruta: id_tipo_ruta,
                casetasActualizadas,
                casetasAEliminar,
                casetasAAgregar
            });

            onSaved?.();
            onClose?.();
        } catch (e) {
            alert('Error al guardar los cambios de la ruta: ' + (e.response?.data?.message || e.message));
        } finally {
            setSaving(false);
        }
    };

    const panel = (
        <Rnd
            default={{
                x: Math.max(0, (window.innerWidth - 520) / 2),
                y: Math.max(0, (window.innerHeight - 600) / 2),
                width: 520,
                height: 600,
            }}
            minWidth={380}
            minHeight={350}
            dragHandleClassName="edit-ruta-handle"
            style={{ zIndex: 1200, position: 'fixed' }}
            enableResizing={{ top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }}
        >
            <div className="card shadow-lg h-100 d-flex flex-column" style={{ border: '2px solid #f6c23e', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#fff' }}>

                {/* Cabecera draggable */}
                <div
                    className="card-header bg-warning d-flex align-items-center justify-content-between edit-ruta-handle"
                    style={{ cursor: 'move', userSelect: 'none', padding: '0.6rem 1rem' }}
                >
                    <h6 className="m-0 font-weight-bold text-dark">
                        <i className="fas fa-edit mr-2"></i>
                        Editar Ruta
                        {ot && <span className="badge badge-dark ml-2 font-weight-normal" style={{ fontSize: '0.75rem' }}>{ot}</span>}
                        <span className="badge badge-secondary ml-1 font-weight-normal" style={{ fontSize: '0.7rem' }}>Tipo {id_tipo_ruta}</span>
                    </h6>
                    <button type="button" className="close" onClick={onClose}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                {/* Cuerpo */}
                <div className="card-body p-2 d-flex flex-column" style={{ overflow: 'hidden', flex: 1 }} onMouseDown={e => e.stopPropagation()}>

                    {loadingCasetas ? (
                        <div className="text-center py-5 text-muted">
                            <i className="fas fa-spinner fa-spin mr-2"></i> Cargando casetas...
                        </div>
                    ) : (
                        <>
                            {/* Buscador con autocomplete */}
                            <div className="mb-2" style={{ position: 'relative' }} ref={searchRef}>
                                <div className="input-group input-group-sm">
                                    <input
                                        type="text"
                                        className={`form-control ${addError ? 'is-invalid' : ''}`}
                                        placeholder="Buscar caseta por nombre o ID..."
                                        value={search}
                                        onChange={e => handleSearchChange(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Escape') { setSuggestions([]); setSearch(''); } }}
                                        onMouseDown={e => e.stopPropagation()}
                                        autoComplete="off"
                                    />
                                    <div className="input-group-append">
                                        {searchLoading
                                            ? <span className="input-group-text"><i className="fas fa-spinner fa-spin"></i></span>
                                            : <span className="input-group-text text-muted"><i className="fas fa-search"></i></span>}
                                    </div>
                                    {addError && <div className="invalid-feedback">{addError}</div>}
                                </div>

                                {/* Dropdown de sugerencias */}
                                {suggestions.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        backgroundColor: '#fff', border: '1px solid #ced4da',
                                        borderRadius: '0 0 0.25rem 0.25rem', zIndex: 10,
                                        maxHeight: '200px', overflowY: 'auto',
                                        boxShadow: '0 4px 8px rgba(0,0,0,.1)'
                                    }}>
                                        {suggestions.map(s => (
                                            <div
                                                key={s.ID_Caseta}
                                                style={{ padding: '0.4rem 0.7rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '0.8rem' }}
                                                className="d-flex justify-content-between align-items-center"
                                                onMouseDown={() => handleSelectSuggestion(s)}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fc'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                                            >
                                                <div>
                                                    <span className="font-weight-bold text-dark">{s.Nombre_IAVE || s.Nombre}</span>
                                                    <span className="text-muted ml-2" style={{ fontSize: '0.75rem' }}>ID: {s.ID_Caseta}</span>
                                                    {s.Estado && <span className="text-muted ml-1" style={{ fontSize: '0.7rem' }}>· {s.Estado}</span>}
                                                </div>
                                                {s.Automovil != null && (
                                                    <span className="badge badge-light border ml-2" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                        Automóvil: ${s.Automovil?.toLocaleString('es-MX')}
                                                    </span>
                                                )}

                                                {s.Camion2Ejes != null && (
                                                    <span className="badge badge-light border" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                        C-2: ${s.Camion2Ejes?.toLocaleString('es-MX')}
                                                    </span>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Lista de casetas */}
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.8rem' }}>
                                    <thead className="thead-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th style={{ width: '3rem' }} className="text-center">#</th>
                                            <th>Caseta</th>
                                            <th style={{ width: '5rem' }} className="text-center">ID</th>
                                            <th style={{ width: '7rem' }} className="text-center">Orden</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {casetas.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center text-muted py-3">Sin casetas</td></tr>
                                        ) : casetas.map((caseta, i) => (
                                            <tr key={caseta.ID_Caseta}>
                                                <td className="text-center align-middle font-weight-bold">{i + 1}</td>
                                                <td className="align-middle">
                                                    {caseta.Nombre_IAVE || caseta.Nombre || caseta.Caseta || '—'}
                                                    {caseta.Notas && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{caseta.Notas}</div>}
                                                </td>
                                                <td className="text-center align-middle text-muted">{caseta.ID_Caseta}</td>
                                                <td className="text-center align-middle p-1">
                                                    <button
                                                        className="btn btn-xs btn-outline-secondary py-0 px-1 mr-1"
                                                        onClick={() => handleMoveUp(i)}
                                                        disabled={i === 0}
                                                        title="Subir"
                                                        style={{ fontSize: '0.75rem' }}
                                                    ><i className="fas fa-arrow-up"></i></button>
                                                    <button
                                                        className="btn btn-xs btn-outline-secondary py-0 px-1 mr-1"
                                                        onClick={() => handleMoveDown(i)}
                                                        disabled={i === casetas.length - 1}
                                                        title="Bajar"
                                                        style={{ fontSize: '0.75rem' }}
                                                    ><i className="fas fa-arrow-down"></i></button>
                                                    <button
                                                        className="btn btn-xs btn-outline-info py-0 px-1 mr-1"
                                                        onClick={() => handleOpenCostoModal(caseta)}
                                                        title="Editar costo"
                                                        style={{ fontSize: '0.75rem' }}
                                                    ><i className="fas fa-dollar-sign"></i></button>
                                                    <button
                                                        className="btn btn-xs btn-outline-danger py-0 px-1"
                                                        onClick={() => handleRemove(i)}
                                                        title="Eliminar de la ruta"
                                                        style={{ fontSize: '0.75rem' }}
                                                    ><i className="fas fa-trash-alt"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Pie */}
                <div className="card-footer py-2 d-flex justify-content-between align-items-center bg-light">
                    <small className="text-muted">{casetas.length} caseta(s) en la ruta</small>
                    <div>
                        <button className="btn btn-sm btn-secondary mr-2" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button className="btn btn-sm btn-warning font-weight-bold" onClick={handleSave} disabled={saving || loadingCasetas}>
                            {saving
                                ? <span><i className="fas fa-spinner fa-spin mr-1"></i>Guardando...</span>
                                : <span><i className="fas fa-save mr-1"></i>Guardar cambios</span>}
                        </button>
                    </div>
                </div>
            </div>
        </Rnd>
    );

    return (
        <>
            {panel}
            <EditCasetaCostoModal
                show={showCostoModal}
                onClose={handleCloseCostoModal}
                onSaved={handleCostoSaved}
                idCaseta={selectedCasetaForCosto?.ID_Caseta}
                nombreCaseta={selectedCasetaForCosto?.Nombre_IAVE || selectedCasetaForCosto?.Nombre}
            />
        </>
    );
}

export default EditRutaPanel;
