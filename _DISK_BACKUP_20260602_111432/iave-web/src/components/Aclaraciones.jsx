import Stats from './aclaraciones/Stats';
import AclaracionesTable from './aclaraciones/AclaracionesTable';



const AclaracionesModule = () => {


  return (
    <div className="container-fluid py-4 pb-0">
      <h1 className="h3 mb-4 text-gray-800">Módulo de Aclaraciones</h1>
      <div>
        <Stats />
        </div>

        <AclaracionesTable />
      </div>


      );
};

      export default AclaracionesModule;
