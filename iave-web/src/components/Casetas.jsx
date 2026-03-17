// src/components/Casetas.js
import CasetasTable from  './casetas/CasetasTable.jsx'
export default function Casetas() {
  return (
    <div className="container-fluid py-4 pb-0">
      <h1 className="h3 mb-4 text-gray-800">Actualización de tarifas de casetas</h1>


      <CasetasTable />

    </div>
  );
}
