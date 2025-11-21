import React, { useState } from 'react';
import { Toast } from 'react-bootstrap';

import { Clipboard } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const CopiarTag = ({ cruceSeleccionado }) => {
  const [copiado, setCopiado] = useState(false);

  const copiarAlPortapapeles = () => {
    if (cruceSeleccionado) {
      navigator.clipboard.writeText(cruceSeleccionado?.Tag);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1000); // Oculta el mensaje después de 2 segundos
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        className='text-primary font-weight-bolder ml-2'
        style={{ cursor: 'pointer', fontSize: '0.65rem' }}
        title="Copiar TAG al portapapeles"
        onClick={copiarAlPortapapeles}
      >
        <Clipboard size={20} />
      </span>

      {copiado && (
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            left: '25px',
            backgroundColor: 'rgb(40, 167, 69)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 6px',
            zIndex: '10',
            width: '11.5rem',

          }}
        >
          TAG copiado al portapapeles! ✔️
        </div>
      )}
    </div>
  );
};


const CopiarFecha = ({ cruceSeleccionado }) => {
  const [copiado, setCopiado] = useState(false);

  const copiarAlPortapapeles = () => {
    if (cruceSeleccionado?.Fecha) {
      navigator.clipboard.writeText(cruceSeleccionado.Fecha);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1000); // Oculta el mensaje después de 2 segundos
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        className='text-primary font-weight-bolder ml-2'
        style={{ cursor: 'pointer', fontSize: '0.65rem' }}
        title="Copiar TAG al portapapeles"
        onClick={copiarAlPortapapeles}
      >
        <Clipboard size={20} />
      </span>

      {copiado && (
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            left: '25px',
            backgroundColor: 'rgb(40, 167, 69)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 6px',
            zIndex: '10',
            width: '11.5rem',

          }}
        >
          TAG copiado al portapapeles! ✔️
        </div>
      )}
    </div>
  );
};




// Ajustar icono porque por defecto no se muestra
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const CasetaMapModal = ({ isOpen, onClose, nombreCaseta, lat, lng }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-2xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 font-bold">X</button>
        <h2 className="text-xl mb-4">{nombreCaseta}</h2>
        <MapContainer center={[lat, lng]} zoom={14} style={{ height: "400px", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={[lat, lng]}>
            <Popup>{nombreCaseta}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

const formatearRazonesSociales = (RazonSocial) => {
  if (!RazonSocial) return '';
  const response = RazonSocial.replaceAll('S.A. de C.V.', '').replaceAll('SA. de C.V.', '').replaceAll('SA de CV.', '').replaceAll('S.A. de CV', '').replaceAll('SA de CV', '');
  return response;
  
};


const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = new Date(fecha);
  if (isNaN(d)) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();
  return `${dia}-${mes}-${anio}`;
};

const formatearFechaConHora = (fecha) => {
  if (!fecha) return '';
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = new Date(fecha);
  if (isNaN(d)) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();

  return `${dia}-${mes}-${anio} a las ${fecha.split("T")[1].split(".")[0]}`;
};

const formatearNombre = (obj) => {
  return `${obj.Nombres || ''} ${obj.Ap_paterno || ''} ${obj.Ap_materno || ''}`;
};

const formatearDinero = (monto) => {
  if (!monto) return '';
  //La intención es colocar el número con una coma cada tres dígitos, pero CON dos decimales.
  const partes = (monto).toFixed(2).split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return partes.join('.');
};
const formatearEnteros = (monto) => {
  if (!monto) return '';
  //La intención es colocar el número con una coma cada tres dígitos, pero sin decimales.
  const partes = (monto).toFixed(0).split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return partes.join('.');
};


function CustomToast({ titulo, mensaje, mostrar, color, tiempo = 5000 }) {
  const [show, setShow] = useState(true);

  return (
    <>

      <Toast
        onClose={() => setShow(false)}
        show={mostrar && show}
        delay={tiempo}
        autohide={true}
        style={{ position: 'relative', bottom: 20, right: 20, minWidth: 250, zIndex: 9999 }}
        className=''

      >
        <Toast.Header className='bg-dark' closeButton={true}>
          <strong className={`m-auto ${color}`} style={{ fontSize: '1.3rem', justifyContent: 'center' }}>{titulo}</strong>
        </Toast.Header>
        <Toast.Body style={{ fontSize: '1rem', backgroundColor: 'gainsboro', animationName: 'toastAnimate', animationDuration: '6s' }} className='align-middle text-dark'>

          {mensaje}

        </Toast.Body>
      </Toast>
    </>
  );
}


function parsearMinutos(totalMinutos) {
  if (totalMinutos < 0) {
    return "El número de minutos no puede ser negativo.";
  }

  const minutosEnUnaHora = 60;
  const minutosEnUnDia = 24 * minutosEnUnaHora;

  // Calcular días
  const dias = Math.floor(totalMinutos / minutosEnUnDia);
  let minutosRestantes = totalMinutos % minutosEnUnDia;

  // Calcular horas
  const horas = Math.floor(minutosRestantes / minutosEnUnaHora);
  minutosRestantes = minutosRestantes % minutosEnUnaHora;

  // Los minutos restantes son los minutos finales
  const minutos = minutosRestantes;

  // Construir la cadena de resultado
  const partes = [];
  if (dias > 0) {
    partes.push(`${dias} día${dias > 1 ? 's' : ''}`);
  }
  if (horas > 0) {
    partes.push(`${horas} h`);
  }
  if (minutos > 0) {
    partes.push(`${minutos.toFixed(0)} min`);
  }

  if (partes.length === 0) {
    return '0 min';
  }

  return partes.join(', ');
}


const RouteOption = ({ tipo, distance, time, distanceUnit = ' KM', costs, advertencias = '', color = 'gray' }) => {
  return (
    <div className="border rounded p-3 py-0 bg-light" style={{ minWidth: '100px', color: `${color}` }}>
      {/* Header con ícono de información */}
      <div className="d-flex align-items-center justify-content-between ">
        <div className="d-flex align-items-center">
          <span
            className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center me-2 ml-2"
            style={{ width: '20px', height: '20px', fontSize: '12px' }}
            title={advertencias || 'Opción de ruta'}
          >
            i
          </span>
          <strong className='ml-4' style={{ fontSize: '0.9rem', color: `${color}` }}>{tipo}</strong>
        </div>
      </div>

      {/* Distancia */}
      <div className="mb-2">
        <small className="text-muted d-block" style={{ fontSize: '.8rem' }}>Distancia</small>
        <div>
          <strong style={{ fontSize: '1rem' }}>{distance}</strong>
          <small className="text-muted ms-1" style={{ fontSize: '.7rem' }}>{(distanceUnit)}</small>
        </div>
      </div>

      {/* Tiempo */}
      <div className="border-top py-0 pt-1 row">
        <small className="text-muted d-block pr-3" style={{ fontSize: '.7rem' }}>Tiempo</small>
        <strong>{time}</strong>
      </div>
      {/* Costos */}
      <div className="py-0 pt-1 row">
        <small className="text-muted d-block pr-3" style={{ fontSize: '.7rem' }}>{costs.label}</small>
        <strong style={{ fontSize: '0.85rem' }}>{(costs.value === 'Sin costo') ? '' : '$'}{costs.value}</strong>
      </div>
    </div>
  );
};



// Componente Modal con clases de Bootstrap/SB Admin
const ModalSelector = ({ isOpen, onClose, onSelect, valorCampo, valoresSugeridos, titulo = '', campo = '', tituloDelSelect = 'Opciones' }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (clienteSeleccionado) {
      onSelect(clienteSeleccionado);
      setClienteSeleccionado('');
      onClose();
    }
  };

  const handleCancelar = () => {
    setClienteSeleccionado('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={handleCancelar}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show"
        style={{ display: 'block', zIndex: 1050 }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg">
            {/* Header */}
            <div className="modal-header bg-gradient-primary">
              <h5 className="modal-title text-white">
                <i className="fas fa-user-tie mr-2"></i>
                {titulo || 'Seleccionar Cliente para la Población'}
              </h5>
              <button
                type="button"
                className="close text-white"
                onClick={handleCancelar}
                style={{ opacity: 0.8 }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <div className="alert alert-info border-left-info" role="alert">
                <i className="fas fa-map-marker-alt mr-2"></i>
                <strong>{campo}:</strong> {valorCampo}
              </div>
              <div className="form-group">
                <label className="font-weight-bold text-gray-800">
                  {tituloDelSelect} <span className="text-danger">*</span>
                </label>
                <select
                  value={clienteSeleccionado}
                  onChange={(e) => setClienteSeleccionado(e.target.value)}
                  className="form-control form-control-lg border-left-primary"
                  style={{ borderLeftWidth: '4px' }}
                >
                  <option value="">-- Selecciona una opción --</option>
                  {valoresSugeridos.map((valor) => (
                    <option key={valor.id_Tipo_ruta} value={valor.id_Tipo_ruta}>
                      ID: {valor.id_Tipo_ruta} | {formatearRazonesSociales(valor.RazonOrigen)} → {formatearRazonesSociales(valor.RazonDestino)} __ ({valor.Categoria})
                    </option>
                  ))}
                </select>
                {!clienteSeleccionado && (
                  <small className="form-text text-muted">
                    <i className="fas fa-info-circle mr-1"></i>
                    Por favor selecciona una opción para ver la ruta asociada en TUSA.
                  </small>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light">
              <button
                type="button"
                onClick={handleCancelar}
                className="btn btn-secondary"
              >
                <i className="fas fa-times mr-2"></i>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={!clienteSeleccionado}
                className="btn btn-success"
              >
                <i className="fas fa-check mr-2"></i>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};




export default CopiarTag;
export { CopiarTag, CopiarFecha, CasetaMapModal, formatearFecha, formatearFechaConHora, formatearNombre, formatearDinero, formatearEnteros, CustomToast, parsearMinutos, RouteOption, ModalSelector };
