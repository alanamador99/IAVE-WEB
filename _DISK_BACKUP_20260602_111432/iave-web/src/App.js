import Sidebar from "./components/sidebar";
import Topbar from "./components/Topbar";
import Footer from "./components/Footer";
import Cruces from "./components/Cruces";
import Casetas from "./components/Casetas";
import Aclaraciones from "./components/Aclaraciones";
import AbusosModule from "./components/Abusos";
import Facturacion from "./components/facturado.jsx";
import Tags from "./components/Tags.jsx";
import Sesgos from "./components/Sesgos.jsx";
import Home from "./components/Dashboard.jsx";
import NotFound from "./components/NotFound.jsx";
import RutasModule from "./components/Rutas.jsx";
import RouteCreator from "./components/Route-Creator.jsx";
import AnalizadorXML from "./components/AnalizadorXML.jsx";
import Login from "./components/Login.jsx";
import NoAuth from "./components/NoAuth.jsx";
import NuevoComponenteTesting from "./components/NuevoComponente.jsx";
import DieselPrices from "./components/DieselPrices.jsx";
import CasetasPaseLinker from "./components/casetas/CasetasPaseLinker.jsx";



import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import MapaContent from "./components/rutas/MapaContent.jsx";
import { useAuth } from "./hooks/useAuth.js"; // Importar hook directamente
import { AuthProvider } from "./context/AuthContext"; // Importar AuthProvider
import Callback from "./components/Callback"; // Importar componente Callback

// Componente para proteger rutas según roles
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando autenticación...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se definen roles permitidos y el usuario no tiene uno de ellos
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirigir a home o dashboard si no tiene permisos
    return <Navigate to="/NoAuth" replace />;
  }

  return children ? children : <Outlet />;
};

function Layout({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth(); // Usar estado real

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // 1. Si NO tengo token y NO estoy en login -> Redirigir a Login
  // Nota: Permitimos /callback para que pueda procesar el login
  if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/callback') {
    return <Navigate to="/login" replace />;
  }

  // 2. Si SI tengo token y estoy intentando entrar a Login -> Redirigir a Home
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  // Rutas donde NO queremos mostrar Sidebar, Topbar ni Footer
  const hideLayout = location.pathname === '/login' || location.pathname === '/callback';

  if (hideLayout) {
    return children;
  }

  return (
    <div className="d-flex flex-column">
      <Sidebar activePage={location.pathname.substring(1)} />
      <div id="content-wrapper" className="d-flex flex-column">
        <Topbar />
        <div id="content" className="main-content pb-0">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />

            {/* Rutas Protegidas - Acceso General (admin, invitado) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'invitado']} />}>
            <Route path="/" element={<Home />} />
            <Route path="/Inicio" element={<Home />} />
            <Route path="/aclaraciones" element={<Aclaraciones />} />
            <Route path="/casetas" element={<Casetas />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/rutas" element={<RutasModule />} />
            <Route path="/nuevocomponente" element={<NuevoComponenteTesting />} />
            <Route path="/diesel" element={<DieselPrices />} />
          </Route>

          {/* Rutas Protegidas - Solo Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/abusos" element={<AbusosModule />} />
            <Route path="/cruces" element={<Cruces />} />
            <Route path="/cruces/:year" element={<Cruces />} />
            <Route path="/facturacion" element={<Facturacion />} />
            <Route path="/XML" element={<AnalizadorXML />} />
            <Route path="/sesgos" element={<Sesgos />} />
            <Route path="/route-creator" element={<RouteCreator />} />
            <Route path="/rutas-testing" element={<RutasModule />} />
            <Route path="/mapas-testing" element={<MapaContent />} />
            <Route path="/casetas/actualizarCaseta/:idCaseta" element={<Casetas />} />
            <Route path="/casetas/linker" element={<CasetasPaseLinker />} />
          </Route>

          <Route path="*" element={<NotFound />} />
          <Route path="/NoAuth" element={<NoAuth />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;