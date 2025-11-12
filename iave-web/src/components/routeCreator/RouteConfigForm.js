import React, { useState } from 'react';
import {RoutePointsList, RouteControlPoints} from './RoutePointsList';

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
    <div className="route-form-sidebar">
      <div className="form-section">
        <h3>📍 Información General</h3>
        <div className="form-group">
          <label>Nombre de la Ruta</label>
          <input 
            type="text" 
            className="form-control" 
            value={routeData.name}
            onChange={(e) => onUpdateRoute('name', e.target.value)}
            placeholder="Ej: Ruta Norte-01"
          />
        </div>
        <div className="form-group">
          <label>Tipo de Vehículo</label>
          <select 
            className="form-control"
            value={routeData.vehicleType}
            onChange={(e) => onUpdateRoute('vehicleType', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="dos-ejes">Camión dos ejes</option>
            <option value="tres-ejes">Camión tres ejes</option>
            <option value="trailer">Tráiler</option>
          </select>
        </div>
        <div className="form-group">
          <label>Conductor</label>
          <select 
            className="form-control"
            value={routeData.driver}
            onChange={(e) => onUpdateRoute('driver', e.target.value)}
          >
            <option value="">Seleccionar conductor...</option>
            <option value="jose">2045 Ariel Ines</option>
            <option value="ana">2240 Marcos Hernandez</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>🎯 Puntos de Ruta</h3>
        <div className="form-group">
          <label>Origen</label>
          <input 
            type="text" 
            className="form-control" 
            value={routeData.origin}
            onChange={(e) => onUpdateRoute('origin', e.target.value)}
            placeholder="Huachinetla, Huehuetoca, Mex."
          />
        </div>
        <div className="form-group">
          <label>Destino</label>
          <input 
            type="text" 
            className="form-control" 
            value={routeData.destination}
            onChange={(e) => onUpdateRoute('destination', e.target.value)}
            placeholder="Hermosillo, Hermosillo, Son."
          />
        </div>
        
        <div className="form-group">
          <label>Punto Intermedio</label>
          <input 
            type="text" 
            className="form-control" 
            value={newWaypoint}
            onChange={(e) => setNewWaypoint(e.target.value)}
            placeholder="Agregar punto intermedio..."
          />
        </div>
        <button className="add-point-btn" onClick={handleAddWaypoint}>
          + Agregar Punto Intermedio
        </button>
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
export default RouteConfigForm;
