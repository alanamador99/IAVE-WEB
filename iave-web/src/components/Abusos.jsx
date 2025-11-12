import Stats from './abusos/Cards';
import AbusosTable from './abusos/AbusosTable';



const AbusosModule = () => {


    return (
        <div className="container-fluid py-4 pb-0">
            <h1 className="h3 mb-4 text-gray-800">Módulo de Abusos</h1>
            <div>
                <Stats />
            </div>

            <AbusosTable />
        </div>


    );
};

export default AbusosModule;
