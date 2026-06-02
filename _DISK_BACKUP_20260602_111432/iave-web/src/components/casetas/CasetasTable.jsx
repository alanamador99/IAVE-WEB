import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import axios from 'axios';
import { RefreshCcw } from 'lucide-react';
import {ModalUpdateCaseta} from '../shared/utils';
import { set } from 'lodash';


const API_URL = process.env.REACT_APP_API_URL;


const claveToImporteField = {
  'A': 'Automovil',
  'B': 'Autobus2Ejes',
  'C-2': 'Camion2Ejes',
  'C-3': 'Camion3Ejes',
  'C-4': 'Camion3Ejes',
  'C-5': 'Camion5Ejes',
  'C-9': 'Camion9Ejes'
};


function CasetasTable() {
  const navigate = useNavigate();
  const { idCaseta } = useParams();
  const colores = useRef();

  const [costos, setCostos] = useState([]);
  const [costosINEGI, setCostosINEGI] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectedCruces, setSelectedCruces] = useState([]);
  const [porcentaje, setPorcentaje] = useState(1);
  const [filtered, setFiltered] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1); //Pagúna actual, obviamente inicia en la primer página
  const [vClase, setvClase] = useState('A'); //Clase de vehiculo, por defecto Automovil
  const [sortColumn, setSortColumn] = useState(null); //Columna mandante para el ordenamiento
  const [sortDirection, setSortDirection] = useState('asc'); // Tipo de ordenamiento
  const [isModalHandleActualizarCaseta, setIsModalHandleActualizarCaseta] = useState(false);
  const [selectedCasetaId, setSelectedCasetaId] = useState(null);


  const handleCheckboxChange = (id) => {
    setSelectedCruces(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const areAllVisibleSelected = () => {
    const visibleIds = sorted.slice((paginaActual - 1) * rowsPerPage, paginaActual * rowsPerPage).map(c => c.ID_Caseta);
    return visibleIds.every(ID_Caseta => selectedCruces.includes(ID_Caseta));
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
  const triggerClick = () => {
    colores.current.click();
  };


  const handleSelectAllVisible = () => {
    const visibleIds = sorted.slice((paginaActual - 1) * rowsPerPage, paginaActual * rowsPerPage).map(c => c.ID_Caseta); // sólo los de la página actual
    const allSelected = visibleIds.every(ID_Caseta => selectedCruces.includes(ID_Caseta));

    if (allSelected) {
      // Quitar todos los visibles
      setSelectedCruces(prev => prev.filter(ID_Caseta => !visibleIds.includes(ID_Caseta)));
    } else {
      // Agregar todos los visibles que no estén ya seleccionados
      setSelectedCruces(prev => [
        ...prev,
        ...visibleIds.filter(ID_Caseta => !prev.includes(ID_Caseta))
      ]);
    }
  };

  const totalPaginas = Math.ceil(sorted.length / rowsPerPage);
  const indiceInicio = (paginaActual - 1) * rowsPerPage;
  const paginaDatos = sorted.slice(indiceInicio, indiceInicio + rowsPerPage);


  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };
  useEffect(() => {
    axios.get(`${API_URL}/api/casetas/`)
      .then(res => {
        setCostos(res.data);
        setFiltered(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Error al cargar los costos de casetas \n' + err);
        setLoading(false);
      });

  }, []);

  // Efecto para abrir el modal si hay un idCaseta en la URL
  useEffect(() => {
    if (idCaseta) {
      setSelectedCasetaId(parseInt(idCaseta));
      setIsModalHandleActualizarCaseta(true);
    }
  }, [idCaseta]);



  const handleChange = e => {
    const { name, value } = e.target;
    if (selectedCruces.length !== 0) {
      setSelectedCruces([]);
    }
    switch (name) {
      case 'Clase':
        setvClase(e.target.value);
        break;
      default:
        break;
    }
  };
  const handleActualizarCaseta = (idCaseta) => {
    //Agregamos a la URL el id de la caseta a actualizar
    //

    navigate(`/casetas/actualizarCaseta/${idCaseta}`); // Cambia la URL al id de la caseta
    setSelectedCasetaId(idCaseta);
    setIsModalHandleActualizarCaseta(true);
  };
  async function getRouteDetails(OriginId, FinalId, VehicleType) {
    const token = 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';
    if (!token) return;

    const originId = OriginId;
    const finalId = FinalId;
    const vehicleType = VehicleType;

    if (!originId || !finalId) {
      alert('Por favor ingresa los IDs de origen y destino');
      return;
    }

    try {
      const formData = new URLSearchParams({
        dest_i: originId,
        dest_f: finalId,
        v: vehicleType,
        type: 'json',
        key: token
      });

      const response = await fetch(`https://gaia.inegi.org.mx/sakbe_v3.1/detalle_o`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });
      if (!response.ok) {
        throw new Error('Respuesta de red no OK');
      }
      const text = await response.text();
      if (!text) {
        throw new Error('Respuesta vacía');
      }
      const data = JSON.parse(text);
      console.log('Datos obtenidos:', data);
      console.log('Status:', response.status);
      console.log('Body:', text);

    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  const getCostosCasetasActualizadosINEGI = (OriginId, FinalId, VehicleType) => {
    console.log('Obteniendo costos actualizados de INEGI...');
    // Lógica para obtener los costos actualizados de las casetas desde la API de INEGI
    getRouteDetails(OriginId, FinalId, VehicleType);

  }

  if (loading) return (<div className="d-flex justify-content-center align-items-center" style={{ height: "15vh" }}>
    <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
      <span className="visually-hidden">.</span>
    </div>
  </div>);
  if (error) return <div>{error}</div>;

  return (
    <div className="card shadow ">
      <div className="card-header py-3 d-flex justify-content-between align-items-center">
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

        <h6 className="m-0 font-weight-bold text-primary ml-3" style={{ flex: 'auto', }}>Comparativa de costos de casetas. </h6>


        <div className='col-md-2  pr-2 input-group-text mb-0 mr-4 ' style={{ maxWidth: 'min-content', }}>
          <label htmlFor='selectEstatus' className='d-flex align-items-center'>
            <span className='text-muted'>Clase:</span>
            <select className='mx-3 p-2' name="Clase" onChange={handleChange} value={vClase} id='selectEstatus' style={{ width: 'auto', height: '2.5rem' }}>
              <option value="A">Automovil</option>
              <option value="B">Autobuses 2 Ejes</option>
              <option value="C-2">Camiones 2 Ejes</option>
            </select>
          </label>
        </div>


        <div className='col-md-2  pr-2 input-group-text mb-0 ' style={{ maxWidth: 'min-content', }}>
          <label htmlFor='selectEstatus' className='d-flex align-items-center'>
            <span className='text-muted'>Clase:</span>
            <select className='mx-3 p-2' name="Clase" onChange={handleChange} value={vClase} id='selectEstatus' style={{ width: 'auto', height: '2.5rem' }}>
              <option value="A">Automovil</option>
              <option value="B">Autobuses 2 Ejes</option>
              <option value="C-2">Camiones 2 Ejes</option>
              <option value="C-3">Camiones 3 Ejes</option>
              <option className='fs-6' value="C-5">Camiones 5 Ejes</option>
              <option value="C-9">Camiones 9 Ejes</option>
            </select>
          </label>
        </div>
        <div className="ml-3 pr-1 pt-1 float-right">
          <button className="btn btn-sm btn btn-outline-dark rounded-3" onClick={() => getCostosCasetasActualizadosINEGI(103329, 150211, '')}>
            <RefreshCcw size={25} className="me-1" />
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive table-container" style={{ maxHeight: '49vh', overflowY: 'auto' }}>
          <table className="table table-scroll table-sm  table-bordered table-hover">
            <thead>
              <tr>
                <th onClick={triggerClick} className='px-0 pl-2 col' style={{ width: '1%' }}>
                  <input tabIndex={1}
                    type="checkbox" ref={colores}
                    style={{ height: '15px', width: '15px', }}
                    onChange={handleSelectAllVisible}
                    checked={areAllVisibleSelected()}
                    id='SelectAll'
                  />
                </th>
                <th className='px-0 pl-2 col-1' style={{ width: '1.2%' }}>IDx</th>
                <th className='px-0 pl-2 col-2'>Caseta</th>
                <th className='px-0 pl-2 col-2'>Tramo</th>
                <th className='px-0 pl-2 col-2'>Estado</th>
                <th className='px-0 pl-2 col-2'>Tarifa TUSA - {claveToImporteField[vClase]}</th>
                <th className='px-0 pl-2 col-2'>Tarifa INEGI - {vClase}</th>
                <th className='px-0 pl-2 col-2'>Concepto</th>
              </tr>
            </thead>

            <tbody>
              {paginaDatos.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center">No hay datos</td>
                </tr>
              ) : (
                paginaDatos.map((caseta, idx) => (

                  <tr key={idx} className={(caseta[claveToImporteField[vClase]] < caseta.Camion2Ejes) ? `text-warning` : (caseta[claveToImporteField[vClase]] === caseta.Camion2Ejes) ? `text-success table-success` : (caseta[claveToImporteField[vClase]] > caseta.Camion2Ejes) ? `text-danger` : `text-info`}>
                    <td className='py-1 align-middle '> <input
                      type="checkbox" tabIndex={idx + 2}
                      checked={selectedCruces.includes(caseta.ID_Caseta)}
                      onChange={() => handleCheckboxChange(caseta.ID_Caseta)}
                    /></td>
                    <td className='px-0 pl-2' style={{cursor:'pointer'}} onClick={() => handleActualizarCaseta(caseta.ID_Caseta)}>{caseta.ID_Caseta}</td>
                    <td>{caseta.Nombre}</td>
                    <td>{caseta.Notas}</td>
                    <td>{caseta.Estado}</td>
                    <td>${caseta[claveToImporteField[vClase]]}</td>
                    <td>${caseta.Camion2Ejes}</td>
                    <td>{(caseta[claveToImporteField[vClase]] < caseta.Camion2Ejes) ? `Tarifa desactualizada ↓` : (caseta[claveToImporteField[vClase]] === caseta.Camion2Ejes) ? `Costo correcto ⭐` : (caseta[claveToImporteField[vClase]] > caseta.Camion2Ejes) ? `Tarifa desactualizada ↑` : `Revisar`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ModalUpdateCaseta 
      isOpen={isModalHandleActualizarCaseta}
      onConfirm={(datosAGuardar) => {
        setIsModalHandleActualizarCaseta(false);
        // Lógica para actualizar la caseta con los datos proporcionados
        const updatedCostos = costos.map(caseta => {
          if (caseta.ID_Caseta === selectedCasetaId) {
            return { ...caseta, ...datosAGuardar };
          }
          return caseta;
        });
        console.log('Datos a guardar para la caseta ID:', selectedCasetaId, datosAGuardar);
        // Mandamos un patch para actualizar la caseta en el backend
        axios.patch(`${API_URL}/api/casetas/updateCasetaByID`, {
          ID_Caseta: selectedCasetaId,
          ...datosAGuardar
        })
        .then(response => { 
          console.log('Caseta actualizada en el backend:', response.data);
        })
        setCostos(updatedCostos);
        setFiltered(updatedCostos);



      }}
      onClose={() => {setIsModalHandleActualizarCaseta(false); navigate('/casetas');}}
      idCaseta={selectedCasetaId}
        />
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
  );
}

export default CasetasTable;