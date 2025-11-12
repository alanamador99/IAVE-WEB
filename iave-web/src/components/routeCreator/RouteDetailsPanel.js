import RouteSummary from './RouteSummary';

import { RoutePointsList, RouteControlPoints } from './RoutePointsList';
import RouteActions from './RouteActions';

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

export default RouteDetailsPanel;
