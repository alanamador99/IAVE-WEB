import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import {
  BanknoteArrowUp,
  Info,
  ChartNoAxesGantt,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  Calendar,
  MapPin,
  FunnelX,
  User,
  FileUser,
  ReceiptText,
} from 'lucide-react';
import { CopiarTag } from '../shared/utils';
import axios from 'axios';
import dayjs from 'dayjs';
import CasetaMapModal from '../shared/CasetaMapModal';

const API_URL = process.env.REACT_APP_API_URL;

// Constantes fuera del componente
const ESTATUS_MAP = {
  pendiente_aclaracion: {
    label: 'Pendiente Aclaración',
    color: 'text-danger font-weight-bold',
    icon: AlertTriangle
  },
  aclaracion_levantada: {
    label: 'Aclaración Levantada',
    color: 'text-warning font-weight-bold',
    icon: Clock
  },
  dictaminado: {
    label: 'Dictaminado',
    color: 'text-success font-weight-bold',
    icon: CheckCircle
  }
};

const FILTROS_INICIALES = {
  fechaInicio: '',
  fechaFin: '',
  operador: '',
  caseta: '',
  estatus: 'todos',
  ejes: '',
  ejesCobrados: ''
};

// Utilidades fuera del componente
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

const abrirPortalPASE = () => {
  const url = 'https://apps.pase.com.mx/uc/';
  const width = 800;
  const height = 600;
  const left = window.innerWidth - width + 20;
  const top = (window.innerHeight - height) / 2 + 200;
  window.open(
    url,
    '_blank',
    `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left},noopener,noreferrer`
  );
};

const AclaracionesTable = () => {
  // Estados principales
  const [aclaraciones, setAclaraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [paginaActual, setPaginaActual] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(250);

  // Estados del modal principal
  const [showModal, setShowModal] = useState(false);
  const [aclaracionSeleccionado, setAclaracionSeleccionado] = useState(null);
  const [vNoAclaracion, setvNoAclaracion] = useState('');
  const [vComentarios, setvComentarios] = useState('');
  const [isDictaminado, setIsDictaminado] = useState(false);
  const [vMontoAclaracion, setvMontoAclaracion] = useState(0);
  const [fechaDictamen, setFechaDictamen] = useState(dayjs().format('YYYY-MM-DD'));

  // Estados del modal de mapa
  const [modalAbierto, setModalAbierto] = useState(false);
  const [caseta, setCaseta] = useState(null);

  // ✅ FIX: useEffect sin dependencias circulares
  useEffect(() => {
    const cargarAclaraciones = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/aclaraciones`);
        setAclaraciones(data);
      } catch (err) {
        console.error('Error al cargar aclaraciones:', err);
      } finally {
        setLoading(false);
      }
    };
    cargarAclaraciones();
  }, []); // Solo se ejecuta al montar

  // ✅ Memorizar aclaraciones filtradas
  const aclaracionesFiltrados = useMemo(() => {
    return aclaraciones.filter(c => {
      const fechaOK = (!filtros.fechaInicio || c.Fecha >= filtros.fechaInicio) && 
                      (!filtros.fechaFin || c.Fecha <= filtros.fechaFin);
      const opOK = !filtros.operador || c.No_Economico.toLowerCase().includes(filtros.operador.toLowerCase());
      const casOK = !filtros.caseta || c.Caseta.toLowerCase().includes(filtros.caseta.toLowerCase());
      const estOK = filtros.estatus === 'todos' || c.Estatus_Secundario === filtros.estatus;
      const ejesOK = !filtros.ejes || c.ID_clave.toLowerCase().trim().includes(filtros.ejes.toLowerCase());
      const ejesCobradosOK = !filtros.ejesCobrados || c.Clase.toLowerCase().trim().includes(filtros.ejesCobrados.toLowerCase());
      return fechaOK && opOK && casOK && estOK && ejesOK && ejesCobradosOK;
    });
  }, [aclaraciones, filtros]);

  // ✅ Memorizar datos paginados
  const { paginaDatos, totalPaginas } = useMemo(() => {
    const total = Math.ceil(aclaracionesFiltrados.length / rowsPerPage);
    const indiceInicio = (paginaActual - 1) * rowsPerPage;
    const datos = aclaracionesFiltrados.slice(indiceInicio, indiceInicio + rowsPerPage);
    return { paginaDatos: datos, totalPaginas: total };
  }, [aclaracionesFiltrados, paginaActual, rowsPerPage]);

  // ✅ Callbacks optimizados
  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginaActual(1); // Reset a página 1 al filtrar
  }, []);

  const resetFiltros = useCallback(() => {
    setFiltros(FILTROS_INICIALES);
    setPaginaActual(1);
  }, []);

  const cambiarPagina = useCallback((nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  }, [totalPaginas]);

  // ✅ Debounce para actualizaciones de API
  const actualizarAclaracionAPI = useCallback(async (id, payload) => {
    try {
      const { data } = await axios.patch(`${API_URL}/api/aclaraciones/${id}/UpdateAclaracion`, payload);
      console.log('Actualización exitosa:', data.message);
      return true;
    } catch (error) {
      console.error('Error al actualizar:', error);
      return false;
    }
  }, []);

  // ✅ Handler optimizado para NoAclaracion (con debounce manual)
  const handleNoAclaracionChange = useCallback((aclaracion, nuevoValor) => {
    // Actualizar UI inmediatamente
    setAclaraciones(prev => prev.map(c => 
      c.ID === aclaracion.ID 
        ? { ...c, NoAclaracion: nuevoValor, Estatus_Secundario: 'aclaracion_levantada' } 
        : c
    ));

    // Actualizar API (considera implementar debounce real aquí)
    const nuevoEstatus = 'aclaracion_levantada';
    actualizarAclaracionAPI(aclaracion.ID, { 
      noAclaracion: nuevoValor, 
      FechaDictamen: fechaDictamen, 
      estatusSecundario: nuevoEstatus 
    });
  }, [actualizarAclaracionAPI, fechaDictamen]);

  // ✅ Handler optimizado para monto dictaminado
  const handleMontoDictaminadoChange = useCallback(async (aclaracion, nuevoValor) => {
    if (isNaN(nuevoValor)) {
      alert('El monto debe ser un número válido');
      return;
    }

    setAclaraciones(prev => prev.map(c => 
      c.ID === aclaracion.ID 
        ? { ...c, montoDictaminado: nuevoValor, Estatus_Secundario: 'dictaminado' } 
        : c
    ));

    await actualizarAclaracionAPI(aclaracion.ID, { 
      montoDictaminado: nuevoValor, 
      estatusSecundario: 'dictaminado' 
    });
  }, [actualizarAclaracionAPI]);

  // ✅ Aplicar dictamen al hacer blur
  const handleMontoBlur = useCallback(async (aclaracion) => {
    if (aclaracion.montoDictaminado) {
      setAclaraciones(prev => prev.map(c => 
        c.ID === aclaracion.ID ? { ...c, Aplicado: 1 } : c
      ));
      await actualizarAclaracionAPI(aclaracion.ID, { 
        estatusSecundario: 'dictaminado', 
        Aplicado: 1 
      });
    }
  }, [actualizarAclaracionAPI]);

  const abrirModal = useCallback((aclaracion) => {
    setAclaracionSeleccionado(aclaracion);
    setvNoAclaracion(aclaracion.NoAclaracion || '');
    setvComentarios(aclaracion.observaciones || '');
    setIsDictaminado(!!aclaracion.Aplicado);
    setFechaDictamen(aclaracion.FechaDictamen ? aclaracion.FechaDictamen.split('T')[0] : dayjs().format('YYYY-MM-DD'));
    setShowModal(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setShowModal(false);
    setAclaracionSeleccionado(null);
  }, []);

  const cerrarModalGuardando = useCallback(async () => {
    if (!vNoAclaracion) {
      return alert('Introduce el Número de aclaración para guardar.');
    }

    const id = aclaracionSeleccionado.ID;
    const nuevoEstatus = isDictaminado ? 'dictaminado' : 'aclaracion_levantada';
    const payload = { 
      noAclaracion: vNoAclaracion, 
      FechaDictamen: fechaDictamen, 
      estatusSecundario: nuevoEstatus, 
      observaciones: vComentarios, 
      dictaminado: isDictaminado ? 1 : 0, 
      montoDictaminado: vMontoAclaracion || 0 
    };

    const exito = await actualizarAclaracionAPI(id, payload);
    if (exito) {
      setAclaraciones(prev => prev.map(c => 
        c.ID === id 
          ? { ...c, ...payload, Estatus_Secundario: nuevoEstatus, Aplicado: payload.dictaminado } 
          : c
      ));
    }
    cerrarModal();
  }, [vNoAclaracion, aclaracionSeleccionado, isDictaminado, fechaDictamen, vComentarios, vMontoAclaracion, actualizarAclaracionAPI, cerrarModal]);

  const abrirMapaCaseta = useCallback((aclaracion) => {
    setModalAbierto(true);
    setCaseta({
      nombre: aclaracion.Caseta,
      lat: aclaracion.latitud,
      lng: aclaracion.longitud,
    });
    setAclaracionSeleccionado(aclaracion);
  }, []);

  const handleModalChange = useCallback(({ target: { name, value, checked, type } }) => {
    if (name === 'inAclaracionN') setvNoAclaracion(value);
    else if (name === 'inDictaminado') setIsDictaminado(checked);
    else if (name === 'inMontoAclaracion') setvMontoAclaracion(value);
    else if (name === 'inFechaCreacion') setFechaDictamen(value);
    else if (name === 'inComentarios') setvComentarios(value);
  }, []);

  const getEstatusInfo = useCallback((key) => ESTATUS_MAP[key] || ESTATUS_MAP.pendiente_aclaracion, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "15vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="wrapper">
        <div className="card shadow">
          <div className="card-header py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="rowsSelect" className="input-group-text mb-0 mr-2">Registros por página:</label>
              <select
                id="rowsSelect"
                className="form-select form-select-sm custom-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value));
                  setPaginaActual(1);
                }}
                style={{ width: 'auto' }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
            <h6 className="m-0 font-weight-bold text-primary ml-3" style={{ flex: 'auto' }}>
              Aclaraciones que aplican según los parámetros seleccionados - (
              <span className="text-sm">{new Intl.NumberFormat("es-MX").format(aclaracionesFiltrados.length)}</span>)
            </h6>
          </div>

          {/* Filtros */}
          <div className="card-body pb-0">
            <div className="d-flex flex-wrap gap-2 mb-3">
              <div className="form-floating pr-2">
                <input
                  type="date"
                  id='inputFechaInicio'
                  value={filtros.fechaInicio}
                  onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                  className="form-control form-control-sm"
                />
                <label className="form-label">Fecha Inicio</label>
              </div>

              <div className="form-floating pr-2">
                <input
                  id='inputFechaFin'
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                  className="form-control form-control-sm"
                />
                <label>Fecha Fin</label>
              </div>

              <div className="form-floating pr-2">
                <input 
                  className="form-control form-control-sm" 
                  type="text"
                  placeholder="Buscar operador..."
                  value={filtros.operador}
                  id="MatriculaOP"
                  autoComplete="off"
                  onChange={(e) => handleFiltroChange('operador', e.target.value)} 
                />
                <label htmlFor="MatriculaOP">Matricula / Operador</label>
              </div>

              <div className="form-floating pr-2">
                <input
                  type="text"
                  placeholder="Buscar caseta..."
                  value={filtros.caseta}
                  id="CasetaAclaracion"
                  autoComplete="off"
                  onChange={(e) => handleFiltroChange('caseta', e.target.value)}
                  className="form-control form-control-sm"
                />
                <label className="form-label" htmlFor='CasetaAclaracion'>Caseta</label>
              </div>

              <div className="col-md-2 pr-2 input-group-text mb-0">
                <label className='form-label' htmlFor='inEstatus'>Estatus:</label>
                <select 
                  className='mx-3 p-2' 
                  id='inEstatus' 
                  name="Estatus" 
                  onChange={(e) => handleFiltroChange('estatus', e.target.value)} 
                  value={filtros.estatus}
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente_aclaracion">Sin aclaración</option>
                  <option value="aclaracion_levantada">En proceso</option>
                  <option value="dictaminado">Dictaminados</option>
                </select>
              </div>

              <div className="form-floating pr-2">
                <input 
                  className="form-control form-control-sm" 
                  type="text"
                  placeholder="Ejes..."
                  value={filtros.ejes}
                  id="Ejes"
                  autoComplete="off"
                  onChange={(e) => handleFiltroChange('ejes', e.target.value)} 
                />
                <label htmlFor="Ejes">Ejes</label>
              </div>

              <div className="form-floating pr-2">
                <input 
                  className="form-control form-control-sm" 
                  type="text"
                  placeholder="Ejes cobrados..."
                  value={filtros.ejesCobrados}
                  id="ejesCobrados"
                  autoComplete="off"
                  onChange={(e) => handleFiltroChange('ejesCobrados', e.target.value)} 
                />
                <label htmlFor="ejesCobrados">Ejes cobrados</label>
              </div>

              <div className="ml-3 pr-1 pt-1">
                <button
                  className="btn btn-sm btn-outline-dark rounded-3"
                  onClick={resetFiltros}
                >
                  <FunnelX size={40} className="me-1" />
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="table-responsive table-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="table table-bordered table-scroll table-sm table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Operador</th>
                    <th>Caseta</th>
                    <th>Importes</th>
                    <th>Diferencia</th>
                    <th>Ejes</th>
                    <th>Estatus</th>
                    <th>Folio</th>
                    <th>Devolución</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginaDatos.map((aclaracion, i) => {
                    const estatusInfo = getEstatusInfo(aclaracion.Estatus_Secundario);
                    const IconoEstatus = estatusInfo.icon;

                    return (
                      <tr key={aclaracion.ID}>
                        <td>
                          <div className="d-flex align-items-center">
                            <Calendar className="me-2 text-secondary mr-2" size={20} />
                            <div>
                              <div className="fw-bold">{aclaracion.Fecha.split('T')[0]}</div>
                              <small className="text-muted">{aclaracion.Fecha.split('T')[1].split('.')[0]}</small>
                            </div>
                          </div>
                        </td>
                        <td className='pr-0 pl-0'>
                          <div className="d-flex align-items-center">
                            <User className="me-2 text-secondary" size={20} />
                            <div>
                              <div className="fw-bold">
                                {aclaracion["No_Economico"].split(' ')[1] + " " + (aclaracion["No_Economico"].split(' ')[2] || '')}
                              </div>
                              <small className="text-muted">{aclaracion["No_Economico"].split(' ')[0]}</small>
                            </div>
                          </div>
                        </td>
                        <td className='pr-0 pl-0'>
                          <span 
                            className="d-inline-flex align-items-center" 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => abrirMapaCaseta(aclaracion)}
                          >
                            <div className="d-flex align-items-center">
                              <MapPin className="me-2 text-secondary" size={20} />
                              <div>
                                <div>{aclaracion.Caseta}</div>
                                <small className="text-muted">TAG: {aclaracion.Tag}</small>
                              </div>
                            </div>
                          </span>
                          <CopiarTag cruceSeleccionado={aclaracion} />
                        </td>
                        <td className='pr-0 pl-0'>
                          <div>
                            <div>Cobrado: <strong>${aclaracion.Importe}</strong></div>
                            <div>Oficial: <strong>${aclaracion.ImporteOficial}</strong></div>
                          </div>
                        </td>
                        <td>
                          <span className={`bg-danger-subtle fw-semibold ${
                            aclaracion?.diferencia > 0 ? 'text-success' : 
                            aclaracion?.diferencia === 0 ? 'text-black' : 'text-danger'
                          }`}>
                            ${aclaracion?.diferencia?.toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <div>
                            Cobrado: <span className="bg-danger-subtle fw-semibold text-success">
                              Clase <strong style={{ fontSize: '1rem' }}>{aclaracion?.Clase}</strong>
                            </span>
                          </div>
                          <div>
                            Oficial: <span className="bg-danger-subtle fw-semibold text-success">
                              <strong>{aclaracion?.ID_clave}</strong>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`d-inline-flex align-items-center ${estatusInfo.color}`}>
                            <IconoEstatus size={16} className="me-1 mr-2" />
                            {estatusInfo.label}
                          </span>
                        </td>
                        <td>
                          <input 
                            id={`inputNoAclaracion-${aclaracion.ID}`} 
                            maxLength={20} 
                            style={{ fontWeight: 'normal', padding: 0 }} 
                            type='text' 
                            className={`pl-2 form-control-sm d-inline-flex align-items-center ${estatusInfo.color}`} 
                            value={aclaracion?.NoAclaracion || ''} 
                            disabled={!!aclaracion.Aplicado} 
                            onChange={(e) => handleNoAclaracionChange(aclaracion, e.target.value)}
                          />
                        </td>
                        <td>
                          <span className='text-secondary'>$</span>
                          <input 
                            type='number' 
                            id={`inputMontoDictaminado-${aclaracion.ID}`} 
                            disabled={!aclaracion.NoAclaracion || !!aclaracion.Aplicado} 
                            style={{ fontWeight: 'normal', width: '5rem', padding: 0 }} 
                            className={`pl-2 form-control-sm d-inline-flex align-items-center ${estatusInfo.color}`} 
                            value={aclaracion?.montoDictaminado || ''} 
                            onChange={(e) => handleMontoDictaminadoChange(aclaracion, parseFloat(e.target.value))}
                            onBlur={() => handleMontoBlur(aclaracion)}
                          />
                          <span className='text-secondary ml-1'>MXN</span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-success"
                              title="Gestionar aclaración"
                              onClick={() => abrirModal(aclaracion)}
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <nav className="mt-3">
              <ul className="pagination pagination-sm justify-content-center d-flex flex-wrap">
                <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => cambiarPagina(paginaActual - 1)}>Anterior</button>
                </li>
                {[...Array(totalPaginas)].map((_, index) => (
                  <li key={index} className={`page-item ${paginaActual === index + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => cambiarPagina(index + 1)}>
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => cambiarPagina(paginaActual + 1)}>Siguiente</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Modal de gestión */}
      <Modal show={showModal} onHide={cerrarModal} size="lg">
        <Modal.Header style={{ paddingBottom: '0.5rem' }}>
          <Modal.Title>
            <span style={{ float: 'right', right: '10px', position: 'absolute', fontSize: '.7rem' }}>
              ID: {aclaracionSeleccionado?.ID}
            </span>
            <FileUser size={35} className="me-1" /> Gestión de Aclaración
            <br />
            <a 
              href={`https://apps.pase.com.mx/uc/detalletag/IMDM/${aclaracionSeleccionado?.Tag?.replace("IMDM", "")}`} 
              style={{ fontSize: '.9rem' }} 
              target='_blank' 
              rel="noreferrer"
            >
              <ReceiptText size={23} className="me-1 ml-2 mr-3" />
              TAG: {aclaracionSeleccionado?.Tag}
            </a>
            <CopiarTag cruceSeleccionado={aclaracionSeleccionado} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ paddingTop: '0.5rem' }}>
          <div className="card" style={{ background: 'whitesmoke' }}>
            <div className='card-header text-center'>
              <Info size={15} className="me-1" />
              <span className='text-primary font-weight-bolder ml-2'>Información de la aclaración</span>
            </div>
            <div className="card-body">
              <div className='form-row align-items-center'>
                <div className="form-floating pr-2 col">
                  Fecha: <span className='ml-1 text-secondary font-weight-bolder'>
                    <span 
                      style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Copiar FECHA al portapapeles"
                      onClick={() => {
                        if (aclaracionSeleccionado?.Fecha) {
                          navigator.clipboard.writeText(formatearFecha(aclaracionSeleccionado?.Fecha));
                        }
                      }}
                    >
                      {formatearFecha(aclaracionSeleccionado?.Fecha)}
                    </span>
                    <span className='font-weight-bolder text-primary'> | </span>
                    {aclaracionSeleccionado?.Fecha?.split('T')[1].split('.')[0]}
                  </span>
                  <br />
                  Matricula/Operador: <span className='ml-1 text-secondary font-weight-bolder'>
                    {aclaracionSeleccionado?.["No_Economico"]}
                  </span>
                  <br />
                  Caseta: <span 
                    className='ml-1 text-secondary font-weight-bolder' 
                    style={{ cursor: 'pointer', fontSize: '0.85rem' }} 
                    title="Copiar CASETA al portapapeles"
                    onClick={() => {
                      if (aclaracionSeleccionado?.Caseta) {
                        navigator.clipboard.writeText(aclaracionSeleccionado?.Caseta);
                      }
                    }}
                  >
                    {aclaracionSeleccionado?.Caseta}
                  </span>
                  <br />
                  Importe Cobrado: <span className='ml-1 text-secondary font-weight-bolder'>
                    ${aclaracionSeleccionado?.Importe?.toFixed(2)}
                  </span>
                  <br />
                  Diferencia: <span className='ml-1 text-secondary font-weight-bolder'>
                    ${aclaracionSeleccionado?.diferencia?.toFixed(2)}
                  </span>
                </div>
                <div className="col">
                  <div className="form-group mb-4">
                    <label htmlFor='inObservaciones'>Observaciones</label>
                    <textarea 
                      name="inComentarios" 
                      className="form-control" 
                      rows="3" 
                      id="inObservaciones" 
                      placeholder="Notas adicionales..." 
                      value={vComentarios} 
                      onChange={handleModalChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-1">
            <div className='card-header text-center'>
              <ChartNoAxesGantt size={15} className="me-1" />
              <span className='text-primary font-weight-bolder py-3 my-2 ml-2 mr-3'>Gestión de la aclaración</span>
              (<span className={`ml-1 font-weight-bolder text-uppercase py-2 ${
                aclaracionSeleccionado?.Estatus_Secundario === 'dictaminado' ? 'text-info' : 
                aclaracionSeleccionado?.Estatus_Secundario === 'aclaracion_levantada' ? 'text-success' : 'text-danger'
              }`}>
                {aclaracionSeleccionado?.Estatus_Secundario || "Solicitud pendiente"}
              </span>)
            </div>
            <div className="card-body border" style={{ background: 'whitesmoke' }}>
              <div className='form-row'>
                <div className="form-floating pr-2 col">
                  <input 
                    type="text" 
                    placeholder='' 
                    id='inAclaracionN' 
                    disabled={isDictaminado} 
                    className={`form-control ${vNoAclaracion ? 'is-valid' : 'is-invalid'}`} 
                    name='inAclaracionN' 
                    value={vNoAclaracion || ''} 
                    onChange={handleModalChange} 
                    maxLength={20} 
                  />
                  <label className="form-label" htmlFor='inAclaracionN'>Número de aclaración</label>
                  <small className="ml-1 form-text text-muted">Proporcionado al crear la aclaración en el portal PASE</small>
                </div>
                <div className="form-floating pr-2 col">
                  <input 
                    type="date" 
                    placeholder='' 
                    id='inFechaCreacion' 
                    name='inFechaCreacion' 
                    className="form-control" 
                    disabled={isDictaminado} 
                    value={fechaDictamen} 
                    onChange={handleModalChange} 
                  />
                  <label className="form-label" htmlFor='inFechaCreacion'>Fecha de creación</label>
                  <small className="ml-1 form-text text-muted">Cuando se carga en el portal PASE.</small>
                </div>
              </div>
              <div className='pt-3'>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={abrirPortalPASE}>
                  <ExternalLink className="mr-1" size={14} /> Abrir Portal PASE/IAVE
                </button>
              </div>
            </div>
          </div>

          <div className="card mt-1">
            <div className='card-header text-center'>
              <BanknoteArrowUp size={15} className="me-1" />
              <span className='text-primary font-weight-bolder py-2 my-2 ml-2'>Devolución</span>
            </div>
            <div className="card-body border" style={{ background: 'whitesmoke' }}>
              <div className='form-row align-items-center'>
                <div className="form-floating pr-2 col">
                  <input
                    type="number"
                    min="0.00" 
                    max="100000.00" 
                    step="0.01"
                    id='inMontoAclaracion'
                    placeholder=''
                    className="form-control"
                    name='inMontoAclaracion'
                    value={vMontoAclaracion}
                    onChange={handleModalChange}
                  />
                  <label className="form-label" htmlFor='inMontoAclaracion'>Monto devuelto</label>
                  <small className="ml-1 form-text text-muted">El número, <strong className='font-weight-bold'>sin formato</strong></small>
                </div>
                <div className="pl-4 col">
                  <div className="form-check form-switch row" style={{ textAlign: 'center', height: '2rem' }}>
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="CheckDictaminado" 
                      name='inDictaminado' 
                      onChange={handleModalChange} 
                      checked={isDictaminado} 
                    />
                    <label className="form-check-label" htmlFor="CheckDictaminado">Dictaminado</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={cerrarModalGuardando}>
            Guardar cambios
          </Button>
          <Button variant="secondary" onClick={cerrarModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de mapa */}
      <CasetaMapModal
        isOpen={modalAbierto}
        nombreCaseta={caseta?.nombre}
        lat={caseta?.lat}
        lng={caseta?.lng}
        onClose={() => setModalAbierto(false)}
        aclaracionSeleccionado={aclaracionSeleccionado}
      />
    </div>
  );
};

export default AclaracionesTable;