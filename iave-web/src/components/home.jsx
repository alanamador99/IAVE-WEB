import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { DollarSign, Users, TrendingUp, AlertCircle, Calendar, FunnelX } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const Dashboard = () => {
  const [selectedMonth] = useState('Agosto 2025');
  const [filters, setFilters] = useState({ fechaInicio: '', fechaFin: '', vOT: '', mat_OP: '', Caseta: '', Estatus: '', tagID: '' });
  const { fechaInicio: vFechaInicio, fechaFin: vFechaFin, vOT, mat_OP: vmat_OP, Caseta: vCaseta, Estatus: vEstatus, tagID: vtagID } = filters;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const resetFiltros = () => {
    setFilters({ fechaInicio: '', fechaFin: '', vOT: '', mat_OP: '', Caseta: '', Estatus: '', tagID: '' });
  };



  // Configuración para Resúmenes Mensual
  const resumenMensualData = {
    labels: ['Casetas Cruzadas', 'Sin Justificación', 'Pendientes', 'Procesadas'],
    datasets: [{
      data: [1234, 1200, 850, 5558],
      backgroundColor: ['#1cc88a', '#4e73df', '#6f42c1', '#36b9cc'],
      borderWidth: 0,
    }]
  };

  // Configuración para Presupuesto
  const presupuestoData = {
    labels: ['TUSA', 'Sesgos', 'Aclaraciones', 'Abusos'],
    datasets: [{
      data: [122.2, 132.3, 99.8, 45.7],
      backgroundColor: ['#1599f1ff', '#36b9cc', '#f6c23e', '#df1313ff'],
      borderWidth: 0,
    }]
  };

  // Configuración para Histórico de Aclaraciones
  const aclaracionesData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Procede',
        data: [45, 54, 96, 78, 88, 92, 105, 110, 120, 130, 140, 150],
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
    labels: ['Escobedo NL - Culiacán', 'Escobedo NL - Mazatlán', 'Aguascalientes', 'Escobedo NL - Texcoco'],
    datasets: [
      {
        label: 'IAVE ($)',
        data: [122.2, 99.8, 46.7, 43.8],
        backgroundColor: '#4e73df',
      },
      {
        label: 'TUSA ($)',
        data: [132.3, 85.5, 24.1, 31.8],
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
            return context.label + ': ' + context.parsed.toLocaleString();
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
            return context.dataset.label + ': ' + context.parsed.y;
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
              {label}: {data.datasets[0].data[idx].toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (

    <div id="content-wrapper" className="d-flex flex-column" style={{ backgroundColor: '#f8f9fc' }}>
      <div id="content">

        {/* Page Content */}
        <div className="container-fluid">
          {/* Page Heading */}
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <div className="container-fluid py-4 pb-0">
              <h1 className="h3 mb-0 text-gray-800">Dashboard Principal</h1>
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
              <input type="date" name="fechaFin"
                className="form-control form-control-sm"
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

          {/* Content Row - Stats Cards */}
          <div className="row">
            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                title="Importe de Casetas"
                value="$1,139,970"
                subtitle="Período seleccionado"
                icon={DollarSign}
                color="#1cc88a"
                borderColor="#1cc88a"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                title="Casetas Cruzadas"
                value="7,608"
                subtitle="Total del mes"
                icon={TrendingUp}
                color="#4e73df"
                borderColor="#4e73df"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                title="Aclaraciones"
                value="186"
                subtitle="$5,142.00 en proceso"
                icon={AlertCircle}
                color="#f6c23e"
                borderColor="#f6c23e"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                title="Rutas Activas"
                value="12"
                subtitle="Con operaciones"
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
                  <h6 className="m-0 font-weight-bold text-primary">Resúmenes Mensual</h6>
                </div>
                <div className="card-body">
                  <div className="chart-area" style={{ height: '300px' }}>
                    <select className="form-select mr-5" style={{ maxWidth: '200px' }} >
                      <option>Selecciona el año</option>
                      <option>2024</option>
                      <option>2025</option>
                      <option>2026</option>
                    </select>

                    <select className="form-select mr-5" style={{ maxWidth: '200px', float: 'right' }} >
                      <option>Selecciona el mes</option>
                      <option>Enero</option>
                      <option>Febrero</option>
                      <option>Marzo</option>
                      <option>Abril</option>
                      <option>Mayo</option>
                      <option>Junio</option>
                      <option>Julio</option>
                      <option>Agosto</option>
                      <option>Septiembre</option>
                      <option>Octubre</option>
                      <option>Noviembre</option>
                      <option>Diciembre</option>
                    </select>
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
                  <span className="h4 mb-0 font-weight-bold text-gray-800">$350k</span>
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
              <h6 className="m-0 font-weight-bold text-primary">Cruces sin Justificación (Abusos) - Top 3</h6>
              <a href="#" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
                <i className="fas fa-list fa-sm text-white-50 mr-1"></i> Ver todos
              </a>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Conductor</th>
                      <th>Cantidad</th>
                      <th>Importe</th>
                      <th>Última Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { nombre: 'Luis Uribe Quintero', cantidad: '$5,156.00', importe: 45, fecha: '24/08/2025' },
                      { nombre: 'Adrian Rodrigo Salas Gutierrez', cantidad: '$702.00', importe: 8, fecha: '21/08/2025' },
                      { nombre: 'Jesus Manuel Villalpa Isias', cantidad: '$650.00', importe: 15, fecha: '20/08/2025' }
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.nombre}</td>
                        <td>{row.importe}</td>
                        <td className="font-weight-bold">{row.cantidad}</td>
                        <td>{row.fecha}</td>
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

  );
};

export default Dashboard;