import React, { useState } from 'react';
import Stats from './abusos/Stats';
import AbusosTable from './abusos/AbusosTable';



const AbusosModule = () => {
  const [datosFiltrados, setDatosFiltrados] = useState(null);

    return (
        <div className="container-fluid py-4 pb-0">
            <h1 className="h3 mb-4 text-gray-800">Módulo de Abusos</h1>
            <div>
                <Stats datosFiltrados={datosFiltrados} />
            </div>

            <AbusosTable onDataFiltered={setDatosFiltrados} />
        </div>


    );
};

export default AbusosModule;
