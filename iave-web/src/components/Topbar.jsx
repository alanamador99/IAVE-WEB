import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import imagen from '../undraw_profile.svg'
import { formatearFecha, formatearNombre } from '../components/shared/utils.jsx';

const API_URL = process.env.REACT_APP_API_URL;

const Topbar = () => {
  const [loading, setLoading] = useState(true);
  const [tagsAInactivar, setTagsAInactivar] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchTags = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/tags/${dayjs().format('DD-MM-YYYY')}/unavailableOPs`);
        if (isMounted) {
          setTagsAInactivar(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error al cargar los estatus de los TAGS:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTags();

    return () => {
      isMounted = false;
    };
  }, []); // Solo se ejecuta al montar

  return (
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
            <a className="dropdown-item" href="#" data-toggle="modal" data-target="#logoutModal">
              <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
              Cerrar sesión
            </a>
          </div>
        </li>
      </ul>
      <span className="float-right">Bienvenido <b>Amador Martínez, José Alan</b> {formatearFecha(dayjs())}</span>
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
                <span className="badge badge-danger badge-counter " style={{ fontSize: '1rem' }}>{tagsAInactivar.length}+</span>
              </a>

            </>
          }


          <div className="dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in"
            aria-labelledby="alertsDropdown">
            <h6 className="dropdown-header">
              TAGs a inactivar
            </h6>
            {(tagsAInactivar.length > 0) ?
              /* Si existen registros de operadores que estén próximos a estar fuera de operación se mostrarán en el dropdown. */
              <>
                {tagsAInactivar.map((OP, idx) => {
                  return (
                    <a className="dropdown-item d-flex align-items-center" href={`https://apps.pase.com.mx/uc/detalletag/IMDM/${OP?.Tag?.replace("IMDM", "")}`} key={idx} target='_blank'>
                      <div className="mr-3">
                        <div className="icon-circle bg-warning">
                          <i className="fas fa-exclamation-triangle text-white"></i>
                        </div>
                      </div>
                      <div>
                        <div className="small text-primary font-weight-bold">{formatearNombre(OP)}</div>
                        Tiene {OP.Descripcion} el {(OP.ID_fecha.split('T')[0])}
                        -

                        <div className="small text-primary text-gray-700">Abrir TAG</div>
                      </div>

                    </a>
                  )
                })}
              </>
              :
              /* En esta parte se define la lógica para el caso de que no se encuentren TAGs a inactivar. */
              <>

              </>
            }

          </div>
        </li>
      </ul>
    </nav>
  );
};

export default React.memo(Topbar);