import React, { useState } from 'react';

// Componente Modal con clases de Bootstrap/SB Admin
const ModalSelectorCliente = ({ isOpen, onClose, onSelect, valorCampo, valoresSugeridos,titulo='', campo='' }) => {
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
                  Cliente: <span className="text-danger">*</span>
                </label>
                <select
                  value={clienteSeleccionado}
                  onChange={(e) => setClienteSeleccionado(e.target.value)}
                  className="form-control form-control-lg border-left-primary"
                  style={{ borderLeftWidth: '4px' }}
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {valoresSugeridos.map((valor) => (
                    <option key={valor.id} value={valor.id}>
                      {valor.nombre}
                    </option>
                  ))}
                </select>
                {!clienteSeleccionado && (
                  <small className="form-text text-muted">
                    <i className="fas fa-info-circle mr-1"></i>
                    Por favor selecciona un cliente para continuar
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

// Componente Demo
const Buscador = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteAsignado, setClienteAsignado] = useState(null);

  // Datos de ejemplo
  const clientes = [
    { id: 1, nombre: 'Autopartes y Componentes SA de CV' },
    { id: 2, nombre: 'Camiones del Noroeste SA de CV' },
    { id: 3, nombre: 'Transportes Ejecutivos SA de CV' },
    { id: 4, nombre: 'Logística y Distribución SA de CV' },
    { id: 5, nombre: 'Servicios Industriales SA de CV' }
  ];

  const poblacion = 'Guadalajara, Jalisco';

  const handleSelectCliente = (clienteId) => {
    const cliente = clientes.find(c => c.id === parseInt(clienteId));
    setClienteAsignado(cliente);
  };

  return (
    <div id="wrapper">
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          {/* Topbar simulado */}
          <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
            <div className="container-fluid">
              <h1 className="h3 mb-0 text-gray-800">
                <i className="fas fa-route mr-2"></i>
                Creador de Rutas - Propuesta IAVE-WEB
              </h1>
            </div>
          </nav>

          {/* Contenido Principal */}
          <div className="container-fluid">
            <div className="row">
              <div className="col-xl-8 col-lg-7">
                {/* Card Principal */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                    <h6 className="m-0 font-weight-bold text-primary">
                      Información de Punto Intermedio
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="border-left-warning border-bottom-warning p-4 mb-4">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                            Punto Intermedio
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800">
                            {poblacion}
                          </div>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-map-marker-alt fa-2x text-gray-300"></i>
                        </div>
                      </div>
                    </div>

                    {clienteAsignado && (
                      <div className="border-left-success p-4 mb-4">
                        <div className="row no-gutters align-items-center">
                          <div className="col mr-2">
                            <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                              Cliente Asignado
                            </div>
                            <div className="h6 mb-0 font-weight-bold text-gray-800">
                              {clienteAsignado.nombre}
                            </div>
                          </div>
                          <div className="col-auto">
                            <i className="fas fa-check-circle fa-2x text-success"></i>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="btn btn-primary btn-icon-split btn-lg"
                    >
                      <span className="icon text-white-50">
                        <i className="fas fa-user-tie"></i>
                      </span>
                      <span className="text">Asignar Cliente a Población</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-xl-4 col-lg-5">
                {/* Card de Instrucciones */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">
                      <i className="fas fa-info-circle mr-2"></i>
                      Instrucciones
                    </h6>
                  </div>
                  <div className="card-body">
                    <ol className="pl-3 mb-0 text-gray-800">
                      <li className="mb-2">Haz clic en el botón para abrir el modal</li>
                      <li className="mb-2">Selecciona un cliente de la lista desplegable</li>
                      <li className="mb-2">Confirma la selección o cancela</li>
                    </ol>
                    <hr />
                    <p className="text-xs text-muted mb-0">
                      <i className="fas fa-palette mr-1"></i>
                      El diseño usa los estilos de SB Admin 2 con Bootstrap
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Modal */}
      <ModalSelectorCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectCliente}
        campo="Población"
        valorCampo={poblacion}
        valoresSugeridos={clientes}
        titulo="Selecciona el cliente del origen"

      />
    </div>
  );
}

export default Buscador;