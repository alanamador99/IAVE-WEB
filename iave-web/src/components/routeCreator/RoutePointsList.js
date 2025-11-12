// ==================== COMPONENTE LISTA DE PUNTOS ====================
export const RoutePointsList = ({ origin, destination, waypoints, onRemoveWaypoint }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      {origin && (
        <div className="flex items-center p-3 mb-2 bg-gray-50 rounded-xl border-l-4 border-green-500 hover:bg-green-50 transition-all duration-300">
          <div className="w-5 h-5 bg-green-500 rounded-full mr-3 animate-pulse"></div>
          <div>
            <strong className="text-green-700">Origen</strong><br />
            <small className="text-gray-600">{origin}</small>
          </div>
        </div>
      )}
      
      {waypoints.map((waypoint, index) => (
        <div key={waypoint.id} className="flex items-center p-3 mb-2 bg-gray-50 rounded-xl border-l-4 border-yellow-500 hover:bg-yellow-50 transition-all duration-300">
          <div className="w-5 h-5 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
          <div className="flex-1">
            <strong className="text-yellow-700">Punto Intermedio</strong><br />
            <small className="text-gray-600">{waypoint.name}</small>
          </div>
          <button 
            onClick={() => onRemoveWaypoint(index)}
            className="bg-red-100 hover:bg-red-200 text-red-600 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            ×
          </button>
        </div>
      ))}
      
      {destination && (
        <div className="flex items-center p-3 mb-2 bg-gray-50 rounded-xl border-l-4 border-red-500 hover:bg-red-50 transition-all duration-300">
          <div className="w-5 h-5 bg-red-500 rounded-full mr-3 animate-pulse"></div>
          <div>
            <strong className="text-red-700">Destino</strong><br />
            <small className="text-gray-600">{destination}</small>
          </div>
        </div>
      )}
    </div>
  );
};

export const RouteControlPoints = () => {
  const controlPoints = [
    { name: 'Jocotitlán', code: '128' },
    { name: 'Atlacomulco', code: '222' },
    { name: 'Contepec', code: '141' },
    { name: 'Zinapécuaro', code: '351' },
    { name: 'Panindícuaro', code: '463' }
  ];

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 mb-6 hover:shadow-xl transition-all duration-300">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 font-semibold flex items-center">
        🚩 Puntos de Control
      </div>
      <div className="divide-y divide-gray-100">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 font-semibold text-gray-700">
          <span>Ubicación</span>
          <span>Código</span>
        </div>
        {controlPoints.map((point, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 p-4 hover:bg-blue-50 transition-all duration-300">
            <span className="text-gray-800">{point.name}</span>
            <span className="text-blue-600 font-semibold">{point.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
};






