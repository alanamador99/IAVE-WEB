import React, {useState} from 'react';

import { ModalUpdateCaseta } from '../components/shared/utils';
import { set } from 'lodash';

function ComponenteEnDesarrollo() {
  const [testingIdCaseta, setTestingIdCaseta] = useState(20); // ID de caseta para pruebas
  return (
    <div className="container-fluid py-4 pb-0">
      <h1 className="h3 mb-4 text-gray-800">Nuevo Componente</h1>
      <ModalUpdateCaseta 
      isOpen={true}
      onConfirm={{}}
      onClose={() => {}}
      idCaseta={testingIdCaseta}
      onClick={() => {setTestingIdCaseta(testingIdCaseta + 1)}}
      testingIdCaseta={testingIdCaseta}

      />
    </div>
  );
}

export default ComponenteEnDesarrollo;