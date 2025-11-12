// ==================== COMPONENTE ACCIONES ====================
const RouteActions = () => {
  return (
    <div className="space-y-3">
      <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1 flex items-center justify-center">
        🚀 Iniciar Ruta
      </button>
      <button className="w-full p-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1 flex items-center justify-center">
        📄 Exportar PDF
      </button>
    </div>
  );
};
export default RouteActions;
