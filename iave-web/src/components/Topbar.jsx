import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import imagen from '../undraw_profile.svg'
import { formatearFecha, formatearNombre, parseJwt } from '../components/shared/utils.jsx';
import { useAuth } from '../hooks/useAuth'; // Importar hook de autenticación
import EditRutaPanel from '../components/shared/EditRutaPanel';

const API_URL = process.env.REACT_APP_API_URL;

const Topbar = () => {
  const { user, logout } = useAuth(); // Usar contexto en lugar de localStorage
  const [loading, setLoading] = useState(true);
  const [tagsAInactivar, setTagsAInactivar] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);

  // Editar ruta desde Topbar
  const [editRutaInputOpen, setEditRutaInputOpen] = useState(false);
  const [editRutaIdInput, setEditRutaIdInput] = useState('');
  const [editRutaPanelData, setEditRutaPanelData] = useState(null); // { id, initialCasetas }
  const [editRutaLoading, setEditRutaLoading] = useState(false);

  const handleOpenEditRutaInput = () => {
    setEditRutaIdInput('');
    setEditRutaInputOpen(true);
  };

  const handleConfirmEditRuta = async () => {
    const id = parseInt(editRutaIdInput, 10);
    if (!id || isNaN(id)) return;
    setEditRutaLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/casetas/rutas/${id}/casetasPorRuta`);
      const initialCasetas = res.data || [];
      setEditRutaPanelData({ id, initialCasetas });
      setEditRutaInputOpen(false);
    } catch {
      alert('Error al obtener las casetas de la ruta');
    } finally {
      setEditRutaLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/tags/notifications`);
      setTagsAInactivar(data);
    } catch (err) {
      console.error('Error al cargar las notificaciones de los TAGS:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (OP, e) => {
    e.preventDefault();
    window.open(`https://apps.pase.com.mx/uc/detalletag/IMDM/${OP?.Tag?.replace("IMDM", "")}`, '_blank', 'noreferrer');
    
    // Configurar la acción a realizar e invocar el Modal
    setAccionPendiente(OP);
    setModalOpen(true);
  };

  const confirmarAccion = async () => {
    if (!accionPendiente) return;

    try {
      await axios.put(`${API_URL}/api/tags/update-status`, {
        tag: accionPendiente.Tag,
        accion: accionPendiente.Accion
      });
      // Recargar notificaciones
      await fetchTags();
    } catch (err) {
      console.error('Error al actualizar estatus:', err);
      alert('Hubo un error al intentar actualizar el estado del TAG.');
    } finally {
      setModalOpen(false);
      setAccionPendiente(null);
    }
  };

  const cancelarAccion = () => {
    setModalOpen(false);
    setAccionPendiente(null);
  };
  const userName = useMemo(() => {
    let name = user?.profile?.name || user?.profile?.preferred_username || 'Usuario';
    
    if (user?.access_token) {
      const decoded = parseJwt(user.access_token);
      if (decoded?.nombre && decoded?.apellido) {
        name = `${decoded.nombre} ${decoded.apellido}`;
      } else if (decoded?.nombre) {
        name = decoded.nombre;
      }
    }
    return name;
  }, [user]);

  const handleCerrarSesion = () => {
    logout(); 
  };

  useEffect(() => {
    fetchTags();
  }, []); // Solo se ejecuta al montar

  return (
    <>
    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4  shadow" >
      <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3">
        <i className="fa fa-bars"></i>
      </button>
      <ul className='navbar-nav ml-auto'>
        <li className="nav-item dropdown no-arrow">
          <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button"
            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span className="mr-2 d-none d-lg-inline text-gray-600 small">Proyecto IAVE</span>
            <img className="img-profile rounded-circle"
              src={imagen}>
            </img>
          </a>
          <div className="dropdown-menu dropdown-menu-right shadow animated--grow-in"
            aria-labelledby="userDropdown">
            <a className="dropdown-item" href="#">
              <i className="fas fa-user fa-sm fa-fw mr-2 text-gray-400"></i>
              Perfil
            </a>
            <a className="dropdown-item" href="#">
              <i className="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>
              Configuración
            </a>
            <a className="dropdown-item" href="#">
              <i className="fas fa-list fa-sm fa-fw mr-2 text-gray-400"></i>
              Historial de actividad
            </a>
            <div className="dropdown-divider"></div>
            <a className="dropdown-item" onClick={handleCerrarSesion} style={{cursor: 'pointer'}}>
              <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
              Cerrar sesión
            </a>
          </div>
        </li>
      </ul>
      <span className="float-right">Bienvenido <b>{userName || 'Usuario'}</b> {formatearFecha(dayjs())}</span>
      {/* Botón Editar Ruta */}
      <ul className="navbar-nav">
        <li className="nav-item">
          <button
            className="btn btn-link nav-link"
            title="Editar casetas de una ruta"
            onClick={handleOpenEditRutaInput}
            style={{ color: '#f6c23e' }}
          >
            <i className="fas fa-route fa-fw" style={{ fontSize: '1.2rem' }}></i>
          </button>
        </li>
      </ul>

      <ul className="navbar-nav ml-auto  sticky-top">
        <li className="nav-item dropdown no-arrow mx-1 ">

          {(loading) ?
            <>
              <div className="d-flex justify-content-center align-items-center" style={{ height: "4vh" }}>
                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden"></span>
                </div>
              </div>
            </>
            :
            <>
              <a className="nav-link dropdown-toggle" href="#" id="alertsDropdown" role="button"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="fas fa-bell fa-fw " style={{ width: '2rem', height: '2rem', color: '#4e73df' }}></i>
                <span className={`badge ${tagsAInactivar.length > 0 ? 'badge-danger' : 'badge-success'} badge-counter`} style={{ fontSize: '1rem' }}>{tagsAInactivar.length}</span>
              </a>

            </>
          }


          <div className="dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in" style={{maxHeight:'300px', overflowY: 'auto'}}
            aria-labelledby="alertsDropdown">
            <h6 className="dropdown-header">
              Notificaciones de TAGs
            </h6>
            {(tagsAInactivar.length === 0) ?
              /* En esta parte se define la lógica para el caso de que no se encuentren TAGs a inactivar o reactivar. */
              <>
                <div className="dropdown-item d-flex align-items-center">
                  <div className="mr-3">
                    <div className="icon-circle bg-success">
                      <i className="fas fa-check text-white"></i>
                    </div>
                  </div>
                  <div>
                    <div className="small text-primary font-weight-bold text-truncate">No hay notificaciones pendientes</div>
                  </div>
                </div>
              </>
            :
            (tagsAInactivar.length > 0) &&
              /* Si existen registros, se muestran. */
              <>
                {tagsAInactivar.map((OP, idx) => {
                  const esReactivar = OP.Accion === 'REACTIVAR';
                  return (
                    <a className="dropdown-item d-flex align-items-center" href="#" onClick={(e) => handleNotificationClick(OP, e)} key={idx}>
                      <div className="mr-3">
                        <div className={`icon-circle ${esReactivar ? 'bg-primary' : 'bg-warning'}`}>
                          <i className={`fas ${esReactivar ? 'fa-info-circle' : 'fa-exclamation-triangle'} text-white`}></i>
                        </div>
                      </div>
                      <div>
                        <div className="small text-primary font-weight-bold text-truncate">{OP.ID_matricula} - {formatearNombre(OP)}</div>
                        {esReactivar 
                          ? `Tiene ${OP.Descripcion} hoy`
                          : `Tiene ${OP.Descripcion} el ${(OP.ID_fecha ? OP.ID_fecha.split('T')[0] : '')}`
                        }
                        -
                        <div className="small text-primary text-gray-700">
                          {esReactivar ? 'Reactivar TAG' : 'Desactivar TAG'}
                        </div>
                      </div>
                    </a>
                  )
                })}
              </>
            }

          </div>
        </li>
      </ul>
    </nav>

    {/* Contenedor estable para evitar problemas de desmontaje causados por mutaciones de Bootstrap / sb-admin */}
    <div id="topbar-modals">
      {/* Modal: ingresar id_tipo_ruta para editar ruta */}
      {editRutaInputOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '0.35rem', width: '360px', boxShadow: '0 .5rem 1rem rgba(0,0,0,.15)' }}>
            <div className="modal-header bg-warning">
              <h5 className="modal-title text-dark font-weight-bold">
                <i className="fas fa-route mr-2"></i>Editar Ruta
              </h5>
              <button type="button" className="close" onClick={() => setEditRutaInputOpen(false)}>
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <label className="form-label font-weight-bold" htmlFor="inputIdTipoRuta">
                ID Tipo Ruta
              </label>
              <input
                id="inputIdTipoRuta"
                type="number"
                className="form-control"
                placeholder="Ej: 42"
                value={editRutaIdInput}
                onChange={e => setEditRutaIdInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirmEditRuta(); if (e.key === 'Escape') setEditRutaInputOpen(false); }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditRutaInputOpen(false)}>Cancelar</button>
              <button
                className="btn btn-warning btn-sm font-weight-bold"
                onClick={handleConfirmEditRuta}
                disabled={!editRutaIdInput || isNaN(parseInt(editRutaIdInput, 10)) || editRutaLoading}
              >
                {editRutaLoading
                  ? <><i className="fas fa-spinner fa-spin mr-1"></i>Cargando...</>
                  : <><i className="fas fa-edit mr-1"></i>Abrir</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel flotante EditRutaPanel */}
      {editRutaPanelData && (
        <EditRutaPanel
          id_tipo_ruta={editRutaPanelData.id}
          initialCasetas={editRutaPanelData.initialCasetas}
          onClose={() => setEditRutaPanelData(null)}
          onSaved={() => setEditRutaPanelData(null)}
        />
      )}

      {/* Modal de confirmación para actualización del estado del TAG */}
      {modalOpen && accionPendiente && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '0.35rem', width: '500px', boxShadow: '0 .5rem 1rem rgba(0,0,0,.15)' }}>
            <div className="modal-header">
              <h5 className="modal-title">
                {accionPendiente.Accion === 'REACTIVAR' ? 'Confirmar Reactivación' : 'Confirmar Desactivación'}
              </h5>
              <button type="button" className="close" onClick={cancelarAccion}>
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body text-center">
              <p>
                ¿Se {accionPendiente.Accion === 'REACTIVAR' ? 'reactivó' : 'desactivó'} el TAG
                <strong> {accionPendiente.Tag} </strong>
                en el portal del proveedor?
              </p>
              <small className="text-muted">Operador: {formatearNombre(accionPendiente)}</small>
            </div>
            <div className="modal-footer justify-content-center">
              <button type="button" className="btn btn-secondary" onClick={cancelarAccion}>
                Aún no
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmarAccion}>
                Sí, actualizar en BD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default React.memo(Topbar);