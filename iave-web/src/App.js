import Sidebar from "./components/sidebar";
import Topbar from "./components/Topbar";
import Footer from "./components/Footer";
import Cruces from "./components/Cruces";
import Casetas from "./components/Casetas";
import Aclaraciones from "./components/Aclaraciones";
import AbusosModule from "./components/Abusos";

import Tags from "./components/Tags.jsx";
import Sesgos from "./components/Sesgos.jsx";
import Homess from "./components/homes.jsx";
import NotFound from "./components/NotFound.jsx";
import RutasModule from "./components/Rutas.jsx";
import RouteCreator from "./components/Route-Creator.jsx";


import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapaContent from "./components/rutas/MapaContent.jsx";


function App() {
  return (
    <Router>
      <div className="d-flex flex-column">
        <Sidebar />
        <div id="content-wrapper" className="d-flex flex-column">
          <Topbar />
          <div id="content" className="main-content pb-0">
            <Routes>
              <Route path="/" element={<Cruces />} />
              <Route path="/Home" element={<Homess />} />
              <Route path="/aclaraciones" element={<Aclaraciones />} />
              <Route path="/abusos" element={<AbusosModule />} />
              <Route path="/cruces" element={<Cruces />} />
              <Route path="/rutas" element={<RutasModule />} />
              <Route path="/rutas-testing" element={<RutasModule />} />
              <Route path="/mapas-testing" element={<MapaContent />} />
              <Route path="/dashboard" element={<Cruces />} />
              <Route path="/casetas" element={<Casetas />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/sesgos" element={<Sesgos />} />
              <Route path="/route-creator" element={<RouteCreator />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;