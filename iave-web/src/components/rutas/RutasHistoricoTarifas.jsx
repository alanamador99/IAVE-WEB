import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ArrowUp, ArrowDown, Activity, Map, Tag, AlertTriangle, ExternalLink, Edit3, DollarSign, Clock } from 'lucide-react';

const RutasHistoricoTarifas = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [expandedRoutes, setExpandedRoutes] = useState({});
    
    const [filters, setFilters] = useState({
        id_Tipo_ruta: '', Origen: '', Destino: ''
    });
    
    const [sortConfig, setSortConfig] = useState({ key: 'percentIncrease', direction: 'desc' });

    useEffect(() => {
        fetchAnalyzerData();
    }, []);

    const fetchAnalyzerData = async () => {
        setLoading(true);
        try {
            const API_URL = (typeof process !== "undefined" && process.env) ? process.env.REACT_APP_API_URL : 'http://localhost:3001';
            const response = await axios.get(`${API_URL}/api/casetas/analisis/historico-rutas`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error al cargar datos del historial.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); 
    };

    const toggleRoute = (id) => {
        setExpandedRoutes(prev => ({...prev, [id]: !prev[id]}));
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // --- Procesamiento de datos ---
    const processedData = useMemo(() => {
        // Enriquecer y filtrar datos
        let processed = data.map(item => {
            const costoAnterior = item.CostoAnterior || 0;
            const costoActual = item.CostoActual || 0;
            const increase = costoAnterior > 0 ? ((costoActual - costoAnterior) / costoAnterior) * 100 : 0;
            
            return {
                ...item,
                costoAnterior,
                costoActual,
                percentIncrease: increase,
                casetasCount: item.CantidadCasetas || 0,
                costoDif: costoActual - costoAnterior
            };
        }).filter(item => {
            for (let key in filters) {
                if (filters[key]) {
                    const itemValue = item[key]?.toString().toLowerCase() || '';
                    const fValue = filters[key].toLowerCase();
                    if (!itemValue.includes(fValue)) return false;
                }
            }
            return true;
        });

        // Ordenamiento
        processed.sort((a, b) => {
            if (!sortConfig.key) return 0;
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return processed;
    }, [data, filters, sortConfig]);

    const formatCurrency = (value) => value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

    // --- Metricas Top ---
    const totalRutas = processedData.length;
    let maxIncreaseRoute = null;
    let maxIncreaseValue = -Infinity;

    processedData.forEach(route => {
        if (route.percentIncrease > maxIncreaseValue) {
            maxIncreaseValue = route.percentIncrease;
            maxIncreaseRoute = route;
        }
    });

    const exportToExcel = () => {
        const exportData = processedData.map(route => ({
            'ID Ruta': route.id_Tipo_ruta,
            'Origen': route.Origen,
            'Destino': route.Destino,
            'Cantidad Casetas': route.casetasCount,
            [`Costo Anterior (${route.AnioAnterior})`]: route.costoAnterior,
            [`Costo Actual (${route.AnioActual})`]: route.costoActual,
            '% Variación': `${route.percentIncrease.toFixed(2)}%`,
            'Monto Extra ($)': route.costoActual - route.costoAnterior
        }));

        let exportCasetasData = [];
        processedData.forEach(route => {
            if (route.casetas && route.casetas.length > 0) {
                route.casetas.forEach((caseta, idx) => {
                    const diffAmount = caseta.CostoActual - caseta.CostoAnterior;
                    const diffPercent = caseta.CostoAnterior > 0 ? (diffAmount / caseta.CostoAnterior) * 100 : 0;
                    exportCasetasData.push({
                        'ID Ruta': route.id_Tipo_ruta,
                        '#': idx + 1,
                        'Caseta': caseta.Caseta,
                        [`Costo Anterior (${route.AnioAnterior})`]: caseta.CostoAnterior,
                        [`Costo Actual (${route.AnioActual})`]: caseta.CostoActual,
                        '% Variación': `${diffPercent.toFixed(2)}%`,
                        'Monto Extra ($)': diffAmount
                    });
                });
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const worksheetCasetas = XLSX.utils.json_to_sheet(exportCasetasData);
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historial Tarifas");
        if (exportCasetasData.length > 0) {
            XLSX.utils.book_append_sheet(workbook, worksheetCasetas, "Detalle Casetas");
        }
        XLSX.writeFile(workbook, `Historial_Tarifas_Rutas_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // --- Paginación ---
    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const currentData = processedData.slice(startIdx, startIdx + itemsPerPage);

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ArrowDown size={12} className="ml-1 text-muted opacity-25" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 text-primary" /> : <ArrowDown size={12} className="ml-1 text-primary" />;
    };

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center" style={{height: '80vh'}}>
                <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div>
            </div>
        );
    }

    return (
        <div className="container-fluid" style={{ backgroundColor: '#f8f9fc', minHeight: '100vh', padding: '1.5rem' }}>
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0 text-gray-800">Historial Tarifas de Rutas</h1>
            </div>

            {/* Tarjetas Superiores */}
            <div className="row mb-4">
                <div className="col-xl-4 col-md-6 mb-4">
                    <div className="card shadow h-100 py-2" style={{borderLeft: '4px solid #4e73df'}}>
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">RUTAS FILTRADAS</div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {totalRutas.toLocaleString()}
                                    </div>
                                </div>
                                <div className="col-auto"><Map size={24} color="#dddfeb" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-4 col-md-6 mb-4">
                    <div className="card shadow h-100 py-2" style={{borderLeft: '4px solid #e74a3b'}}>
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">MAYOR INCREMENTO % (TOTAL/RUTA)</div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {maxIncreaseValue > -Infinity ? `${maxIncreaseValue.toFixed(2)}%` : '0.00%'}
                                    </div>
                                    <div className="text-xs mt-1 text-muted">
                                        Ruta: {maxIncreaseRoute ? maxIncreaseRoute.id_Tipo_ruta : '-'}
                                    </div>
                                </div>
                                <div className="col-auto"><Activity size={24} color="#dddfeb" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between" style={{backgroundColor: '#4e5d6c'}}>
                    <h6 className="m-0 font-weight-bold text-white">Detalle de rutas ({totalRutas.toLocaleString()} registros)</h6>
                    <div className="d-flex align-items-center">
                        <button className="btn btn-sm btn-success shadow-sm ml-3" onClick={exportToExcel}>
                            Exportar a Excel
                        </button>
                    </div>
                </div>
                
                <div className="table-responsive">
                    <table className="table table-hover table-striped mb-0 text-gray-800" style={{fontSize: '0.85rem'}}>
                        <thead className="thead-light">
                            <tr>
                                <th style={{width: '2%'}}></th>
                                <th onClick={() => handleSort('id_Tipo_ruta')} style={{cursor: 'pointer'}}>Ruta <SortIcon column="id_Tipo_ruta"/></th>
                                <th onClick={() => handleSort('Origen')} style={{cursor: 'pointer'}}>Origen <SortIcon column="Origen"/></th>
                                <th onClick={() => handleSort('Destino')} style={{cursor: 'pointer'}}>Destino <SortIcon column="Destino"/></th>
                                <th onClick={() => handleSort('casetasCount')} style={{cursor: 'pointer'}}>Cant. Casetas <SortIcon column="casetasCount"/></th>
                                <th onClick={() => handleSort('costoAnterior')} style={{cursor: 'pointer'}}>Costo Anterior <SortIcon column="costoAnterior"/></th>
                                <th onClick={() => handleSort('costoActual')} style={{cursor: 'pointer'}}>Costo Actual <SortIcon column="costoActual"/></th>
                                <th onClick={() => handleSort('percentIncrease')} style={{cursor: 'pointer'}}>% Var <SortIcon column="percentIncrease"/></th>
                                <th onClick={() => handleSort('costoDif')} style={{cursor: 'pointer'}}>Monto ($) <SortIcon column="costoDif"/></th>
                                <th className="text-center">Acciones</th>
                            </tr>
                            <tr className="bg-white">
                                <th></th>
                                <th><input type="text" className="form-control form-control-sm" placeholder="Filtro..." value={filters.id_Tipo_ruta} onChange={(e) => handleFilterChange('id_Tipo_ruta', e.target.value)} /></th>
                                <th><input type="text" className="form-control form-control-sm" placeholder="Filtro..." value={filters.Origen} onChange={(e) => handleFilterChange('Origen', e.target.value)} /></th>
                                <th><input type="text" className="form-control form-control-sm" placeholder="Filtro..." value={filters.Destino} onChange={(e) => handleFilterChange('Destino', e.target.value)} /></th>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((route, i) => (
                                <React.Fragment key={route.id_Tipo_ruta}>
                                <tr className="bg-white">
                                    <td>
                                        <button 
                                            className="btn btn-sm btn-light py-0 px-1" 
                                            onClick={() => toggleRoute(route.id_Tipo_ruta)}
                                        >
                                            {expandedRoutes[route.id_Tipo_ruta] ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                                        </button>
                                    </td>
                                    <td className="font-weight-bold text-primary">{route.id_Tipo_ruta}</td>
                                    <td>{route.Origen}</td>
                                    <td>{route.Destino}</td>
                                    <td>{route.casetasCount}</td>
                                    <td>
                                        <span className="font-weight-bold">{formatCurrency(route.costoAnterior)}</span>
                                        <span className="text-muted ml-1" style={{fontSize:'0.7rem'}}>({route.AnioAnterior})</span>
                                    </td>
                                    <td>
                                        <span className="font-weight-bold">{formatCurrency(route.costoActual)}</span>
                                        <span className="text-muted ml-1" style={{fontSize:'0.7rem'}}>({route.AnioActual})</span>
                                    </td>
                                    <td className="font-weight-bold">
                                        <span className={route.percentIncrease > 0 ? "text-danger" : route.percentIncrease < 0 ? "text-success" : "text-muted"}>
                                            {route.percentIncrease > 0 ? "+" : ""}{route.percentIncrease.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="font-weight-bold">
                                        <span className={(route.costoActual - route.costoAnterior) > 0 ? "text-danger" : (route.costoActual - route.costoAnterior) < 0 ? "text-success" : "text-muted"}>
                                            {formatCurrency(route.costoActual - route.costoAnterior)}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button 
                                            className="btn btn-sm btn-outline-primary py-0 px-1"
                                            title="Ver en Route-Creator"
                                            onClick={() => navigate(`/route-creator?origen=${encodeURIComponent(route.Origen || '')}&destino=${encodeURIComponent(route.Destino || '')}`)}
                                        >
                                            <Edit3 size={14}/>
                                        </button>
                                    </td>
                                </tr>
                                {expandedRoutes[route.id_Tipo_ruta] && (
                                    <tr>
                                        <td></td>
                                        <td colSpan="9" className="p-0">
                                            <div className="bg-light p-3 border-left border-bottom border-primary" style={{borderWidth: '3px !important'}}>
                                                <h6 className="font-weight-bold mb-3 text-primary"><Map size={14} className="mr-1"/> Casetas de la Ruta {route.id_Tipo_ruta}</h6>
                                                <table className="table table-sm table-bordered bg-white mb-0">
                                                    <thead className="thead-light">
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Caseta</th>
                                                            <th>Costo {route.AnioAnterior}</th>
                                                            <th>Costo {route.AnioActual}</th>
                                                            <th>Diferencia %</th>
                                                            <th>Monto ($)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {route.casetas && route.casetas.length > 0 ? route.casetas.map((caseta, idx) => {
                                                            const diff = caseta.CostoAnterior > 0 ? ((caseta.CostoActual - caseta.CostoAnterior) / caseta.CostoAnterior) * 100 : 0;
                                                            const diffAmount = caseta.CostoActual - caseta.CostoAnterior;
                                                            return (
                                                                <tr key={idx}>
                                                                    <td className="text-muted">{idx + 1}</td>
                                                                    <td>{caseta.Caseta}</td>
                                                                    <td>{formatCurrency(caseta.CostoAnterior)}</td>
                                                                    <td className="font-weight-bold">{formatCurrency(caseta.CostoActual)}</td>
                                                                    <td className={diff > 0 ? 'text-danger font-weight-bold' : diff < 0 ? 'text-success font-weight-bold' : 'text-muted'}>
                                                                        {diff > 0 ? "+" : ""}{diff.toFixed(2)}%
                                                                    </td>
                                                                    <td className={diffAmount > 0 ? 'text-danger font-weight-bold' : diffAmount < 0 ? 'text-success font-weight-bold' : 'text-muted'}>
                                                                        {diffAmount > 0 ? "+" : ""}{formatCurrency(diffAmount)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }) : (
                                                            <tr><td colSpan="6" className="text-center text-muted">No se encontraron detalles de casetas.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                    <div className="d-flex align-items-center">
                        <span className="text-muted mr-3" style={{fontSize: '0.85rem'}}>
                            Mostrando {startIdx + 1} a {Math.min(startIdx + itemsPerPage, processedData.length)} de {totalRutas}
                        </span>
                        <select className="custom-select custom-select-sm" style={{width: 'auto', fontSize: '0.85rem'}} value={itemsPerPage} onChange={(e) => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                            <option value={50}>50 por página</option>
                            <option value={100}>100 por página</option>
                            <option value={200}>200 por página</option>
                        </select>
                    </div>
                    
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>&lt; Anterior</button>
                            </li>
                            <li className="page-item disabled"><span className="page-link" style={{color: '#4e5d6c'}}>Pág {currentPage} de {totalPages}</span></li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Siguiente &gt;</button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default RutasHistoricoTarifas;
