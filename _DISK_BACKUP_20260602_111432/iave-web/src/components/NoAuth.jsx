import React from 'react';
import { Link } from 'react-router-dom';

export default function NoAuth() {
  return (
    <div className="container-fluid text-center mt-5">
      <div className="error" data-text="403" style={{ fontSize: '15rem', fontWeight: 'bold', color: '#e74a3b', justifySelf:'center', marginLeft:'-10vw', paddingBottom:'2rem', paddingTop:'0.5rem'}}>
          403  
      </div>
      <div className='mx-auto'>
        <p className="lead text-gray-800 mb-3">Acceso Denegado</p>
        <p className="text-gray-500 mb-4">Lo sentimos, no tienes permisos para acceder a esta página.</p>
        <Link to="/" className="btn btn-primary">
          &larr; Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
