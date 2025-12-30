/**
 * @fileoverview Módulo de utilidades compartidas para la aplicación IAVE WEB
 * @description Contiene componentes reutilizables y funciones auxiliares para:
 * - Copiar información al portapapeles
 * - Mostrar mapas interactivos
 * - Formatear datos (fechas, dinero, nombres)
 * - Mostrar notificaciones (Toast)
 * - Modales de selección
 * 
 * @module shared/utils
 * @requires react
 * @requires react-bootstrap
 * @requires lucide-react
 * @requires react-leaflet
 * @requires leaflet
 */

import React, { useState, useRef, useEffect } from 'react';
import { Toast } from 'react-bootstrap';

import { MapPin, Mail, Phone, User, Calendar, Building, Clipboard, LocateFixed } from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Componente para copiar el TAG de un cruce al portapapeles
 * @component
 * @param {Object} props - Props del componente
 * @param {Object} props.cruceSeleccionado - Objeto del cruce con la propiedad Tag
 * @param {string} props.cruceSeleccionado.Tag - TAG a copiar
 * @returns {React.ReactElement} Elemento visual con icono de copiar y notificación
 * 
 * @example
 * <CopiarTag cruceSeleccionado={{ Tag: 'IMDM29083641' }} />
 * 
 * @description
 * - Renderiza un icono de clipboard clickeable
 * - Al hacer click, copia el TAG al portapapeles
 * - Muestra confirmación visual por 1 segundo
 * - Incluye tooltip con instrucciones
 */
const CopiarTag = ({ cruceSeleccionado }) => {
  const [copiado, setCopiado] = useState(false);

  const copiarAlPortapapeles = () => {
    if (cruceSeleccionado) {
      navigator.clipboard.writeText(cruceSeleccionado?.Tag);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1000); // Oculta el mensaje después de 2 segundos
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        className='text-primary font-weight-bolder ml-2'
        style={{ cursor: 'pointer', fontSize: '0.65rem' }}
        title="Copiar TAG al portapapeles"
        onClick={copiarAlPortapapeles}
      >
        <Clipboard size={20} />
      </span>

      {copiado && (
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            left: '25px',
            backgroundColor: 'rgb(40, 167, 69)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 6px',
            zIndex: '10',
            width: '11.5rem',

          }}
        >
          TAG copiado al portapapeles! ✔️
        </div>
      )}
    </div>
  );
};

/**
 * Componente para copiar la fecha de un cruce al portapapeles
 * @component
 * @param {Object} props - Props del componente
 * @param {Object} props.cruceSeleccionado - Objeto del cruce
 * @param {string} props.cruceSeleccionado.Fecha - Fecha a copiar
 * @returns {React.ReactElement} Elemento visual con icono de copiar y notificación
 * 
 * @example
 * <CopiarFecha cruceSeleccionado={{ Fecha: '2025-12-01T14:30:45' }} />
 * 
 * @description
 * Similar a CopiarTag pero para fechas
 * - Copia la fecha al portapapeles
 * - Muestra confirmación visual por 1 segundo
 */
const CopiarFecha = ({ cruceSeleccionado }) => {
  const [copiado, setCopiado] = useState(false);

  const copiarAlPortapapeles = () => {
    if (cruceSeleccionado?.Fecha) {
      navigator.clipboard.writeText(cruceSeleccionado.Fecha);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1000); // Oculta el mensaje después de 2 segundos
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        className='text-primary font-weight-bolder ml-2'
        style={{ cursor: 'pointer', fontSize: '0.65rem' }}
        title="Copiar TAG al portapapeles"
        onClick={copiarAlPortapapeles}
      >
        <Clipboard size={20} />
      </span>

      {copiado && (
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            left: '25px',
            backgroundColor: 'rgb(40, 167, 69)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 6px',
            zIndex: '10',
            width: '11.5rem',

          }}
        >
          TAG copiado al portapapeles! ✔️
        </div>
      )}
    </div>
  );
};

// ============================================
// CONFIGURACIÓN DE LEAFLET - MARCADORES
// ============================================

/**
 * Configuración de iconos por defecto en Leaflet
 * @description
 * Ajusta los iconos de marcadores porque por defecto no se muestran correctamente
 * en aplicaciones React con bundlers (webpack, vite, etc.)
 * 
 * Define las rutas de las imágenes:
 * - marker-icon.png: Icono normal
 * - marker-icon-2x.png: Icono de alta resolución (retina)
 * - marker-shadow.png: Sombra del marcador
 */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Componente modal para visualizar una caseta en mapa
 * @component
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Determina si el modal está visible
 * @param {Function} props.onClose - Callback cuando se cierra el modal
 * @param {string} props.nombreCaseta - Nombre de la caseta a mostrar
 * @param {number} props.lat - Latitud de la caseta
 * @param {number} props.lng - Longitud de la caseta
 * @returns {React.ReactElement|null} Modal con mapa Leaflet o null si no está abierto
 * 
 * @example
 * const [mapOpen, setMapOpen] = useState(false);
 * <CasetaMapModal 
 *   isOpen={mapOpen} 
 *   onClose={() => setMapOpen(false)}
 *   nombreCaseta="Caseta Tlanalapa"
 *   lat={20.3456}
 *   lng={-99.1234}
 * />
 * 
 * @description
 * - Modal overlay con fondo oscuro semitransparente
 * - Mapa interactivo centrado en coordenadas
 * - Marcador con popup del nombre de la caseta
 * - Botón X para cerrar (esquina superior derecha)
 * - Usa OpenStreetMap como capa base
 */
const CasetaMapModal = ({ isOpen, onClose, nombreCaseta, lat, lng }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-2xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 font-bold">X</button>
        <h2 className="text-xl mb-4">{nombreCaseta}</h2>
        <MapContainer center={[lat, lng]} zoom={14} style={{ height: "400px", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={[lat, lng]}>
            <Popup>{nombreCaseta}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

// ============================================
// FUNCIONES DE FORMATEO
// ============================================

/**
 * Formatea una razón social removiendo sufijos comunes
 * @function formatearRazonesSociales
 * @param {string} RazonSocial - Razón social a formatear
 * @returns {string} Razón social sin sufijos ("S.A. de C.V.", etc.)
 * 
 * @example
 * formatearRazonesSociales("Transportes ACME S.A. de C.V.")
 * // Returns: "Transportes ACME"
 * 
 * @description
 * Elimina los sufijos legales comunes en México:
 * - "S.A. de C.V."
 * - "SA. de C.V."
 * - "SA de CV."
 * - "S.A. de CV"
 * - "SA de CV"
 */
const formatearRazonesSociales = (RazonSocial) => {
  if (!RazonSocial) return '';
  const response = RazonSocial.replaceAll('S.A. de C.V.', '').replaceAll('SA. de C.V.', '').replaceAll('SA de CV.', '').replaceAll('S.A. de CV', '').replaceAll('SA de CV', '');
  return response;

};

/**
 * Formatea una fecha a formato legible corto
 * @function formatearFecha
 * @param {string|Date} fecha - Fecha a formatear (ISO string o Date)
 * @returns {string} Fecha formateada como "DD-Mmm-YYYY" (ej: "01-Dic-2025")
 * @returns {string} String vacío si la fecha es inválida
 * 
 * @example
 * formatearFecha("2025-12-01")
 * // Returns: "01-Dic-2025"
 * 
 * formatearFecha(new Date(2025, 11, 1))
 * // Returns: "01-Dic-2025"
 * 
 * @description
 * - Formatea con nombre de mes abreviado (3 letras)
 * - Rellena día con 0 si es necesario
 * - Retorna string vacío si la fecha es inválida (isNaN)
 * - Meses: Ene, Feb, Mar, Abr, May, Jun, Jul, Ago, Sep, Oct, Nov, Dic
 */
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

/**
 * Formatea una fecha con hora incluida
 * @function formatearFechaConHora
 * @param {string} fecha - Fecha ISO con hora (ej: "2025-12-01T14:30:45.000Z")
 * @returns {string} Fecha y hora formateadas (ej: "01-Dic-2025 a las 14:30:45")
 * @returns {string} String vacío si la fecha es inválida
 * 
 * @example
 * formatearFechaConHora("2025-12-01T14:30:45.000Z")
 * // Returns: "01-Dic-2025 a las 14:30:45"
 * 
 * @description
 * - Combina formateo de fecha + hora
 * - Extrae hora de la parte después de "T" en formato ISO
 * - Remove milisegundos de la hora mostrada
 * - Formato: "DD-Mmm-YYYY a las HH:MM:SS"
 */
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

/**
 * Formatea nombre completo de una persona
 * @function formatearNombre
 * @param {Object} obj - Objeto con datos de persona
 * @param {string} obj.Nombres - Nombres de pila
 * @param {string} obj.Ap_paterno - Apellido paterno
 * @param {string} obj.Ap_materno - Apellido materno
 * @returns {string} Nombre completo formateado
 * 
 * @example
 * formatearNombre({
 *   Nombres: "Carlos",
 *   Ap_paterno: "García",
 *   Ap_materno: "López"
 * })
 * // Returns: "Carlos García López"
 * 
 * @description
 * - Concatena nombres y apellidos con espacios
 * - Maneja propiedades faltantes (undefined/null)
 * - Orden: Nombres + Ap_paterno + Ap_materno
 */
const formatearNombre = (obj) => {
  return `${obj.Nombres || ''} ${obj.Ap_paterno || ''} ${obj.Ap_materno || ''}`;
};

/**
 * Formatea un monto de dinero con separador de miles y 2 decimales
 * @function formatearDinero
 * @param {number} monto - Monto a formatear
 * @returns {string} Monto formateado con comas y 2 decimales (ej: "1,234.56")
 * @returns {string} String vacío si monto es falsy
 * 
 * @example
 * formatearDinero(1234.5)
 * // Returns: "1,234.50"
 * 
 * formatearDinero(1000000.999)
 * // Returns: "1,000,000.99"
 * 
 * @description
 * - Inserta coma cada 3 dígitos
 * - Siempre muestra 2 decimales (toFixed(2))
 * - Usa regex para insertar separadores: /\B(?=(\d{3})+(?!\d))/g
 * - Uso: precios, importes, tarifas
 */
const formatearDinero = (monto) => {
  if (!monto) return '';
  //La intención es colocar el número con una coma cada tres dígitos, pero CON dos decimales.
  const partes = (monto).toFixed(2).split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return partes.join('.');
};

/**
 * Formatea un número entero con separador de miles (sin decimales)
 * @function formatearEnteros
 * @param {number} monto - Número a formatear
 * @returns {string} Número formateado con comas (ej: "1,234,567")
 * @returns {string} String vacío si monto es falsy
 * 
 * @example
 * formatearEnteros(1234567)
 * // Returns: "1,234,567"
 * 
 * formatearEnteros(1000)
 * // Returns: "1,000"
 * 
 * @description
 * - Similar a formatearDinero pero sin decimales
 * - Inserta coma cada 3 dígitos
 * - Redondea usando toFixed(0)
 * - Uso: cantidades, km, unidades
 */
const formatearEnteros = (monto) => {
  if (!monto) return '';
  //La intención es colocar el número con una coma cada tres dígitos, pero sin decimales.
  const partes = (monto).toFixed(0).split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return partes.join('.');
};

// ============================================
// COMPONENTES DE NOTIFICACIÓN Y SELECTORES
// ============================================

/**
 * Componente de notificación tipo Toast (alerta emergente)
 * @component
 * @param {Object} props - Props del componente
 * @param {string} props.titulo - Título de la notificación
 * @param {string} props.mensaje - Mensaje a mostrar
 * @param {boolean} props.mostrar - Controla visibilidad
 * @param {string} props.color - Clase CSS de color (ej: "text-success", "text-danger")
 * @param {number} [props.tiempo=5000] - Duración en ms antes de auto-ocultarse
 * @returns {React.ReactElement} Componente Toast de Bootstrap
 * 
 * @example
 * const [showToast, setShowToast] = useState(false);
 * <CustomToast
 *   titulo="Éxito"
 *   mensaje="Datos guardados correctamente"
 *   mostrar={showToast}
 *   color="text-success"
 *   tiempo={3000}
 * />
 * 
 * @description
 * - Usa componente Toast de react-bootstrap
 * - Se auto-oculta después del tiempo especificado
 * - Posicionado en esquina inferior derecha (fixed)
 * - Color personalizable mediante clases Bootstrap
 */
function CustomToast({ titulo, mensaje, mostrar, color, tiempo = 5000 }) {
  const [show, setShow] = useState(true);

  return (
    <>

      <Toast
        onClose={() => setShow(false)}
        show={mostrar && show}
        delay={tiempo}
        autohide={true}
        style={{ position: 'relative', bottom: 20, right: 20, minWidth: 250, zIndex: 9999 }}
        className=''

      >
        <Toast.Header className='bg-dark' closeButton={true}>
          <strong className={`m-auto ${color}`} style={{ fontSize: '1.3rem', justifyContent: 'center' }}>{titulo}</strong>
        </Toast.Header>
        <Toast.Body style={{ fontSize: '1rem', backgroundColor: 'gainsboro', animationName: 'toastAnimate', animationDuration: '6s' }} className='align-middle text-dark'>

          {mensaje}

        </Toast.Body>
      </Toast>
    </>
  );
}

/**
 * Convierte minutos totales a formato legible (días, horas, minutos)
 * @function parsearMinutos
 * @param {number} totalMinutos - Total de minutos a convertir
 * @returns {string} Formato legible (ej: "2 días, 3 h, 45 min")
 * @returns {string} Mensaje de error si totalMinutos es negativo
 * @returns {string} "0 min" si totalMinutos es 0
 * 
 * @example
 * parsearMinutos(1505)
 * // Returns: "1 día, 1 h, 5 min"
 * 
 * parsearMinutos(125)
 * // Returns: "2 h, 5 min"
 * 
 * parsearMinutos(45)
 * // Returns: "45 min"
 * 
 * @description
 * - Desglose: totalMinutos / 1440 = días
 * - Resto / 60 = horas
 * - Resto = minutos
 * - Solo muestra componentes > 0
 * - Pluraliza "día/días" correctamente
 * - Uso: duración de viajes, tiempos de proceso
 */
function parsearMinutos(totalMinutos) {
  if (totalMinutos < 0) {
    return "El número de minutos no puede ser negativo.";
  }

  const minutosEnUnaHora = 60;
  const minutosEnUnDia = 24 * minutosEnUnaHora;

  // Calcular días
  const dias = Math.floor(totalMinutos / minutosEnUnDia);
  let minutosRestantes = totalMinutos % minutosEnUnDia;

  // Calcular horas
  const horas = Math.floor(minutosRestantes / minutosEnUnaHora);
  minutosRestantes = minutosRestantes % minutosEnUnaHora;

  // Los minutos restantes son los minutos finales
  const minutos = minutosRestantes;

  // Construir la cadena de resultado
  const partes = [];
  if (dias > 0) {
    partes.push(`${dias} día${dias > 1 ? 's' : ''}`);
  }
  if (horas > 0) {
    partes.push(`${horas} h`);
  }
  if (minutos > 0) {
    partes.push(`${minutos.toFixed(0)} min`);
  }

  if (partes.length === 0) {
    return '0 min';
  }

  return partes.join(', ');
}

/**
 * Componente para visualizar opciones de ruta con detalles
 * @component
 * @param {Object} props - Props del componente
 * @param {string} props.tipo - Tipo de ruta (ej: "Óptima", "Libre", "Recomendada")
 * @param {string|number} props.distance - Distancia de la ruta
 * @param {string} props.time - Tiempo de viaje estimado
 * @param {string} [props.distanceUnit=" KM"] - Unidad de distancia
 * @param {Object} props.costs - Objeto de costos
 * @param {string} props.costs.label - Etiqueta de costo (ej: "Peaje")
 * @param {string|number} props.costs.value - Valor del costo
 * @param {string} [props.advertencias=""] - Advertencias adicionales
 * @param {string} [props.color="gray"] - Color del texto/icono
 * @returns {React.ReactElement} Card con información de ruta
 * 
 * @example
 * <RouteOption
 *   tipo="Óptima"
 *   distance="850"
 *   time="12 h, 30 min"
 *   costs={{ label: "Peaje", value: "450.00" }}
 *   advertencias="Incluye casetas de peaje"
 *   color="green"
 * />
 * 
 * @description
 * - Renderiza tarjeta con borde redondeado
 * - Muestra tipo, distancia, tiempo, costos
 * - Icono "i" con tooltip de advertencias
 * - Diseño responsivo con Bootstrap
 * - Color personalizable para cada opción
 */
const RouteOption = ({ tipo, distance, time, distanceUnit = ' KM', costs, advertencias = '', color = 'gray' }) => {
  return (
    <div className="border rounded p-3 py-0 bg-light" style={{ minWidth: '100px', color: `${color}` }}>
      {/* Header con ícono de información */}
      <div className="d-flex align-items-center justify-content-between ">
        <div className="d-flex align-items-center">
          <span
            className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center me-2 ml-2"
            style={{ width: '20px', height: '20px', fontSize: '12px' }}
            title={advertencias || 'Opción de ruta'}
          >
            i
          </span>
          <strong className='ml-4' style={{ fontSize: '0.9rem', color: `${color}` }}>{tipo}</strong>
        </div>
      </div>

      {/* Distancia */}
      <div className="mb-2">
        <small className="text-muted d-block" style={{ fontSize: '.8rem' }}>Distancia</small>
        <div>
          <strong style={{ fontSize: '1rem' }}>{distance}</strong>
          <small className="text-muted ms-1" style={{ fontSize: '.7rem' }}>{(distanceUnit)}</small>
        </div>
      </div>

      {/* Tiempo */}
      <div className="border-top py-0 pt-1 row">
        <small className="text-muted d-block pr-3" style={{ fontSize: '.7rem' }}>Tiempo</small>
        <strong>{time}</strong>
      </div>
      {/* Costos */}
      <div className="py-0 pt-1 row">
        <small className="text-muted d-block pr-3" style={{ fontSize: '.7rem' }}>{costs.label}</small>
        <strong style={{ fontSize: '0.85rem' }}>{(costs.value === 'Sin costo') ? '' : '$'}{costs.value}</strong>
      </div>
    </div>
  );
};


/**
 * Modal de selección con dropdown para el origen/destino del directorio en el creador de rutas.
 * @component
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Controla visibilidad del modal
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Function} props.onSelect - Callback con valor seleccionado
 * @param {string} props.valorCampo - Valor actual del campo (mostrado en alerta)
 * @param {Array<Object>} props.valoresSugeridos - Array de opciones
 * @param {string} props.valoresSugeridos[].id_Tipo_ruta - ID de la ruta

 * @param {string} [props.titulo=""] - Título del modal
 * @param {string} [props.campo=""] - Nombre del campo
 * @param {string} [props.tituloDelSelect="Opciones"] - Etiqueta del select
 * @returns {React.ReactElement|null} Modal o null si no está abierto
 * 
 * @example
 * const [modalOpen, setModalOpen] = useState(false);
 * const [selected, setSelected] = useState(null);
 * 
 * <ModalSelector
 *   isOpen={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   onSelect={(value) => setSelected(value)}
 *   valorCampo="Guadalajara"
 *   valoresSugeridos={rutasData}
 *   titulo="Seleccionar Ruta"
 *   campo="Origen"
 *   tituloDelSelect="Rutas disponibles"
 * />
 * 
 * @description
 * - Modal centrado con backdrop
 * - Select dropdown con opciones
 * - Formatea razones sociales automáticamente
 * - Botones Cancelar y Confirmar
 * - Botón confirmar deshabilitado si nada seleccionado
 * - Estilos Bootstrap SB Admin
 */
const ModalSelectorOrigenDestino = ({ isOpen, onClose, onSelect, objeto, valoresSugeridos }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [objetoMostrado, setObjetoMostrado] = useState(objeto);

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (clienteSeleccionado) {
      onSelect(clienteSeleccionado);
      setClienteSeleccionado('');
      setObjetoMostrado(objeto);
      onClose();
    }
  };

  const handleCancelar = () => {
    setClienteSeleccionado('');
    setObjetoMostrado(objeto);
    onClose();
  };

  const handleSeleccionChange = (e) => {
    const valorSeleccionado = e.target.value;
    setClienteSeleccionado(valorSeleccionado);
    if (valorSeleccionado) {
      // Buscar el objeto completo en valoresSugeridos
      const objetoEncontrado = valoresSugeridos.find(
        valor => valor.ID_entidad == valorSeleccionado
      );

      if (objetoEncontrado) {
        setObjetoMostrado(objetoEncontrado);
      }
    } else {
      // Si no hay selección, mostrar el objeto inicial
      setObjetoMostrado(objeto);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={handleCancelar}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show"
        style={{ display: 'block', zIndex: 1050 }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg">
            <div className="form-group pt-3 px-4">
              <label className="font-weight-bold text-gray-800">
                Vinculando cliente manualmente<span className="text-danger">*</span> <small>(Con base en la población)</small>
              </label>
              <select
                value={clienteSeleccionado}
                onChange={handleSeleccionChange}
                className="form-control form-control-lg border-left-primary"
                style={{ borderLeftWidth: '4px' }}
              >
                <option value="">-- Selecciona una opción --</option>
                {valoresSugeridos.map((valor) => (
                  <option key={valor.ID_entidad + '_' + (valor.distancia_km || '')} value={valor.ID_entidad}>
                    {((valor.distancia_km) ? `*C*` : '')} ID: {valor.ID_entidad} | {formatearRazonesSociales(valor.Nombre)} | {formatearRazonesSociales(valor.ID_poblacion)}
                  </option>
                ))}
              </select>
              {!clienteSeleccionado && (
                <small className="form-text text-muted">
                  <i className="fas fa-info-circle mr-1"></i>
                  Por favor selecciona una opción para ver la ruta asociada en TUSA.
                </small>
              )}
            </div>

            {/* Body - Mostrar card solo si hay un objeto para mostrar */}
            {objetoMostrado && (
              <div className="col mb-4">
                <div className="card shadow-sm h-100 border-left-primary" style={{ borderLeftWidth: '4px' }}>
                  <div className="card-body p-3">
                    {/* Header del card */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="text-primary font-weight-bold mb-0" style={{ fontSize: '0.85rem' }}>
                        {objetoMostrado.Nombre || 'Nombre no registrado'}
                      </h6>
                      <span className="badge badge-primary badge-sm">{objetoMostrado.Grupo || 'Grupo no registrado'}</span>
                    </div>

                    {/* Razón Social */}
                    <p className="text-gray-800 mb-2" style={{ fontSize: '0.75rem' }}>
                      <Building size={12} className="mr-1" style={{ display: 'inline', verticalAlign: 'middle' }} />
                      {objetoMostrado.Razon_social || 'Razón social no registrado'}
                    </p>

                    {/* Información de Contacto */}
                    <div className="mb-2">
                      <div className="d-flex align-items-center mb-1" style={{ fontSize: '0.7rem' }}>
                        <User size={11} className="text-gray-600 mr-1" />
                        <span className="text-gray-700">{objetoMostrado.Contacto || 'Contacto no registrado'}</span>
                      </div>

                      <div className="d-flex align-items-center mb-1" style={{ fontSize: '0.7rem' }}>
                        <Phone size={11} className="text-gray-600 mr-1" />
                        <span className="text-gray-700">{objetoMostrado.Celular || 'Celular no registrado'}</span>
                      </div>

                      <div className="d-flex align-items-center mb-1" style={{ fontSize: '0.7rem' }}>
                        <Mail size={11} className="text-gray-600 mr-1" />
                        <span className="text-gray-700 text-truncate" style={{ maxWidth: '180px' }}>
                          {objetoMostrado.Correo_electronico || 'Correo no registrado'}
                        </span>
                      </div>
                    </div>

                    {/* Dirección */}
                    <div className="mb-2 pb-2 border-bottom" style={{ fontSize: '0.7rem' }}>
                      <MapPin size={11} className="text-gray-600 mr-1" style={{ display: 'inline', verticalAlign: 'top' }} />
                      <span className="text-gray-700">{objetoMostrado.Direccion || 'Dirección no registrado'}</span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="row text-xs text-gray-600 g-1">
                      <div className="col-6 mb-1">
                        <span className="d-block text-primary">
                          ID del Directorio:
                        </span>
                        {objetoMostrado.ID_entidad || '__'}
                      </div>
                      <div className="col-6 mb-1">
                        <span className="d-block text-primary">
                          Modificado por:
                        </span>
                        {objetoMostrado.ID_Usuario || '__'}
                      </div>
                      <div className="col-6 mb-1">
                        <span className="d-block text-primary">Población:</span>
                        {objetoMostrado.ID_poblacion || '__'}
                      </div>
                      <div className="col-6 mb-1">
                        <span className="d-block text-primary">Modificado el:</span>
                        <Calendar size={10} className="mr-1" style={{ display: 'inline', verticalAlign: 'middle' }} />
                        {formatearFecha(objetoMostrado.Fecha_captura) || '__'}
                      </div>
                      <div className="col-12 mb-1 ">
                        <span className="d-block text-primary">Coordenadas:</span>
                        <LocateFixed size={15} className="mr-1" style={{ display: 'inline', verticalAlign: 'middle' }} />
                        {objetoMostrado.latitud || '__'}, {objetoMostrado.longitud || '__'}
                      </div>


                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="modal-footer bg-light">
              <button
                type="button"
                onClick={handleCancelar}
                className="btn btn-secondary"
              >
                <i className="fas fa-times mr-2"></i>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={!clienteSeleccionado}
                className="btn btn-success"
              >
                <i className="fas fa-check mr-2"></i>
                Vincular Cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};



/**
 * Modal de selección con dropdown para el origen/destino del directorio en el creador de rutas.
 * @component
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Controla visibilidad del modal
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Function} props.onSelect - Callback con valor seleccionado
 * @param {string} props.valorCampo - Valor actual del campo (mostrado en alerta)
 * @param {Array<Object>} props.valoresSugeridos - Array de opciones
 * @param {string} props.valoresSugeridos[].id_Tipo_ruta - ID de la ruta

 * @param {string} [props.titulo=""] - Título del modal
 * @param {string} [props.campo=""] - Nombre del campo
 * @param {string} [props.tituloDelSelect="Opciones"] - Etiqueta del select
 * @returns {React.ReactElement|null} Modal o null si no está abierto
 * 
 * @example
 * const [modalOpen, setModalOpen] = useState(false);
 * const [selected, setSelected] = useState(null);
 * 
 * <ModalSelector
 *   isOpen={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   onSelect={(value) => setSelected(value)}
 *   valorCampo="Guadalajara"
 *   valoresSugeridos={rutasData}
 *   titulo="Seleccionar Ruta"
 *   campo="Origen"
 *   tituloDelSelect="Rutas disponibles"
 * />
 * 
 * @description
 * - Modal centrado con backdrop
 * - Select dropdown con opciones
 * - Formatea razones sociales automáticamente
 * - Botones Cancelar y Confirmar
 * - Botón confirmar deshabilitado si nada seleccionado
 * - Estilos Bootstrap SB Admin
 */
const ModalConfirmacion = ({ isOpen, onClose, onSelect, mensaje }) => {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmar = () => {
    onSelect(true);
    onClose();
  };

  const handleCancelar = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={handleCancelar}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show"
        style={{ display: 'block', zIndex: 1050 }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg">
            <div className="form-group pt-3 px-4">
              <label className="font-weight-bold text-gray-800">
                ¿Confirmas que <span className="text-danger"> {mensaje}</span> ?
              </label>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={handleCancelar}
                className="btn btn-secondary"
                tabIndex={1}
              >
                <i className="fas fa-times mr-2"></i>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                className="btn btn-success"
                tabIndex={2}
              >
                <i className="fas fa-check mr-2"></i>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};



/**
 * Modal de selección con dropdown
 * @component
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Controla visibilidad del modal
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Function} props.onSelect - Callback con valor seleccionado
 * @param {string} props.valorCampo - Valor actual del campo (mostrado en alerta)
 * @param {Array<Object>} props.valoresSugeridos - Array de opciones
 * @param {string} props.valoresSugeridos[].id_Tipo_ruta - ID de la ruta
 * @param {string} props.valoresSugeridos[].RazonOrigen - Origen
 * @param {string} props.valoresSugeridos[].RazonDestino - Destino
 * @param {string} props.valoresSugeridos[].Categoria - Categoría
 * @param {string} [props.titulo=""] - Título del modal
 * @param {string} [props.campo=""] - Nombre del campo
 * @param {string} [props.tituloDelSelect="Opciones"] - Etiqueta del select
 * @returns {React.ReactElement|null} Modal o null si no está abierto
 * 
 * @example
 * const [modalOpen, setModalOpen] = useState(false);
 * const [selected, setSelected] = useState(null);
 * 
 * <ModalSelector
 *   isOpen={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   onSelect={(value) => setSelected(value)}
 *   valorCampo="Guadalajara"
 *   valoresSugeridos={rutasData}
 *   titulo="Seleccionar Ruta"
 *   campo="Origen"
 *   tituloDelSelect="Rutas disponibles"
 * />
 * 
 * @description
 * - Modal centrado con backdrop
 * - Select dropdown con opciones
 * - Formatea razones sociales automáticamente
 * - Botones Cancelar y Confirmar
 * - Botón confirmar deshabilitado si nada seleccionado
 * - Estilos Bootstrap SB Admin
 */
const ModalSelector = ({ isOpen, onClose, onSelect, valorCampo, valoresSugeridos, titulo = '', campo = '', tituloDelSelect = 'Opciones' }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (clienteSeleccionado) {
      onSelect(clienteSeleccionado);
      setClienteSeleccionado('');
      onClose();
    }
  };

  const handleCancelar = () => {
    setClienteSeleccionado('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={handleCancelar}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show"
        style={{ display: 'block', zIndex: 1050 }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg">
            {/* Header */}
            <div className="modal-header bg-gradient-primary">
              <h5 className="modal-title text-white">
                <i className="fas fa-user-tie mr-2"></i>
                {titulo || 'Seleccionar Cliente para la Población'}
              </h5>
              <button
                type="button"
                className="close text-white"
                onClick={handleCancelar}
                style={{ opacity: 0.8 }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <div className="alert alert-info border-left-info" role="alert">
                <i className="fas fa-map-marker-alt mr-2"></i>
                <strong>{campo}:</strong> {valorCampo}
              </div>
              <div className="form-group">
                <label className="font-weight-bold text-gray-800">
                  {tituloDelSelect} <span className="text-danger">*</span>
                </label>
                <select
                  value={clienteSeleccionado}
                  onChange={(e) => {
                    setClienteSeleccionado(e.target.value);
                  }}
                  className="form-control form-control-lg border-left-primary"
                  style={{ borderLeftWidth: '4px' }}
                >
                  <option value="">-- Selecciona una opción --</option>
                  {valoresSugeridos.map((valor) => (
                    <option key={valor.id_Tipo_ruta} value={valor.id_Tipo_ruta}>
                      ID: {valor.id_Tipo_ruta} | {formatearRazonesSociales(valor.RazonOrigen)} → {formatearRazonesSociales(valor.RazonDestino)} __ ({valor.Categoria})
                    </option>
                  ))}
                </select>
                {!clienteSeleccionado && (
                  <small className="form-text text-muted">
                    <i className="fas fa-info-circle mr-1"></i>
                    Por favor selecciona una opción para ver la ruta asociada en TUSA.
                  </small>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light">
              <button
                type="button"
                onClick={handleCancelar}
                className="btn btn-secondary"
              >
                <i className="fas fa-times mr-2"></i>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={!clienteSeleccionado}
                className="btn btn-success"
              >
                <i className="fas fa-check mr-2"></i>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// EXPORTS
// ============================================

/**
 * Exportación de componentes y funciones
 * @module shared/utils
 * 
 * @exports CopiarTag - Componente copiar TAG
 * @exports CopiarFecha - Componente copiar fecha
 * @exports CasetaMapModal - Componente modal con mapa
 * @exports formatearFecha - Función formatear fecha
 * @exports formatearFechaConHora - Función fecha con hora
 * @exports formatearNombre - Función formatear nombre
 * @exports formatearDinero - Función formatear dinero
 * @exports formatearEnteros - Función formatear números
 * @exports formatearRazonesSociales - Función limpiar razones sociales
 * @exports CustomToast - Componente notificación
 * @exports parsearMinutos - Función parsear minutos
 * @exports RouteOption - Componente opción de ruta
 * @exports ModalSelector - Componente modal selector
 * @exports ModalSelectorOrigenDestino - Componente modal selector origen/destino
 * @exports modalConfirmacion - Componente modal de ventana de confirmación
 */

export default CopiarTag;
export {
  CopiarTag,
  CopiarFecha,
  CasetaMapModal,
  formatearFecha,
  formatearFechaConHora,
  formatearNombre,
  formatearDinero,
  formatearEnteros,
  formatearRazonesSociales,
  CustomToast,
  parsearMinutos,
  RouteOption,
  ModalSelector,
  ModalSelectorOrigenDestino,
  ModalConfirmacion
};
