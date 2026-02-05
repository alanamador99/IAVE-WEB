import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import {
  Grid2X2Check,
  Building2,
  MailPlus,
  Info,
  TicketCheck,
  ChartNoAxesGantt,
  AlertTriangle,
  Target,
  HandCoins,
  Gavel,
  DollarSign,
  Edit3,
  Calendar,
  MapPin,
  FunnelX,
  User,
  FileUser,
  ReceiptText,
} from 'lucide-react';
import CopiarTag from '../shared/utils';
import axios from 'axios';
import dayjs from 'dayjs';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconTollB from 'leaflet/dist/images/LittleTollBoth.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet's default icon issue with webpack
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const markerIconToollBs = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIconTollB,
  shadowUrl: markerShadow,
});


const API_URL = process.env.REACT_APP_API_URL;



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



const estatusMap = {
  pendiente_reporte: {
    label: 'Pendiente Reporte',
    color: 'text-danger font-weight-bold',
    icon: Target,
    key_s: 'pendiente_reporte'
  },
  reporte_enviado_todo_pendiente: {
    label: 'Abuso notificado',
    color: 'text-warningss font-weight-bold',
    icon: AlertTriangle,
    key_s: 'reporte_enviado_todo_pendiente'
  },
  descuento_aplicado_pendiente_acta: {
    label: 'Descuento aplicado',
    color: 'text-info font-weight-bold',
    icon: HandCoins,
    key_s: 'descuento_aplicado_pendiente_acta'
  },
  acta_aplicada_pendiente_descuento: {
    label: 'Acta aplicada',
    color: 'text-info font-weight-bold',
    icon: Gavel,
    key_s: 'acta_aplicada_pendiente_descuento'
  },
  completado: {
    label: 'Completado',
    color: 'text-success font-weight-bold',
    icon: DollarSign,
    key_s: 'acta_aplicada_pendiente_descuento'
  },
};

const AbusosTable = ({ NotifyUpdateToParent }) => {
  const checkboxes = useRef();
  const tableRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalCondonacion, setShowModalCondonacion] = useState(false);
  const [showModalCorreo, setShowModalCorreo] = useState(false);

  const [historicoUbicacionesAbuso, setHistoricoUbicacionesAbuso] = useState([]);
  const [estatusAbuso, setEstatusAbuso] = useState('');
  const [vComentarios, setvComentarios] = useState('');
  const [actaAplicada, setActaAplicada] = useState(false);
  const [vMontoDescontado, setvMontoDescontado] = useState();
  const [polylines, setPolylines] = useState([]);
  const [filtered, setFiltered] = useState([]); //Cruces filtrados
  const [cruces, setCruces] = useState([]);
  const [filtros, setFiltros] = useState({ fechaInicio: '', fechaFin: '', operador: '', caseta: '', estatus: 'todos' });
  const [cruceSeleccionado, setCruceSeleccionado] = useState(null);
  const [casetaSeleccionada, setCasetaSeleccionada] = useState([]); // [lat, lng]
  const [fechaAbuso, setFechaAbuso] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(true);
  const [loadingExpediente, setLoadingExpediente] = useState(true);
  const [operador, setOperador] = useState(''); // Estado para el operador seleccionado
  const [expedienteAbusos, setExpedienteAbusos] = useState([]);

  const [selectedCruces, setSelectedCruces] = useState([]);


  const [paginaActual, setPaginaActual] = useState(1); //Pagúna act ual, obviamente inicia en la primer página
  const [rowsPerPage, setRowsPerPage] = useState(50); //Filas por página.
  let sorted = [...filtered];


  /*Carga inicial de los cruces marcados cómo abusos */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/abusos`);
        setCruces(data);
        setFiltered(data);
      } catch (err) {
        console.error('Error al cargar cruces:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /*Effect para actualizar el listado de abusos, dependiendo del operador seleccionado. */
  useEffect(() => {
    (async () => {
      try {
        setLoadingExpediente(true)
        if (operador) {
          const { data } = await axios.get(`${API_URL}/api/abusos/${operador}/abusosByOP`);
          setExpedienteAbusos(data);
          console.log('Expediente abusos', data);
        }
      } catch (err) {
        console.error('Error al cargar el expediente del operador:', err);
      } finally {
        setLoadingExpediente(false);
      }
    })();
  }, [operador]);


  /*Effect para actualizar el listado de ubicaciones según el operador y el día seleccionados. */
  useEffect(() => {
    (async () => {
      try {
        setLoadingUbicaciones(true);

        if (cruceSeleccionado) {
          const { data } = await axios.get(`${API_URL}/api/abusos/Ubicaciones/${cruceSeleccionado?.ID}`);
          const caseta = await axios.get(`${API_URL}/api/cruces/caseta/${cruceSeleccionado?.Caseta}`);
          setCasetaSeleccionada(caseta.data.caseta);
          setHistoricoUbicacionesAbuso(data.ubicaciones);
          setPolylines(data.polylines);
        } else {
          //    console.log('Sin cruce seleccionado');
        }
      } catch (err) {
        console.error('Error al cargar cruces:', err);
      } finally {
        setLoadingUbicaciones(false);
      }
    })();
  }, [cruceSeleccionado]);








  const handleChange = ({ target: { name, value, checked, type } }) => {
    if (selectedCruces.length !== 0) {
      setSelectedCruces([]);
    }
    if (name === 'inComentarios') {
      return setvComentarios(value);
    }
    if (name === 'inFechaCreacion') {
      return setFechaAbuso(value);
    }
    if (name === 'inDeterminacionAbuso') {

      return setEstatusAbuso(value);
    }
    if (name === 'inMontoDescontado') {
      if (value < 0) return; // Evitar valores negativos
      if (isNaN(value)) return; // Evitar valores no numéricos

      if (value === cruceSeleccionado?.Importe) {
        if (estatusAbuso === 'reporte_enviado_todo_pendiente') {
          setEstatusAbuso('descuento_aplicado_pendiente_acta');
        }
        if (!!actaAplicada) {
          setEstatusAbuso('completado');
        }
      }

      if (value < cruceSeleccionado?.Importe) {
        if (estatusAbuso === 'reporte_enviado_todo_pendiente') {
          setEstatusAbuso('reporte_enviado_todo_pendiente');
        }
        if (!!actaAplicada) {
          setEstatusAbuso('acta_aplicada_pendiente_descuento');
        }
      }


      if (value > cruceSeleccionado?.Importe) {
        alert('El monto descontado no puede ser mayor al monto del abuso.');

        return;
      }; // Evitar que el monto sea mayor al del abuso
      return setvMontoDescontado(value);
    }

    if (name === 'inActaAplicada') {

      if (vMontoDescontado === cruceSeleccionado?.Importe && !!actaAplicada) {

        setEstatusAbuso('descuento_aplicado_pendiente_acta');
      }
      if (vMontoDescontado < cruceSeleccionado?.Importe && !!actaAplicada) {

        setEstatusAbuso('reporte_enviado_todo_pendiente');
      }

      if (vMontoDescontado < cruceSeleccionado?.Importe && !actaAplicada) {

        setEstatusAbuso('acta_aplicada_pendiente_descuento');
      }
      if (vMontoDescontado === cruceSeleccionado?.Importe && !actaAplicada) {
        setEstatusAbuso('completado');
      }
      return setActaAplicada(!!checked);
    }



  };
  const formatearNombre = (obj) => {
    return `${obj.Nombres || ''} ${obj.Ap_paterno || ''} ${obj.Ap_materno || ''}`;
  };
  const handleCheckboxChange = (id) => {
    setSelectedCruces(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };


  const triggerClick = () => {
    checkboxes.current.click();
  };

  const handleSelectAllVisible = () => {
    const visibleIds = sorted.slice((paginaActual - 1) * rowsPerPage, paginaActual * rowsPerPage).map(c => c.ID); // sólo los de la página actual
    const allSelected = visibleIds.every(ID => selectedCruces.includes(ID));

    if (allSelected) {
      // Quitar todos los visibles
      setSelectedCruces(prev => prev.filter(ID => !visibleIds.includes(ID)));
    } else {
      // Agregar todos los visibles que no estén ya seleccionados
      setSelectedCruces(prev => [
        ...prev,
        ...visibleIds.filter(ID => !prev.includes(ID))
      ]);
    }
  };



  const areAllVisibleSelected = () => {
    const visibleIds = sorted.slice((paginaActual - 1) * rowsPerPage, paginaActual * rowsPerPage).map(c => c.ID);
    return visibleIds.every(id => selectedCruces.includes(id));
  };
  const getEstatusInfo = (key) => estatusMap[key] || estatusMap.pendiente_reporte;

  const totalPaginas = Math.ceil(sorted.length / rowsPerPage);
  const indiceInicio = (paginaActual - 1) * rowsPerPage;
  const paginaDatos = sorted.slice(indiceInicio, indiceInicio + rowsPerPage);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const abrirModal = (cruce) => {
    setCruceSeleccionado(cruce);
    setvComentarios(cruce.observaciones || '');
    setActaAplicada(!!cruce.Aplicado);
    setvMontoDescontado((cruce.montoDictaminado === 0) ? '' : cruce.montoDictaminado)
    setEstatusAbuso(cruce.Estatus_Secundario || 'reporte_enviado_todo_pendiente');
    setShowModal(true);
    setFechaAbuso((cruce.FechaDictamen) ? cruce.FechaDictamen.split('T')[0] : dayjs().format('YYYY-MM-DD'))
  };


  const CondonarAbuso = (cruce) => {
    setCruceSeleccionado(cruce);
    setvComentarios(cruce.observaciones || '');
    setShowModalCondonacion(true);
    setFechaAbuso((cruce.FechaDictamen) ? cruce.FechaDictamen.split('T')[0] : dayjs().format('YYYY-MM-DD'))
    setOperador(cruce.No_Economico.split(' ')[0] || '');
  };



  const enviarCorreo = () => {
    setShowModalCorreo(true);
    console.log(selectedCruces)

  };

  const cerrarModal = () => {
    setShowModal(false);
    setCruceSeleccionado(null);
  };
  const cerrarModalCorreo = async (guardando) => {
    setShowModalCorreo(false);
    if (guardando) {
      try {
        if (selectedCruces.length === 0) {
          alert("No hay cruces seleccionados.");
          return;
        }
        //Aquí verificamos si el estatus de los abusos seleccionados es "pendiente_reporte", en caso contrario no se puede enviar el correo.
        const abusosNoPendientes = filtered.filter(c => selectedCruces.includes(c.ID) && c.Estatus_Secundario !== 'pendiente_reporte');
        if (abusosNoPendientes.length > 0) {
          alert("Alguno de los abusos seleccionados ya fue enviado por correo.");
        }
        //Llamada a la API para el envío del correo, filtrando los abusos que se van a enviar (quitando los que no están en estado 'pendiente_reporte').
        const abusosAPEnviar = filtered.filter(c => selectedCruces.includes(c.ID) && c.Estatus_Secundario === 'pendiente_reporte');
        await axios.patch(`${API_URL}/api/abusos/estatus-masivo`, {
          ids: abusosAPEnviar.map(c => c.ID),
          nuevoEstatus: "reporte_enviado_todo_pendiente"
        });
        // Actualizar la lista de cruces después de cambiar el estatus en la base de datos, pero omitiendo los registros que ya no estaban en "pendiente_reporte"
        setCruces(prevCruces =>
          prevCruces.map(cruce =>
            abusosAPEnviar.includes(cruce.ID) ? { ...cruce, Estatus_Secundario: "reporte_enviado_todo_pendiente" } : cruce
          )
        );
        NotifyUpdateToParent(); // Notify parent component about the update
        setSelectedCruces([]); // Limpiar selección después de la acción masiva
      } catch (error) {
        console.error("Error al enviar correo:", error);
      }
      finally {
        setSelectedCruces([]); // Limpiar selección después de la acción masiva
        NotifyUpdateToParent(); // Notify parent component about the update
      }
    }

  };
  const cerrarModalCondonacion = () => {
    setShowModalCondonacion(false);
    setCruceSeleccionado(null);
    setOperador(null);
    setHistoricoUbicacionesAbuso([]);
  };
  const cerrarModalGuardando = async () => {

    try {
      const id = cruceSeleccionado.ID;

      const payload = { FechaDictamen: ((estatusAbuso === 'pendiente_reporte') ? null : fechaAbuso), montoDictaminado: vMontoDescontado, estatusSecundario: estatusAbuso, observaciones: vComentarios, dictaminado: actaAplicada ? 1 : 0 };
      const { status } = await axios.patch(`${API_URL}/api/abusos/${id}/UpdateAbuso`, payload);
      if (status === 200) {
        setCruces(prev => prev.map(c => c.ID === id ? { ...c, Estatus_Secundario: estatusAbuso, montoDictaminado: vMontoDescontado, FechaDictamen: fechaAbuso, observaciones: vComentarios, Aplicado: payload.dictaminado } : c));
      } else console.error('No se pudo actualizar el estatus');
    } catch (error) {
      console.error('Error al cambiar el estatus:', error);
    }
    cerrarModal();
  };

  const cerrarModalCondonando = async () => {

    try {
      const id = cruceSeleccionado.ID;
      const payload = { FechaDictamen: fechaAbuso, estatusSecundario: estatusAbuso, observaciones: vComentarios, dictaminado: actaAplicada ? 1 : 0 };
      const { status } = await axios.patch(`${API_URL}/api/cruces/${id}/estatus`, { estatus: 'Condonado' });
      if (status === 200) {
        setCruces(prev => prev.map(c => c.ID === id ? { ...c, Estatus_Secundario: estatusAbuso, FechaDictamen: fechaAbuso, observaciones: vComentarios, Aplicado: payload.dictaminado } : c));
        setFiltered(prev => prev.map(c => c.ID === id ? { ...c, Estatus_Secundario: estatusAbuso, FechaDictamen: fechaAbuso, observaciones: vComentarios, Aplicado: payload.dictaminado } : c));
        setOperador('');
      } else console.error('No se pudo actualizar el estatus');
    } catch (error) {
      console.error('Error al cambiar el estatus:', error);
    }
    setOperador(null);
    cerrarModalCondonacion();
  };

  useEffect(() => {
    const filtrado = cruces.filter(c => {
      const fechaOK = (!filtros.fechaInicio || c?.Fecha >= filtros.fechaInicio) && (!filtros.fechaFin || c?.Fecha <= filtros.fechaFin);
      const opOK = !filtros.operador || c.No_Economico.toLowerCase().includes(filtros.operador.toLowerCase());
      const casOK = !filtros.caseta || c.Caseta.toLowerCase().includes(filtros.caseta.toLowerCase());
      const estOK = filtros.estatus === 'todos' || c.Estatus_Secundario === filtros.estatus;
      return fechaOK && opOK && casOK && estOK;
    });
    setFiltered(filtrado);
  }, [filtros, cruces]);

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
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <h6 className="m-0 font-weight-bold text-primary ml-3" style={{ flex: 'auto', }}>Cruces que aplican según los parametros seleccionados  - (<span className="text sm">{new Intl.NumberFormat("es-MX").format(sorted.length)})</span></h6>

          </div>

          {/* Filtros */}
          <div className="card-body pb-0">
            {/* Este DIV unicamente se muestra cuando se seleccionan cruces */}
            <div className=" justify-content-around float-right border border-secondary rounded p-1 py-0" style={{ display: (selectedCruces.length > 0) ? 'flex' : 'none', }}>
              <div className='col-4 border border-secondary rounded px-3 py-0 mr-2 word-wrap'>
                {/* Fila para acomodar las columnas del recuento de los cruces seleccionados */}
                <div className='row px-0' >

                  {/* Columna del recuento de los cruces seleccionados (El número de cruces seleccionados) */}
                  <div className='col-7 justify-content-end'>
                    <span className="text-info  font-weight-bold" style={{ fontSize: '1.5rem', lineHeight: '1.9rem' }}>{selectedCruces.length}</span>
                  </div>


                  <div className='col-2 float-right justify-content-end' >
                    <Grid2X2Check size={20} className="me-1  p-0 m-0" />
                  </div>


                  {/* Columna de las acciones masivas */}
                  <div className='col-sm' style={{ fontSize: '.8rem', lineHeight: '0.3rem', textAlign: 'right' }} >
                    {(selectedCruces.length > 1) ? 'Cruces' : 'Cruce'}
                  </div>

                </div>
                <div className="row text-center px-0 justify-content-center">

                  <span style={{ fontSize: '1rem', lineHeight: '1.5rem' }}>{(selectedCruces.length > 1) ? 'seleccionados' : 'seleccionado'}</span>
                </div>


              </div>
              {/* Columna de las acciones masivas */}
              <div className='col pt-0 px-0 '>
                <div className='d-flex align-items-center row text-center' style={{ fontSize: '1.2rem', justifyContent: 'center', lineHeight: '1.4rem' }}>
                  <span className="text-muted text-center">Acciones masivas:</span>
                </div>
                <div className='d-flex align-items-center gap-1 row' style={{ justifyContent: 'center', }}>
                  <button
                    className="btn btn-outline-primary mr-1"
                    title="Enviar por correo los cruces seleccionados"
                    onClick={() => enviarCorreo()}
                  >
                    <MailPlus size={30} />
                  </button>

                </div>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mb-3">

              <div className="form-floating pr-2">
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                  className="form-control form-control-sm"
                />
                <label className="form-label">Fecha Inicio</label>

              </div>

              <div className="form-floating pr-2 ">
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                  className="form-control form-control-sm"
                />
                <label >Fecha Fin</label>

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
                  placeholder="Buscar caseta..."
                  value={filtros.caseta}
                  id="CasetaAclaracion"
                  autoComplete="off"
                  onChange={(e) => setFiltros({ ...filtros, caseta: e.target.value })}
                  className="form-control form-control-sm"
                />
                <label className="form-label" htmlFor='CasetaAclaracion'>Caseta</label>

              </div>

              <div className="pl-1 pr- input-group-text mb-0 ">
                <label className='form-label' htmlFor='inEstatus'>Estatus:</label>
                <select className='mx-3 p-2' id='inEstatus' name="Estatus" onChange={(e) => setFiltros({ ...filtros, estatus: e.target.value })} value={filtros.estatus}>
                  <option value="todos">Todos</option>
                  <option value="pendiente_reporte">Pendiente</option>
                  <option value="reporte_enviado_todo_pendiente">Abuso notificado</option>
                  <option value="descuento_aplicado_pendiente_acta">Descuento aplicado</option>
                  <option value="acta_aplicada_pendiente_descuento">Acta aplicada</option>
                  <option value="completado">Completados</option>
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
                    caseta: '',
                    estatus: 'todos'
                  })}>
                  <FunnelX size={40} className="me-1" />
                </button>
              </div>
            </div>


            {/* Tabla */}
            <div className="table-responsive table-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

              <table className="table  table-bordered table-scroll table-sm table-hover align-middle ">
                <thead className="text-center">
                  <tr>
                    <th onClick={triggerClick} >
                      <input tabIndex={1}
                        type="checkbox" ref={checkboxes}
                        style={{ height: '15px', width: '15px', }}
                        onChange={handleSelectAllVisible}
                        checked={areAllVisibleSelected()}
                        id='SelectAll'
                      />
                    </th>
                    <th>IDx</th>
                    <th>Fecha/Hora</th>
                    <th>Operador</th>
                    <th>Caseta</th>
                    <th>Clase</th>
                    <th>Descontar</th>
                    <th>Situación personal</th>
                    <th>Estatus</th>
                    <th>Acciones </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Se crea una fila de la tabla con cada registro obtenido de la pagina actual de Datos, conforme a la paginación */}
                  {paginaDatos.map((abuso, i) => {
                    const estatusInfo = getEstatusInfo(abuso.Estatus_Secundario);
                    const IconoEstatus = estatusInfo?.icon;


                    return (
                      <tr key={i} className='justify-content-center'>
                        <td className='py-1 align-middle justify-content-center text-center' style={{ verticalAlign: 'middle' }}> <input
                          type="checkbox" tabIndex={i + 2}
                          checked={selectedCruces.includes(abuso.ID)}
                          onChange={() => handleCheckboxChange(abuso.ID)}
                        /></td>

                        <td className='px-0 py-1 align-middle justify-content-center' style={{ textAlign: 'center', verticalAlign: 'middle' }}>{i + 1}</td>

                        <td style={{ verticalAlign: 'middle' }}>
                          <div className="d-flex align-items-center justify-content-center">
                            <Calendar className="me-2 text-secondary mr-2" size={20} />
                            <div>
                              <div className="fw-bold">{formatearFecha(abuso?.Fecha)}</div>
                              <small className="text-muted">{abuso?.Fecha?.split('T')[1].split('.')[0]}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center justify-content-center" style={{ verticalAlign: 'middle' }}>
                            <User className="me-2 text-secondary" size={20} />
                            <div>
                              <div className="fw-bold">{abuso["Nombres"]?.split(' ')[0] + " " + (abuso["Apellidos"]?.split(' ')[1] || '')}</div>
                              <small className="text-muted">{abuso["No_Economico"]?.split(' ')[0]} </small>
                            </div>
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle' }} className='pr-0' >
                          <div className="d-flex" >
                            <MapPin className="me-2 text-secondary" size={20} />
                            <div>
                              <div>{abuso.Caseta}</div>
                              <small className="text-muted">Carril: {abuso.Carril}</small>
                            </div>
                          </div>
                        </td>


                        <td style={{ verticalAlign: 'middle', }}>

                          <div className="d-flex align-items-center justify-content-center" >
                            <div>
                              <div>

                                <strong>{abuso.Clase}</strong>
                              </div>
                            </div>
                          </div>

                        </td>
                        <td className="justify-content-center" style={{ verticalAlign: 'middle', fontSize: ((abuso?.Importe - abuso?.montoDictaminado === 0) ? '0.8rem' : '1.1rem'), color: ((abuso?.Importe - abuso?.montoDictaminado === 0) ? 'green' : 'darkblue'), fontWeight: ((abuso?.Importe - abuso?.montoDictaminado === 0) ? 'bold' : 'bolder') }}>
                          <div>
                            <div>{(abuso?.Importe - abuso?.montoDictaminado === 0) ? '$ ' + abuso?.Importe.toFixed(2) + ` OK` : '$' + (abuso?.Importe - abuso?.montoDictaminado).toFixed(2)}</div>
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle', }}>
                          <strong>{abuso?.Estado_Personal}</strong>

                        </td>
                        <td className=' align-items-center' style={{ verticalAlign: 'middle' }}>
                          <span className={` ${estatusInfo?.color}`} >
                            <IconoEstatus size={16} className="me-1 mr-2" />
                            {estatusInfo?.label}
                          </span>
                        </td>


                        <td>
                          <div className="d-flex justify-content-center  align-items-center">
                            <button
                              className="btn btn-sm btn-outline-primary mr-1"
                              title="Gestionar Abuso"
                              onClick={() => abrirModal(abuso)}
                            >
                              <Edit3 size={22} />
                            </button>

                            <button
                              className="btn btn-sm btn-outline-success"
                              title="Condonar Abuso"
                              onClick={() => CondonarAbuso(abuso)}
                            >
                              <TicketCheck size={22} className='p-0' />
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
            <div className='assignMe'>
              <nav className="mt-3">

                <ul className="pagination pagination-sm justify-content-center d-flex flex-wrap" style={{ overflow: 'auto', }}>
                  <li className={`flex-wrap page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => cambiarPagina(paginaActual - 1)}>Anterior</button>
                  </li>

                  {[...Array(totalPaginas)].map((_, index) => (
                    <li key={index} className={`flex-wrap page-item ${paginaActual === index + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => cambiarPagina(index + 1)}>
                        {index + 1}
                      </button>
                    </li>
                  ))}

                  <li className={`flex-wrap page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => cambiarPagina(paginaActual + 1)}>Siguiente</button>
                  </li>
                </ul>
              </nav>
            </div>

          </div>

        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header style={{ paddingBottom: '0.5rem' }}>
          <Modal.Title>
            <span className='' style={{ float: 'right !important', right: '10px', position: 'absolute', fontSize: '.7rem' }}>ID: {cruceSeleccionado?.ID}</span>
            <FileUser size={35} className="me-1" /> Gestión del Abuso
            <br></br>

            <a href={`https://apps.pase.com.mx/uc/detalletag/IMDM/${cruceSeleccionado?.Tag?.replace("IMDM", "")}`} style={{ fontSize: '.9rem', }} target='_blank' rel="noreferrer"  >

              <ReceiptText size={23} className="me-1 ml-2 mr-3" />
              TAG: {cruceSeleccionado?.Tag}
            </a>

            {/*Este es el componente al que */}
            <CopiarTag cruceSeleccionado={cruceSeleccionado} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ paddingTop: '0.5rem' }}>
          <div className="card" style={{ background: 'whitesmoke', }}>
            <div className='card-header text-center'>
              <Info size={18} className="me-1" />
              <span className='text-primary font-weight-bolder ml-2'>Información del cruce determinado como <b>ABUSO</b></span>

            </div>
            <div className="card-body" style={{ background: 'whitesmoke', }}>

              <div className='form-row align-items-center'>

                <div className="form-floating pr-2 col">

                  Fecha:
                  <span className='ml-1 text-secondary font-weight-bolder'> <span style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                    title="Copiar FECHA al portapapeles"
                    onClick={() => {
                      if (cruceSeleccionado?.Fecha) {
                        navigator.clipboard.writeText(formatearFecha(cruceSeleccionado?.Fecha));
                      }
                    }}
                  >
                    {formatearFecha(cruceSeleccionado?.Fecha) + " "}
                  </span>
                    <span className='font-weight-bolder text-primary'>|</span> {cruceSeleccionado?.Fecha?.split('T')[1].split('.')[0]}</span>
                  <br></br>
                  Matricula/Operador:
                  <span className='ml-1 text-secondary font-weight-bolder'> {cruceSeleccionado?.["No_Economico"]}</span>
                  <br></br>
                  Caseta:
                  <span className='ml-1 text-secondary font-weight-bolder' style={{ cursor: 'pointer', fontSize: '0.85rem' }} title="Copiar CASETA al portapapeles"
                    onClick={() => {
                      if (cruceSeleccionado?.Caseta) {
                        navigator.clipboard.writeText(cruceSeleccionado?.Caseta);
                      }
                    }}
                  > {cruceSeleccionado?.Caseta}</span>
                  <br></br>
                  Importe del abuso:
                  <span className='ml-1 text-secondary font-weight-bolder'>$ {cruceSeleccionado?.Importe?.toFixed(2)}</span>
                  <br></br>

                  Pendiente por descontar:
                  <span className='ml-1 text-secondary font-weight-bolder'>$ {(cruceSeleccionado?.Importe - vMontoDescontado).toFixed(2)}</span>
                  <br></br>

                </div>

                <div className="col">
                  <div className="form-group mb-4"><label htmlFor='inObservaciones'>Observaciones</label>
                    <textarea name="inComentarios" className="form-control" rows="3" id="inObservaciones" placeholder="Comentarios por parte del operador..." value={vComentarios ?? ""} onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-1">
            <div className='card-header text-center'>
              <ChartNoAxesGantt size={18} className="me-1" />
              <span className='text-primary font-weight-bolder py-3 my-2 ml-2 mr-1'>Situación actual del abuso → </span>
              <span className={` font-weight-bolder text-uppercase py-2 ${getEstatusInfo(cruceSeleccionado?.Estatus_Secundario).color}}`}> {cruceSeleccionado?.Estatus_Secundario.replaceAll("_", " ")}</span>

            </div>
            <div className="card-body border " style={{ background: 'whitesmoke', }}>
              <div className='form-row'>
                <div className="form-floating pr-2 col">
                  <select className="form-select form-control form-select" id='inDeterminacionAbuso' name='inDeterminacionAbuso' aria-label="inDeterminacionAbuso" onChange={handleChange} value={estatusAbuso}>
                    <option value={'reporte_enviado_todo_pendiente'}>Reporte notificado</option>
                    <option value={'pendiente_reporte'}>Pendiente notificar abuso</option>
                    <option value={'descuento_aplicado_pendiente_acta'}>Descuento aplicado</option>
                    <option value={'acta_aplicada_pendiente_descuento'}>Acta administrativa aplicada</option>
                    <option value={'completado'}>Gestión completada</option>
                  </select>
                  <label className="form-label text-primary font-weight-bold" htmlFor='inDeterminacionAbuso'>Selecciona la situación actual</label>

                </div>
                <div className="form-floating pr-2 col">

                  <input type="date" placeholder='' id='inFechaCreacion' name='inFechaCreacion' className="form-control form-control" disabled={(cruceSeleccionado?.FechaDictamen && estatusAbuso !== 'pendiente_reporte')} value={fechaAbuso ?? ""} onChange={handleChange} />
                  <label className="form-label" htmlFor='inFechaCreacion'>Fecha de notificación del abuso</label>
                  <small className="ml-1 form-text text-muted">Cuando se envío el correo de la detección del abuso.</small>

                </div>

              </div>

            </div>
          </div>

          <div className="card mt-1">
            <div className='card-header text-center'>
              <Building2 size={18} className="me-1" />
              <span className='text-primary font-weight-bolder py-2 my-2 ml-2'>Comentarios de los departamentos relacionados</span>
            </div>
            <div className="card-body border " style={{ background: 'whitesmoke', }}>
              <div className='form-row align-items-center'>
                <div className="form-floating pr-2 col">
                  <input
                    type="number"
                    min="0.00" max="100000.00" step="0.01"
                    id='inMontoDescontado'
                    placeholder='$'
                    className="form-control form-control"
                    name='inMontoDescontado'
                    value={vMontoDescontado ?? ""}
                    onChange={handleChange}
                    onBlur={() => {
                      if (vMontoDescontado < cruceSeleccionado?.Importe) {
                        alert('El monto descontado es menor al monto del abuso. Dar seguimiento para completar la gestión.');
                      }
                    }}
                  />
                  <label className="form-label" htmlFor='inMontoDescontado'>Monto descontado: </label>
                  <small className="ml-1 form-text text-muted">El número, <strong className='font-weight-bold'>sin formato</strong></small>
                </div>
                <div className="pl-4 col">
                  <div className="form-check form-switch row " style={{ textAlign: 'center', height: '2rem' }}>
                    <input className="form-check-input" type="checkbox" id="inActaAplicada" name='inActaAplicada' onChange={handleChange} checked={actaAplicada} />
                    <label className="form-check-label" htmlFor="inActaAplicada">Acta administrativa aplicada</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => cerrarModalGuardando(cruceSeleccionado)}>
            Guardar cambios
          </Button>
          <Button variant="secondary" onClick={() => cerrarModal(cruceSeleccionado)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/*Modal para la gestión de las condonaciones */}
      <Modal show={showModalCondonacion} onHide={() => cerrarModalCondonacion()} size="xl" animation={true}>
        <Modal.Header style={{ paddingBottom: '0.5rem' }}>
          <Modal.Title>
            <span className='' style={{ float: 'right !important', right: '10px', position: 'absolute', fontSize: '.7rem' }}>ID: {cruceSeleccionado?.ID}</span>
            <TicketCheck size={35} className="me-1" /> ¿Deseas condonar el abuso?
            <br></br>

            <a href={`https://apps.pase.com.mx/uc/detalletag/IMDM/${cruceSeleccionado?.Tag?.replace("IMDM", "")}`} style={{ fontSize: '.9rem', }} target='_blank' rel="noreferrer"  >

              <ReceiptText size={23} className="me-1 ml-2 mr-3" ></ReceiptText >
              TAG: {cruceSeleccionado?.Tag}
            </a>
            <CopiarTag cruceSeleccionado={cruceSeleccionado} />

          </Modal.Title>
        </Modal.Header>


        <Modal.Body className='py-0' style={{ paddingTop: '0.5rem' }}>
          <div className="card" style={{ background: 'whitesmoke', }}>
            <div className='card-header text-center'>
              <Info size={18} className="me-1" />
              <span className='text-primary font-weight-bolder ml-2'>Historial del operador</span>
            </div>

            <div className="card-body py-0" style={{ background: 'whitesmoke', minHeight: '6rem', }}>
              <div className=" justify-content-center" style={{ placeSelf: 'center', overflow: 'none!important' }}>


                {(loadingExpediente) ? (
                  <div className="d-flex justify-content-center align-items-center" style={{ height: "15vh", overflow: 'none' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem", overflow: 'none' }}>
                      <span className="visually-hidden" style={{ overflow: 'none' }}></span>
                    </div>
                  </div>
                ) : <><table className='align-content-center table table-striped table-sm table-responsive table-bordered border-light table-scrollable'>
                  <thead className='table table-dark'>
                    <tr>
                      <th>Caseta</th>
                      <th>Carril</th>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Importe</th>
                      <th>Dictamen</th>

                    </tr>
                  </thead>
                  <tbody className='table-light table-bordered border-dark table-striped '>
                    {expedienteAbusos.map((item, idx) => (
                      <tr key={idx} className={item.Estatus_Secundario === 'Condonado' ? 'table-success font-weight-bold' : ''}>
                        <td>{item.Caseta}</td>
                        <td>{item.Carril}</td>
                        <td>{formatearFecha(item?.Fecha)}</td>
                        <td>{item.Clase}</td>
                        <td>${item?.Importe.toFixed(2)}</td>
                        <td>{item.Estatus_Secundario.replaceAll("_", " ").toUpperCase()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </>
                }

              </div>
            </div>
          </div>

          <div className='card-header text-center'>
            <Info size={18} className="me-1" />
            <span className='text-primary font-weight-bolder ml-2'>{(Math.round(historicoUbicacionesAbuso.length / 20) ? (Math.round(historicoUbicacionesAbuso.length / 20) + 1) : '')} Ubicaciones del operador {formatearNombre(historicoUbicacionesAbuso[0] || '')}</span>
          </div>

          <div style={{}} className='container-fluid'>
            Historico de ubicaciones el {formatearFecha(cruceSeleccionado?.Fecha)} en el mapa:
            <br />
            <div style={{}}>
              {(loadingUbicaciones) ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "25vh", overflow: 'none' }}>
                  <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem", overflow: 'none' }}>
                    <span className="visually-hidden" style={{ overflow: 'none' }}></span>
                  </div>
                </div>
              ) : (historicoUbicacionesAbuso.length > 1) ? <>
                <MapContainer center={[historicoUbicacionesAbuso[0].latitud, historicoUbicacionesAbuso[0].longitud]} zoom={9} scrollWheelZoom={false} style={{ width: '100%', height: '45vh' }} >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors || IAVE-WEB ⭐🚌'
                  />

                  <Marker position={[historicoUbicacionesAbuso[0].latitud, historicoUbicacionesAbuso[0].longitud]}>
                    <Popup> Origen</Popup>
                  </Marker>
                  {historicoUbicacionesAbuso.map((ubicacion, idx, arr) => (
                    ((idx % (Math.round(historicoUbicacionesAbuso.length / 20))) === 0) &&
                    <Marker key={idx} position={[ubicacion.latitud, ubicacion.longitud]}>
                      <Popup>Posición #{1 + (idx / (Math.round(historicoUbicacionesAbuso.length / 20)))} <br /> {formatearFechaConHora(ubicacion?.Fecha)} </Popup>
                    </Marker>
                  ))}
                  <Polyline color='red' positions={polylines}> <Popup> Recorrido del operador</Popup></Polyline>

                  <Marker
                    position={[casetaSeleccionada.latitud, casetaSeleccionada.longitud]}
                    icon={markerIconToollBs}
                  >
                    <Popup>
                      Caseta: {casetaSeleccionada.Nombre}
                      <br />
                      Importe: ${cruceSeleccionado?.Importe.toFixed(2)}
                      <br />
                      El {formatearFechaConHora(cruceSeleccionado?.Fecha)}
                    </Popup>
                  </Marker>


                  <Marker position={[historicoUbicacionesAbuso[historicoUbicacionesAbuso.length - 1].latitud, historicoUbicacionesAbuso[historicoUbicacionesAbuso.length - 1].longitud]}>
                    <Popup> Destino</Popup>
                  </Marker>
                </MapContainer>
              </> : <div className="container-fluid text-center mt-5">
                <div className="error" data-text="Error" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4e73df', justifySelf: 'center', }}>
                  No existen registros
                </div>
                <div className='mx-auto'>

                  <p className="lead text-gray-800 mb-3 mt-4">No se registraron ubicaciones de <b>{(historicoUbicacionesAbuso[0]?.Nombres) || 'el colaborador'} {historicoUbicacionesAbuso[0]?.Ap_paterno}</b> el <b>{formatearFecha(historicoUbicacionesAbuso[0]?.Fecha) || 'día del abuso'}</b></p>
                  <p className="text-gray-500 mb-4">Para mayor información verifica con el área de Rastreo o con Personal.</p>

                </div>
              </div>}

            </div>

          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => cerrarModalCondonando(cruceSeleccionado)}>
            Confirmar
          </Button>
          <Button variant="secondary" onClick={() => cerrarModalCondonacion(cruceSeleccionado)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>



      {/*Modal para el envío del correo electrónico de acuerdo a los cruces seleccionados.*/}
      <Modal show={showModalCorreo} onHide={() => cerrarModalCorreo()} size="xl" animation={true}>
        <Modal.Header style={{ paddingBottom: '0.5rem' }}>
          <Modal.Title className='d-flex '>
            <MailPlus size={35} className="me-1" /> Selecciona y copia la tabla a tu correo electrónico
            <br />
          </Modal.Title>
        </Modal.Header>


        <Modal.Body style={{ paddingTop: '0.5rem' }}>
          <div className="card" style={{ background: 'whitesmoke', }}>
            <div className='card-header text-center'>
              <Info size={18} className="me-1" />
              <span className='text-primary font-weight-bolder ml-2'>Tabla de abusos seleccionados ({selectedCruces.length}).</span>
            </div>

            <div className="card-body" style={{ background: 'whitesmoke' }}>
              <div className=" justify-content-center table-container" style={{ placeSelf: 'center', overflow: 'none!important' }}>
                {/*Tabla a copiar al portapapeles ↓*/}
                <table ref={tableRef} className='align-content-center table table-striped table-sm table-responsive table-bordered border-light table-scrollable' style={{ fontFamily: 'consolas', fontWeight: 'light' }}>
                  <thead className='table table-dark'>
                    <tr>
                      <th>Matricula</th>
                      <th>Nombre</th>
                      <th>Tag</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Caseta</th>
                      <th>Carril</th>
                      <th>Clase</th>
                      <th>Importe</th>
                      <th>Estado del personal</th>

                    </tr>
                  </thead>
                  <tbody className='table-light table-bordered border-dark table-striped '>
                    {filtered.filter(abuso => selectedCruces.includes(abuso.ID)).map(

                      (item, idx) => (
                        <tr key={idx} >
                          <td className={(item.NombreCompleto.length < 3) ? 'text-danger font-weight-bold' : ''}>{item.ID_Matricula || item.No_Economico.split(" ")[0]}</td>
                          <td className={(item.NombreCompleto.length < 3) ? 'text-danger font-weight-bold' : ''}>{(item.NombreCompleto.length > 2) ? item.NombreCompleto : item.No_Economico.split(" ")[1]}</td>
                          <td>{item.Tag}</td>
                          <td>{formatearFecha(item?.Fecha)}</td>
                          <td>{item?.Fecha.split('T')[1].split('.')[0]}</td>
                          <td>{item?.Caseta}</td>
                          <td>{item?.Carril}</td>
                          <td>{item?.Clase}</td>
                          <td>${item?.Importe.toFixed(2)}</td>
                          <td>{item?.Estado_Personal?.replace("_", " ").toUpperCase() || '(Vacío)'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>

              </div>
            </div>
          </div>


        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => cerrarModalCorreo('ok')}>
            Confirmar envío del correo
          </Button>
          <Button variant="secondary" onClick={() => cerrarModalCorreo()}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>

    </div>






  );
};

export default AbusosTable;
