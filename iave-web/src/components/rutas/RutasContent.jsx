import React, { useState, useEffect, useRef } from 'react';
import { formatearDinero, formatearEnteros } from '../shared/utils';
import { FunnelX } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const RutasContent = ({ onRutaSeleccionada, onOrigenDestino }) => {
    const checkboxes = useRef();
    const [loading, setLoading] = useState(true);
    const [TipoBusqueda, setTipoBusqueda] = useState(true);
    const [rutas, setRutas] = useState([{ '.': ' ', }]);
    const [rutaSeleccionada, setRutaSeleccionada] = useState(0);
    const [filtered, setFiltered] = useState([]);
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [caseta, setCaseta] = useState('');
    const [categoria, setCategoria] = useState('todos');
    const [distancia, setDistancia] = useState('todos');
    const [filtros, setFiltros] = useState({ Origen: '', Destino: '', Poblacion: '', RazonSocial: '', Categoria: 'todos', Distancia: 'todos' });
    
    // Estados para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
    
    useEffect(() => {
        try {
            axios.get(`${API_URL}/api/casetas/rutas`)
            .then(res => {
                setRutas(res.data);
                setFiltered(res.data);
            })
            .catch(err => console.error('Error al obtener las rutas de TUSA:', err));
        } catch (error) {
            console.log("Error al obtener las rutas de TUSA:", error)
        }
        finally {
            alert('Recuerda que esta es una versión preliminar del gestor de rutas. Algunas funcionalidades pueden no estar disponibles o ser limitadas. ¡Gracias por tu comprensión!')
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        onRutaSeleccionada && onRutaSeleccionada((rutaSeleccionada));
        onOrigenDestino && onOrigenDestino((rutas[rutaSeleccionada-1]?.RazonOrigen)?rutas[rutaSeleccionada-1]?.RazonOrigen + ' → ' + rutas[rutaSeleccionada-1]?.RazonDestino: null)
    }, [rutaSeleccionada]);

    const handleCheckboxChange = (id_Tipo_ruta) => {
        setRutaSeleccionada(id_Tipo_ruta);
    };

    useEffect(() => {
        const filtrado = rutas.filter(ruta => {
            const matchOrigen = filtros.Origen === '' || (TipoBusqueda && ruta.PoblacionOrigen?.toLowerCase().includes(filtros.Origen.toLowerCase())) || (!TipoBusqueda && ruta.RazonOrigen?.toLowerCase().includes(filtros.Origen.toLowerCase()));
            const matchDestino = filtros.Destino === '' || (TipoBusqueda && ruta.PoblacionDestino?.toLowerCase().includes(filtros.Destino.toLowerCase())) || (!TipoBusqueda && ruta.RazonDestino?.toLowerCase().includes(filtros.Destino.toLowerCase()));
            const matchRazonSocial = filtros.RazonSocial === '' || ruta.RazonOrigen?.toLowerCase().includes(filtros.RazonSocial?.toLowerCase()) || ruta.RazonDestino?.toLowerCase().includes(filtros.RazonSocial?.toLowerCase());
            const matchPoblacion = filtros.Poblacion === '' || ruta.PoblacionOrigen?.toLowerCase().includes(filtros.Poblacion?.toLowerCase()) || ruta.PoblacionDestino?.toLowerCase().includes(filtros.Poblacion?.toLowerCase());
            const matchCategoria = filtros.Categoria === 'todos' || ruta.Categoria?.toLowerCase().includes(filtros.Categoria?.toLowerCase());

            return matchOrigen && matchDestino && matchPoblacion && matchRazonSocial && matchCategoria;
        });
        setFiltered(filtrado);
        setPaginaActual(1);
    }, [filtros, rutas]);

    const handleChange = e => {
        const { name, value } = e.target;
        setRutaSeleccionada(0);
        switch (name) {
            case 'Origen':
                setOrigen(e.target.value);
                break;
            case 'Destino':
                setDestino(e.target.value);
                break;
            case 'Caseta':
                setCaseta(e.target.value);
                break;
            case 'Categoria':
                setCategoria(e.target.value);
                break;
            case 'Distancia':
                setDistancia(e.target.value);
                break;
            default:
                break;
        }
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const resetFiltros = () => {
        setFiltros(() => ({ Origen: '', Destino: '', Categoria: 'todos', Poblacion: '', RazonSocial: '' }));
        setOrigen('');
        setDestino('');
        setCaseta('');
        setCategoria('todos');
        setDistancia('todos');
        setPaginaActual(1);
    }

    // Calcular datos de paginación
    const totalPaginas = Math.ceil(filtered.length / registrosPorPagina);
    const indiceInicio = (paginaActual - 1) * registrosPorPagina;
    const indiceFin = indiceInicio + registrosPorPagina;
    const datosPaginados = filtered.slice(indiceInicio, indiceFin);

    // Generar array de números de página para mostrar
    const obtenerNumerosPagina = () => {
        const paginas = [];
        const maxPaginasVisibles = 5;
        
        if (totalPaginas <= maxPaginasVisibles) {
            for (let i = 1; i <= totalPaginas; i++) {
                paginas.push(i);
            }
        } else {
            if (paginaActual <= 3) {
                for (let i = 1; i <= 4; i++) {
                    paginas.push(i);
                }
                paginas.push('...');
                paginas.push(totalPaginas);
            } else if (paginaActual >= totalPaginas - 2) {
                paginas.push(1);
                paginas.push('...');
                for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
                    paginas.push(i);
                }
            } else {
                paginas.push(1);
                paginas.push('...');
                for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
                    paginas.push(i);
                }
                paginas.push('...');
                paginas.push(totalPaginas);
            }
        }
        
        return paginas;
    };

    const cambiarPagina = (numeroPagina) => {
        if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
            setPaginaActual(numeroPagina);
        }
    };

    const handleRegistrosPorPaginaChange = (e) => {
        setRegistrosPorPagina(Number(e.target.value));
        setPaginaActual(1);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "15vh" }}>
                <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
                    <span className="visually-hidden">.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="wrapper card shadow">
            <div className="card-header py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <label htmlFor="rowsSelect" className="input-group-text mb-0 mr-2">Registros por página:</label>
                    <select
                        id="rowsSelect"
                        className="form-select form-select-sm custom-select"
                        style={{ width: 'auto' }}
                        value={registrosPorPagina}
                        onChange={handleRegistrosPorPaginaChange}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <h6 className="m-0 font-weight-bold text-primary ml-3" style={{ flex: 'auto', }}>🚛 Gestor de Rutas - Propuesta <i>IAVE-WEB</i> - ({formatearEnteros(filtered.length)})</h6>
            </div>

            <div className="card-body pb-0">
                {/* Filtros */}
                <div className="d-flex flex-wrap gap-2 mb-3">
                    <div className="row">
                        <div style={{ width: '12rem', textAlign: 'center' }} className='Alo'>
                            <span title='Al dar clic sobre el botón de abajo, se cambia el tipo de busqueda de las rutas'><i className="fas fa-info-circle"></i> </span><span>Buscando por:</span>
                            <br />
                            <input type="checkbox" style={{ display: 'none' }} className="btn-check" id="btn-check-outlined" autoComplete="off" value={TipoBusqueda} onChange={() => setTipoBusqueda(!TipoBusqueda)} />
                            <label className="btn btn-outline-primary" htmlFor="btn-check-outlined">{(TipoBusqueda ? 'Población' : 'Razón Social')}</label>
                        </div>

                        <div className="form-floating pr-2">
                            <input type="text" className="form-control form-control-sm" id="Origen" placeholder='_' name='Origen' value={origen} onChange={handleChange} />
                            <label className="form-label" htmlFor="Origen">Origen</label>
                        </div>

                        <div className="form-floating pr-2">
                            <input type="text" className="form-control form-control-sm" id="Destino" placeholder='_' name='Destino' value={destino} onChange={handleChange} />
                            <label className="form-label" htmlFor="Destino">Destino</label>
                        </div>

                        <div className="form-floating pr-2" title="Una caseta contenida en la ruta." >
                            <input type="text" placeholder="_" id="CasetaAclaracion" autoComplete="off" className="form-control form-control-sm" name='Caseta' value={caseta} onChange={handleChange} />
                            <label className="form-label" htmlFor='CasetaAclaracion'>Caseta</label>
                        </div>

                        <div className="pl-1 pr- input-group-text mb-0 ">
                            <label className='form-label' htmlFor='inEstatus'>Categoría:</label>
                            <select className='mx-3 p-2' id='inEstatus' name="Categoria" value={categoria} onChange={handleChange}>
                                <option value="todos">Todos</option>
                                <option value="Latinos">Latinos</option>
                                <option value="Nacionales">Nacionales</option>
                                <option value="Exportacion">Exportación</option>
                                <option value="Otros">Otros</option>
                                <option value="Cemex">Cemex</option>
                                <option value="Alternas">Alternas</option>
                            </select>
                        </div>

                        <div className="pl-1 pr- input-group-text mb-0 ml-2">
                            <label className='form-label' htmlFor='inDistancia'>Distancia:</label>
                            <select className='mx-3 p-2' id='inDistancia' name="Distancia" value={distancia} onChange={handleChange}>
                                <option value="todos">Todos</option>
                                <option value="Largos">Largos</option>
                                <option value="Medianos">Medianos</option>
                                <option value="Cortos">Cortos</option>
                            </select>
                        </div>
                    </div>

                    <div className="ml-3 pr-1 pt-1">
                        <button
                            className="btn btn-sm btn btn-outline-dark rounded-3"
                            title="Resetear filtros"
                            onClick={resetFiltros}
                        >
                            <FunnelX size={40} className="me-1" />
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="table-responsive table-container" style={{ maxHeight: '25vh', overflowY: 'auto' }}>
                    <table className="table  table-bordered table-scroll table-sm table-hover align-middle p-0">
                        <thead className="text-center">
                            <tr>
                                <th className='table-dark'></th>
                                <th className='text-nowrap'>ID_ruta</th>
                                <th className='text-nowrap'>id_Tipo_ruta</th>
                                <th className='text-nowrap'>Observaciones</th>
                                <th className='text-nowrap'>Fecha de Alta</th>
                                <th className='text-nowrap'>Km real</th>
                                <th className='text-nowrap'>Km oficial</th>
                                <th className='text-nowrap'>Km pago</th>
                                <th className='text-nowrap'>Km tabulados</th>
                                <th className='text-nowrap'>peaje dos ejes</th>
                                <th className='text-nowrap'>peaje tres ejes</th>
                                <th className='text-nowrap'>Origen</th>
                                <th className='text-nowrap'>Destino</th>
                                <th className='text-nowrap'>Razon social Origen</th>
                                <th className='text-nowrap'>Razon social Destino</th>
                                <th className='text-nowrap'>Categoria</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datosPaginados.map((ruta, index) => (
                                <tr key={'ruta_' + (JSON.stringify(ruta.id_Tipo_ruta) + '_' + JSON.stringify(ruta.ID_ruta))} className='justify-content-center' onClick={() => { setRutaSeleccionada(ruta.id_Tipo_ruta) }} >
                                    <td className='py-1 align-middle justify-content-center text-center' style={{ verticalAlign: 'middle' }} ref={checkboxes} >
                                        <input type="checkbox" tabIndex={index + 2} checked={(rutaSeleccionada === ruta.id_Tipo_ruta)} onChange={() => handleCheckboxChange(ruta?.id_Tipo_ruta)} />
                                    </td>

                                    {Object.keys(ruta).map((campo, i) => {
                                        return (
                                            <td key={`td_${ruta.ID_ruta}_${campo}_${i}`}
                                                style={{ verticalAlign: 'middle', cursor: 'pointer' }}
                                                onClick={handleCheckboxChange}
                                            >
                                                <div className="d-flex align-items-center justify-content-center">
                                                    {campo === 'fecha_Alta' ?
                                                        (<span className='text-nowrap'>{ruta[campo].split('T')[0]}</span>)
                                                        : campo.toString().includes('peaje_') ?
                                                            (<span className='text-nowrap'>{(ruta[campo] === 0) ? '---' : '$'} {formatearDinero(ruta[campo])}</span>)
                                                            : (campo.toString().includes('Razon') || campo.toString().includes('Poblacion')) ?
                                                                (<span className='text-xs object-fit-scale'>{ruta[campo]}</span>)
                                                                : (campo.toString().includes('Km_')) ?
                                                                    (<span className='object-fit-scale' style={{ fontSize: '0.9rem', }}>{formatearEnteros(ruta[campo])}</span>)
                                                                    :
                                                                    (<>{ruta[campo]}</>)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                <div className='assignMe'>
                    <nav className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                            <span className="text-muted small">
                                Mostrando {filtered.length > 0 ? indiceInicio + 1 : 0} - {Math.min(indiceFin, filtered.length)} de {filtered.length} registros
                            </span>
                            <span className="text-muted small">
                                Página {totalPaginas > 0 ? paginaActual : 0} de {totalPaginas}
                            </span>
                        </div>

                        <ul className="pagination pagination-sm justify-content-center d-flex flex-wrap" style={{ overflow: 'auto', }}>
                            <li className={`flex-wrap page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => cambiarPagina(paginaActual - 1)}
                                    disabled={paginaActual === 1}
                                >
                                    Anterior
                                </button>
                            </li>

                            {obtenerNumerosPagina().map((numero, index) => (
                                numero === '...' ? (
                                    <li key={`ellipsis-${index}`} className="flex-wrap page-item disabled">
                                        <span className="page-link">...</span>
                                    </li>
                                ) : (
                                    <li key={`page-${numero}`} className={`flex-wrap page-item ${paginaActual === numero ? 'active' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => cambiarPagina(numero)}
                                        >
                                            {numero}
                                        </button>
                                    </li>
                                )
                            ))}

                            <li className={`flex-wrap page-item ${paginaActual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link"
                                    onClick={() => cambiarPagina(paginaActual + 1)}
                                    disabled={paginaActual === totalPaginas || totalPaginas === 0}
                                >
                                    Siguiente
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default RutasContent;