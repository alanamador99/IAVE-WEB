const fs = require('fs');

let fileContent = fs.readFileSync('c:/Users/IAVE/Documents/Proyecto IAVE WEB/iave-web/src/components/rutas/RutasAnalyzer.jsx', 'utf8');

// Replace sortConfig state
fileContent = fileContent.replace(
    /const \[sortConfig, setSortConfig\] = useState\(\{ key: 'Anio', direction: 'desc' \}\);/g,
    const [sortConfig, setSortConfig] = useState({ key: 'percentIncrease', direction: 'desc' });\n    const [expandedRoutes, setExpandedRoutes] = useState({});\n\n    const toggleRoute = (id) => {\n        setExpandedRoutes(prev => ({ ...prev, [id]: !prev[id] }));\n    };
);

// We delete the previous logic inside processedData, insights, and the table and provide our own grouping implementation.
const newCoreLogic = 
    // --- Lógica de Filtrado, Ordenamiento y Paginación (useMemo para eficiencia) ---
    const processedData = useMemo(() => {
        // Filtrar planos
        let filteredFlat = data.filter(item => {
            const isSinCaseta = item.Caseta?.startsWith('sinCaseta:');
            if (excluirSinCaseta && isSinCaseta) return false;
            if (soloHuerfanas && !isSinCaseta) return false;

            for (let key in filters) {
                if (filters[key]) {
                    const itemValue = item[key]?.toString().toLowerCase() || '';
                    const fValue = filters[key].toLowerCase();
                    if (!itemValue.includes(fValue)) return false;
                }
            }
            return true;
        });

        // Agrupar
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
                    costoA: {}
                };
            }
            grouped[rutaId].casetas.push(item);
            grouped[rutaId].TotalCruces += (item.TotalCruces || 0);
            
            if (item.Anio) {
                availableYears.add(item.Anio);
                if (!grouped[rutaId].costoA[item.Anio]) {
                    grouped[rutaId].costoA[item.Anio] = { casetas: {} };
                }
                const aData = grouped[rutaId].costoA[item.Anio];
                if (!aData.casetas[item.Caseta]) aData.casetas[item.Caseta] = [];
                aData.casetas[item.Caseta].push(item.CostoPromedio || 0);
            }
        });

        const sortedYears = Array.from(availableYears).sort((a, b) => b - a);
        const currentYear = sortedYears[0] || new Date().getFullYear();
        const previousYear = sortedYears[1] || (currentYear - 1);

        const calculateRouteCost = (anioObj) => {
            if(!anioObj) return 0;
            let total = 0;
            Object.values(anioObj.casetas).forEach(costsArr => {
                total += costsArr.reduce((a,b)=>a+b, 0) / costsArr.length;
            });
            return total;
        };

        let finalData = Object.values(grouped).map(route => {
            const costCurrent = calculateRouteCost(route.costoA[currentYear]);
            const costPrev = calculateRouteCost(route.costoA[previousYear]);
            let percentIncrease = 0;
            if (costPrev > 0) percentIncrease = ((costCurrent - costPrev) / costPrev) * 100;
            else if (costPrev === 0 && costCurrent > 0) percentIncrease = 100;

            return {
                ...route,
                costCurrent,
                costPrev,
                percentIncrease,
                currentYear,
                previousYear
            };
        });

        // Ordenar
        finalData.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return finalData;
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
        processedData.forEach(p => {
             casetasHuerfanas += p.casetas.filter(c => c.Caseta?.startsWith('sinCaseta:')).length;
        });
        
        return { rutasUnicas, totalCruces, casetasHuerfanas, masCara: processedData[0] };
    }, [processedData]);
;

// Extract table replacement block. Due to regex issues, we match the boundaries.
let startIdx = fileContent.indexOf('// --- Lógica de Filtrado');
let endIdx = fileContent.indexOf('// --- Utilidades Visuales ---');

if (startIdx > -1 && endIdx > -1) {
    let before = fileContent.substring(0, startIdx);
    // Replace encoding artifacts properly before injecting. We don't touch 'before' other than sortConfig which we already did via replace above.
    // Actually we did sortConfig above, let's just do it directly on before.
    before = before.replace(
        /const \\\[sortConfig, setSortConfig\\\] = useState\\\(\\{ key: 'Anio', direction: 'desc' \\}\\);/g,
        "const [sortConfig, setSortConfig] = useState({ key: 'percentIncrease', direction: 'desc' });\\n    const [expandedRoutes, setExpandedRoutes] = useState({});\\n\\n    const toggleRoute = (id) => {\\n        setExpandedRoutes(prev => ({ ...prev, [id]: !prev[id] }));\\n    };"
    );
    let after = fileContent.substring(endIdx);
    
    fileContent = before + newCoreLogic + '\\n    ' + after;
}

// Replace the table
let tableStart = fileContent.indexOf('<table className="table table-hover');
let tableEnd = fileContent.indexOf('</table>');

if (tableStart > -1 && tableEnd > -1) {
    let newTable = \
                            <table className="table table-hover table-scrollable table-sm table-bordered mb-0" style={{ fontSize: '0.85rem' }}>
                                <thead className="thead-light sticky-top">
                                    <tr>
                                        <th style={{width: '2%'}}></th>
                                        <th onClick={() => handleSort('id_Tipo_ruta')} style={{cursor:'pointer'}}>Ruta <SortIcon column="id_Tipo_ruta"/></th>
                                        <th onClick={() => handleSort('Origen')} style={{cursor:'pointer'}}>Origen <SortIcon column="Origen"/></th>
                                        <th onClick={() => handleSort('Destino')} style={{cursor:'pointer'}}>Destino <SortIcon column="Destino"/></th>
                                        <th onClick={() => handleSort('TotalCruces')} style={{cursor:'pointer'}}>Viajes <SortIcon column="TotalCruces"/></th>
                                        <th onClick={() => handleSort('costPrev')} style={{cursor:'pointer'}}>Costo Anterior <SortIcon column="costPrev"/></th>
                                        <th onClick={() => handleSort('costCurrent')} style={{cursor:'pointer'}}>Costo Actual <SortIcon column="costCurrent"/></th>
                                        <th onClick={() => handleSort('percentIncrease')} style={{cursor:'pointer'}}>% Var. <SortIcon column="percentIncrease"/></th>
                                    </tr>
                                    <tr className="bg-light">
                                        <th></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro Ruta" value={filters.id_Tipo_ruta} onChange={e => handleFilterChange('id_Tipo_ruta', e.target.value)} /></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro Origen" value={filters.Origen} onChange={e => handleFilterChange('Origen', e.target.value)} /></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro Destino" value={filters.Destino} onChange={e => handleFilterChange('Destino', e.target.value)} /></th>
                                        <th colSpan="4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((route, index) => (
                                        <React.Fragment key={index}>
                                            <tr className="bg-white">
                                                <td>
                                                    <button className="btn btn-sm btn-light py-0 px-1" onClick={() => toggleRoute(route.id_Tipo_ruta)}>
                                                        {expandedRoutes[route.id_Tipo_ruta] ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                                                    </button>
                                                </td>
                                                <td className="font-weight-bold">{route.id_Tipo_ruta}</td>
                                                <td>{route.Origen}</td>
                                                <td>{route.Destino}</td>
                                                <td className="text-center font-weight-bold">{route.TotalCruces}</td>
                                                <td className="text-muted">{(route.costPrev || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} <small>({route.previousYear})</small></td>
                                                <td className="text-dark font-weight-bold">{(route.costCurrent || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} <small>({route.currentYear})</small></td>
                                                <td className={\ont-weight-bold \\}>
                                                    {route.percentIncrease > 0 ? '+' : ''}{route.percentIncrease.toFixed(2)}%
                                                </td>
                                            </tr>
                                            {expandedRoutes[route.id_Tipo_ruta] && (
                                                <tr>
                                                    <td></td>
                                                    <td colSpan="7" className="p-0">
                                                        <div className="bg-light p-3 border-left border-bottom">
                                                            <h6 className="font-weight-bold mb-3 text-info"><Map size={14} className="mr-1"/> Casetas de la Ruta {route.id_Tipo_ruta}</h6>
                                                            <table className="table table-sm table-bordered bg-white mb-0">
                                                                <thead className="thead-light">
                                                                    <tr>
                                                                        <th>Caseta</th>
                                                                        <th>Clase</th>
                                                                        <th>Año/Mes</th>
                                                                        <th>Cruces</th>
                                                                        <th>Mínimo</th>
                                                                        <th>Máximo</th>
                                                                        <th>Promedio</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {route.casetas.map((caseta, i) => {
                                                                        const isHuerfana = caseta.Caseta?.startsWith('sinCaseta:');
                                                                        return (
                                                                            <tr key={i} className={isHuerfana ? 'table-warning' : ''}>
                                                                                <td>
                                                                                    {isHuerfana 
                                                                                        ? <span className="text-dark font-weight-bold" title='Ruta huérfana'><AlertTriangle size={12} className="mr-1 text-danger"/>{caseta.Caseta.replace('sinCaseta:', '')}</span>
                                                                                        : caseta.Caseta}
                                                                                </td>
                                                                                <td className="text-center">{caseta.Clase}</td>
                                                                                <td className="text-center">{caseta.Anio} / {meses[caseta.Mes - 1]}</td>
                                                                                <td className="text-center">{caseta.TotalCruces}</td>
                                                                                <td className="text-success">{(caseta.CostoMinimo || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                                                                                <td className="text-danger">{(caseta.CostoMaximo || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                                                                                <td className="font-weight-bold">{(caseta.CostoPromedio || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {paginatedData.length === 0 && (
                                        <tr><td colSpan="8" className="text-center py-5 text-muted">No se encontraron resultados consistentes con la configuración actual.</td></tr>
                                    )}
                                </tbody>
                            </table>
\;
    fileContent = fileContent.substring(0, tableStart) + newTable.trim() + fileContent.substring(tableEnd + 8);
}

fs.writeFileSync('c:/Users/IAVE/Documents/Proyecto IAVE WEB/iave-web/src/components/rutas/RutasAnalyzer.jsx', fileContent, 'utf8');