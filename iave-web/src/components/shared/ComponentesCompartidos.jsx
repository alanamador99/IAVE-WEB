// =============================================================================
// 1. HOOK PERSONALIZADO PARA FILTROS COMPARTIDOS
// =============================================================================
import { useState, useMemo } from 'react';

const useFiltros = (initialFilters = {}) => {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    operador: '',
    caseta: '',
    estatus: 'todos',
    tipo: '',
    ...initialFilters
  });

  const actualizarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros(initialFilters);
  };

  return {
    filtros,
    setFiltros,
    actualizarFiltro,
    limpiarFiltros
  };
};

// =============================================================================
// 2. COMPONENTE DE FILTROS REUTILIZABLE
// =============================================================================
const FiltrosCompartidos = ({ 
  filtros, 
  onFiltroChange, 
  onLimpiar, 
  configuracion = {},
  children 
}) => {
  const {
    mostrarFechas = true,
    mostrarOperador = true,
    mostrarCaseta = true,
    mostrarEstatus = false,
    mostrarTipo = false,
    opcionesEstatus = [],
    opcionesTipo = []
  } = configuracion;

  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {mostrarFechas && (
        <>
          <div className="form-floating pr-2">
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => onFiltroChange('fechaInicio', e.target.value)}
              className="form-control form-control-sm"
              id="fechaInicio"
            />
            <label htmlFor="fechaInicio">Fecha Inicio</label>
          </div>

          <div className="form-floating pr-2">
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => onFiltroChange('fechaFin', e.target.value)}
              className="form-control form-control-sm"
              id="fechaFin"
            />
            <label htmlFor="fechaFin">Fecha Fin</label>
          </div>
        </>
      )}

      {mostrarOperador && (
        <div className="form-floating pr-2">
          <input
            className="form-control form-control-sm"
            type="text"
            placeholder="Buscar operador..."
            value={filtros.operador}
            id="operadorFiltro"
            autoComplete="off"
            onChange={(e) => onFiltroChange('operador', e.target.value)}
          />
          <label htmlFor="operadorFiltro">Matrícula / Operador</label>
        </div>
      )}

      {mostrarCaseta && (
        <div className="form-floating pr-2">
          <input
            type="text"
            placeholder="Buscar caseta..."
            value={filtros.caseta}
            id="casetaFiltro"
            autoComplete="off"
            onChange={(e) => onFiltroChange('caseta', e.target.value)}
            className="form-control form-control-sm"
          />
          <label htmlFor="casetaFiltro">Caseta</label>
        </div>
      )}

      {mostrarEstatus && (
        <div className="col-md-2 pr-2 input-group-text mb-0">
          <label>Estatus:</label>
          <select 
            className="mx-3 p-2" 
            onChange={(e) => onFiltroChange('estatus', e.target.value)} 
            value={filtros.estatus}
          >
            {opcionesEstatus.map(opcion => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {mostrarTipo && (
        <div className="form-floating pr-2">
          <select
            className="form-select form-select-sm"
            value={filtros.tipo}
            onChange={(e) => onFiltroChange('tipo', e.target.value)}
            id="tipoFiltro"
          >
            {opcionesTipo.map(opcion => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
          <label htmlFor="tipoFiltro">Tipo</label>
        </div>
      )}

      {/* Filtros adicionales específicos de cada módulo */}
      {children}

      <div className="ml-5 pr-1">
        <button 
          type="button" 
          className="btn btn-outline-secondary btn-sm"
          onClick={onLimpiar}
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// 3. COMPONENTE DE PAGINACIÓN REUTILIZABLE
// =============================================================================
const ControlPaginacion = ({ 
  totalRegistros, 
  registrosPorPagina, 
  onCambiarRegistrosPorPagina,
  titulo = "Registros"
}) => {
  return (
    <div className="card-header py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between">
      <div className="d-flex align-items-center gap-2">
        <label htmlFor="rowsSelect" className="input-group-text mb-0 mr-2">
          Registros por página:
        </label>
        <select
          id="rowsSelect"
          className="form-select form-select-sm custom-select"
          value={registrosPorPagina}
          onChange={(e) => onCambiarRegistrosPorPagina(parseInt(e.target.value))}
          style={{ width: 'auto' }}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={250}>250</option>
        </select>
      </div>

      <h6 className="m-0 font-weight-bold text-primary ml-3" style={{ flex: 'auto' }}>
        {titulo} - (<span className="text-sm">{totalRegistros}</span>)
      </h6>
    </div>
  );
};

// =============================================================================
// 4. MODAL COMPARTIDO PARA EXPEDIENTES
// =============================================================================
const ModalExpediente = ({ 
  show, 
  onHide, 
  titulo,
  operadores = [],
  operadorSeleccionado,
  onOperadorChange,
  registros = [],
  columnas = [],
  renderFilaModal
}) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{titulo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <Form.Select 
            onChange={(e) => onOperadorChange(e.target.value)} 
            value={operadorSeleccionado}
          >
            <option value="">Selecciona operador</option>
            {operadores.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </Form.Select>
        </div>
        
        {operadorSeleccionado && (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                {columnas.map(col => (
                  <th key={col.key}>{col.titulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros
                .filter(registro => registro.operador === operadorSeleccionado)
                .map(registro => renderFilaModal(registro))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// =============================================================================
// 5. HOOK PARA MANEJO DE MODALES
// =============================================================================
const useModal = () => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);

  const abrirModal = (elemento = null) => {
    setElementoSeleccionado(elemento);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setElementoSeleccionado(null);
  };

  return {
    modalAbierto,
    elementoSeleccionado,
    abrirModal,
    cerrarModal
  };
};

// =============================================================================
// 6. CONFIGURACIÓN COMÚN
// =============================================================================
export const CONFIGURACIONES = {
  ACLARACIONES: {
    titulo: 'Módulo de Aclaraciones',
    filtros: {
      mostrarFechas: true,
      mostrarOperador: true,
      mostrarCaseta: true,
      mostrarEstatus: true,
      opcionesEstatus: [
        { value: 'todos', label: 'Todos' },
        { value: 'pendiente_aclaracion', label: 'Sin aclaración' },
        { value: 'aclaracion_levantada', label: 'En proceso' },
        { value: 'resuelto', label: 'Dictaminados' }
      ]
    },
    columnasModal: [
      { key: 'fecha', titulo: 'Fecha' },
      { key: 'hora', titulo: 'Hora' },
      { key: 'caseta', titulo: 'Caseta' },
      { key: 'tipo', titulo: 'Tipo' },
      { key: 'comentario', titulo: 'Comentario' }
    ]
  },
  ABUSOS: {
    titulo: 'Módulo de Abusos',
    filtros: {
      mostrarFechas: false,
      mostrarOperador: true,
      mostrarCaseta: false,
      mostrarTipo: true,
      opcionesTipo: [
        { value: '', label: 'Todos los abusos' },
        { value: 'fuera_horario', label: 'Fuera de horario' },
        { value: 'fuera_ruta', label: 'Fuera de ruta' }
      ]
    },
    columnasModal: [
      { key: 'fecha', titulo: 'Fecha' },
      { key: 'hora', titulo: 'Hora' },
      { key: 'caseta', titulo: 'Caseta' },
      { key: 'tipo', titulo: 'Tipo' },
      { key: 'comentario', titulo: 'Comentario' }
    ]
  }
};

// =============================================================================
// 7. UTILIDADES COMPARTIDAS
// =============================================================================
export const utils = {
  // Función para obtener información de estatus (común para ambos módulos)
  getEstatusInfo: (estatus, tipo = 'aclaracion') => {
    const mapas = {
      aclaracion: {
        'pendiente_aclaracion': {
          label: 'Pendiente Aclaración',
          color: 'text-danger text-gray-800',
          icon: 'AlertTriangle',
          description: 'Requiere levantar aclaración en portal'
        },
        'aclaracion_levantada': {
          label: 'Aclaración Levantada',
          color: 'bg-yellow-100 text-yellow-800',
          icon: 'Clock',
          description: 'Esperando devolución'
        },
        'resuelto': {
          label: 'Resuelto',
          color: 'bg-green-100 text-green-800',
          icon: 'CheckCircle',
          description: 'Devolución completada'
        }
      },
      abuso: {
        'fuera_horario': {
          label: 'Fuera de horario',
          color: 'table-danger',
          description: 'Actividad fuera del horario permitido'
        },
        'fuera_ruta': {
          label: 'Caseta fuera de ruta',
          color: 'table-warning',
          description: 'Uso de caseta no autorizada en la ruta'
        }
      }
    };
    
    const mapa = mapas[tipo] || mapas.aclaracion;
    return mapa[estatus] || mapa[Object.keys(mapa)[0]];
  },

  // Función para formatear fechas
  formatearFecha: (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX');
  },

  // Función para formatear moneda
  formatearMoneda: (cantidad) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(cantidad);
  }
};

// Exportar todos los componentes y hooks
export {
  useFiltros,
  useModal,
  FiltrosCompartidos,
  ControlPaginacion,
  ModalExpediente
};