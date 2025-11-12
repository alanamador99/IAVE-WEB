import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import {
  BanknoteArrowUp,
  Tag,
  Info,
  ChartNoAxesGantt,
  ExternalLink,
  Edit3,
  Calendar,
  FunnelX,
  User,
  FileUser,
  ReceiptText,
  CircleCheckBig,
  Layers,
  Layers2,
  UserRoundX,
  Eye
} from 'lucide-react';
import CopiarTag from '../shared/utils';
import axios from 'axios';
import dayjs from 'dayjs';




const API_URL = process.env.REACT_APP_API_URL;

const abrirPortalPASE = () => {
  const url = 'https://apps.pase.com.mx/uc/';
  const width = 800;
  const height = 600;
  const left = window.innerWidth - width + 20;
  const top = (window.innerHeight - height) / 2 + 200;
  window.open(
    url,
    '_blank',
    `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,innerwidth=${width},height=${height},top=${top},left=${left},noopener,noreferrer,titlebar=no,rel="noreferrer"`
  );
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

const estatusMap = {
  inactivo: {
    label: 'Inactivo (ausencia en la operación)',
    status: 'inactivo',
    color: 'text-warning',
    icon: UserRoundX
  },
  activo: {
    label: 'Activo en operación',
    status: 'activo',
    color: 'text-success',
    icon: CircleCheckBig
  },
  stockS: {
    label: 'Stock en Sahagún',
    status: 'stock',
    color: 'text-primary',
    icon: Layers
  },
  stockM: {
    label: 'Stock en Monterrey',
    status: 'stock',
    color: 'text-secondary',
    icon: Layers2

  },
  extravio: {
    label: 'TAG extraviado',
    status: 'extravio',
    color: 'text-danger',
    icon: ReceiptText
  }
};

const TagsTable = () => {
  const [showModal, setShowModal] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(250);
  const [vNoAclaracion, setvNoAclaracion] = useState('');
  const [vComentarios, setvComentarios] = useState('');
  const [isDictaminado, setIsDictaminado] = useState(false);
  const [vMontoAclaracion, setvMontoAclaracion] = useState();
  const [tags, setTags] = useState([]);
  const [filtros, setFiltros] = useState({ fechaInicio: '', fechaFin: '', operador: '', tag: '', estatus: 'todos' });
  const [tagSeleccionado, setTagSeleccionado] = useState(null);
  const [fechaAclaracion, setFechaAclaracion] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/tags`);
        setTags(data);
      } catch (err) {
        console.error('Error al cargar tags:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = ({ target: { name, value, checked, type } }) => {
    if (name === 'inAclaracionN') return setvNoAclaracion(value);
    if (name === 'inDictaminado') return setIsDictaminado(checked);
    if (name === 'inMontoAclaracion') return setvMontoAclaracion(value);
    if (name === 'inFechaCreacion') return setFechaAclaracion(value);
    if (name === 'inComentarios') return setvComentarios(value);
  };

  const getEstatusInfo = (key) => estatusMap[key] || estatusMap.inactivo;

  const abrirModal = (tag) => {
    tag.Tag = tag.Dispositivo;
    setTagSeleccionado(tag);
    setvNoAclaracion(tag.NoAclaracion || '');
    setvComentarios(tag.Observaciones || '');
    setIsDictaminado(!!tag.Aplicado);
    setShowModal(true);
    console.log(tag);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setTagSeleccionado(null);
  };

  const cerrarModalGuardando = async () => {
    if (!vNoAclaracion) {
      return alert('Introduce el Número de aclaración para guardar.');
    }
    try {
      const id = tagSeleccionado.ID;
      const nuevoEstatus = isDictaminado ? 'dictaminado' : 'aclaracion_levantada';
      const payload = { noAclaracion: vNoAclaracion, FechaDictamen: fechaAclaracion, estatusSecundario: nuevoEstatus, observaciones: vComentarios, dictaminado: isDictaminado ? 1 : 0 };
      const { status, data } = await axios.patch(`${API_URL}/api/aclaraciones/${id}/UpdateAclaracion`, payload);
      if (status === 200) {
        setTags(prev => prev.map(c => c.ID === id ? { ...c, Estatus_Secundario: nuevoEstatus, FechaDictamen: fechaAclaracion, observaciones: vComentarios, NoAclaracion: vNoAclaracion, Aplicado: payload.dictaminado } : c));
        console.log(data.message);
      } else console.error('No se pudo actualizar el estatus');
    } catch (error) {
      console.error('Error al cambiar el estatus:', error);
    }
    cerrarModal();
  };

  const tagsFiltrados = tags.filter(t => {
    const fechaOK = (!filtros.fechaInicio || t.Fecha >= filtros.fechaInicio) && (!filtros.fechaFin || t.Fecha <= filtros.fechaFin);
    const opOK = !filtros.operador || t.No_Economico.toLowerCase().includes(filtros.operador.toLowerCase());
    const tagOK = !filtros.tag || t.Dispositivo.toLowerCase().includes(filtros.tag.toLowerCase());
    const estOK = filtros.estatus === 'todos' || t.Estatus_Secundario === filtros.estatus;
    return fechaOK && opOK && tagOK && estOK;
  });
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "15vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
          <span className="visually-hidden">.</span>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Card contenedor */}
      <div className="wrapper">

        <div className="card shadow">
          <div className="card-header py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="rowsSelect" className="input-group-text mb-0 mr-2">Registros por página:</label>
              <select
                id="rowsSelect"
                className="form-select form-select-sm custom-select"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                style={{ width: 'auto' }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>

            <h6 className="m-0 font-weight-bold text-primary ml-3" style={{ flex: 'auto', }}>Tags que aplican según los parametros seleccionados  - (<span className="text sm">{tagsFiltrados.length})</span></h6>

          </div>

          {/* Filtros */}
          <div className="card-body pb-0">
            <div className="d-flex flex-wrap gap-2 mb-3">

              <div className="form-floating pr-2">
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                  id='inFechaInicio'
                  className="form-control form-control-sm"
                />
                <label className="form-label" htmlFor='inFechaInicio'>Fecha Inicio</label>

              </div>

              <div className="form-floating pr-2">
                <input
                  type="date"
                  value={filtros.fechaFin}
                  id="inFechaFin"
                  onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                  className="form-control form-control-sm"
                />
                <label className='' htmlFor="inFechaFin" >Fecha Fin</label>

              </div>


              <div className="form-floating pr-2">
                <input className="form-control form-control-sm" type="text"
                  placeholder="Buscar operador..."
                  value={filtros.operador}
                  id="MatriculaOP"
                  autoComplete="off"
                  onChange={(e) => setFiltros({ ...filtros, operador: e.target.value })} />
                <label htmlFor="MatriculaOP">Matricula / Operador</label>
              </div>



              <div className="form-floating pr-2">

                <input
                  type="text"
                  placeholder="Buscar tag..."
                  value={filtros.tag}
                  id="TagAclaracion"
                  autoComplete="off"
                  onChange={(e) => setFiltros({ ...filtros, tag: e.target.value })}
                  className="form-control form-control-sm"
                />
                <label className="form-label" htmlFor='TagAclaracion'>Tag</label>

              </div>

              <div className="col-md-2  pr-2 input-group-text mb-0 ">
                <label className='form-label' htmlFor='inEstatus'>Estatus:</label>
                <select className='mx-3 p-2' id='inEstatus' name="Estatus" onChange={(e) => setFiltros({ ...filtros, estatus: e.target.value })} value={filtros.estatus}>
                  <option value="todos">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                  <option value="extravio">Extraviados</option>
                  <option value="stockM">Stock Monterrey</option>
                  <option value="stockS">Stock Sahagún</option>
                </select>
              </div>

              {/* Botón para resetear los filtros. */}
              <div className="ml-3 pr-1 pt-1">
                <button
                  className="btn btn-sm btn btn-outline-dark rounded-3"
                  onClick={() => setFiltros({
                    fechaInicio: '',
                    fechaFin: '',
                    operador: '',
                    tag: '',
                    estatus: 'todos'
                  })}>
                  <FunnelX size={40} className="me-1" />
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="table-responsive table-container">
              <table className="table table-sm table-hover table-scroll align-middle">
                <thead className="table-light">
                  <tr>
                    <th className='col-1'>Fecha modificación</th>
                    <th className='col-1'>Colaborador</th>
                    <th className='col-1'>TAG</th>
                    <th className='col-1'>Situación personal</th>
                    <th className='col-1'>Estatus</th>
                    <th className='col-2'>Observaciones</th>
                    <th className='col-1'> </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Se crea una fila de la tabla con cada registro obtenido de tagsFiltrados */}
                  {tagsFiltrados.map((tag, i) => {
                    const estatusInfo = getEstatusInfo(tag.Estatus_Secundario);
                    const IconoEstatus = estatusInfo?.icon;
                    const Fecha = ((estatusInfo?.status === 'extravio') ? tag.Fecha_Extravio : (estatusInfo?.status === 'stock' || estatusInfo?.status === 'activo') ? tag.Fecha_alta : (estatusInfo?.status === 'inactiva') ? tag.Fecha_inactiva : tag.Fecha);
                    return (
                      <tr key={i}>
                        <td style={{ alignContent: 'center' }}>
                          <div className="d-flex align-items-center" style={{ alignContent: 'center' }}>
                            <Calendar className="me-2 text-secondary mr-2" size={30} />
                            <div>
                              <div className="fw-bold">{Fecha?.split('T')[0]}</div>
                              <small className="text-muted">{tag?.Fecha?.split('T')[1]?.split('.')[0]}</small>
                            </div>
                          </div>
                        </td>
                        <td style={{ alignContent: 'center' }}>
                          <div className="d-flex align-items-center">
                            <User className="me-2 text-secondary" size={30} />
                            <div className='ml-2' style={{ display: 'inline' }}>
                              <div className="fw-bold inline">{tag.id_matricula} </div><div className='inline'>{tag.Nombres}</div>
                              <small className="text-muted">{(tag.Ap_paterno || '') + " " + (tag.Ap_materno || '')} </small>
                            </div>
                          </div>
                        </td>
                        <td style={{ alignContent: 'center' }}>
                          <div className="d-flex align-items-center">
                            <a href={`https://apps.pase.com.mx/uc/detalletag/IMDM/${tag?.Dispositivo?.replace("IMDM", "")}`} style={{ fontSize: '.9rem', }} target='_blank' rel="noreferrer"  >
                              <Tag className="me-2 text-secondary" size={30} />
                            </a>

                            <big className="text-secondary ml-2">{tag.Dispositivo}</big>
                          </div>
                        </td>

                        <td style={{ alignContent: 'center' }}>
                          <strong>{tag.Estado_Personal}</strong>
                        </td>


                        <td style={{ alignContent: 'center' }}>
                          <span className={`d-inline-flex  align-items-center ${estatusInfo?.color}`}>
                            <IconoEstatus size={16} className="me-1 mr-2" />
                            {estatusInfo?.label}
                          </span>
                        </td>


                        <td style={{ alignContent: 'center' }} className='col-2'>
                          <textarea id={`observación-${i}`} className={`d-inline-flex form-control  align-items-center ${estatusInfo?.color}`}
                            style={{ alignContent: 'center', width: '100%', height: '4rem', resize: 'none', border: 'none', background: (estatusInfo.status === 'inactivo') ? 'navy' : 'gainsboro', overflow: 'hidden', fontSize: '0.75rem', fontWeight: 'lighter', overflow: 'auto' }}
                            readOnly value={tag.Observaciones || 'Sin observaciones'} />
                        </td>

                        <td style={{ alignContent: 'center' }}>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-success mr-2"
                              title="Gestionar aclaración"
                              onClick={() => abrirModal(tag)}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-success ml-1"
                              title="Generar responsiva"
                              onClick={() => generarResponsiva(tag)}
                            >
                              <Eye size={14} className='warning' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="md">
        <Modal.Header style={{ paddingBottom: '0.5rem' }}>
          <Modal.Title>
            <span className='' style={{ float: 'right !important', right: '10px', position: 'absolute', fontSize: '.7rem' }}>ID: {tagSeleccionado?.ID}</span>
            <FileUser size={35} className="me-1" ></FileUser> Gestión del TAG
            <br></br>

            <a href={`https://apps.pase.com.mx/uc/detalletag/IMDM/${tagSeleccionado?.Dispositivo?.replace("IMDM", "")}`} style={{ fontSize: '.9rem', }} target='_blank' rel="noreferrer"  >

              <ReceiptText size={23} className="me-1 ml-2 mr-3" ></ReceiptText >
              TAG: {tagSeleccionado?.Dispositivo}
            </a>

            {/*Este es el componente al que */}
            <CopiarTag cruceSeleccionado={tagSeleccionado} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ paddingTop: '0.5rem' }}>
          <div className="card" style={{ background: 'whitesmoke', }}>
            <div className='card-header text-center'>
              <Info size={15} className="me-1" />
              <span className='text-primary font-weight-bolder ml-2'>Información del tag</span>

            </div>
            <div className="card-body" style={{ background: 'whitesmoke', }}>

              <div className='form-row align-items-center'>

                <div className="form-floating pr-2 col">

                  Fecha:
                  <span className='ml-1 text-secondary font-weight-bolder'>
                    <span style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Copiar FECHA al portapapeles"
                      onClick={() => {
                        if (tagSeleccionado?.Fecha_alta) {
                          navigator.clipboard.writeText(formatearFecha(tagSeleccionado?.Fecha_alta));
                        }
                      }}
                    >
                      {formatearFecha(tagSeleccionado?.Fecha_alta)}
                    </span>
                  </span>

                  <br></br>


                  Matricula/Operador:
                  <span className='ml-1 text-secondary font-weight-bolder'> {tagSeleccionado?.["No_Economico"]}</span>

                  <br></br>


                  Tag:
                  <span className='ml-1 text-secondary font-weight-bolder' style={{ cursor: 'pointer', fontSize: '0.85rem' }} title="Copiar CASETA al portapapeles"
                    onClick={() => {
                      if (tagSeleccionado?.Tag) {
                        navigator.clipboard.writeText(tagSeleccionado?.Tag);
                      }
                    }}> 
                    {tagSeleccionado?.Tag}
                  </span>

                  <br></br>



                  Cruces del úlltimo mes (#):
                  <span className='ml-1 text-secondary font-weight-bolder'> {tagSeleccionado?.Importe?.toFixed(2)}</span>

                  <br></br>



                  Monto acumulado de los cruces del último mes:
                  <span className='ml-1 text-secondary font-weight-bolder'>$ {tagSeleccionado?.diferencia?.toFixed(2)}</span>

                </div>


              </div>

              <div className='form-row align-items-center'>
                                <div className="col">
                  <div className="form-group mb-4"><label htmlFor='inObservaciones'>Observaciones</label>
                    <textarea name="inComentarios" className="form-control" rows="3" id="inObservaciones" placeholder="Comentarios..." value={vComentarios} onChange={handleChange} />

                  </div>
                </div>


                <div className="pl-4 col">
                  <div className="form-check form-switch row " style={{ textAlign: 'center', height: '2rem' }}>
                    <input className="form-check-input" type="checkbox" id="CheckDictaminado" name='inDictaminado' onChange={handleChange} checked={isDictaminado} />
                    <label className="form-check-label" htmlFor="CheckDictaminado">Activo</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => cerrarModalGuardando(tagSeleccionado)}>
            Guardar cambios
          </Button>
          <Button variant="secondary" onClick={() => cerrarModal(tagSeleccionado)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>


  );
};

export default TagsTable;



const generarResponsiva = async (tag) => {
  const data = {
    nombre: tag?.Nombres + " " + tag?.Ap_paterno + " " + tag?.Ap_materno,
    matricula: (tag?.id_matricula),
    numeroDispositivo: tag?.Dispositivo,
    fechaAsignacion: tag?.Fecha_alta ? tag.Fecha_alta.split('T')[0] : ''
  };

  const response = await fetch(`${API_URL}/api/tags/exportar-responsiva`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Responsiva_${data.numeroDispositivo}.xlsx`;
  a.click();
};
