const fs = require('fs');
let fileContent = fs.readFileSync('c:/Users/IAVE/Documents/Proyecto IAVE WEB/iave-web/src/components/rutas/RutasAnalyzer.jsx', 'utf8');

const tableStartString = '<thead className="thead-light sticky-top">';
const tableEndString = '</tbody>';

const startIdx = fileContent.indexOf(tableStartString);
const endIdx = fileContent.indexOf(tableEndString, startIdx) + tableEndString.length;

if (startIdx > -1 && endIdx > -1) {
    const newHtml = 
                                <thead className="thead-light sticky-top">
                                    {/* Cabecera de Ordenamiento */}
                                    <tr>
                                        <th style={{width: '2%'}}></th>
                                        <th onClick={() => handleSort('id_Tipo_ruta')} style={{cursor:'pointer'}}>Ruta <SortIcon column="id_Tipo_ruta"/></th>
                                        <th onClick={() => handleSort('Origen')} style={{cursor:'pointer'}}>Origen <SortIcon column="Origen"/></th>
                                        <th onClick={() => handleSort('Destino')} style={{cursor:'pointer'}}>Destino <SortIcon column="Destino"/></th>
                                        <th className="text-center" onClick={() => handleSort('TotalCruces')} style={{cursor:'pointer'}}>Viajes <SortIcon column="TotalCruces"/></th>
                                        <th onClick={() => handleSort('costPrev')} style={{cursor:'pointer'}}>Costo Anterior <SortIcon column="costPrev"/></th>
                                        <th onClick={() => handleSort('costCurrent')} style={{cursor:'pointer'}}>Costo Actual <SortIcon column="costCurrent"/></th>
                                        <th className="text-center" onClick={() => handleSort('percentIncrease')} style={{cursor:'pointer'}}>% Var <SortIcon column="percentIncrease"/></th>
                                    </tr>
                                    {/* Sub-Cabecera de Filtros */}
                                    <tr className="bg-light">
                                        <th></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro..." value={filters.id_Tipo_ruta} onChange={e => handleFilterChange('id_Tipo_ruta', e.target.value)} /></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro..." value={filters.Origen} onChange={e => handleFilterChange('Origen', e.target.value)} /></th>
                                        <th><input className="form-control form-control-sm text-xs" placeholder="Filtro..." value={filters.Destino} onChange={e => handleFilterChange('Destino', e.target.value)} /></th>
                                        <th colSpan="4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((route, index) => {
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
                                                    <td className="text-muted">{(route.costPrev || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} <small>({route.previousYear})</small></td>
                                                    <td className="text-dark font-weight-bold">{(route.costCurrent || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} <small>({route.currentYear})</small></td>
                                                    <td className={\	ext-center font-weight-bold \\}>
                                                        {route.percentIncrease > 0 ? '+' : ''}{route.percentIncrease.toFixed(2)}%
                                                    </td>
                                                </tr>
                                                {/* Detalle Expandido (Casetas Hija) */}
                                                {expandedRoutes[route.id_Tipo_ruta] && (
                                                    <tr>
                                                        <td></td>
                                                        <td colSpan="7" className="p-0">
                                                            <div className="bg-light p-3 border-left border-bottom border-primary" style={{borderWidth: '3px !important'}}>
                                                                <h6 className="font-weight-bold mb-3 text-primary"><Map size={14} className="mr-1"/> Casetas Desglosadas a lo largo del tiempo (Ruta {route.id_Tipo_ruta})</h6>
                                                                <table className="table table-sm table-bordered bg-white mb-0">
                                                                    <thead className="thead-light">
                                                                        <tr>
                                                                            <th>Caseta</th>
                                                                            <th>Clase</th>
                                                                            <th>Año/Mes</th>
                                                                            <th>Cruces (Mes)</th>
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
                                                                                            ? <span className="text-dark font-weight-bold" title="Ruta huérfana"><AlertTriangle size={12} className="mr-1 text-danger"/>{caseta.Caseta.replace('sinCaseta:', '')}</span>
                                                                                            : caseta.Caseta}
                                                                                    </td>
                                                                                    <td className="text-center text-muted">{caseta.Clase}</td>
                                                                                    <td className="text-center font-weight-bold">{caseta.Anio} / {caseta.Mes ? caseta.Mes : 'N/A'}</td>
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
                                        );
                                    })}
                                    {paginatedData.length === 0 && (
                                        <tr><td colSpan="8" className="text-center py-5 text-muted">No se encontraron resultados consistentes con la configuración actual.</td></tr>
                                    )}
                                </tbody>;
    fileContent = fileContent.substring(0, startIdx) + newHtml.trim() + fileContent.substring(endIdx);
    fs.writeFileSync('c:/Users/IAVE/Documents/Proyecto IAVE WEB/iave-web/src/components/rutas/RutasAnalyzer.jsx', fileContent, 'utf8');
}