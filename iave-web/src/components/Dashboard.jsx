import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { DollarSign, Users, TrendingUp, AlertCircle, Calendar, FunnelX } from 'lucide-react';
import { formatearFecha } from '../components/shared/utils';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const API_URL = process.env.REACT_APP_API_URL;
const Dashboard = () => {
  const [filters, setFilters] = useState({ fechaInicio: '', fechaFin: '', vOT: '', mat_OP: '', vCaseta: '', Estatus: '', rutaSeleccionada: '' });
  const { fechaInicio: vFechaInicio, fechaFin: vFechaFin, vOT, mat_OP: vmat_OP, vCaseta, Estatus: vEstatus, rutaSeleccionada } = filters;
  const [rutasData, setRutasData] = useState([]);
  const [filtradoData, setFiltradoData] = useState([]);
  const [abusosFiltrados, setAbusosFiltrados] = useState([]);
  const [condonadosFiltrados, setCondonadosFiltrados] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importeTotalCasetas, setImporteTotalCasetas] = useState(0);
  const [totalCasetasCruzadas, setTotalCasetasCruzadas] = useState(0);
  const [detalleAclaracionesAgrupadas, setDetalleAclaracionesAgrupadas] = useState(0);

  const formatCompactNumber = (number) => {
    if (number === undefined || number === null) return '0';
    return new Intl.NumberFormat('es-MX', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2
    }).format(number);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFilters((prev) => ({ ...prev, [name]: val }));
  };
  const resetFiltros = () => {
    setFilters({ fechaInicio: '', fechaFin: '', vOT: '', mat_OP: '', vCaseta: '', Estatus: '', rutaSeleccionada: '' });
  };




  useEffect(() => {
    try {
      axios.post(`${API_URL}/api/dashboard/getDashboardData/`, {
        idOrden: vOT,
        Matricula: vmat_OP,
        FechaInicio: vFechaInicio,
        FechaFin: vFechaFin,
        id_Tipo_ruta: rutaSeleccionada
      })
        .then(res => {
          setData(res.data);
        })
        .catch(err => console.error('Error al cargar cruces:', err));
      axios.get(`${API_URL}/api/dashboard/getRutasInfo/`).then(res => {
        setRutasData(res.data);
      }).catch(err => console.error('Error al cargar las rutas:', err));

    } catch (error) {
      console.log("Error al cargar los cruces:", error)
    }
    finally {
      setLoading(false);
    }

  }, []);

  const ExportarDatosaExcel = (data, nombreArchivo) => {
    import('xlsx').then(XLSX => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
      XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
    });

  };
  useEffect(() => {

    const inicio = vFechaInicio ? new Date(vFechaInicio + 'T00:00:00') : null;
    const fin = vFechaFin ? new Date(vFechaFin + 'T23:59:59') : null;
    const OT = vOT ? vOT.toLowerCase() : '';

    const casetaLower = vCaseta ? vCaseta?.toLowerCase() : '';
    const matOpLower = vmat_OP ? vmat_OP?.toLowerCase() : '';
    const shouldFilterRuta = rutaSeleccionada && rutaSeleccionada !== '';
    /*
      Estatus secundarios agrupados en:
      Culminados
      confirmado
      dictaminado
      cobro_menor
      descuento_aplicado_pendiente_acta
      acta_aplicada_pendiente_descuento
      NULL
      Condonado


      En proceso
      aclaracion_levantada
      pendiente_reporte
      pendiente_aclaracion
    */

    const gastosFiltrados = data?.gastosCrucesAgrupados?.filter(item => {
      // Comparaciones básicas primero para evitar instanciar Date si no es necesario
      // En caso de que sea "Pendiente" el valor del Estatus se iguala a  Error, ya que en la base de datos los pendientes están marcados como Error
      if (vEstatus) {
        if (vEstatus === 'Error') {
          if (item.Estatus !== 'Error' && item.Estatus !== 'Pendiente') return false;
        } else if (item.Estatus !== vEstatus) {
          return false;
        }
      }
      if (shouldFilterRuta && String(item.Id_tipo_ruta) !== String(rutaSeleccionada)) return false;
      if (casetaLower && !item.Nombre?.toLowerCase().includes(casetaLower)) return false;
      if (matOpLower && !item.No_Economico?.toLowerCase().includes(matOpLower)) return false;

      if (OT && !item.ID_orden?.toLowerCase().includes(OT)) return false;

      // Filtro por rango de fechas


      if (inicio || fin) {
        const fechaCruce = new Date(item.Fecha);
        if (inicio && fechaCruce < inicio) return false;
        if (fin && fechaCruce > fin) return false;
      }
      return true;
    });

    const total = gastosFiltrados?.reduce((sum, item) => sum + item.Importe, 0) || 0;

    const abusosFiltrados = gastosFiltrados?.filter(item => item.Estatus === 'Abuso') || [];
    //ordenamos los abusos de mayor a menor importe
    abusosFiltrados.sort((a, b) => b.Importe - a.Importe);
    setAbusosFiltrados(abusosFiltrados || []);

    const condonadosFiltrados = gastosFiltrados?.filter(item => item.Estatus_Secundario === 'Condonado') || [];
    //ordenamos los condonados de mayor a menor importe
    condonadosFiltrados.sort((a, b) => b.Importe - a.Importe);
    setCondonadosFiltrados(condonadosFiltrados || []);

    //Filtramos únicamente las aclaraciones:
    const aclaracionesFiltradas = gastosFiltrados?.filter(item => (item.Estatus === 'Aclaración' && (item.Estatus_Secundario === 'aclaracion_levantada'))) || [];

    // Datos filtrados
    setFiltradoData(gastosFiltrados || []);
    setImporteTotalCasetas(total);
    setTotalCasetasCruzadas(gastosFiltrados?.length || 0);
    setDetalleAclaracionesAgrupadas(aclaracionesFiltradas || []);

    console.log('Datos filtrados:', gastosFiltrados);
  }, [data, vFechaInicio, vFechaFin, vCaseta, vEstatus, vOT, vmat_OP, rutaSeleccionada]);

  // Configuración para Resúmenes Mensual
  const resumenMensualData = {
    labels: ['Confirmados', 'Cobro Menor', 'Aclaraciones', `Abusos`, 'Sesgos'],
    datasets: [{
      data: [filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Confirmado' ? 1 : 0), 0), filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Se cobró menos' ? 1 : 0), 0), filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Aclaración' ? 1 : 0), 0), filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Abuso' ? 1 : 0), 0), filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Sesgo' ? 1 : 0), 0)],
      backgroundColor: ['#1cc88a', '#36b9cc', '#f6c23e', '#df1313ff', '#858796'],
      borderWidth: 0,
    }]
  };

  // Configuración para Presupuesto (es lo mismo que Resúmenes Mensual pero monetizado)
  const presupuestoData = {
    labels: ['Confirmados', 'Cobro Menor', 'Aclaraciones', 'Abusos', 'Sesgos'],
    datasets: [{
      data: [filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Confirmado' ? item.Importe : 0), 0), filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Se cobró menos' ? item.Importe : 0), 0), filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Aclaración' ? item.Importe : 0), 0), filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Abuso' ? item.Importe : 0), 0), filtradoData.reduce((sum, item) => sum + (item.Estatus === 'Sesgo' ? item.Importe : 0), 0)],
      backgroundColor: ['#1cc88a', '#36b9cc', '#f6c23e', '#df1313ff', '#858796'],
      borderWidth: 0,
    }]
  };

  // Configuración para Histórico de Aclaraciones
  const aclaracionesData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Procede',
        data: [25671, 4570, 9360, 16072, 21291, 9488, 21132, 6035, 10582, 26536, 29266, 29211],
        backgroundColor: '#1cc88a',
      },
      {
        label: 'No Procede',
        data: [12, 18, 22, 15, 20, 17, 25, 28, 30, 35, 40, 45],
        backgroundColor: '#e74a3b',
      }
    ]
  };

  // Configuración para Importe por Ruta
  const importePorRutaData = {
    labels: ['Escobedo NL - Culiacán', 'Escobedo NL - Mazatlán', 'Aguascalientes', 'Escobedo NL - Texcoco', 'Escobedo NL - Culiacán'],
    datasets: [
      {
        label: 'IAVE ($)',
        data: [122.2, 99.8, 46.7, 43.8, 29.4],
        backgroundColor: '#4e73df',
      },
      {
        label: 'TUSA ($)',
        data: [132.3, 85.5, 24.1, 31.8, 29.4],
        backgroundColor: '#36b9cc',
      }
    ]
  };

  // Opciones comunes para gráficos de dona
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgb(255,255,255)',
        titleColor: '#6e707e',
        bodyColor: '#858796',
        borderColor: '#dddfeb',
        borderWidth: 1,
        padding: 15,
        displayColors: false,
        caretPadding: 10,
        callbacks: {
          label: function (context) {
            return context.label + ': $' + (context.parsed)?.toLocaleString();
          }
        }
      }
    },
    cutout: '70%',
  };

  // Opciones para gráfico de barras vertical
  const barOptionsVertical = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#858796',
          font: {
            family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgb(255,255,255)',
        titleColor: '#6e707e',
        bodyColor: '#858796',
        borderColor: '#dddfeb',
        borderWidth: 1,
        padding: 15,
        displayColors: true,
        caretPadding: 10,
        callbacks: {
          label: function (context) {
            return context.dataset.label + ': $' + (context.parsed.y)?.toLocaleString();
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#858796',
          font: {
            family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e3e6f0',
          borderDash: [2],
          drawBorder: false,
        },
        ticks: {
          color: '#858796',
          font: {
            family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
            size: 10
          }
        }
      }
    }
  };

  // Opciones para gráfico de barras horizontal
  const barOptionsHorizontal = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#858796',
          font: {
            family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgb(255,255,255)',
        titleColor: '#6e707e',
        bodyColor: '#858796',
        borderColor: '#dddfeb',
        borderWidth: 1,
        padding: 15,
        displayColors: true,
        caretPadding: 10,
        callbacks: {
          label: function (context) {
            return context.dataset.label + ': $' + context.parsed.x + 'k';
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: '#e3e6f0',
          borderDash: [2],
          drawBorder: false,
        },
        ticks: {
          color: '#858796',
          font: {
            family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
            size: 10
          }
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#858796',
          font: {
            family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
            size: 10
          }
        }
      }
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, borderColor }) => (
    <div className="card shadow h-20 py-2" style={{ borderLeft: `0.25rem solid ${borderColor}` }}>
      <div className="card-body">
        <div className="row no-gutters align-items-center">
          <div className="col mr-2">
            <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: borderColor }}>
              {title}
            </div>
            <div className="h5 mb-0 font-weight-bold text-gray-800">{value}</div>
            {subtitle && <div className="text-xs text-gray-600 mt-1">{subtitle}</div>}
          </div>
          <div className="col-auto">
            <Icon className="fa-2x" style={{ color: borderColor, width: '4rem', height: '4rem', opacity: 0.3 }} />
          </div>
        </div>
      </div>
    </div>
  );

  const ChartLegend = ({ data }) => (
    <div className="row mt-5 text-center">
      {data.labels.map((label, idx) => (
        <div key={idx} className="col-6 mb-2">
          <div className="d-flex align-items-center">
            <div
              className="mr-2"
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: data.datasets[0].backgroundColor[idx]
              }}
            ></div>
            <span className="small text-gray-600">
              {label}: {data.datasets[0].data[idx]?.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (

    <div id="content-wrapper" className="d-flex flex-column" style={{ backgroundColor: '#f8f9fc' }}>
      <div id="content">

        {/* Contenido principal */}
        <div className="container-fluid">
          {/* Encabezado de la página */}
          <div className="d-sm-flex align-items-center justify-content-between mb-4">

            <div className="container-fluid py-4 pb-0">
              {/* Botón para exportar datos a excel */}
              <div className="float-right p-0 m-0">
                <button className="btn btn-sm btn-outline-success rounded-3" onClick={() => ExportarDatosaExcel(filtradoData, 'Reporte_Dashboard_Principal')}>
                  <i className="fas fa-file-excel fa-sm text-success-50 mr-1"></i> Exportar Datos
                </button>
              </div>
              <h1 className="h3 mb-0 text-gray-800">Dashboard Principal {rutaSeleccionada || ''}</h1>
              <p className="mb-0 text-gray-600">Resumen general de operaciones y estadísticas</p>

            </div>
          </div>
          {/* DIV para los filtros */}
          <div className="d-flex flex-wrap gap-2 mb-3">


            {/* DIV para el filtro de fecha */}
            <div className="form-floating pr-2">
              <input type="date" name="fechaInicio" placeholder="Fecha Inicio" className="form-control form-control-sm"
                onChange={handleChange} value={vFechaInicio} id='in_fechaInicio' />
              <label className="form-label" htmlFor='in_fechaInicio'>Inicio Rango</label>
            </div>

            <div className="form-floating pr-2">
              <input type="date" name="fechaFin" placeholder="Fecha Fin" className="form-control form-control-sm"
                onChange={handleChange} value={vFechaFin} id='in_fechaFin' />
              <label className="form-label" htmlFor='in_fechaFin'>Fin Rango</label>

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
              <input type="text" name="vCaseta" placeholder="Caseta" className="form-control form-control-sm" onChange={handleChange} value={vCaseta} />
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
                </select>
              </label>
            </div>

            <div className='col-md-2 ml-2  p-2 input-group-text mb-0 ' style={{ maxWidth: 'min-content', }}>
              <label htmlFor='rutaSeleccionada' className='d-flex align-items-center'>
                <span className='text-muted'>Ruta:</span>
                <select className='mx-3 p-2' name="rutaSeleccionada" onChange={handleChange} value={rutaSeleccionada} id='rutaSeleccionada' style={{ width: 'auto', height: '2.5rem' }}>
                  <option value="">Todos</option>
                  {data?.rutasActivas && [...new Map(data.rutasActivas.map(item => [item.Id_tipo_ruta, item])).values()].map((ruta) => (
                    <option key={ruta.Id_tipo_ruta || ruta.ID_orden} value={ruta.Id_tipo_ruta}>  {ruta.Origen} - {ruta.Destino} ({ruta.Recuento} OTs)  </option>
                  ))}
                </select>
              </label>
            </div>


            <div className="ml-3 pr-1 pt-1 d-flex">
              <button className="btn btn-sm btn btn-outline-dark rounded-3" onClick={resetFiltros}>
                <FunnelX size={25} className="me-1" />
              </button>
            </div>

          </div>

          {/* Content Row - Stats Cards */}
          <div className="row">
            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                title="Importe de Casetas"
                value={`$${importeTotalCasetas?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="Período seleccionado"
                icon={DollarSign}
                color="#1cc88a"
                borderColor="#1cc88a"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                title="Cruces realizados"
                value={totalCasetasCruzadas?.toLocaleString()}
                subtitle="Período seleccionado"
                icon={TrendingUp}
                color="#4e73df"
                borderColor="#4e73df"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                title="Aclaraciones"
                value={detalleAclaracionesAgrupadas?.length?.toLocaleString()}
                subtitle={`$${(detalleAclaracionesAgrupadas) && detalleAclaracionesAgrupadas?.reduce((acc, item) => acc + item.Importe, 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} en proceso`}
                icon={AlertCircle}
                color="#f6c23e"
                borderColor="#f6c23e"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                title="Rutas Activas"
                value={(data?.rutasActivas?.length) ? data?.rutasActivas?.length?.toLocaleString() : "0"}
                subtitle="De acuerdo al filtro aplicado"
                icon={Users}
                color="#6f42c1"
                borderColor="#6f42c1"
              />
            </div>
          </div>

          {/* Content Row - Charts */}
          <div className="row">
            {/* Resúmenes Mensual */}
            <div className="col-xl-6 col-lg-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">Resumen Mensual</h6> <h5 className='float-right'>({(data?.gastosCrucesAgrupados?.length)?.toLocaleString()} Cruces en total)</h5>
                </div>
                <div className="card-body">
                  <div className="chart-area" style={{ height: '300px' }}>
                    <Doughnut data={resumenMensualData} options={doughnutOptions} />
                  </div>
                  <ChartLegend data={resumenMensualData} className="pt-3 mt-3" />
                </div>
              </div>
            </div>

            {/* Presupuesto */}
            <div className="col-xl-6 col-lg-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">Presupuesto</h6>
                  {/* Importe Total de Casetas dinamico (billones,millones,miles) */}
                  <span className="h4 mb-0 font-weight-bold text-gray-800">${formatCompactNumber(importeTotalCasetas)}</span>
                </div>
                <div className="card-body">
                  <div className="chart-area" style={{ height: '300px' }}>
                    <Doughnut data={presupuestoData} options={doughnutOptions} />
                  </div>
                  <ChartLegend data={presupuestoData} />
                </div>
              </div>
            </div>
          </div>

          {/* Content Row - More Charts */}
          <div className="row">
            {/* Histórico de Aclaraciones */}
            <div className="col-xl-6 col-lg-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">Histórico de Aclaraciones ($)</h6>
                  <h6 className='float-right m-0 font-weight-bold text-primary' >$ {aclaracionesData?.datasets[0]?.data?.reduce((acc, item) => acc + item, 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} </h6>
                </div>
                <div className="card-body">
                  <div className="chart-bar" style={{ height: '300px' }}>
                    <Bar data={aclaracionesData} options={barOptionsVertical} />
                  </div>
                </div>
              </div>
            </div>

            {/* Importe por Ruta */}
            <div className="col-xl-6 col-lg-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">Importe por Ruta</h6>
                </div>
                <div className="card-body">
                  <div className="chart-bar" style={{ height: '300px' }}>
                    <Bar data={importePorRutaData} options={barOptionsHorizontal} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DataTable - Cruces sin Justificación (Abusos) */}
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-danger">Cruces sin Justificación (Abusos) - Top 5</h6>
              <h6 className="float-right m-0 font-weight-bold text-warning">Cruces sin Justificación (Condonados) - Top 5</h6>
              <a href="/abusos" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
                <i className="fas fa-list fa-sm text-white-50 mr-1"></i> Ver todos
              </a>
            </div>
            <div className="card-body">
              <div className="row justify-content-around">
                <div className="table-responsive col-lg-5 col-md-12">
                  <table className="table table-bordered" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Conductor</th>
                        <th>Importe</th>
                        <th>Última Fecha</th>
                        <th>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abusosFiltrados && abusosFiltrados.map((row, idx) => (
                        (idx <= 5) &&
                        <tr key={idx}>
                          <td>{row.No_Economico}</td>
                          <td>${row.Importe?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>{formatearFecha(row?.Fecha)}</td>
                          <td className="font-weight-bold">{row?.Estatus_Secundario?.replaceAll('_', ' ')?.toUpperCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="table-responsive col-lg-5 col-md-12">
                  <table className="table table-bordered" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Conductor</th>
                        <th>Importe</th>
                        <th>Última Fecha</th>
                        <th>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {condonadosFiltrados && condonadosFiltrados.map((row, idx) => (
                        (idx <= 5) &&
                        <tr key={idx}>
                          <td>{row.No_Economico}</td>
                          <td>${row.Importe?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>{formatearFecha(row?.Fecha)}</td>
                          <td className="font-weight-bold">{row?.Estatus_Secundario?.replaceAll('_', ' ')?.toUpperCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

  );
};

export default Dashboard;