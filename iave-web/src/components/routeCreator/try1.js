import React, { useState, useCallback } from 'react';

// ==================== COMPONENTE PRINCIPAL ====================
const RouteCreator = ({ onSave, onCancel, initialData = null }) => {
  const [routeData, setRouteData] = useState({
    name: initialData?.name || '',
    vehicleType: initialData?.vehicleType || '',
    driver: initialData?.driver || '',
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    waypoints: initialData?.waypoints || [],
    summary: {
      distance: 1843.44,
      time: 1191,
      cost: 6825,
      fuel: 245.8,
      status: 'planning'
    }
  });

  const updateRouteData = useCallback((field, value) => {
    setRouteData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const addWaypoint = useCallback((waypoint) => {
    setRouteData(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, waypoint]
    }));
  }, []);

  const removeWaypoint = useCallback((index) => {
    setRouteData(prev => ({
      ...prev,
      waypoints: prev.waypoints.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(routeData);
    }
  }, [routeData, onSave]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800 p-5">
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
        <RouteHeader 
          onSave={handleSave}
          onCancel={onCancel}
          routeName={routeData.name}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-140px)]">
          <RouteConfigForm 
            routeData={routeData}
            onUpdateRoute={updateRouteData}
            onAddWaypoint={addWaypoint}
            onRemoveWaypoint={removeWaypoint}
          />
          
          <InteractiveMap 
            origin={routeData.origin}
            destination={routeData.destination}
            waypoints={routeData.waypoints}
          />
          
          <RouteDetailsPanel 
            summary={routeData.summary}
            waypoints={routeData.waypoints}
          />
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE HEADER ====================
const RouteHeader = ({ onSave, onCancel, routeName }) => {
  return (
    <div className="bg-gradient-to-r from-slate-800 via-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
        🚛 {routeName || 'Nueva Ruta'} - ERP Traslados
      </h1>
      <div className="flex gap-4">
        <button 
          className="px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
          onClick={onCancel}
        >
          📋 Plantillas
        </button>
        <button 
          className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1"
          onClick={onSave}
        >
          💾 Guardar Ruta
        </button>
      </div>
    </div>
  );
};

// ==================== COMPONENTE FORMULARIO ====================
const RouteConfigForm = ({ 
  routeData, 
  onUpdateRoute, 
  onAddWaypoint, 
  onRemoveWaypoint 
}) => {
  const [newWaypoint, setNewWaypoint] = useState('');

  const handleAddWaypoint = () => {
    if (newWaypoint.trim()) {
      onAddWaypoint({
        id: Date.now(),
        name: newWaypoint,
        type: 'waypoint'
      });
      setNewWaypoint('');
    }
  };

  return (
    <div className="lg:col-span-3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
      <div className="mb-8">
        <h3 className="text-slate-800 mb-4 text-lg font-semibold border-b-2 border-blue-500 pb-2 flex items-center">
          📍 Información General
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Nombre de la Ruta</label>
            <input 
              type="text" 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:scale-105 transition-all duration-300 focus:shadow-lg"
              value={routeData.name}
              onChange={(e) => onUpdateRoute('name', e.target.value)}
              placeholder="Ej: Ruta Norte-01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Tipo de Vehículo</label>
            <select 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:scale-105 transition-all duration-300 focus:shadow-lg"
              value={routeData.vehicleType}
              onChange={(e) => onUpdateRoute('vehicleType', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="dos-ejes">Camión dos ejes</option>
              <option value="tres-ejes">Camión tres ejes</option>
              <option value="trailer">Tráiler</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Conductor</label>
            <select 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:scale-105 transition-all duration-300 focus:shadow-lg"
              value={routeData.driver}
              onChange={(e) => onUpdateRoute('driver', e.target.value)}
            >
              <option value="">Seleccionar conductor...</option>
              <option value="jose">José Manuel</option>
              <option value="ana">Ana García</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-slate-800 mb-4 text-lg font-semibold border-b-2 border-blue-500 pb-2 flex items-center">
          🎯 Puntos de Ruta
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Origen</label>
            <input 
              type="text" 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:scale-105 transition-all duration-300 focus:shadow-lg"
              value={routeData.origin}
              onChange={(e) => onUpdateRoute('origin', e.target.value)}
              placeholder="Huachinetla, Huehuetoca, Mex."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Destino</label>
            <input 
              type="text" 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:scale-105 transition-all duration-300 focus:shadow-lg"
              value={routeData.destination}
              onChange={(e) => onUpdateRoute('destination', e.target.value)}
              placeholder="Hermosillo, Hermosillo, Son."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Punto Intermedio</label>
            <input 
              type="text" 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:scale-105 transition-all duration-300 focus:shadow-lg"
              value={newWaypoint}
              onChange={(e) => setNewWaypoint(e.target.value)}
              placeholder="Agregar punto intermedio..."
            />
          </div>
          <button 
            className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1"
            onClick={handleAddWaypoint}
          >
            + Agregar Punto Intermedio
          </button>
        </div>
      </div>

      <RoutePointsList 
        origin={routeData.origin}
        destination={routeData.destination}
        waypoints={routeData.waypoints}
        onRemoveWaypoint={onRemoveWaypoint}
      />
    </div>
  );
};

// ==================== COMPONENTE LISTA DE PUNTOS ====================
const RoutePointsList = ({ origin, destination, waypoints, onRemoveWaypoint }) => {
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

// ==================== COMPONENTE PANEL DE DETALLES ====================
const RouteDetailsPanel = ({ summary, waypoints }) => {
  return (
    <div className="lg:col-span-3 bg-gray-50 p-6 border-l border-gray-200 overflow-y-auto">
      <RouteSummary summary={summary} />
      <RouteControlPoints />
      <RouteActions />
    </div>
  );
};

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
          <span className="text-purple-800 font-bold">{Math.floor(summary.time/60)}h {summary.time%60}min</span>
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

// ==================== COMPONENTE PUNTOS DE CONTROL ====================
const RouteControlPoints = () => {
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

// ==================== EXPORTS ====================
export default RouteCreator;
export { 
  RouteHeader, 
  RouteConfigForm, 
  InteractiveMap, 
  RouteDetailsPanel,
  RouteSummary,
  RoutePointsList,
  RouteControlPoints,
  RouteActions
};