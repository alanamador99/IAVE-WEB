// src/components/Cruces.js
import Stats from "./cruces/Stats";
import CrucesTable from "./cruces/CrucesTable";

export default function Cruces() {
  return (
    <div className="container-fluid py-4 pb-0">
      <h1 className="h3 mb-4 text-gray-800">Detalle de Cruces</h1>

      {/*Son las estadisticas de los cruces ya dictaminados, se refieren a las Aclaraciones | Abusos  | Sesgos. */}
      {/*Se deben actualizar conforme al prop que compartiran ambos componentes*/}
      <Stats />

      {/*Se coloca el componente de cruces para que compartan el status de las estadisticas y estas se actualicen al cambiar el "estatus" de los cruces. */}
      <CrucesTable />

    </div>
  );
}
