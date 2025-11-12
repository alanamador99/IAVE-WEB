// ==================== COMPONENTE RESUMEN ====================
const RouteSummary = ({ summary }) => {
  const getStatusColor = (status) => {
    const colors = {
      planning: 'from-yellow-400 to-orange-500',
      active: 'from-green-400 to-green-600',
      completed: 'from-gray-400 to-gray-600',
      cancelled: 'from-red-400 to-red-600'
    };
    return colors[status] || 'from-yellow-400 to-orange-500';
  };

  const getStatusText = (status) => {
    const texts = {
      planning: 'En planificación',
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return texts[status] || 'En planificación';
  };

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        📊 Resumen de Ruta
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
          <span className="text-gray-700 font-medium">Distancia Total:</span>
          <span className="text-blue-800 font-bold">{summary.distance.toLocaleString()} km</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
          <span className="text-gray-700 font-medium">Tiempo Estimado:</span>
          <span className="text-purple-800 font-bold">{Math.floor(summary.time / 60)}h {summary.time % 60}min</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
          <span className="text-gray-700 font-medium">Costo Estimado:</span>
          <span className="text-green-800 font-bold">${summary.cost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
          <span className="text-gray-700 font-medium">Combustible:</span>
          <span className="text-orange-800 font-bold">{summary.fuel} L</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
          <span className="text-gray-700 font-medium">Estado:</span>
          <span className="flex items-center">
            <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${getStatusColor(summary.status)} mr-2 animate-pulse`}></span>
            <span className="text-gray-800 font-bold">{getStatusText(summary.status)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
export default RouteSummary;
