// ==================== COMPONENTE PRINCIPAL ====================
import React, { useState, useCallback } from 'react';
import RouteHeader from './RouteHeader';
import RouteConfigForm from './RouteConfigForm';
import InteractiveMap from './InteractiveMap';
import RouteDetailsPanel from './RouteDetailsPanel';

const RouteCreator = ({ onSave, onCancel, initialData = null }) => {
  const [routeData, setRouteData] = useState({
    name: initialData?.name || '',
    vehicleType: initialData?.vehicleType || '',
    driver: initialData?.driver || '',
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    waypoints: initialData?.waypoints || [],
    summary: {
      distance: 0,
      time: 0,
      cost: 0,
      fuel: 0,
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
    <div className="wrapper-route-creator">
      <div className="route-creator-container">
        <RouteHeader
          onSave={handleSave}
          onCancel={onCancel}
          routeName={routeData.name}
        />

        <div className="route-creator-main">
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
            onMapClick={(coordinates) => console.log('Map clicked:', coordinates)}
          />

          <RouteDetailsPanel
            summary={routeData.summary}
            waypoints={routeData.waypoints}
            onExportPDF={() => console.log('Export PDF')}
            onStartRoute={() => console.log('Start route')}
          />
        </div>
      </div>
    </div>
  );
};
export default RouteCreator;

