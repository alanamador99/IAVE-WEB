import Stats from './sesgos/Stats.jsx';
import SesgosComponent from './sesgos/SesgosComponent.jsx';



const SesgosModule = () => {


    return (
        <div className="container-fluid py-4">
            <h1 className="h3 mb-4 text-gray-800">Gestión de Sesgos</h1>
            <div>
                <Stats />
            </div>
            <SesgosComponent />
        </div>


    );
};

export default SesgosModule;