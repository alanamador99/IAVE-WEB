

// ==================== COMPONENTE MAPA ====================
const InteractiveMap = ({ origin, destination, waypoints }) => {
  return (
    <div className="lg:col-span-6 bg-white relative overflow-hidden">
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex flex-col items-center justify-center text-gray-600">
        <div className="text-6xl mb-4">🗺️</div>
        <div className="text-xl font-semibold mb-2">Mapa Interactivo</div>
        <div className="text-sm opacity-75 text-center">
          <div>Origen: {origin || 'No definido'}</div>
          <div>Destino: {destination || 'No definido'}</div>
          <div>Puntos intermedios: {waypoints.length}</div>
        </div>
      </div>

      {/* Controles del mapa */}
      <div className="absolute top-5 right-5 flex flex-col gap-3">
        <button className="w-12 h-12 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-lg font-bold text-gray-700">
          +
        </button>
        <button className="w-12 h-12 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-lg font-bold text-gray-700">
          −
        </button>
        <button className="w-12 h-12 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-lg">
          📍
        </button>
        <button className="w-12 h-12 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-lg">
          🗂️
        </button>
      </div>
    </div>
  );
};
export default InteractiveMap;
