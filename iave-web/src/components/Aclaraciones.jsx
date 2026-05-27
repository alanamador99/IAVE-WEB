import React, { useState } from 'react';
import Stats from './aclaraciones/Stats';
import CasetasPendientesStats from './aclaraciones/CasetasPendientesStats';
import AclaracionesTable from './aclaraciones/AclaracionesTable';

const AclaracionesModule = () => {
  const [datosFiltrados, setDatosFiltrados] = useState(null);
  const [datosCasetas, setDatosCasetas] = useState(null);
  const [filtroExterno, setFiltroExterno] = useState(null);

  const handleFilterClick = (caseta, clase, clear = false) => {
    setFiltroExterno({ caseta, clase, clear, timestamp: Date.now() });
  };

  return (
    <div className="container-fluid py-4 pb-0">
      <h1 className="h3 mb-4 text-gray-800">Módulo de Aclaraciones</h1>
      <div className="row mb-4">
        <div className="col-lg-9 col-md-8">
          <Stats datosFiltrados={datosFiltrados} />
        </div>
        <div className="col-lg-3 col-md-4" style={{maxHeight:'18rem',}}>
          <CasetasPendientesStats 
            datosFiltrados={datosCasetas || datosFiltrados} 
            onFilterClick={handleFilterClick} 
          />
        </div>
      </div>

      <AclaracionesTable 
        onDataFiltered={setDatosFiltrados} 
        onDataWidget={setDatosCasetas}
        filtroExterno={filtroExterno} 
      />
    </div>
  );
};

export default AclaracionesModule;
