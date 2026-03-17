import Stats from './abusos/Stats';
import AbusosTable from './abusos/AbusosTable';



const AbusosModule = () => {
const handleUpdateFromAbusosTable = () => {
    // Lógica para manejar la actualización desde AbusosTable hacia el componente Stats
    // Se debe de notificar al componente Stats que actualice sus datos
    console.log('Table component has notified an update.');
  }

    return (
        <div className="container-fluid py-4 pb-0">
            <h1 className="h3 mb-4 text-gray-800">Módulo de Abusos</h1>
            <div>
                <Stats
                    onUpdateFromAbusosTable={( ) => {
                        handleUpdateFromAbusosTable();
                    }}

                />
            </div>

            <AbusosTable 
                NotifyUpdateToParent={handleUpdateFromAbusosTable}
            />
        </div>


    );
};

export default AbusosModule;
