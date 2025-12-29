import {
  SearchCode,
} from 'lucide-react';
function Sidebar() {
  return (
    <ul 
      className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" 
      id="accordionSidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '250px', // Ajusta el ancho según necesites
        height: '100vh',
        overflowY: 'auto',
        zIndex: 1000
      }}
    >
      <a className="sidebar-brand d-flex align-items-center justify-content-center p-5" href="/">
        <img
          src="../Icono.ico"
          height={70}
          alt="LOGOTIPO ATM"
          className="rounded-lg m-2"
        />
      </a>
      <hr className="sidebar-divider my-0" />
      <li className="nav-item active">
        <a className="nav-link" href="/">
          <i className="fas fa-fw fa-home pr-3"></i>
          <span className="ml-1">Inicio</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      
      <li className="nav-item active">
        <a className="nav-link" href="/cruces">
          <i className="fas fa-fw fa-clipboard pr-3"></i>
          <span className="ml-1">Registros</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      <li className="nav-item active">
        <a className="nav-link" href="/facturacion">
          {/* Icono de Facturación */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-receipt-cutoff" viewBox="0 0 16 16">
            <path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5M11.5 4a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z" />
            <path d="M2.354.646a.5.5 0 0 0-.801.13l-.5 1A.5.5 0 0 0 1 2v13H.5a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H15V2a.5.5 0 0 0-.053-.224l-.5-1a.5.5 0 0 0-.8-.13L13 1.293l-.646-.647a.5.5 0 0 0-.708 0L11 1.293l-.646-.647a.5.5 0 0 0-.708 0L9 1.293 8.354.646a.5.5 0 0 0-.708 0L7 1.293 6.354.646a.5.5 0 0 0-.708 0L5 1.293 4.354.646a.5.5 0 0 0-.708 0L3 1.293zm-.217 1.198.51.51a.5.5 0 0 0 .707 0L4 1.707l.646.647a.5.5 0 0 0 .708 0L6 1.707l.646.647a.5.5 0 0 0 .708 0L8 1.707l.646.647a.5.5 0 0 0 .708 0L10 1.707l.646.647a.5.5 0 0 0 .708 0L12 1.707l.646.647a.5.5 0 0 0 .708 0l.509-.51.137.274V15H2V2.118z" />
          </svg>
          <span className="ml-4">Facturación</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      <li className="nav-item active">
        <a className="nav-link" href="/aclaraciones">
          <i className="fas fa-fw bi fa-dollar-sign pr-3"></i>
          <span className="ml-1">Aclaraciones</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      <li className="nav-item active">
        <a className="nav-link" href="/rutas">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pin-map" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8z" />
            <path fillRule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z" />
          </svg>
          <span className="ml-4">Rutas</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      <li className="nav-item active">
        <a className="nav-link" href="/sesgos">
          <SearchCode size={23} className="me-1 mr-3" />
          <span className="ml-1">Sesgos</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      <li className="nav-item active">
        <a className="nav-link" href="/abusos">
          <i className="fas fa-fw fa-gavel pr-3"></i>
          <span className="ml-1">Abusos</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      <li className="nav-item active">
        <a className="nav-link" href="/casetas">
          <i className="fas fa-fw fa-car pr-3"></i>
          <span className="ml-1">Tarifas - Casetas</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      <li className="nav-item active">
        <a className="nav-link" href="/tags">
          <i className="fas fa-fw fa fa-tag pr-3"></i>
          <span className="ml-1">TAGs</span>
        </a>
      </li>
      <hr className="sidebar-divider d-none d-md-block" />

      <div id="collapsePages" className="collapse" aria-labelledby="headingPages" data-parent="#accordionSidebar">
        <div className="bg-white py-2 collapse-inner rounded">
          <h6 className="collapse-header">Login Screens:</h6>
          <a className="collapse-item" href="login.html">Login</a>
          <a className="collapse-item" href="register.html">Register</a>
          <a className="collapse-item" href="forgot-password.html">Forgot Password</a>
          <div className="collapse-divider"></div>
          <h6 className="collapse-header">Other Pages:</h6>
          <a className="collapse-item" href="404.html">404 Page</a>
          <a className="collapse-item" href="blank.html">Blank Page</a>
        </div>
      </div>
    </ul>
  );
}

export default Sidebar;