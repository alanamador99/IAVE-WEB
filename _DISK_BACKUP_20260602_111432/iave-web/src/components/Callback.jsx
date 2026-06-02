import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { userManager } from "../auth/authConfig";

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const processed = useRef(false); // Evitar doble ejecución

  useEffect(() => {
    // Si ya procesamos, no hacemos nada (evita doble llamada en React Strict Mode)
    if (processed.current) return;
    processed.current = true;

    // Procesar la respuesta del proveedor de identidad (el código en la URL)
    userManager
      .signinCallback()
      .then((user) => {
        console.log("Login exitoso:", user);
        // Redirigir al usuario a la página principal o la que intentaba acceder
        // (Podrías guardar la ruta original en state antes de redirigir)
        navigate("/", { replace: true });
      })
      .catch((err) => {
        console.error("Error en callback de login:", err);
        setError(err.message);
        // Opcional: Redirigir a login de nuevo tras unos segundos
        // setTimeout(() => navigate("/login"), 3000);
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Error de Autenticación</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Procesando...</span>
        </div>
        <h4 className="mt-3">Completando inicio de sesión...</h4>
      </div>
    </div>
  );
};

export default Callback;