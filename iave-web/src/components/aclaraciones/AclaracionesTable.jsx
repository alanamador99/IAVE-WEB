import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import {
  BanknoteArrowUp,
  Info,
  TicketX,
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
import { useAuth } from '../../hooks/useAuth';

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
  },
  aprobado: {
    label: 'Aprobado',
    color: 'text-success font-weight-bold',
    icon: CheckCircle
  },
  Rechazado: {
    label: 'Rechazado',
    color: 'text-danger font-weight-bold',
    icon: TicketX
  },
  Aprobado: {
    label: 'Aprobado',
    color: 'text-success font-weight-bold',
    icon: CheckCircle
  },
  todos: {
    label: 'Todos',
    color: 'text-dark font-weight-bold',
    icon: Info
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
  const { canEdit } = useAuth();
  // Estados principales
  const [aclaraciones, setAclaraciones] = useState([]);

  //Estados de UI
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [progreso, setProgreso] = useState(null); // % de carga (0-100)
  const [eventSource, setEventSource] = useState(null);
  const [progressDetails, setProgressDetails] = useState({
    total: 0,
    processed: 0,
    inserted: 0,
    skipped: 0,
    remaining: 0,
    message: ''
  });

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

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(100);

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
  // En los filtros de estado secundario se consideran como "rechazados" aquellas aclaraciones dictaminadas cuyo monto dictaminado sea 0, mientras que aquellas con monto dictaminado mayor a 0 se consideran "aprobadas", permitiendo así filtrar por estatus de dictamen de manera más granular.

  const aclaracionesFiltrados = useMemo(() => {
    return aclaraciones.filter(c => {
      const fechaOK = (!filtros.fechaInicio || c.Fecha >= filtros.fechaInicio) &&
        (!filtros.fechaFin || c.Fecha <= filtros.fechaFin);
      const opOK = !filtros.operador || (c.No_Economico && c.No_Economico.toLowerCase().includes(filtros.operador.toLowerCase()));
      const casOK = !filtros.caseta || (c.Caseta && c.Caseta.toLowerCase().includes(filtros.caseta.toLowerCase()));
      let estOK = true;

      if (filtros.estatus === 'todos') {
        estOK = true;
      } else {
        // Otros estados directo (pendiente_aclaracion, etc.)
        estOK = c.Estatus_Secundario === filtros.estatus;
      }
      const ejesOK = !filtros.ejes || (c.ID_clave && c.ID_clave.toLowerCase().trim().includes(filtros.ejes.toLowerCase()));
      const ejesCobradosOK = !filtros.ejesCobrados || (c.Clase && c.Clase.toLowerCase().trim().includes(filtros.ejesCobrados.toLowerCase()));
      return fechaOK && opOK && casOK && estOK && ejesOK && ejesCobradosOK;
    });
  }, [aclaraciones, filtros]);



  // ✅ Calcular datos de paginación
  const totalPaginas = Math.ceil(aclaracionesFiltrados.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const paginaDatos = aclaracionesFiltrados.slice(indiceInicio, indiceFin);

  const connectToProgressStream = () => {
    const es = new EventSource(`${API_URL}/api/aclaraciones/progress`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'connected':
            break;
          case 'start':
            setProgreso(5);
            setProgressDetails({
              total: data.total,
              processed: 0,
              inserted: 0,
              skipped: 0,
              remaining: data.total,
              message: data.message
            });
            break;

          case 'progress':
            setProgreso(data.percentage);
            setProgressDetails({
              total: data.total,
              processed: data.processed,
              inserted: data.inserted,
              skipped: data.skipped,
              remaining: data.total - data.processed,
              message: data.message
            });
            break;

          case 'complete':
            setProgreso(100);
            setProgressDetails({
              total: data.total,
              processed: data.processed,
              inserted: data.inserted,
              skipped: data.skipped,
              remaining: 0,
              message: 'Completado',
              omitidos: data.omitidos
            });

            // Recargar datos
            axios.get(`${API_URL}/api/aclaraciones`)
              .then(res => {
                setAclaraciones(res.data);
              })
              .catch(err => console.error('Error al recargar aclaraciones:', err));
            break;

          case 'error':
            console.error('❌ Error en el stream:', data);
            setProgressDetails(prev => ({ ...prev, message: `Error: ${data.message}` }));
            // No reseteamos progreso a null para mostrar el error en el modal
            break;

          default:
            console.warn('❓ Evento desconocido en SSE:', data);
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    es.onerror = (error) => {
      console.error('❌ Error en EventSource:', error);
      es.close();
    };

    setEventSource(es);
    return es;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let resultados = [];
    setProgreso(0);

    // Conectar al stream de progreso
    const es = connectToProgressStream();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      chunkSize: 1024 * 1024,

      chunk: (results, parser) => {
        resultados = resultados.concat(results.data);
        // Solo mostrar progreso de parsing inicial (no real)
        if (progreso < 5) {
          setProgreso(Math.min(1, (results.meta.cursor / file.size) * 5));
        }
      },

      complete: async () => {
        try {
          console.log(`✅ Parsing completado. Enviando ${resultados.length} registros al servidor...`);

          // Enviar datos al backend (el progreso real vendrá por SSE)
          const response = await axios.post(
            `${API_URL}/api/aclaraciones/importar`,
            resultados,
            { headers: { "x-usuario": "admin" } }
          );

          console.log('✅ Datos enviados al servidor correctamente');

        } catch (error) {
          console.error("❌ Error al enviar datos al backend:", error);
          alert("❌ Error al importar el archivo: " + (error.response?.data?.error || error.message));

          // Cerrar conexión SSE en caso de error
          if (es) {
            es.close();
          }
          setProgreso(null);
        } finally {
          // Limpiar input file
          document.getElementById('fileInput').value = '';
        }
      },

      error: (err) => {
        console.error("❌ Error al parsear CSV:", err);
        alert(`❌ Error al procesar el archivo CSV: ${err.message || 'Error desconocido'}`);

        if (es) {
          es.close();
        }
        setProgreso(null);
        document.getElementById('fileInput').value = '';
      },
    });
  };



  // ✅ Generar array de números de página para mostrar
  const obtenerNumerosPagina = useCallback(() => {
    const paginas = [];
    const maxPaginasVisibles = 5;

    if (totalPaginas <= maxPaginasVisibles) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      if (paginaActual <= 3) {
        for (let i = 1; i <= 4; i++) {
          paginas.push(i);
        }
        paginas.push('...');
        paginas.push(totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        paginas.push(1);
        paginas.push('...');
        for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
          paginas.push(i);
        }
      } else {
        paginas.push(1);
        paginas.push('...');
        for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
          paginas.push(i);
        }
        paginas.push('...');
        paginas.push(totalPaginas);
      }
    }

    return paginas;
  }, [paginaActual, totalPaginas]);

  const cambiarPagina = useCallback((numeroPagina) => {
    if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
      setPaginaActual(numeroPagina);
    }
  }, [totalPaginas]);

  // ✅ Callbacks optimizados
  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginaActual(1); // Reset a página 1 al filtrar
  }, []);




  //Esta función permite cargar los folios manualmente desde un archivo o fuente externa.

  //Esta función carga un archivo JSON con el dictamen del proveedor para conciliar las aclaraciones existentes, actualizando su dictamen y el monto que registra el proveedor, para posteriormente aplicar el dictamen y reflejarlo en la tabla.
  const handleCargarJSON = useCallback(() => {
    document.getElementById('fileInputJSON').click();
  }, []);

  const handleFileJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProgreso(0);

    // Conectar al stream de progreso
    const es = connectToProgressStream();

    // Set initial processing state immediately
    setProgreso(1);
    setProgressDetails({
      total: 0,
      processed: 0,
      inserted: 0,
      skipped: 0,
      remaining: 0,
      message: 'Leyendo archivo JSON...'
    });

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const rawData = JSON.parse(event.target.result);
        // Soporte para estructura { content: [] } o array directo
        const jsonData = Array.isArray(rawData) ? rawData : (rawData.content || []);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error("El archivo JSON debe contener un arreglo de objetos válido");
        }

        console.log(`✅ JSON leído. Enviando ${jsonData.length} registros...`);

        setProgreso(5); // Pequeño avance visual
        setProgressDetails(prev => ({ ...prev, message: 'Conectando con el servidor...' }));

        // Esperar un momento para asegurar que la conexión SSE esté establecida
        await new Promise(resolve => setTimeout(resolve, 500));

        await axios.patch(
          `${API_URL}/api/aclaraciones/conciliarJSON`,
          jsonData,
          { headers: { "x-usuario": "admin" } }
        );

        // El resto del flujo se maneja vía SSE (connectToProgressStream)

      } catch (error) {
        console.error("❌ Error al procesar JSON:", error);
        alert("Error al procesar el archivo JSON: " + (error.response?.data?.error || error.message));

        // Cerrar stream si hubo error síncrono antes de que el servidor pudiera reportar error
        if (es) es.close();

        // Mostrar error en el modal en lugar de cerrarlo abruptamente si ya se abrió
        setProgreso(null);
        setProgressDetails(prev => ({
          ...prev,
          message: `Error: ${error.response?.data?.error || error.message}`
        }));
      } finally {
        document.getElementById('fileInputJSON').value = '';
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Error de lectura de archivo");
      if (es) es.close();
      setProgreso(null);
      document.getElementById('fileInputJSON').value = '';
    };

    reader.readAsText(file);
  };




  const handleRegistrosPorPaginaChange = (e) => {
    setRegistrosPorPagina(Number(e.target.value));
    setPaginaActual(1);
  };

  const resetFiltros = useCallback(() => {
    setFiltros(FILTROS_INICIALES);
    setPaginaActual(1);
  }, []);


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


  const handleNoAclaracionChange = useCallback((aclaracion, nuevoValor) => {
    // Actualizar UI inmediatamente
    setAclaraciones(prev => prev.map(c =>
      c.ID === aclaracion.ID
        ? { ...c, NoAclaracion: nuevoValor, Estatus_Secundario: 'aclaracion_levantada' }
        : c
    ));


    const nuevoEstatus = 'aclaracion_levantada';
    actualizarAclaracionAPI(aclaracion.ID, {
      noAclaracion: nuevoValor,
      FechaDictamen: fechaDictamen,
      estatusSecundario: nuevoEstatus
    });
  }, [actualizarAclaracionAPI, fechaDictamen]);


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

  // ✅ Aplicar dictamen al hacer blur (desenfoque) en el monto, para evitar múltiples llamadas mientras se escribe
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
            <div className="card-header py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="rowsSelect" className="input-group-text mb-0 mr-2">Registros por página:</label>
                <select
                  id="rowsSelect"
                  className="form-select form-select-sm custom-select"
                  style={{ width: 'auto' }}
                  value={registrosPorPagina}
                  onChange={handleRegistrosPorPaginaChange}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <h6 className="m-0 font-weight-bold text-primary ml-3" style={{ flex: 'auto' }}>
              Aclaraciones que aplican según los parámetros seleccionados - (
              <span className="text-sm">{new Intl.NumberFormat("es-MX").format(aclaracionesFiltrados.length)}</span>)
            </h6>

            <input
              type="file"
              accept=".csv"
              id="fileInput"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <input
              type="file"
              accept=".json"
              id="fileInputJSON"
              onChange={handleFileJSON}
              style={{ display: 'none' }}
            />

            {canEdit() && (
              <>
                <div className='mr-1 pr-1'>
                  <Button className='btn btn-sm btn-primary' size="sm" onClick={() => document.getElementById('fileInput').click()}>
                    <ExternalLink size={16} className="me-1" />
                    Cargar Folios
                  </Button>
                </div>
                <div className='mr-3 pr-3'>
                  <Button className='btn btn-sm btn-success' size="sm" onClick={handleCargarJSON}>
                    <ExternalLink size={16} className="me-1" />
                    Conciliar JSON
                  </Button>
                </div>
              </>
            )}
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

              <div className="col-md-2 pr-2 input-group-text mb-0 text-truncate mr-2 pr-2" style={{width:'11rem', maxWidth:'15rem'}}>
                <label className='form-label' htmlFor='inCaseta'>Caseta:</label>
                <select
                  className='mx-3 p-2'
                  id='inCaseta'
                  name="Caseta"
                  onChange={(e) => handleFiltroChange('caseta', e.target.value)}
                  value={filtros.caseta}
                >
                  <option value="">Todas</option>
                  {[...new Set(aclaraciones.map(c => c.Caseta))].map(caseta => (
                    <option key={caseta} value={caseta}>{caseta}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2 pr-2 input-group-text mb-0 text-truncate mr-2 pr-1" style={{width:'11rem', maxWidth:'13rem'}}>
                <label className='form-label' htmlFor='inEstatus'>Estatus:</label>
                <select
                  className='mx-3 p-2'
                  id='inEstatus'
                  name="Estatus"
                  onChange={(e) => handleFiltroChange('estatus', e.target.value)}
                  value={filtros.estatus}
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente_aclaracion">Pendientes</option>
                  <option value="aclaracion_levantada">En proceso</option>
                  <option value="Aprobado">Aprobados</option>
                  <option value="Rechazado">Rechazados</option>
                </select>
              </div>

              <div className="form-floating pr-2">
                <input
                  className="form-control form-control-sm text-truncate"
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
                    const estatusInfo = getEstatusInfo(aclaracion.Estatus_Secundario === 'dictaminado' && Number(aclaracion.montoDictaminado) === 0 ? 'rechazado' : aclaracion.Estatus_Secundario);
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
                          <span className={`bg-danger-subtle fw-semibold ${aclaracion?.diferencia > 0 ? 'text-success' :
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
                            disabled={!canEdit() || aclaracion.Estatus_Secundario === "dictaminado" || !!aclaracion.Aplicado}
                            onChange={(e) => handleNoAclaracionChange(aclaracion, e.target.value)}
                          />
                        </td>
                        <td>
                          <span className='text-secondary'>$</span>
                          <input
                            type='number'
                            id={`inputMontoDictaminado-${aclaracion.ID}`}
                            disabled={!canEdit() || aclaracion.Estatus_Secundario === "dictaminado" || !aclaracion.NoAclaracion || !!aclaracion.Aplicado}
                            style={{ fontWeight: 'normal', width: '5rem', padding: 0 }}
                            className={`pl-2 form-control-sm d-inline-flex align-items-center ${estatusInfo.color}`}
                            value={aclaracion?.montoDictaminado || 0}
                            onChange={(e) => handleMontoDictaminadoChange(aclaracion, parseFloat(e.target.value))}
                            onBlur={() => handleMontoBlur(aclaracion)}
                          />
                          <span className='text-secondary ml-1'>MXN</span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {canEdit() && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                title="Gestionar aclaración"
                                onClick={() => abrirModal(aclaracion)}
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
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
                <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                  <span className="text-muted small">
                    Mostrando {aclaracionesFiltrados.length > 0 ? indiceInicio + 1 : 0} - {Math.min(indiceFin, aclaracionesFiltrados.length)} de {aclaracionesFiltrados.length} registros
                  </span>
                  <span className="text-muted small">
                    Página {totalPaginas > 0 ? paginaActual : 0} de {totalPaginas}
                  </span>
                </div>

                <ul className="pagination pagination-sm justify-content-center d-flex flex-wrap" style={{ overflow: 'auto', }}>
                  <li className={`flex-wrap page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => cambiarPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                    >
                      Anterior
                    </button>
                  </li>

                  {obtenerNumerosPagina().map((numero, index) => (
                    numero === '...' ? (
                      <li key={`ellipsis-${index}`} className="flex-wrap page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    ) : (
                      <li key={`page-${numero}`} className={`flex-wrap page-item ${paginaActual === numero ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => cambiarPagina(numero)}
                        >
                          {numero}
                        </button>
                      </li>
                    )
                  ))}

                  <li className={`flex-wrap page-item ${paginaActual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => cambiarPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas || totalPaginas === 0}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
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
              (<span className={`ml-1 font-weight-bolder text-uppercase py-2 ${aclaracionSeleccionado?.Estatus_Secundario === 'dictaminado' ? 'text-info' :
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

      {/* Modal de Progreso de Carga Masiva */}
      <Modal show={progreso !== null} onHide={() => { if (progreso === 100 || progressDetails.message?.includes('Error')) setProgreso(null) }} backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>{progressDetails.message?.includes('Error') ? 'Error en Importación' : (progreso === 100 ? 'Importación Completada' : 'Importando Folios')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <h5 className="text-secondary">{progressDetails.message || 'Iniciando...'}</h5>
            <h2 className={`font-weight-bold ${progressDetails.message?.includes('Error') ? 'text-danger' : 'text-primary'}`}>{Math.round(progreso || 0)}%</h2>
          </div>
          <ProgressBar
            animated={progreso < 100 && !progressDetails.message?.includes('Error')}
            now={progreso || 0}
            variant={progressDetails.message?.includes('Error') ? 'danger' : 'success'}
          />

          <div className="mt-3 small border rounded p-3 bg-light">
            <div className="d-flex justify-content-between mb-1">
              <span>Total registros:</span>
              <strong>{progressDetails.total || 0}</strong>
            </div>
            <div className="d-flex justify-content-between mb-1 text-success">
              <span>Actualizados/Insertados:</span>
              <strong>{progressDetails.inserted || 0}</strong>
            </div>
            <div className="d-flex justify-content-between mb-1 text-warning">
              <span>Omitidos:</span>
              <strong>{progressDetails.skipped || 0}</strong>
            </div>
          </div>

          {/* Mostrar detalles de omisiones si terminó */}
          {progressDetails.omitidos && (
            <div className="mt-2 alert alert-warning small py-2">
              <strong>Detalle de omisiones:</strong>
              <ul className="mb-0 pl-3">
                <li>Datos incompletos/vacíos: {progressDetails.omitidos.incompletos || 0}</li>
                <li>Duplicados (ya existen): {progressDetails.omitidos.duplicados || 0}</li>
              </ul>
            </div>
          )}

        </Modal.Body>
        <Modal.Footer>
          {(progreso === 100 || progressDetails.message?.includes('Error')) && (
            <Button variant="secondary" onClick={() => setProgreso(null)}>
              Cerrar
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AclaracionesTable;