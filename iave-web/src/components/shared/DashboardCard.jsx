// src/components/DashboardCard.js
import { Link } from 'react-router-dom';

export default function DashboardCard({ titulo, descripcion, valor, bg, ruta, grande = true, valordefault = '', bateriaSuperior = '', bateriaSuperiorIzquierda='' }) {
  const enlaceRuta = (ruta) ? <>  <Link to={ruta} className="btn btn-outline-primary btn-sm my-0">Ver detalles</Link></> : <></>;
  const clase = (grande) ? "col-sm col-md mb-4" : 'col-sm col-md mb-4';

  const font_Size = (String(valor).length === 1) ? 60 / (2 * (String(valor).length)) + 'px' : 150 / (2 * (String(valor).length)) + 'px';
  return (

    <div className={clase}>
      <div className="card text-center shadow rounded-4 p-2" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="card-body d-flex flex-column justify-content-between py-2 mt-1">
          <div style={{ height: '20px' }}>

            <span className='float-right ' style={{ fontSize: '1rem', position: 'relative', top: '0px', marginRight:'-1rem' }}>{bateriaSuperior}</span>
            <span className='float-left ' style={{ fontSize: '1rem', position: 'relative', top: '0px', marginLeft:'-1rem'}}>{bateriaSuperiorIzquierda}</span>

            <h1 className={`${bg} text-white rounded-circle mx-auto `} style={{ fontSize: font_Size, width: '60px', height: '60px', lineHeight: '60px', position: 'relative', paddingTop: '0px !important', top: '-40px' }}>
              {(valor==='⟳') ?<>                <div className="spinner-border spinner-border-sm ml-3" id='SpinnerLoad' >  </div> </>: <> {valor} </>}
            </h1>
          </div>
          <h5 className="fw-bold">{titulo}</h5>
          <p className="text-lg text-gray-900">{valordefault}</p>
          <p className="text-muted small">{descripcion}</p>
        </div>
        {enlaceRuta}

      </div>

    </div>

  );
}
