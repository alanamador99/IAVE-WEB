import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-fluid text-center mt-5">
      <div className="error" data-text="404" style={{ fontSize: '15rem', fontWeight: 'bold', color: '#4e73df', justifySelf:'center', marginLeft:'-10vw', paddingBottom:'2rem', paddingTop:'0.5rem'}}>
          404  
      </div>
      <div className='mx-auto'>

        <p className="lead text-gray-800 mb-3">Página no encontrada</p>
        <p className="text-gray-500 mb-4">Parece que encontraste un error en la Matrix...</p>
        <Link to="/" className="btn btn-primary">
          &larr; Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
