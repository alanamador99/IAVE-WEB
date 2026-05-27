import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Activity, Map, Tag, AlertTriangle, ExternalLink, Edit3, Link2, DollarSign } from 'lucide-react';

const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const RutasExpandedDetail = ({route, navigate, tieneHuerfanas, meses}) => {
    // Agrupar por Caseta y Clase
    const grouped = useMemo(() => {
        const ag = {};
        route.casetas.forEach(c => {
            const key = `${c.Caseta}|${c.Clase}`;
            if (!ag[key]) {
                ag[key] = {
                    Caseta: c.Caseta,
                    Clase: c.Clase,
                    isHuerfana: c.Caseta?.startsWith('sinCaseta:'),
                    ID_Caseta: c.ID_Caseta,
                    years: {}
                };
            }
            if (c.Anio) {
                if (!ag[key].years[c.Anio]) {
                    ag[key].years[c.Anio] = {
                        meses: Array(12).fill(null),
                        totalAnio: 0,
                    };
                }
                const mesIdx = (c.Mes || 1) - 1;
                ag[key].years[c.Anio].meses[mesIdx] = c;
                ag[key].years[c.Anio].totalAnio += (c.TotalCruces || 0);
            }
        });
        return Object.values(ag);
    }, [route.casetas]);

    const availableYears = useMemo(() => {
        const yearsSet = new Set();
        grouped.forEach(g => Object.keys(g.years).forEach(y => yearsSet.add(y)));
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [grouped]);

    const [expandedYears, setExpandedYears] = useState({});
    const toggleYear = (year) => setExpandedYears(prev => ({...prev, [year]: !prev[year]}));

    return (
        <tr>
            <td></td>
            <td colSpan="9" className="p-0">
                <div className="bg-light p-3 border-left border-bottom border-primary" style={{borderWidth: '3px !important'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="font-weight-bold mb-0 text-primary"><Map size={14} className="mr-1"/> Casetas de la Ruta {route.id_Tipo_ruta}</h6>
                        <div>
                            <button 
                                className="btn btn-sm btn-outline-primary mr-2"
                                onClick={() => navigate(`/route-creator?origen=${encodeURIComponent(route.Origen || '')}&destino=${encodeURIComponent(route.Destino || '')}`)}
                            >
                                <Edit3 size={12} className="mr-1"/> Editar en Route-Creator
                            </button>
                            {tieneHuerfanas && (
                                <button 
                                    className="btn btn-sm btn-warning"
                                    onClick={() => navigate('/casetas/linker')}
                                >
                                    <Link2 size={12} className="mr-1"/> Vincular Huérfanas
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm table-bordered bg-white mb-0 text-nowrap">
                            <thead className="thead-light">
                                <tr>
                                    <th>Caseta</th>
                                    <th>Clase</th>
                                    {availableYears.map(y => {
                                        if (expandedYears[y]) {
                                            return (
                                                <React.Fragment key={y}>
                                                    {meses.map(m => <th key={`${y}-${m}`} className="text-center" style={{fontSize: '0.8rem'}}>{m}</th>)}
                                                    <th className="text-center bg-light border-right-0">
                                                        Total {y} 
                                                        <button className="btn btn-sm btn-light py-0 px-1 ml-1" onClick={() => toggleYear(y)} title={`Contraer ${y}`} style={{lineHeight: 1}}>
                                                            <ChevronLeft size={12}/>
                                                        </button>
                                                    </th>
                                                </React.Fragment>
                                            );
                                        } else {
                                            return (
                                                <th key={y} className="text-center">
                                                    {y} 
                                                    <button className="btn btn-sm btn-light py-0 px-1 ml-1" onClick={() => toggleYear(y)} title={`Expandir ${y}`} style={{lineHeight: 1}}>
                                                        <ChevronRight size={12}/>
                                                    </button>
                                                </th>
                                            );
                                        }
                                    })}
                                    <th style={{width: '5%'}}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grouped.map((g, i) => {
                                    return (
                                        <tr key={i} className={g.isHuerfana ? 'table-warning' : ''}>
                                            <td>
                                                {g.isHuerfana 
                                                    ? <span className="text-dark font-weight-bold" title="Caseta huérfana - sin vínculo a catálogo"><AlertTriangle size={12} className="mr-1 text-danger"/>{g.Caseta.replace('sinCaseta:', '')}</span>
                                                    : g.Caseta}
                                            </td>
                                            <td className="text-center text-muted">{g.Clase}</td>
                                            {availableYears.map(y => {
                                                const yData = g.years[y];
                                                const totalCruces = yData ? yData.totalAnio : 0;
                                                
                                                if (expandedYears[y]) {
                                                    return (
                                                        <React.Fragment key={y}>
                                                            {meses.map((m, idx) => {
                                                                const mData = yData?.meses[idx];
                                                                return (
                                                                    <td key={`${y}-${idx}`} className="text-center text-muted" style={{fontSize: '0.8rem'}}>
                                                                        {mData && mData.TotalCruces ? mData.TotalCruces : '-'}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="text-center bg-light font-weight-bold">
                                                                {totalCruces > 0 ? `${totalCruces}` : '-'}
                                                            </td>
                                                        </React.Fragment>
                                                    );
                                                } else {
                                                    return <td key={y} className="text-center">{totalCruces > 0 ? `${totalCruces} cruces` : '-'}</td>;
                                                }
                                            })}
                                            <td className="text-center">
                                                {g.isHuerfana ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-warning py-0 px-1"
                                                        title="Vincular esta caseta"
                                                        onClick={() => navigate('/casetas/linker')}
                                                    >
                                                        <Link2 size={12}/>
                                                    </button>
                                                ) : g.ID_Caseta ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-info py-0 px-1"
                                                        title="Actualizar costos"
                                                        onClick={() => navigate(`/casetas/actualizarCaseta/${g.ID_Caseta}`)}
                                                    >
                                                        <DollarSign size={12}/>
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </td>
        </tr>
    );
};

const RutasAnalyzer = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Estados de Control Visual e Interacción ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    
    const [filters, setFilters] = useState({
        id_Tipo_ruta: '', Origen: '', Destino: '', Caseta: '', Clase: '', Anio: '', Mes: ''
    });
    const [excluirSinCaseta, setExcluirSinCaseta] = useState(false);
    const [soloHuerfanas, setSoloHuerfanas] = useState(false);
    
    const [sortConfig, setSortConfig] = useState({ key: 'percentIncrease', direction: 'desc' });
    const [expandedRoutes, setExpandedRoutes] = useState({});

    // --- Control de Despliegue de Rutas ---
    const toggleRoute = (id_ruta) => {
        setExpandedRoutes(prev => ({ ...prev, [id_ruta]: !prev[id_ruta] }));
    };

    useEffect(() => {
        fetchAnalyzerData();
    }, []);

    const fetchAnalyzerData = async () => {
        setLoading(true);
        try {
                        const API_URL = (typeof process !== "undefined" && process.env) ? process.env.REACT_APP_API_URL : 'http://localhost:3001';

            const response = await axios.get(`${API_URL}/api/casetas/analisis/costos-rutas`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error al cargar datos del analizador.');
        } finally {
            setLoading(false);
        }
    };

    // --- Manipuladores de estado ---
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset page on filter
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const exportToExcel = () => {
        // Generamos un reporte plano incluyendo los datos de incremento que calculamos por ruta
        const exportData = [];
        processedData.forEach(route => {
            route.casetas.forEach(caseta => {
                exportData.push({
                    id_Tipo_ruta: route.id_Tipo_ruta, 
                    Origen: route.Origen, 
                    Destino: route.Destino, 
                    Caseta_Nombre: caseta.Caseta, 
                    Clase: caseta.Clase, 
                    Anio: caseta.Anio, 
                    Mes: meses[(caseta.Mes || 1) - 1], 
                    TotalCruces: caseta.TotalCruces,
                    CostoCasetaPromedio: caseta.CostoPromedio,
                    // Indicadores de Ruta
                    Ruta_Incremento_Porcentaje: route.percentIncrease.toFixed(2) + '%',
                    Costo_Ruta_Actual: route.costCurrent,
                    Costo_Ruta_Anterior: route.costPrev
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Análisis Rutas");
        XLSX.writeFile(workbook, `Analisis_Rutas_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // --- Lógica de Filtrado, Ordenamiento y Paginación (useMemo para eficiencia) ---
    const processedData = useMemo(() => {
        // Filtrar datos base de manera plana
        let filteredFlat = data.filter(item => {
            const isSinCaseta = item.Caseta?.startsWith('sinCaseta:');
            if (excluirSinCaseta && isSinCaseta) return false;
            if (soloHuerfanas && !isSinCaseta) return false;

            // Filtros individuales por columna apply inside parent too? Yes.
            for (let key in filters) {
                if (filters[key]) {
                    const itemValue = item[key]?.toString().toLowerCase() || '';
                    const fValue = filters[key].toLowerCase();
                    if (!itemValue.includes(fValue)) return false;
                }
            }
            return true;
        });

        // Agrupación por id_Tipo_ruta y cálculo de incremento porcentual por años
        const grouped = {};
        const availableYears = new Set();
        
        filteredFlat.forEach(item => {
            const rutaId = item.id_Tipo_ruta;
            if (!grouped[rutaId]) {
                grouped[rutaId] = {
                    id_Tipo_ruta: rutaId,
                    Origen: item.Origen,
                    Destino: item.Destino,
                    casetas: [],
                    TotalCruces: 0,
                    costoAnual: {}
                };
            }
            grouped[rutaId].casetas.push(item);
            grouped[rutaId].TotalCruces += (item.TotalCruces || 0);
            
            if (item.Anio) {
                availableYears.add(item.Anio);
                if (!grouped[rutaId].costoAnual[item.Anio]) {
                    grouped[rutaId].costoAnual[item.Anio] = { porCaseta: {} };
                }
                const aData = grouped[rutaId].costoAnual[item.Anio];
                if (!aData.porCaseta[item.Caseta]) aData.porCaseta[item.Caseta] = [];
                aData.porCaseta[item.Caseta].push(item.CostoPromedio || 0);
            }
        });

        const sortedYears = Array.from(availableYears).sort((a, b) => b - a);
        const currentYear = sortedYears[0] || new Date().getFullYear();
        const previousYear = sortedYears[1] || (currentYear - 1);

        const buildRouteCost = (anioObj) => {
            if(!anioObj) return 0;
            let total = 0;
            // Sumamos el promedio interno de cada caseta dentro de ese año para obtener el "costo viaje total" estimado
            Object.values(anioObj.porCaseta).forEach(costsArr => {
                total += costsArr.reduce((a,b)=>a+b, 0) / costsArr.length;
            });
            return total;
        };

        let result = Object.values(grouped).map(route => {
            const costCurrent = buildRouteCost(route.costoAnual[currentYear]);
            const costPrev = buildRouteCost(route.costoAnual[previousYear]);
            let percentIncrease = 0;
            if (costPrev > 0) percentIncrease = ((costCurrent - costPrev) / costPrev) * 100;
            else if (costPrev === 0 && costCurrent > 0) percentIncrease = 100;

            const huerfanasSet = new Set();
            let crucesHuerfanas = 0;
            route.casetas.forEach(c => {
                if (c.Caseta?.startsWith('sinCaseta:')) {
                    huerfanasSet.add(c.Caseta);
                    crucesHuerfanas += (c.TotalCruces || 0);
                }
            });

            return {
                ...route,
                costCurrent,
                costPrev,
                percentIncrease,
                currentYear,
                previousYear,
                casetasHuerfanasDistintas: huerfanasSet.size,
                crucesHuerfanas
            };
        });

        // Ordenar rutas Padre
        result.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            
            // Handlers para strings vs números
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [data, filters, excluirSinCaseta, soloHuerfanas, sortConfig]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedData.slice(start, start + itemsPerPage);
    }, [processedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    // --- Lógica de Insights Rápidos ---
    const insights = useMemo(() => {
        if (!processedData.length) return { totalRutas: 0, totalCruces: 0, casetasHuerfanas: 0, masCara: null };
        
        const rutasUnicas = processedData.length;
        const totalCruces = processedData.reduce((acc, curr) => acc + (curr.TotalCruces || 0), 0);
        let casetasHuerfanas = 0;
        let maxPromedio = processedData[0];

        processedData.forEach(d => {
            if ((d.costCurrent || 0) > (maxPromedio?.costCurrent || 0)) maxPromedio = d;
            casetasHuerfanas += d.casetas.filter(c => c.Caseta?.startsWith('sinCaseta:')).length;
        });

        return { rutasUnicas, totalCruces, casetasHuerfanas, masCara: maxPromedio };
    }, [processedData]);


    // --- Utilidades Visuales ---
    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ArrowDown size={14} className="text-muted opacity-25 ml-1" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-primary ml-1" /> : <ArrowDown size={14} className="text-primary ml-1" />;
    };

    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0 text-gray-800">Análisis de Costos de Rutas</h1>
            </div>

            {/* --- Tarjetas de Insights --- */}
            <div className="row mb-4">
                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-primary shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Rutas Analizadas</div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">{insights.rutasUnicas?.toLocaleString('es-MX')}</div>
                                </div>
                                <div className="col-auto">
                                    <Map className="text-gray-300" size={32} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-success shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Cantidad de Cruces</div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">{insights.totalCruces?.toLocaleString('es-MX')}</div>
                                </div>
                                <div className="col-auto">
                                    <Activity className="text-gray-300" size={32} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-danger shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">Costo Más Alto (Total/Ruta)</div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {insights.masCara ? (insights.masCara.costCurrent || 0)?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '.00'}
                                    </div>
                                    {insights.masCara && <small className="mt-1 text-muted d-block">Ruta: {insights.masCara.id_Tipo_ruta}</small>}
                                </div>
                                <div className="col-auto">
                                    <Tag className="text-gray-300" size={32} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card border-left-warning shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Casetas Huérfanas Ocultas</div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">{insights.casetasHuerfanas?.toLocaleString('es-MX')}</div>
                                </div>
                                <div className="col-auto">
                                    <AlertTriangle className="text-gray-300" size={32} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-dark">
                    <h6 className="m-0 font-weight-bold text-white">
                        Detalle de rutas ({processedData?.length?.toLocaleString('es-MX')} registros)
                    </h6>
                    <div className="d-flex align-items-center">
                        <div className="custom-control custom-switch mr-4">
                            <input 
                                type="checkbox" 
                                className="custom-control-input" 
                                id="switchSoloHuerfanas"
                                checked={soloHuerfanas}
                                onChange={(e) => {
                                    setSoloHuerfanas(e.target.checked);
                                    if(e.target.checked) setExcluirSinCaseta(false);
                                }}
                            />
                            <label className="custom-control-label text-white" style={{cursor:'Pointer'}} htmlFor="switchSoloHuerfanas">Solo Huérfanas</label>
                        </div>
                        <div className="custom-control custom-switch">
                            <input 
                                type="checkbox" 
                                className="custom-control-input" 
                                id="switchHuerfanas"
                                checked={excluirSinCaseta}
                                onChange={(e) => {
                                    setExcluirSinCaseta(e.target.checked);
                                    if(e.target.checked) setSoloHuerfanas(false);
                                }}
                            />
                            <label className="custom-control-label text-white" style={{cursor:'Pointer'}} htmlFor="switchHuerfanas">Ocultar Huérfanas</label>
                            {/* Nota: Ambos switches se desactivan mutuamente para evitar confusión en el filtrado */}
                            <button className="btn btn-success btn-sm ml-3" onClick={exportToExcel}>Exportar a Excel</button>
                        </div>
                    </div>
                </div>
                
                
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-2">Obteniendo la información...</p></div>
                    ) : (
                        <div className="table-responsive table-container table-hover">
                            <table className="table table-hover table-scrollable table-sm table-bordered mb-0" style={{ fontSize: '0.85rem' }}>
                                                                <thead className="thead-light sticky-top">
                                    {/* Cabecera de Ordenamiento */}
                                    <tr>
                                        <th style={{width: '2%'}}></th>
                                        <th onClick={() => handleSort('id_Tipo_ruta')} style={{cursor:'pointer'}}>Ruta <SortIcon column="id_Tipo_ruta"/></th>
                                        <th onClick={() => handleSort('Origen')} style={{cursor:'pointer'}}>Origen <SortIcon column="Origen"/></th>
                                        <th onClick={() => handleSort('Destino')} style={{cursor:'pointer'}}>Destino <SortIcon column="Destino"/></th>
                                        <th className="text-center" onClick={() => handleSort('TotalCruces')} style={{cursor:'pointer'}}>Viajes <SortIcon column="TotalCruces"/></th>
                                        <th className="text-center" onClick={() => handleSort('casetasHuerfanasDistintas')} style={{cursor:'pointer'}}>Huérfanas <SortIcon column="casetasHuerfanasDistintas"/></th>
                                        <th onClick={() => handleSort('costPrev')} style={{cursor:'pointer'}}>Costo Anterior <SortIcon column="costPrev"/></th>
                                        <th onClick={() => handleSort('costCurrent')} style={{cursor:'pointer'}}>Costo Actual <SortIcon column="costCurrent"/></th>
                                        <th className="text-center" onClick={() => handleSort('percentIncrease')} style={{cursor:'pointer'}}>% Var <SortIcon column="percentIncrease"/></th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                    {/* Sub-Cabecera de Filtros */}
                                    <tr className="bg-light">
                                        <th></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro..." value={filters.id_Tipo_ruta} onChange={e => handleFilterChange('id_Tipo_ruta', e.target.value)} /></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro..." value={filters.Origen} onChange={e => handleFilterChange('Origen', e.target.value)} /></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro..." value={filters.Destino} onChange={e => handleFilterChange('Destino', e.target.value)} /></th>
                                        <th colSpan="6"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((route, index) => {
                                        const tieneHuerfanas = route.casetas.some(c => c.Caseta?.startsWith('sinCaseta:'));
                                        return (
                                            <React.Fragment key={index}>
                                                <tr className="bg-white">
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm btn-light py-0 px-1" 
                                                            onClick={() => toggleRoute(route.id_Tipo_ruta)}
                                                            title={expandedRoutes[route.id_Tipo_ruta] ? "Ocultar casetas" : "Ver casetas"}
                                                        >
                                                            {expandedRoutes[route.id_Tipo_ruta] ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                                                        </button>
                                                    </td>
                                                    <td className="font-weight-bold text-primary">{route.id_Tipo_ruta}</td>
                                                    <td>{route.Origen?.substring(0, 20)}{route.Origen?.length > 20 ? '...' : ''}</td>
                                                    <td>{route.Destino?.substring(0, 20)}{route.Destino?.length > 20 ? '...' : ''}</td>
                                                    <td className="text-center font-weight-bold">{route.TotalCruces}</td>
                                                    <td className="text-center">
                                                        {route.casetasHuerfanasDistintas > 0 ? (
                                                            <span className="text-warning font-weight-bold" title={`${route.crucesHuerfanas} cruces en total por casetas huérfanas`}>
                                                                {route.casetasHuerfanasDistintas} <small className="text-muted" style={{fontSize: "0.8em"}}>({route.crucesHuerfanas} cr)</small>
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td className="text-muted">{(route.costPrev || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} <small>({route.previousYear})</small></td>
                                                    <td className="text-dark font-weight-bold">{(route.costCurrent || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} <small>({route.currentYear})</small></td>
                                                    <td className={`text-center font-weight-bold ${route.percentIncrease > 0 ? 'text-danger' : route.percentIncrease < 0 ? 'text-success' : 'text-muted'}`}>
                                                        {route.percentIncrease > 0 ? '+' : ''}{route.percentIncrease.toFixed(2)}%
                                                    </td>
                                                    <td className="text-center text-nowrap">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary py-0 px-1 mr-1"
                                                            title="Editar ruta en Route-Creator"
                                                            onClick={() => navigate(`/route-creator?origen=${encodeURIComponent(route.Origen || '')}&destino=${encodeURIComponent(route.Destino || '')}`)}
                                                        >
                                                            <Edit3 size={13}/>
                                                        </button>
                                                        {tieneHuerfanas && (
                                                            <button
                                                                className="btn btn-sm btn-outline-warning py-0 px-1 mr-1"
                                                                title="Vincular casetas huérfanas"
                                                                onClick={() => navigate('/casetas/linker')}
                                                            >
                                                                <Link2 size={13}/>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                                {/* Detalle Expandido (Casetas Hija) */}
                                                {expandedRoutes[route.id_Tipo_ruta] && (
                                                    <RutasExpandedDetail 
                                                        route={route} 
                                                        navigate={navigate} 
                                                        tieneHuerfanas={tieneHuerfanas} 
                                                        meses={meses} 
                                                    />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                    {paginatedData.length === 0 && (
                                        <tr><td colSpan="10" className="text-center py-5 text-muted">No se encontraron resultados consistentes con la configuración actual.</td></tr>
                                    )}
                                </tbody></table>
                        </div>
                    )}
                </div>

                {/* --- Paginación --- */}
                {!loading && processedData.length > 0 && (
                    <div className="card-footer d-flex align-items-center justify-content-between py-2">
                        <div>
                            <span className="text-muted small">
                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length} registros
                            </span>
                            <select 
                                className="custom-select custom-select-sm ml-3 d-inline-block w-auto"
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="25">25 por página</option>
                                <option value="50">50 por página</option>
                                <option value="100">100 por página</option>
                                <option value="500">500 por página</option>
                            </select>
                        </div>
                        <div className="pagination pagination-sm m-0">
                            <button 
                                className="btn btn-sm btn-outline-primary mr-1" 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={16} /> Anterior
                            </button>
                            <span className="btn btn-sm btn-light disabled mx-1">Pág {currentPage} de {totalPages}</span>
                            <button 
                                className="btn btn-sm btn-outline-primary ml-1" 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                Siguiente <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RutasAnalyzer;