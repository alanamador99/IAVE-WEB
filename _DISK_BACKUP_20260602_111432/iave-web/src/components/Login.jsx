import React from 'react';
import { useAuth } from '../hooks/useAuth';
// import { useNavigate } from 'react-router-dom';
import ATMLogo from '../../src/Icono.png';

const logo = ATMLogo;

const Login = () => {
  // Volvemos a usar login (redirect) porque el servidor no soporta password grant
  const { login } = useAuth();
  
  const handleLogin = () => {
    login().catch(error => console.error("Error redirect login:", error));
  };

  return (
    <div className="bg-gradient-primary" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container">

        <div className="row justify-content-center">

          <div className="col-xl-10 col-lg-12 col-md-9">

            <div className="card o-hidden border-0 shadow-lg my-5">
              <div className="card-body p-0">
                {/* Nested Row within Card Body */}
                <div className="row">
                  {/* Left side with image */}
                  <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center bg-light">
                    <img 
                      src={logo} 
                      alt="Logo ATMexicana" 
                      className="img-fluid p-5" 
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                  
                  {/* Right side with form */}
                  <div className="col-lg-6">
                    <div className="p-5">
                      <div className="text-center">
                        <h1 className="h4 text-gray-900 mb-4">¡Bienvenido a IAVE-WEB!</h1>
                        <p className="mb-4 text-muted">Inicia sesión con tu cuenta TUSA.</p>
                      </div>
                      
                      <div className="user">
                        <button 
                            className="btn btn-primary btn-user btn-block"
                            onClick={handleLogin}
                        >
                          Iniciar Sesión
                        </button>
                      </div>
                      <hr />
                      <div className="text-center">
                         <span className="small text-gray-500">Serás redirigido al inicio de sesiónd TUSA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
export default Login;



