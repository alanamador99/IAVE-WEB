
// ==================== COMPONENTE HEADER ====================
const RouteHeader = ({ onSave, onCancel, routeName }) => {
  return (
    <div className="route-creator-header">
      <h1>🚛 {routeName || 'Nueva Ruta'} - Propuesta de rutas IAVE - WEB</h1>
      <div className="header-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          📋 Plantillas
        </button>
        <button className="btn btn-primary" onClick={onSave}>
          💾 Guardar Ruta
        </button>
      </div>
    </div>
  );
};

export default RouteHeader;
