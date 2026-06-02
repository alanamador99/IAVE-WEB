// src/components/CrucesTable.js
import Papa from 'papaparse';
import React, { useEffect, useState, useRef, useCallback, use, } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useSearchParams } from "react-router-dom";
import { ModalHandleEditarCruce } from '../shared/utils';
import { FunnelX, Grid2X2Check } from 'lucide-react';


const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];


const bases = ["Base Monterrey", "Base Cd. Sahagún", "Administrativos"];




const API_URL = process.env.REACT_APP_API_URL;








function CrucesTable() {
  const checkboxes = useRef();
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = searchParams.get("y");
  const monthParam = searchParams.get("m");
  const [selectedCruces, setSelectedCruces] = useState([]);
  const [progreso, setProgreso] = useState(null); // % de carga (0-100)
  const [sortColumn, setSortColumn] = useState(null); //Columna mandante para el ordenamiento
  const [sortDirection, setSortDirection] = useState('asc'); // Tipo de ordenamiento
  const [cruces, setCruces] = useState([]); // Se almacenan los cruces que están aplicados además del filtro
  const [years, setYears] = useState([]); // Se almacenan los años disponibles
  const [selectedYear, setSelectedYear] = useState(null); // Se almacena el año seleccionado
  const [filtered, setFiltered] = useState([]); //Cruces filtrados
  const [filtros, setFiltros] = useState({ fecha: '', mat_OP: '', tagID: '', Caseta: '', vOT: '', Estatus: '' }); //Se almacena el valor de los filtros. Pueden ser Fecha, no. economico y nombre de la caseta
  const [vCaseta, setvCaseta] = useState(''); //Para limpiar el valor del textbox de la Caseta
  const [vOT, setvOT] = useState(''); //Para limpiar el valor del textbox de la Caseta
  const [vFecha, setvFecha] = useState(''); //Para limpiar el valor del textbox de la fecha
  const [vtagID, setvtagID] = useState(''); //Para limpiar el valor del textbox de la fecha
  const [vEstatus, setvEstatus] = useState(''); //Para limpiar el valor del textbox del Estatus
  const [vmat_OP, setvmat_OP] = useState(''); //Para limpiar el valor del textbox del No.Economico
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [baseSeleccionada, setBaseSeleccionada] = useState(null);
  const [progressDetails, setProgressDetails] = useState({
    total: 0,
    processed: 0,
    inserted: 0,
    skipped: 0,
    remaining: 0,
    message: ''
  });
  const [eventSource, setEventSource] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cruceSeleccionado, setCruceSeleccionado] = useState(null);

  const [paginaActual, setPaginaActual] = useState(1); //P2ágina actual, obviamente inicia en la primer página
  const [registrosPorPagina, setRegistrosPorPagina] = useState(250); //Filas por página.




  useEffect(() => {
    try {
      console.log("Parámetros recibidos en CrucesTable:", { yearParam, monthParam });
      axios.get(`${API_URL}/api/cruces`)
        .then(res => {
          setCruces(res.data);
          setFiltered(res.data);
        })
        .catch(err => console.error('Error al cargar cruces:', err));
      axios.get(`${API_URL}/api/cruces/years`)
        .then(res => {
          setYears(res.data);
        })
        .catch(err => console.error('Error al cargar años:', err));
    } catch (error) {
      console.log("Error al cargar los cruces:", error)
    }
    finally {
      setLoading(false);
      console.log("Mes seleccionado en los parametros de router:", monthParam);
      console.log("Año seleccionado en los parametros de router:", yearParam);
    }

  }, []);
  // Limpiar conexión SSE cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const handleMostrarDialogoEdicionCruce = (cruce) => {
    setCruceSeleccionado(cruce);
    setShowModal(true);
  };
  useEffect(() => {
    const filtrado = cruces.filter(c => {
      const fechaCruce = dayjs(c.Fecha);
      const mesCruce = fechaCruce.month(); // 0 = Enero, 11 = Diciembre
      const yearCruce = fechaCruce.year();
      const matchMes = mesSeleccionado === null || mesCruce === mesSeleccionado;
      const matchBase = baseSeleccionada === null || c.Base?.toLowerCase().includes(baseSeleccionada.toLowerCase());
      const matchYear = selectedYear === null || yearCruce === selectedYear?.AÑO;

      const matchmat_OP = filtros.mat_OP === '' || c["No_Economico"]?.toLowerCase().includes(filtros.mat_OP.toLowerCase());
      const matchtagID = filtros.tagID === '' || c.Tag?.toLowerCase().includes(filtros.tagID?.toLowerCase());
      const matchOT = filtros.vOT === '' || c.id_orden?.toLowerCase().includes(filtros.vOT?.toLowerCase());
      const matchCaseta = filtros.Caseta === '' || c.Caseta?.toLowerCase().includes(filtros.Caseta.toLowerCase());
      const matchEstatus = filtros.Estatus === '' || c.Estatus?.toLowerCase().includes(filtros.Estatus.toLowerCase());
      const matchFecha = filtros.fecha === '' || dayjs(c.Fecha).format('YYYY-MM-DD') === filtros.fecha;


      return matchFecha && matchmat_OP && matchtagID && matchOT && matchCaseta && matchEstatus && matchMes && matchBase && matchYear;
    });
    setFiltered(filtrado);
  }, [filtros, cruces, mesSeleccionado, baseSeleccionada, selectedYear]);

  const connectToProgressStream = () => {
    const es = new EventSource(`${API_URL}/api/cruces/progress`);

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
              message: data.message
            });

            // Mostrar resultado final
            setTimeout(() => {
              alert(
                `✅ Importación completada:\n` +
                `📊 Total procesados: ${data.total} registros\n` +
                `✔️ Insertados: ${data.inserted}\n` +
                `❌ Omitidos: ${data.skipped} (${data.omitidos?.incompletos || 0} incompletos, ` +
                `${data.omitidos?.fechaInvalida || 0} con fecha inválida, ` +
                `${data.omitidos?.duplicado || 0} duplicados)`
              );

              // Recargar datos
              axios.get(`${API_URL}/api/cruces`)
                .then(res => {
                  setCruces(res.data);
                  setFiltered(res.data);
                })
                .catch(err => console.error('Error al recargar cruces:', err));
            }, 1000);

            // Limpiar después de 3 segundos
            setTimeout(() => {
              setProgreso(null);
              setProgressDetails({ total: 0, processed: 0, inserted: 0, skipped: 0, message: '' });
            }, 3000);
            break;

          case 'error':
            console.error('❌ Error en el stream:', data);
            alert(`❌ Error durante la importación: ${data.message}`);
            setProgreso(null);
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


  const handleChange = e => {
    const { name, value } = e.target;
    if (selectedCruces.length !== 0) {
      setSelectedCruces([]);
    }
    switch (name) {
      case 'fecha':
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          if (value) {
            newParams.set("m", dayjs(value).month() + 1);
            newParams.set("y", dayjs(value).year());
          } else {
            newParams.delete("m");
            newParams.delete("y");
          }
          return newParams;
        });
        setvFecha(e.target.value);
        break;
      case 'mat_OP':
        setvmat_OP(e.target.value);
        break;
      case 'tagID':
        setvtagID(e.target.value);
        break;
      case 'vOT':
        setvOT(e.target.value);
        break;
      case 'Caseta':
        setvCaseta(e.target.value);
        break;
      case 'Estatus':
        setvEstatus(e.target.value);
        break;
      default:
        break;
    }
    setFiltros(prev => ({ ...prev, [name]: value }));
  };
  const resetFiltros = () => {
    setFiltros(() => ({ fecha: '', mat_OP: '', vOT: '', tagID: '', Caseta: '', Estatus: '', mes: dayjs().month() }));
    setvCaseta('');
    setvEstatus('');
    setvmat_OP('');
    setvtagID('');
    setvOT('');
    setvFecha('');
  }
  const ordenarPor = (columna) => {
    if (sortColumn === columna) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columna);
      setSortDirection('asc');
    }
  };


  let sorted = [...filtered];

  if (sortColumn) {
    sorted.sort((a, b) => {
      const aVal = a[sortColumn] || '';
      const bVal = b[sortColumn] || '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }



  // ✅ Calcular datos de paginación
  const totalPaginas = Math.ceil(sorted.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const paginaDatos = sorted.slice(indiceInicio, indiceFin);

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


  const handleRegistrosPorPaginaChange = (e) => {
    setRegistrosPorPagina(Number(e.target.value));
    setPaginaActual(1);
  };
  const handleCheckboxChange = (id) => {
    setSelectedCruces(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
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
          setProgreso(Math.min(5, (results.meta.cursor / file.size) * 5));
        }
      },

      complete: async () => {
        try {
          console.log(`✅ Parsing completado. Enviando ${resultados.length} registros al servidor...`);

          // Enviar datos al backend (el progreso real vendrá por SSE)
          const response = await axios.post(
            `${API_URL}/api/cruces/importar`,
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

  const cambiarEstatus = async (idCruce, nuevoEstatus) => {
    try {
      const response = await axios.patch(`${API_URL}/api/cruces/${idCruce}/estatus`, { estatus: nuevoEstatus, });

      if (response.status === 200) {
        setCruces(prevCruces =>
          prevCruces.map(cruce =>
            cruce.ID === idCruce ? { ...cruce, Estatus: nuevoEstatus } : cruce
          )
        );
      } else {
        console.error('No se pudo actualizar el estatus');
      }
    } catch (error) {
      console.error('Error al cambiar el estatus:', error);
    }
  };


  const setOTtoanID = async (idCruce, vOT) => {
    try {
      const response = await axios.patch(`${API_URL}/api/cruces/${idCruce}/setOT`, {
        vOT: vOT,
      });

      if (response.status === 200) {
        setCruces(prevCruces =>
          prevCruces.map(cruce =>
            cruce.ID === idCruce ? { ...cruce, vOT: vOT } : cruce
          )
        );
      } else {
        console.error('No se pudo actualizar el estatus');
      }
    } catch (error) {
      console.error('Error al cambiar el estatus:', error);
    }
  };
  const triggerClick = () => {
    checkboxes.current.click();
  };



  const CheckStatus = async (Operador, IDCruce, Fecha) => {
    if (!IDCruce) {
      alert(`❌ Error: Cruce inválido. ID recibido: ${IDCruce}`);
      return;
    }

    try {
      const { data } = await axios.get(`${API_URL}/api/cruces/statusPersonal/${IDCruce}`);

      if (!data || data.length === 0) {
        alert(`ℹ️ No se encontró información del operador ${Operador} para el cruce ${IDCruce}.`);
        return;
      }
      if (data.status === 500) {
        alert(`🚧🚧 No se encontró información del operador ${Operador} para el cruce ${IDCruce}. 🚧🚧`);
        return;
      }

      let fechaTemp = new Date(Fecha);
      let fechaTemp1 = new Date(Fecha);
      fechaTemp.setDate(fechaTemp.getDate() + 1); // Aumenta un día
      const FechaLimite = fechaTemp.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      fechaTemp1.setDate(fechaTemp1.getDate() - 1); // Aumenta un día
      const FechaLimite1 = fechaTemp1.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      const statusAlterno = (data[0]?.EstatusConcatenado) ? data[0].EstatusConcatenado : data[0].Descripcion;
      const mensajeAdicionalAlterno = (data[0]?.Encabezado === 'Alterno') ?
        `⚠️ No se cuenta con situación personal del OP \nsobre la fecha ${Fecha.split("-")[2].split("T")[0]}/${Fecha.split("-")[1]}/${Fecha.split("-")[0]}\nSe amplió el rango de fechas a un día menos y un día más (${FechaLimite1.split("-")[2].split("T")[0]}/${FechaLimite1.split("-")[1]}/${FechaLimite1.split("-")[0]} - ${FechaLimite.split("-")[2].split("T")[0]}/${FechaLimite.split("-")[1]}/${FechaLimite.split("-")[0]})\n` : '';
      const confirmar = window.confirm(
        `👤 Operador: ${Operador}\n🛣️ Cruce ID: ${IDCruce}\n${mensajeAdicionalAlterno}📋 Status: ${statusAlterno}\n\n¿Deseas confirmar este abuso?`
      );

      if (confirmar) {
        await cambiarEstatus(IDCruce, 'Abuso');
        console.log("⚠️ Abuso confirmado por el usuario");
      }

    } catch (error) {
      if (error.response && error.response.status === 404) {
        alert(`🚧🚧  ${JSON.stringify(error.response.data.mensaje).replace("T00:00:00.000Z", "").replaceAll('"', '')}.🚧🚧 `);
        return;
      }
      if (error.response && error.response.status === 400) {
        alert(`ℹ️ No se encontró información del operador ${Operador} para el cruce ${IDCruce}.`);
        return;
      }
      if (error.response && error.response.status === 403) {
        alert(`ℹ️ No tienes permiso para consultar el estado del operador ${Operador} para el cruce ${IDCruce}.`);
        return;
      }
      if (error.response && error.response.status === 401) {
        alert(`ℹ️ No estás autorizado para consultar el estado del operador ${Operador} para el cruce ${IDCruce}.`);
        return;
      }
      if (error.response && error.response.status === 500) {
        alert(`No se encontró información del operador ${Operador} para el cruce ${IDCruce}. 🚧🚧`);
        return;
      }
      console.error("❌ Error al consultar estatus del operador:", error);
      alert(`Error al consultar el estado del operador para el cruce ${IDCruce}.`);
    }
  };




  const actualizarOTMasivo = async (e) => {
    e.preventDefault();
    console.log("Cruces seleccionados para reasignar OT:", selectedCruces.length);

    try {
      const response = await axios.patch(`${API_URL}/api/cruces/conciliacionMasiva`, {
        ids: selectedCruces
      });
      
      setProgreso(100);
      const data = await response.data;
      alert(data.message || 'Asignación completada');

      // Limpia selección y recarga tabla si es necesario
      setSelectedCruces([]);
      setFiltered(cruces);
    } catch (error) {
      console.error("Error al asignar OT", error);
    }
  };

  const asignarStatusMasivo = async (status) => {
    if (selectedCruces.length === 0) {
      alert("❌ No hay cruces seleccionados para cambiar el estatus.");
      return;
    }
    if (!window.confirm(`¿Estás seguro de que deseas cambiar el estatus de ${selectedCruces.length} cruces a "${status}"?`)) {
      return;
    }
    // Llamar a la función cambiarEstatus para cada ID seleccionado
    try {
      await axios.patch(`${API_URL}/api/cruces/masivo-estatus`, {
        ids: selectedCruces.map(id => id),
        nuevoEstatus: status
      });
      // Actualizar la lista de cruces después de cambiar el estatus
      setFiltered(prevFiltered =>
        prevFiltered.map(cruce =>
          selectedCruces.includes(cruce.ID) ? { ...cruce, Estatus: status } : cruce
        )
      );
      setSelectedCruces([]); // Limpiar selección después de la acción masiva
    } catch (error) {
      console.error(`Error al cambiar el estatus de los cruces ${selectedCruces}:`, error);
      alert("❌ Error al cambiar el estatus de los cruces seleccionados.");
    }





  };
  const handleSelectAllVisible = () => {
    const visibleIds = sorted.slice((paginaActual - 1) * registrosPorPagina, paginaActual * registrosPorPagina).map(c => c.ID); // sólo los de la página actual
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
    const visibleIds = sorted.slice((paginaActual - 1) * registrosPorPagina, paginaActual * registrosPorPagina).map(c => c.ID);
    return visibleIds.every(id => selectedCruces.includes(id));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "5vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
          <span className="visually-hidden">.</span>
        </div>
      </div>
    );
  }
  return (
    <div className='wrapper' style={{ display: "flex", flexDirection: "column", flex: "1 1 auto" }}>
      {/* Barra de progreso detallada */}
      {(progreso !== null) && (
        <div className="mt-2 mb-3" style={{}}>
          {/* Barra principal */}
          <div className="progress" style={{ height: "25px" }}>
            <div
              className={`progress-bar progress-bar-striped progress-bar-animated 
                ${progreso < 30 ? 'bg-info' :
                  progreso < 70 ? 'bg-warning' :
                    progreso === 100 ? 'bg-success' : 'bg-primary'
                } text-dark font-weight-bold`}
              role="progressbar"
              style={{ width: `${progreso}%` }}
            >
              <span style={{
                position: 'absolute',
                textAlign: 'center',
                lineHeight: '25px',
                color: progreso > 50 ? '#000' : '#fff',
                fontWeight: 'bold',
                justifySelf: 'anchor-center'
              }}>
                {progreso?.toFixed(1)}% - {progressDetails.message || 'Procesando...'}
              </span>
            </div>
          </div>

          {/* Detalles del progreso */}
          {(progressDetails.total > 0) && (
            <div className="mt-2 row text-center" style={{ fontSize: '0.9rem', justifyContent: 'space-around ' }}>
              <div className="col-md-2">
                <span className="badge badge-info">
                  📊 Total: {progressDetails.total?.toLocaleString()}
                </span>
              </div>
              <div className="col-md-2">
                <span className="badge badge-primary">
                  ⚙️ Procesados: {progressDetails.processed?.toLocaleString()}
                </span>
              </div>
              <div className="col-md-2">
                <span className="badge badge-success">
                  ✅ Insertados: {progressDetails.inserted?.toLocaleString()}
                </span>
              </div>
              <div className="col-md-2">
                <span className="badge badge-warning">
                  ⏭️ Omitidos: {progressDetails.skipped?.toLocaleString()}
                </span>
              </div>
              <div className="col-md-2">
                <span className="badge badge-danger">
                  🚫 Restantes: {progressDetails.remaining?.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="card shadow">
        <div className="card-header py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="rowsSelect" className="input-group-text mb-0 mr-2">Registros por página:</label>
            <select
              id="rowsSelect"
              className="form-select form-select-sm custom-select"
              value={registrosPorPagina}
              onChange={(e) => setRegistrosPorPagina(parseInt(e.target.value))}
              style={{ width: 'auto' }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>

          <h6 className="m-0 font-weight-bold text-primary ml-3" style={{ flex: 'auto', }}>Cruces que aplican según los parametros seleccionados  - (<span className="text sm">{new Intl.NumberFormat("es-MX").format(sorted.length)}</span>)

          </h6>
          {selectedCruces.length > 0 && (
            <button
              className="btn-primary text-white px-4 py-1 rounded mr-4"
              onClick={actualizarOTMasivo}
            >
              Reasignar OT a {selectedCruces.length} cruces
            </button>
          )}






          <div className="d-flex gap-2">
            <input
              type="file"
              accept=".csv"
              id="fileInput"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />


            <button className="btn btn-success btn-sm pl-2" onClick={() => document.getElementById('fileInput').click()}>
              Cargar cruces
            </button>
            <span className='pl-2'></span>
            <button className="btn btn-outline-primary btn-sm" onClick={() => exportarCSV(filtered)}>
              Exportar tabla
            </button>
          </div>
        </div>

        <div className="card-body ">


          {/* Este DIV unicamente se muestra cuando se seleccionan cruces */}
          <div className=" justify-content-around float-right border border-secondary rounded p-1 py-0" style={{ display: (selectedCruces.length > 0) ? 'flex' : 'none', }}>
            <div className='col-4 border border-secondary rounded p-1 mr-2 word-wrap'>
              {/* Fila para acomodar las columnas del recuento de los cruces seleccionados */}
              <div className='row px-0' >

                {/* Columna del recuento de los cruces seleccionados (El número de cruces seleccionados) */}
                <div className='col-7 justify-content-end'>
                  <span className="text-info  font-weight-bold" style={{ fontSize: '1.6rem', lineHeight: '1.2rem' }}>{selectedCruces.length}</span>
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
            <div className='col p-1 px-0 '>
              <div className='d-flex align-items-center row text-center' style={{ fontSize: '1.2rem', justifyContent: 'center', lineHeight: '1.4rem' }}>
                <span className="text-muted text-center">Acciones masivas:</span>
              </div>
              <div className='d-flex align-items-center gap-1 row' style={{ justifyContent: 'center', }}>
                <button className="btn btn-md btn-success ml-1 align-top" data-placement="top" title="Marcar TODOS como Confirmados" onClick={() => asignarStatusMasivo('Confirmado')}>
                  ✔
                </button>
                <button className="btn btn-md btn-warning me-1 align-middle ml-1" data-placement="top" title="Marcar TODOS como Aclaración" onClick={() => asignarStatusMasivo('Aclaración')}>
                  ⚠
                </button>
                <button className="btn btn-md btn-danger align-middle ml-1" data-toggle="tooltip" data-placement="top" title="Marcar TODOS como Abuso" onClick={() => asignarStatusMasivo('Abuso')}>
                  🚫
                </button>
                <button className="btn btn-md btn-info me-1 align-middle ml-1" data-toggle="tooltip" data-placement="top" title="Marcar TODOS como Sesgos" onClick={() => asignarStatusMasivo('Error')}>
                  ℹ️
                </button>
              </div>
            </div>
          </div>


          {/* DIV para los filtros */}
          <div className="d-flex flex-wrap gap-2 mb-3">


            {/* DIV para el filtro de fecha */}
            <div className="form-floating pr-2">
              <input type="date" name="fecha"
                className="form-control form-control-sm"
                onChange={handleChange} value={vFecha} id='in_fecha' />
              <label className="form-label" htmlFor='in_fecha'>Fecha Cruce</label>

            </div>




            {/* DIV para el filtro de TAG */}
            <div className="form-floating pr-2" style={{ maxWidth: '9rem', }}>
              <input type="text" name="tagID" className="form-control form-control-sm" placeholder='TAG' onChange={handleChange} value={vtagID} id='in_TagID' />
              <label className="form-label" htmlFor='in_TagID'>TAG</label>

            </div>

            {/* DIV para el filtro de OT */}
            <div className="form-floating pr-2" style={{ maxWidth: '9rem', }}>
              <input type="text" name="vOT" className="form-control form-control-sm" placeholder='OT' onChange={handleChange} value={vOT} id='in_OT' />
              <label className="form-label" htmlFor='in_OT'>OT</label>

            </div>

            {/* DIV para el filtro de Matricula / OP (No_Economico) */}
            <div className="form-floating pr-2" style={{ maxWidth: '11.5rem', }}>
              <input type="text" name="mat_OP" className="form-control form-control-sm" placeholder='Matricula / Operador' onChange={handleChange} value={vmat_OP} id='in_Matricula_Op' />
              <label className="form-label" htmlFor='in_Matricula_Op'>Matricula / Operador</label>

            </div>


            {/* DIV para el filtro de Matricula / OP (No_Economico) */}
            <div className="form-floating pr-2" style={{ maxWidth: '9rem', }}>
              <input type="text" name="Caseta" placeholder="Caseta" className="form-control form-control-sm" onChange={handleChange} value={vCaseta} />
              <label className="form-label">Caseta</label>
            </div>



            <div className='col-md-2  pr-2 input-group-text mb-0 ' style={{ maxWidth: 'min-content', }}>
              <label htmlFor='selectEstatus' className='d-flex align-items-center'>
                <span className='text-muted'>Dictamen:</span>
                <select className='mx-3 p-2' name="Estatus" onChange={handleChange} value={vEstatus} id='selectEstatus' style={{ width: 'auto', height: '2.5rem' }}>
                  <option value="">Todos</option>
                  <option value="Abuso">🚫 Abusos</option>
                  <option value="Aclaración">⚠️ Aclaraciones</option>
                  <option value="Confirmado">✔️ Confirmados</option>
                  <option value="Error">ℹ️ Error</option>
                  <option value="CasetaNoEncontradaEnRuta">🚧 Cruce sin relación</option>
                  <option value="Se cobró menos">⭐ Cobro menor</option>
                  <option value="Pendiente">⏳ Pendientes</option>
                </select>
              </label>
            </div>


            <div className="ml-3 pr-1 pt-1 d-flex">
              <button className="btn btn-sm btn btn-outline-dark rounded-3" onClick={resetFiltros}>
                <FunnelX size={25} className="me-1" />
              </button>
            </div>

          </div>

          {/* DIV para la tabla */}
          <div className="table-responsive table-container " style={{ maxHeight: '50rem' }}>



            <div className="mb-4 d-flex flex-column">
              <h5 className="mb-2">Filtrar por Mes:</h5>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {meses.map((mes, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${mesSeleccionado === i ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setMesSeleccionado(i)}
                  >
                    {mes}
                  </button>
                ))}
                <button
                  className={`btn btn-sm ${mesSeleccionado === null ? "btn-secondary" : "btn-outline-secondary"}`}
                  onClick={() => setMesSeleccionado(null)}
                >
                  Todos
                </button>
              </div>
              <h5 className="mb-2">Filtrar por Año:</h5>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {years.map((year, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${selectedYear === year ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                  >
                    {year['AÑO']}
                  </button>
                ))}
                <button
                  className={`btn btn-sm ${selectedYear === null ? "btn-secondary" : "btn-outline-secondary"}`}
                  onClick={() => setSelectedYear(null)}
                >
                  Todos
                </button>
              </div>

              <h5 className="mb-2">Filtrar por:</h5>
              <div className="d-flex flex-wrap gap-2">
                {bases.map((base, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${baseSeleccionada === base ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setBaseSeleccionada(baseSeleccionada === base ? null : base)}
                  >
                    {base}
                  </button>
                ))}
                <button
                  className={`btn btn-sm ${baseSeleccionada === null ? "btn-secondary" : "btn-outline-secondary"}`}
                  onClick={() => setBaseSeleccionada(null)}
                >
                  Todo
                </button>
              </div>
            </div>


            <table className="table table-bordered table-scroll table-sm table-hover align-middle" width="100%" cellSpacing="0">
              <thead>
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
                  <th className='px-0' style={{ textAlign: 'center' }}>IDx </th>
                  <th onClick={() => ordenarPor('Tag')} style={{ cursor: 'pointer' }}>Tag {sortColumn === 'Tag' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => ordenarPor('No_Economico')} style={{ cursor: 'pointer' }}>No. Económico {sortColumn === 'No_Economico' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => ordenarPor('Fecha')} style={{ cursor: 'pointer' }}>Fecha {sortColumn === 'Fecha' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => ordenarPor('Caseta')} style={{ cursor: 'pointer' }}>Caseta {sortColumn === 'Caseta' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => ordenarPor('Carril')} style={{ cursor: 'pointer' }}>Carril {sortColumn === 'Carril' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => ordenarPor('Clase')} style={{ cursor: 'pointer' }}>Clase {sortColumn === 'Clase' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => ordenarPor('Importe')} style={{ cursor: 'pointer' }}>Importe {sortColumn === 'Importe' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => ordenarPor('ImporteOficial')} style={{ cursor: 'pointer' }}>Tarifa TUSA {sortColumn === 'ImporteOficial' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => ordenarPor('id_orden')} style={{ cursor: 'pointer' }}> OT {sortColumn === 'id_orden' && (sortDirection === 'asc' ? '↑' : '↓')}</th>


                  <th onClick={() => ordenarPor('FechaAplicacion')} style={{ cursor: 'pointer' }}> Aplicado el  {sortColumn === 'FechaAplicacion' && (sortDirection === 'asc' ? '↑' : '↓')}</th>



                  <th onClick={() => ordenarPor('Estatus')} style={{ cursor: 'pointer', lineHeight: '.8rem', fontSize: '.9rem' }}>Dictamen <br />del cruce {sortColumn === 'Estatus' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th >Acciones </th>

                </tr>
              </thead>
              <tbody>
                {paginaDatos.map((cruce, i) => (
                  <tr key={i} className={'py-0 align-middle ' + ((cruce.Estatus === 'Confirmado') ? 'font-weight-bolder text-success' : (cruce.Estatus === 'Abuso') ? 'font-weight-bolder text-danger' : (cruce.Estatus === 'Aclaración') ? 'font-weight-bolder text-warning' : (cruce.Estatus === 'Error') ? 'font-weight-bolder text-info' : 'font-weight-bolder text-dark')}>
                    <td className='py-1 align-middle '> <input
                      type="checkbox" tabIndex={i + 2}
                      checked={selectedCruces.includes(cruce.ID)}
                      onChange={() => handleCheckboxChange(cruce.ID)}
                    /></td>
                    <td onDoubleClick={() => {setCruceSeleccionado(cruce); setShowModal(true);console.log("CruceSeleccionado:", cruce)}} className='px-0 py-1 align-middle ' style={{ textAlign: 'center' }}>{((paginaActual - 1) * registrosPorPagina) + i + 1}</td>
                    <td className='py-1 align-middle '>{cruce.Tag}</td>
                    <td className='py-1 align-middle '>{cruce["No_Economico"]}</td>

                    <td className='py-1 align-middle '>

                      <span className='fw-bold'>{new Date(cruce.Fecha).toLocaleDateString("es-MX")}</span>
                      <br />
                      <span style={{ fontSize: '.75rem', fontWeight: 'lighter', }}>{new Date(cruce.Fecha).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </td>

                    <td className='p-0 py-1 align-middle text-center '>{cruce.Caseta}</td>
                    <td className='p-0 py-1 align-middle text-center '>{cruce.Carril}</td>
                    <td className='p-0 py-1 text-center align-middle '>{cruce.Clase}</td>
                    <td className='p-0 py-1 text-center align-middle '>

                      <span className='fw-bold' title={(cruce.Estatus === 'Se cobró menos') ? `Se cobraron $${parseFloat(cruce.ImporteOficial - cruce.Importe).toFixed(2)} menos ` : ''}>${parseFloat(cruce.Importe).toFixed(2)} {(cruce.Estatus === 'Se cobró menos') && '⭐'}</span>

                    </td>
                    <td className='p-0 py-1 text-center align-middle '>
                      <span className={`text-info fw-bold text-center`} >${parseFloat(cruce.ImporteOficial).toFixed(2)}</span> <span className='float-end' title='Tarifa confirmada.'> {(cruce.ImporteOficial === cruce.Importe ? '⭐' : '')}</span>
                    </td>



                    <td className='p-0 py-1 text-center align-middle'><span onClick={() => CheckStatus(cruce["No_Economico"], cruce.ID, cruce.Fecha)} style={{
                      cursor: 'pointer',
                      color: (!cruce.id_orden) ? 'red' : '',
                      textDecoration: (!cruce.id_orden) ? 'underline' : 'none',
                      backgroundColor: (!cruce.id_orden) ? '#f8d7da' : '#d4edda',
                      padding: '0.2rem 0.5rem',
                      fontSize: (!cruce.id_orden) ? '0.7rem' : '',
                    }}>{(cruce.id_orden) || "Validar asistencia"}</span></td>





                    <td className='p-0 py-1 align-middle text-center '>{new Date(cruce.FechaAplicacion).toLocaleDateString()}</td>
                    <td className='p-0 py-1 align-middle text-center '>{cruce.Estatus || "Pendiente"}</td>
                    <td className='p-0 text-center py-1 align-middle '>
                      <button className="btn btn-sm btn-success ml-1 align-top" data-placement="top" title="Cruce OK" onClick={() => cambiarEstatus(cruce.ID, 'Confirmado')}>
                        ✔
                      </button>
                      <button className="btn btn-sm btn-warning me-1 align-middle ml-1" data-placement="top" title="Se solicitará aclaración" onClick={() => cambiarEstatus(cruce.ID, 'Aclaración')}>
                        ⚠
                      </button>
                      <button className="btn btn-sm btn-danger align-middle ml-1" data-toggle="tooltip" data-placement="top" title="Marcar como abuso" onClick={() => cambiarEstatus(cruce.ID, 'Abuso')}>
                        🚫
                      </button>
                      <button className="btn btn-sm btn-info me-1 align-middle ml-1" data-toggle="tooltip" data-placement="top" title="Diferencia por registros" onClick={() => cambiarEstatus(cruce.ID, 'Error')}>
                        ℹ️
                      </button>
                    </td>
                  </tr>
                ))}
                {paginaDatos.length === 0 && (
                  <tr><td colSpan="14" className="text-center">
                    No existen registros.
                  </td></tr>

                )}
              </tbody>
            </table>

          </div>
          {/* Paginación */}
          <div className='assignMe'>
            <nav className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                <span className="text-muted small">
                  Mostrando {paginaDatos.length > 0 ? indiceInicio + 1 : 0} - {Math.min(indiceFin, paginaDatos.length)} de {sorted.length} registros
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
      {showModal && cruceSeleccionado && <ModalHandleEditarCruce isOpen={showModal} onClose={() => setShowModal(false)} cruceSeleccionado={cruceSeleccionado} onConfirm={(DatosAGuardar)=>{
        axios.patch(`${API_URL}/api/cruces/${cruceSeleccionado.ID}/editar`, DatosAGuardar).then(response=>{
          if(response.status === 200){
            setCruces(prevCruces => prevCruces.map(cruce => cruce.ID === cruceSeleccionado.ID ? {...cruce, ...DatosAGuardar} : cruce));
            alert("Cruce actualizado correctamente");
          } else {
            alert("Error al actualizar el cruce");
          }
        }).catch(error=>{
          console.error("Error al actualizar el cruce:", error);
          alert("Error al actualizar el cruce");
        });
      }}/>}
    </div >
  );
}

function exportarCSV(data) {
  const headers = ['Tag', 'No_Economico', 'Fecha', 'Caseta', 'Importe', 'Carril', 'Clase', 'ImporteOficial', 'OT', 'FechaAplicacion', 'Estatus'];
  const rows = data.map(item => [
    item.Tag,
    item["No_Economico"],
    new Date(item.Fecha).toLocaleDateString(),
    item.Caseta,
    item.Importe,
    item.Carril,
    item.Clase,
    item.ImporteOficial,
    item.id_orden || '',
    new Date(item.FechaAplicacion).toLocaleDateString(),
    item.Estatus,
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `reporte IAVE, cruces ${Date.now()}.csv`;
  link.click();
}

export default CrucesTable;




