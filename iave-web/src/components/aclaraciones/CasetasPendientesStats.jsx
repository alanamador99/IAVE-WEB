import React, { useMemo, useState } from 'react';
import { Filter, FilterX, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const CasetasPendientesStats = ({ datosFiltrados, onFilterClick }) => {
  const [filtroActivo, setFiltroActivo] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });

  const tableData = useMemo(() => {
    if (!datosFiltrados || datosFiltrados.length === 0) return [];

    const pendientes = datosFiltrados.filter(item => 
      item.Estatus_Secundario === 'pendiente_aclaracion'
    );

    const agrupado = pendientes.reduce((acc, current) => {
      const caseta = current.Caseta || 'Desconocida';
      const clase = current.Clase || 'Desconocida';
      const key = caseta + '-' + clase;
      
      if (!acc[key]) {
        acc[key] = { caseta, clase, total: 0, key };
      }
      acc[key].total += 1;
      return acc;
    }, {});

    const sortedData = Object.values(agrupado);
    
    if (sortConfig && sortConfig.key) {
      sortedData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sortedData;
  }, [datosFiltrados, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown size={12} className="text-muted ml-1" />;
    }
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />;
  };

  const handleToggleFilter = (row) => {
    if (filtroActivo === row.key) {
      setFiltroActivo(null);
      if (onFilterClick) onFilterClick(row.caseta, row.clase, true); // true = limpiar
    } else {
      setFiltroActivo(row.key);
      if (onFilterClick) onFilterClick(row.caseta, row.clase, false);
    }
  };

  return (
    <div className="card shadow mb-4 h-100 pb-0">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">Casetas Pendientes por Clase</h6>
      </div>
      <div className="card-body p-0 " style={{ maxHeight: '250px', overflowY: 'scroll' }}>
        {tableData.length === 0 ? (
          <p className="text-muted text-center p-3 m-0">No hay datos pendientes.</p>
        ) : (
          <div className="table-responsive table-container m-0 overflow-hidden">
            <table className="table table-sm table-hover mb-0 text-center">
              <thead className="thead-light">
                <tr>
                  <th className="align-middle" onClick={() => requestSort('caseta')} style={{ cursor: 'pointer', position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8f9fc' }}>
                    Caseta {getSortIcon('caseta')}
                  </th>
                  <th className="align-middle" onClick={() => requestSort('clase')} style={{ cursor: 'pointer', position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8f9fc' }}>
                    Clase {getSortIcon('clase')}
                  </th>
                  <th className="align-middle" onClick={() => requestSort('total')} style={{ cursor: 'pointer', position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8f9fc' }}>
                    Total {getSortIcon('total')}
                  </th>
                  <th className="align-middle" style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8f9fc' }}>
                    Filtrar
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => {
                  const isActivo = filtroActivo === row.key;
                  let btnClass = 'btn btn-sm py-0 px-2 ';
                  btnClass += isActivo ? 'btn-primary' : 'btn-outline-primary';
                  return (
                    <tr key={idx} className={isActivo ? 'table-primary' : ''}>
                      <td className="align-middle text-xs text-left pl-3">{row.caseta}</td>
                      <td className="align-middle text-xs">{row.clase}</td>
                      <td className="align-middle font-weight-bold text-danger">{row.total}</td>
                      <td className="align-middle">
                        <button 
                          className={btnClass}
                          title={isActivo ? 'Quitar filtro' : 'Filtrar por esta caseta y clase'}
                          onClick={() => handleToggleFilter(row)}
                        >
                          {isActivo ? <FilterX size={14} /> : <Filter size={14} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasetasPendientesStats;
