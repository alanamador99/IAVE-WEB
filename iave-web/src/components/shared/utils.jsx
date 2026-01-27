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

import React, { useState, useRef, useEffect, useCallback, use } from 'react';
import { Toast } from 'react-bootstrap';
import { NumericFormat } from 'react-number-format';
import axios from 'axios';
import markerCaseta from 'leaflet/dist/images/MapPinGreen.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';




import { MapPin, Mail, Phone, User, Calendar, Building, Clipboard, LocateFixed, RefreshCcwDot } from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { set } from 'lodash';


// ===== CONSTANTES =====
const testNombreCaseta = 'Caseta Tlanalapa';
const API_KEY = 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';
const API_URL = process.env.REACT_APP_API_URL;
// Iconos de marcadores (fuera del componente para evitar re-creación)
const markerIcons = {
  caseta: L.icon({
    iconUrl: markerCaseta,
    shadowUrl: markerShadow,
    iconSize: [24, 24],
    shadowSize: [40, 40],
  })
};


const switchTipoVehiculo = (tvehiculo) => {
  let resultado;
  switch (tvehiculo) {
    case "1":
      resultado = "Automovil";
      break;
    case "2":
      resultado = "Autobus2Ejes";
      break;
    case "5":
      resultado = "Camion2Ejes";
      break;
    case "6":
      resultado = "Camion3Ejes";
      break;
    case "7":
      resultado = "Camion3Ejes";
      break;
    case "8":
      resultado = "Camion5Ejes";
      break;
    case "9":
      resultado = "Camion5Ejes";
      break;
    case "10":
      resultado = "Camion9Ejes";
      break;
    case "11":
      resultado = "Camion9Ejes";
      break;
    case "12":
      resultado = "Camion9Ejes";
      break;
    default:
      resultado = "Error";
      break;
  }
  return resultado;
}

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
            attribution='&copy; OpenStreetMap contributors || IAVE-WEB ⭐🚌'
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
  const response = RazonSocial.replaceAll('S.A. de C.V.', '').replaceAll('SA. de C.V.', '').replaceAll('SA de CV.', '').replaceAll('S.A. de CV', '').replaceAll('SA de CV', '').replaceAll('S.A. de C.V', '');
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
function CustomToast({ titulo, mensaje, mostrar, color, tiempo = 2000 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(mostrar);
  }, [mostrar]);

  return (
    <>

      <Toast
        onClose={() => setShow(false)}
        show={show}
        delay={tiempo}
        autohide={true}
        style={{ position: 'relative', bottom: 20, right: 20, minWidth: 250, zIndex: 9999 }}
        className=''

      >
        <Toast.Header className='bg-dark' closeButton={true}>
          <strong className={`m-auto ${color}`} style={{ fontSize: '1.3rem', justifyContent: 'center' }}>{titulo}</strong>
        </Toast.Header>
        <Toast.Body style={{ fontSize: '1rem', backgroundColor: 'gainsboro', animationName: 'toastAnimate', animationDuration: '2.3s' }} className='align-middle text-dark'>

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
 * - Modal centrado con backdrop
 * @description
 * - Select dropdown con opciones
 * - Formatea razones sociales automáticamente
 * - Botones Cancelar y Confirmar
 * - Botón confirmar deshabilitado si nada seleccionado
 * - Estilos Bootstrap SB Admin
 */
const ModalSelectorOrigenDestino = ({ isOpen, onClose, onConfirm, objeto, valoresSugeridos, tipo }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [objetoMostrado, setObjetoMostrado] = useState(objeto);
  const focusRef = useRef(null);

  useEffect(() => {
    if (isOpen && focusRef.current) {
      requestAnimationFrame(() => {
        focusRef.current.focus();
      });
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
    if (clienteSeleccionado) {
      const objetoSeleccionado = valoresSugeridos.find(
        valor => valor.ID_entidad == clienteSeleccionado
      );
      objetoSeleccionado.nombre = objetoSeleccionado.Nombre;
      onConfirm(objetoSeleccionado);
      setObjetoMostrado(objetoSeleccionado);
      setClienteSeleccionado('');
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
                Vinculando <span className='text text-info'>{tipo} </span> manualmente<span className="text-danger">*</span> <small>(Con base en la población)</small>
              </label>
              <select
                value={clienteSeleccionado}
                onChange={handleSeleccionChange}
                className="form-control form-control-lg border-left-primary"
                ref={focusRef}
                style={{ borderLeftWidth: '4px' }}
                tabIndex={1}
              >
                <option value="">-- Selecciona una opción --</option>
                {valoresSugeridos.map((valor) => (
                  <option key={valor.ID_entidad + '_' + (valor.distancia_km || '')} value={valor.ID_entidad}>
                    {((valor.distancia_km) ? `*C*` : '')} ID: {valor.ID_entidad} | {formatearRazonesSociales(valor.Nombre)} | {valor.ID_poblacion}
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
const ModalConfirmacion = ({ isOpen, onClose, onSelect, mensaje, color, casetaAAgregar }) => {
  const cancelButtonRef = useRef(null);
  const [casetaSeleccionada, setCasetaSeleccionada] = useState('');
  const [lista, setLista] = useState([]);
  const [loadingCasetas, setLoadingCasetas] = useState(true);
  const focusRef = useRef(null);



  useEffect(() => {
    const fetchData = async () => {
      try {
        if (casetaAAgregar && Object.keys(casetaAAgregar).length > 0) {
          const response = await axios.post(
            `${API_URL}/api/casetas/casetaINEGI`,
            casetaAAgregar
          );
          console.log('Respuesta recibida:', response.data);
          setLista(response.data);
        }
      } catch (error) {
        console.error('Error fetching casetas:', error);
        setLista([]);
      } finally {
        console.log('Caseta a agregar:', casetaAAgregar);
        console.log('URL de la API:', `${API_URL}/api/casetas/casetaINEGI`);
        setLoadingCasetas(false);
      }
    };

    if (isOpen && casetaAAgregar) {
      setLoadingCasetas(true);
      fetchData();
    }
  }, [casetaAAgregar, isOpen]);

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
    onClose();
    if (mensaje.includes('eliminar')) onSelect(true);
    if (!casetaSeleccionada) return;
    onSelect(
      lista.find(caseta => caseta.ID_Caseta == casetaSeleccionada)
    );
    console.log('Caseta seleccionada para agregar:',
      lista.find(caseta => caseta.ID_Caseta == casetaSeleccionada));
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
            <div className="form-group pt-3 px-4 mb-0 pb-0">
              <label className="font-weight-bold text-gray-800">
                <span className={`text-${color}`}> {mensaje}</span>
              </label>
            </div>



            {loadingCasetas && casetaAAgregar && (
              <div className="container-fluid pb-3"
                style={{
                  zIndex: 999999,
                  backgroundColor: 'none',
                  width: '60%',
                  height: '8vh',
                  textAlign: 'center',
                  padding: '0px',
                  margin: '0px',
                  display: 'block',
                  alignContent: 'center',
                  placeSelf: 'anchor-center',
                }}>
                <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#045e13ff', alignContent: 'center' }}>
                  <div className="spinner-border text-primary" role="status" style={{ width: "2.8rem", height: "2.8rem" }}>
                    <span className="visually-hidden"></span>
                  </div>
                </div>
              </div>
            )}

            {lista?.length > 0 &&
              <div className="form-group">
                <label className="font-weight-bold text-gray-800">
                  Selecciona la caseta TUSA que deseas agregar: <span className="text-danger">*</span>
                </label>
                <select
                  value={casetaSeleccionada}
                  ref={focusRef}
                  autoFocus={isOpen}
                  tabIndex={1}
                  onChange={(e) => {
                    setCasetaSeleccionada(e.target.value);
                  }}
                  className="form-control form-control-lg border-left-primary"
                  style={{ borderLeftWidth: '4px' }}
                >
                  <option value="">-- Selecciona una opción --</option>
                  {lista.map((valor) => (
                    <option key={valor?.ID_Caseta} value={valor?.ID_Caseta}>
                      ID: {valor?.ID_Caseta} | {valor.Nombre} | {valor.Notas} __ ({valor.Nombre_IAVE} → ${valor[switchTipoVehiculo(casetaAAgregar.ejes)]})
                    </option>
                  ))}
                </select>
                {!casetaSeleccionada && (
                  <small className="form-text text-muted">
                    <i className="fas fa-info-circle mr-1"></i>
                    Por favor selecciona una opción para añadir la caseta INEGI asociada en TUSA.
                  </small>
                )}
              </div>
            }
            {lista?.length === 0 && !loadingCasetas && (
              <div className="form-group px-4">
                <div className="alert alert-warning py-2" role="alert">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  No se encontraron casetas TUSA asociadas a la caseta INEGI proporcionada.

                </div>
                <span>Ampliar rango</span>
                <span>Busqueda especifica</span>
              </div>
            )}



            {/* Footer */}
            <div className="modal-footer bg-light">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={handleCancelar}
                className="btn btn-secondary"
                tabIndex={2}
              >
                <i className="fas fa-times mr-2"></i>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                className="btn btn-success"
                tabIndex={3}
                disabled={(loadingCasetas || (!casetaSeleccionada)) && mensaje.includes('vincular')}

              >
                <i className="fas fa-check mr-2"></i>
                Confirmar
                {mensaje.includes('eliminar') ? ' Eliminación' : ' Adición'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};








const ModalUpdateCaseta = ({ isOpen, onClose, onConfirm, idCaseta }) => {


  const [loadingCasetas, setLoadingCasetas] = useState(false);
  const [nombreCaseta, setNombreCaseta] = useState('');
  const [peajeAutomovil, setPeajeAutomovil] = useState('');
  const [peajeBusDosEjes, setPeajeBusDosEjes] = useState('');
  const [peajeDosEjes, setPeajeDosEjes] = useState('');
  const [peajeTresEjes, setPeajeTresEjes] = useState('');
  const [peajeCincoEjes, setPeajeCincoEjes] = useState('');
  const [peajeNueveEjes, setPeajeNueveEjes] = useState('');
  const [coordenadasCaseta, setCoordenadasCaseta] = useState({ lat: '', lng: '' });
  const [nombreCasetaINEGI, setNombreCasetaINEGI] = useState('');


  const [IDOrigenINEGI, setIDOrigenINEGI] = useState('');
  const [IDDestinoINEGI, setIDDestinoINEGI] = useState('');
  const [peajeAutomovilINEGI, setPeajeAutomovilINEGI] = useState('');
  const [peajeBusDosEjesINEGI, setPeajeBusDosEjesINEGI] = useState('');
  const [peajeDosEjesINEGI, setPeajeDosEjesINEGI] = useState('');
  const [peajeTresEjesINEGI, setPeajeTresEjesINEGI] = useState('');
  const [peajeCincoEjesINEGI, setPeajeCincoEjesINEGI] = useState('');
  const [peajeNueveEjesINEGI, setPeajeNueveEjesINEGI] = useState('');

  useEffect(() => {
    const fetchCasetaData = async () => {
      try {
        setLoadingCasetas(true);
        if (!idCaseta) return;

        // 1. Obtener datos de la caseta local
        const responseCaseta = await fetch(
          `${API_URL}/api/casetas/${idCaseta}/getCasetaByID`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        const dataCaseta = await responseCaseta.json();

        // 2. Actualizar estados locales inmediatamente
        setNombreCaseta(dataCaseta?.Nombre || '');
        setCoordenadasCaseta({
          lat: dataCaseta?.latitud || '',
          lng: dataCaseta?.longitud || ''
        });

        // Seteamos valores iniciales
        setPeajeAutomovil(parseFloat(dataCaseta?.Automovil) || '');
        setPeajeBusDosEjes(parseFloat(dataCaseta?.Autobus2Ejes) || '');
        setPeajeDosEjes(parseFloat(dataCaseta?.Camion2Ejes) || '');
        setPeajeTresEjes(parseFloat(dataCaseta?.Camion3Ejes) || '');
        setPeajeCincoEjes(parseFloat(dataCaseta?.Camion5Ejes) || '');
        setPeajeNueveEjes(parseFloat(dataCaseta?.Camion9Ejes) || '');
        setIDOrigenINEGI(dataCaseta?.OrigenInmediato || '');
        setIDDestinoINEGI(dataCaseta?.DestinoInmediato || '');
        if (dataCaseta?.OrigenInmediato && dataCaseta?.DestinoInmediato) {
          console.log("Origen y destino inmediatos disponibles para INEGI:", dataCaseta?.OrigenInmediato, dataCaseta?.DestinoInmediato);
          // Consultas a INEGI en PARALELO (Optimización)
          const tiposVehiculo = [
            { v: '1', nombre: 'Automovil' },
            { v: '2', nombre: 'Autobus 2 Ejes' },
            { v: '5', nombre: 'Camion 2 Ejes' },
            { v: '6', nombre: 'Camion 3 Ejes' },
            { v: '8', nombre: 'Camion 5 Ejes' },
            { v: '12', nombre: 'Camion 9 Ejes' }
          ];

          const inegiPromises = tiposVehiculo.map(async (tipo) => {
            const formData = new URLSearchParams({
              dest_i: dataCaseta.OrigenInmediato,
              dest_f: dataCaseta.DestinoInmediato,
              v: tipo.v,
              type: 'json',
              key: API_KEY
            });

            const res = await fetch(`https://gaia.inegi.org.mx/sakbe_v3.1/detalle_o`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: formData
            });
            const data = await res.json();
            return data.data.filter(obj => obj.costo_caseta !== 0);
          });

          // Esperamos todas las respuestas juntas (mucho más rápido)
          const resultadosInegi = await Promise.all(inegiPromises);

          console.log("Datos INEGI cargados:", resultadosInegi);

          // Función local para calcular distancia en KM (Haversine)
          const getDistanciaKm = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Radio de la Tierra
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };

          // Asignamos los costos obtenidos buscando la caseta correcta por geolocalización
          resultadosInegi.forEach((resultado, index) => {
            let casetaEncontrada = null;
            let minDist = 5.0; // Tolerancia de 5km para encontrar la caseta

            resultado.forEach(item => {
              try {
                // Parseamos las coordenadas del geojson o punto_caseta de la respuesta
                const geo = JSON.parse(item.punto_caseta || item.geojson);
                const [lon, lat] = geo.coordinates;

                // Comparamos con las coordenadas de nuestra caseta local
                const dist = getDistanciaKm(parseFloat(dataCaseta.latitud), parseFloat(dataCaseta.longitud), lat, lon);

                if (dist < minDist) {
                  minDist = dist;
                  casetaEncontrada = item;
                }
              } catch (e) {
                console.warn("Error calculando distancia de caseta:", e);
              }
            });

            const tipo = tiposVehiculo[index];
            const costoCaseta = casetaEncontrada ? parseFloat(casetaEncontrada.costo_caseta) : 0;

            if (casetaEncontrada) {
              setNombreCasetaINEGI(casetaEncontrada.direccion ? casetaEncontrada.direccion.replace('Cruce la caseta ', '') : '');
            }

            switch (tipo.nombre) {
              case 'Automovil':
                setPeajeAutomovilINEGI(costoCaseta);
                break;
              case 'Autobus 2 Ejes':
                setPeajeBusDosEjesINEGI(costoCaseta);
                break;
              case 'Camion 2 Ejes':
                setPeajeDosEjesINEGI(costoCaseta);
                break;
              case 'Camion 3 Ejes':
                setPeajeTresEjesINEGI(costoCaseta);
                break;
              case 'Camion 5 Ejes':
                setPeajeCincoEjesINEGI(costoCaseta);
                break;
              case 'Camion 9 Ejes':
                setPeajeNueveEjesINEGI(costoCaseta);
                break;
              default:
                break;
            }
          });
        }
        else {
          console.log("No hay origen o destino inmediatos para INEGI en la caseta:", dataCaseta);
          // Seteamos valores INEGI (según lógica original: inicializar con valor local)
          setPeajeAutomovilINEGI(parseFloat(dataCaseta?.Automovil) || '');
          setPeajeBusDosEjesINEGI(parseFloat(dataCaseta?.Autobus2Ejes) || '');
          setPeajeDosEjesINEGI(parseFloat(dataCaseta?.Camion2Ejes) || '');
          setPeajeTresEjesINEGI(parseFloat(dataCaseta?.Camion3Ejes) || '');
          setPeajeCincoEjesINEGI(parseFloat(dataCaseta?.Camion5Ejes) || '');
          setPeajeNueveEjesINEGI(parseFloat(dataCaseta?.Camion9Ejes) || '');
        }



      } catch (error) {
        console.error('Error fetching caseta data:', error);
      } finally {
        setLoadingCasetas(false);
      }
    };

    fetchCasetaData();
  }, [idCaseta]);



  const validarCamposLlenos = () => {
    return (
      peajeAutomovil &&
      peajeBusDosEjes &&
      peajeDosEjes &&
      peajeTresEjes &&
      peajeCincoEjes &&
      peajeNueveEjes
    );
  };



  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    switch (name) {
      case 'txtPeajeAutomovil':
        setPeajeAutomovil(value);
        break;
      case 'txtPeajeAutobus':
        setPeajeBusDosEjes(value);
        break;
      case 'txtPeajeDosEjes':
        setPeajeDosEjes(value);
        break;
      case 'txtPeajeTresEjes':
        setPeajeTresEjes(value);
        break;
      case 'txtPeajeCincoEjes':
        setPeajeCincoEjes(value);
        break;
      case 'txtPeajeNueveEjes':
        setPeajeNueveEjes(value);
        break;
      case 'txtIDOrigenINEGI':
        setIDOrigenINEGI(value);
        break;
      case 'txtIDDestinoINEGI':
        setIDDestinoINEGI(value);
        break;
      default:
        break;
    }
  }, []);
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
    const datosCompletos = {
      API_peajeAutomovil: peajeAutomovil,
      API_peajeBusDosEjes: peajeBusDosEjes,
      API_peajeDosEjes: peajeDosEjes,
      API_peajeTresEjes: peajeTresEjes,
      API_peajeCincoEjes: peajeCincoEjes,
      API_peajeNueveEjes: peajeNueveEjes,
      API_OrigenINEGI: IDOrigenINEGI,
      API_DestinoINEGI: IDDestinoINEGI,
    };
    onConfirm(datosCompletos);
    onClose();
  };


  const handleCancelar = () => {
    setPeajeAutomovil('');
    setPeajeBusDosEjes('');
    setPeajeDosEjes('');
    setPeajeTresEjes('');
    setPeajeCincoEjes('');
    setPeajeNueveEjes('');
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
                <RefreshCcwDot size={20} className="mr-2" style={{ display: 'inline', verticalAlign: 'middle' }} />
                Actualizando costos de caseta
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

              {loadingCasetas &&
                <div className="container-fluid pb-3"
                  style={{
                    zIndex: 999999,
                    backgroundColor: 'none',
                    width: '60%',
                    height: '8vh',
                    textAlign: 'center',
                    padding: '0px',
                    margin: '0px',
                    display: 'block',
                    alignContent: 'center',
                    placeSelf: 'anchor-center',
                  }}>
                  <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#045e13ff', alignContent: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: "2.8rem", height: "2.8rem" }}>
                      <span className="visually-hidden"></span>
                    </div>
                  </div>
                </div>}
              {!loadingCasetas && <div className="form-group">
                <label className="font-weight-bold text-gray-800">
                  Actualizando los costos de la caseta de "{nombreCaseta}" <span className="text-danger">*</span>
                </label>
                {/*Se contempla un input para cada uno de los campos de la caseta que se está actualizando en TUSA. Los cargos se precargan con los datos que se obtienen del INEGI.
                */}


                <div className="form-group">

                  <div className="row mt-2" style={{ justifyContent: 'center' }}>
                    <div className="form-floating" style={{ maxWidth: '8rem', }}>

                      {/* Input para Peaje Automovil */}
                      <NumericFormat
                        name="txtPeajeAutomovil"
                        className="form-control form-control-sm border-left-primary"
                        placeholder='Peaje 2 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeAutomovil', value: values.floatValue || '' } });
                        }}
                        value={peajeAutomovil}
                        id='txtPeajeAutomovil'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                      />
                      <label className="form-label" htmlFor='txtPeajeAutomovil'>Automovil</label>

                    </div>
                    <div className="form-floating pr-2" style={{ maxWidth: '6rem', }}>
                      {/* Input para Peaje Automovil INEGI */}
                      <NumericFormat
                        name="txtPeajeAutomovilINEGI"
                        className="form-control form-control-sm border-left-success"
                        placeholder='Peaje 2 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeAutomovilINEGI', value: values.floatValue || '' } });
                        }}
                        value={peajeAutomovilINEGI}
                        id='txtPeajeAutomovilINEGI'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        disabled={true}
                      />
                      <label className="form-label" htmlFor='txtPeajeAutomovilINEGI'>INEGI</label>

                    </div>
                    <div className="form-floating" style={{ maxWidth: '8rem', }}>
                      {/* Input para Peaje Autobus */}
                      <NumericFormat
                        name="txtPeajeAutobus"
                        className="form-control form-control-sm border-left-primary"
                        placeholder='Peaje 2 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeAutobus', value: values.floatValue || '' } });
                        }}
                        value={peajeBusDosEjes}
                        id='txtPeajeAutobus'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                      />
                      <label className="form-label" htmlFor='txtPeajeAutobus'>Autobus</label>

                    </div>
                    <div className="form-floating pr-2" style={{ maxWidth: '6rem', }}>
                      {/* Input para Peaje Autobus INEGI */}
                      <NumericFormat
                        name="txtPeajeAutobusINEGI"
                        className="form-control form-control-sm border-left-success"
                        placeholder='Peaje 2 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeAutobusINEGI', value: values.floatValue || '' } });
                        }}
                        value={peajeBusDosEjesINEGI}
                        id='txtPeajeAutobusINEGI'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        disabled={true}
                      />
                      <label className="form-label" htmlFor='txtPeajeAutobusINEGI'>INEGI</label>
                    </div>

                  </div>

                  <div className="row mt-2" style={{ justifyContent: 'center' }}>

                    <div className="form-floating" style={{ maxWidth: '8rem', }}>
                      {/* Input para Peaje Camion 2 Ejes */}
                      <NumericFormat
                        name="txtPeaje2Ejes"
                        className="form-control form-control-sm border-left-primary"
                        placeholder='Peaje 2 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeaje2Ejes', value: values.floatValue || '' } });
                        }}
                        value={peajeDosEjes}
                        id='txtPeaje2Ejes'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                      />
                      <label className="form-label" htmlFor='txtPeaje2Ejes'>C_2ejes</label>
                    </div>
                    <div className="form-floating pr-2" style={{ maxWidth: '6rem', }}>
                      {/* Input para Peaje Camion 2 Ejes INEGI */}
                      <NumericFormat
                        name="txtPeaje2EjesINEGI"
                        className="form-control form-control-sm border-left-success"
                        placeholder='Peaje 2 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeaje2EjesINEGI', value: values.floatValue || '' } });
                        }}
                        value={peajeDosEjesINEGI}
                        id='txtPeaje2EjesINEGI'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        disabled={true}
                      />
                      <label className="form-label" htmlFor='txtPeaje2EjesINEGI'>INEGI</label>
                    </div>



                    <div className="form-floating" style={{ maxWidth: '8rem', }}>
                      {/* Input para Peaje Camion 3 Ejes */}
                      <NumericFormat
                        name="txtPeajeTresEjes"
                        className="form-control form-control-sm border-left-primary"
                        placeholder='Peaje 3 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeTresEjes', value: values.floatValue || '' } });
                        }}
                        value={peajeTresEjes}
                        id='txtPeajeTresEjes'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                      />
                      <label className="form-label" htmlFor='txtPeajeTresEjes'>C_3ejes</label>
                    </div>
                    <div className="form-floating pr-2" style={{ maxWidth: '6rem', }}>
                      {/* Input para Peaje Camion 3 Ejes INEGI */}
                      <NumericFormat
                        name="txtPeajeTresEjesINEGI"
                        className="form-control form-control-sm border-left-success"
                        placeholder='Peaje 3 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeTresEjesINEGI', value: values.floatValue || '' } });
                        }}
                        value={peajeTresEjesINEGI}
                        id='txtPeajeTresEjesINEGI'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        disabled={true}
                      />
                      <label className="form-label" htmlFor='txtPeajeTresEjesINEGI'>INEGI</label>
                    </div>
                  </div>

                  <div className="row mt-2" style={{ justifyContent: 'center' }}>

                    <div className="form-floating" style={{ maxWidth: '8rem', }}>
                      {/* Input para Peaje Camion 5 Ejes */}
                      <NumericFormat
                        name="txtPeajeCincoEjes"
                        className="form-control form-control-sm border-left-primary"
                        placeholder='Peaje 5 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeCincoEjes', value: values.floatValue || '' } });
                        }}
                        value={peajeCincoEjes}
                        id='txtPeajeCincoEjes'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                      />
                      <label className="form-label" htmlFor='txtPeajeCincoEjes'>C_5ejes</label>

                    </div>
                    <div className="form-floating pr-2" style={{ maxWidth: '6rem', }}>
                      {/* Input para Peaje Camion 5 Ejes INEGI */}
                      <NumericFormat
                        name="txtPeajeCincoEjesINEGI"
                        className="form-control form-control-sm border-left-success"
                        placeholder='Peaje 5 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeCincoEjesINEGI', value: values.floatValue || '' } });
                        }}
                        value={peajeCincoEjesINEGI}
                        id='txtPeajeCincoEjesINEGI'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        disabled={true}
                      />
                      <label className="form-label" htmlFor='txtPeajeCincoEjesINEGI'>INEGI</label>
                    </div>

                    <div className="form-floating" style={{ maxWidth: '8rem', }}>
                      {/* Input para Peaje Camion 9 Ejes */}
                      <NumericFormat
                        name="txtPeajeNueveEjes"
                        className="form-control form-control-sm border-left-primary"
                        placeholder='Peaje 9 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeNueveEjes', value: values.floatValue || '' } });
                        }}
                        value={peajeNueveEjes}
                        id='txtPeajeNueveEjes'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                      />
                      <label className="form-label" htmlFor='txtPeajeNueveEjes'>C_9ejes</label>
                    </div>
                    <div className="form-floating pr-2" style={{ maxWidth: '6rem', }}>
                      {/* Input para Peaje Camion 9 Ejes INEGI */}
                      <NumericFormat
                        name="txtPeajeNueveEjesINEGI"
                        className="form-control form-control-sm border-left-success"
                        placeholder='Peaje 9 Ejes'
                        onValueChange={(values) => {
                          handleChange({ target: { name: 'txtPeajeNueveEjesINEGI', value: values.floatValue || '' } });
                        }}
                        value={peajeNueveEjesINEGI}
                        id='txtPeajeNueveEjesINEGI'
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        disabled={true}
                      />
                      <label className="form-label" htmlFor='txtPeajeNueveEjesINEGI'>INEGI</label>
                    </div>

                  </div>
                </div>

                {!loadingCasetas && <MapContainer
                  center={[coordenadasCaseta.lat, coordenadasCaseta.lng]}
                  zoom={13}
                  style={{ height: '200px', width: '100%', marginTop: '15px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors || IAVE-WEB ⭐🚌'
                  />
                  <Marker position={[coordenadasCaseta.lat, coordenadasCaseta.lng]}>
                    <Popup>
                      Ubicación TUSA de la caseta "{nombreCaseta}".
                    </Popup>
                  </Marker>
                </MapContainer>}

                <div className="form-group">
                  <div className="row mt-2" style={{ justifyContent: 'center' }}>

                    {/* Inputs para las coordenadas de la caseta, por si se decide igualarlas a las coordenadas del INEGI */}
                    <div className="form-floating pr-2" >
                      <input type="number" name="txtLatitudTUSA" className="form-control form-control-sm border-left-info" placeholder='Latitud TUSA' onChange={handleChange} value={coordenadasCaseta.lat} id='txtLatitudTUSA' />
                      <label className="form-label" htmlFor='txtLatitudTUSA'>Latitud TUSA</label>
                    </div>
                    <div className="form-floating pr-2" >
                      <input type="number" name="txtLongitudTUSA" className="form-control form-control-sm border-left-info" placeholder='Longitud TUSA' onChange={handleChange} value={coordenadasCaseta.lng} id='txtLongitudTUSA' />
                      <label className="form-label" htmlFor='txtLongitudTUSA'>Longitud TUSA</label>
                    </div>



                    {/* Inputs para el origen inmediato, que viene sobre la respuesta de la API de TUSA*/}
                    <div className="row mt-2">
                      <div className="form-floating pr-2" >
                        <input name="txtNombreCaseta" className="form-control form-control-sm border-left-info" placeholder='Origen Inmediato' onChange={handleChange} value={nombreCasetaINEGI} id='txtOrigenInmediato' />
                        <label className="form-label" htmlFor='txtOrigenInmediato'>Caseta</label>
                      </div>
                    </div>


                    <div className="row mt-2">
                      <div className="form-floating pr-2" >
                        <input type="number" min="0" step="1" name="txtIDOrigenINEGI" className="form-control form-control-sm border-left-info" placeholder='ID Origen INEGI' onChange={handleChange} value={IDOrigenINEGI} id='txtIDOrigenINEGI' />
                        <label className="form-label" htmlFor='txtIDOrigenINEGI'>ID Origen INEGI</label>
                      </div>

                      <div className="form-floating pr-2" >
                        <input type="number" min="0" step="1" name="txtIDDestinoINEGI" className="form-control form-control-sm border-left-info" placeholder='ID Destino INEGI' onChange={handleChange} value={IDDestinoINEGI} id='txtIDDestinoINEGI' />
                        <label className="form-label" htmlFor='txtIDDestinoINEGI'>ID Destino INEGI</label>
                      </div>
                    </div>
                  </div>
                </div>
                {!validarCamposLlenos() && (
                  <small className="form-text text-muted">
                    <i className="fas fa-info-circle mr-1"></i>
                    Completa todos los campos para continuar.
                  </small>
                )}
              </div>}

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
                disabled={!validarCamposLlenos()}
                className="btn btn-success"
                style={{ cursor: validarCamposLlenos() ? 'pointer' : 'not-allowed' }}
              >
                <i className="fas fa-check mr-2"></i>
                Confirmar
              </button>
            </div>
          </div>
        </div >
      </div >
    </>
  );
};










const ModalFillCreation = ({ isOpen, onClose, onConfirm, datosPrecargados }) => {
  const cancelButtonRef = useRef(null);
  const [kmReales, setKmReales] = useState('');
  const [kmOficiales, setKmOficiales] = useState('');
  const [kmDePago, setKmDePago] = useState('');
  const [kmTabulados, setKmTabulados] = useState('');
  const [peajeDosEjes, setPeajeDosEjes] = useState('');
  const [peajeTresEjes, setPeajeTresEjes] = useState('');
  const [categoriaRuta, setCategoriaRuta] = useState();
  const [alterna, setAlterna] = useState(false);

  useEffect(() => {
    setPeajeDosEjes(parseFloat(datosPrecargados?.peajeDosEjes) || '');
    setPeajeTresEjes(parseFloat(datosPrecargados?.peajeTresEjes) || '');
    setKmOficiales(datosPrecargados?.distanciaTotal || '');
  }, [datosPrecargados]);


  const validarCamposLlenos = () => {
    return (
      kmReales &&
      kmOficiales &&
      kmDePago &&
      kmTabulados &&
      peajeDosEjes &&
      peajeTresEjes &&
      categoriaRuta
    );
  };



  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    switch (name) {
      case 'txtKmReales':
        setKmReales(value);
        break;
      case 'txtKmOficiales':
        setKmOficiales(value);
        break;
      case 'txtKmDePago':
        setKmDePago(value);
        break;
      case 'txtKmTabulados':
        setKmTabulados(value);
        break;
      case 'txtPeajeDosEjes':
        setPeajeDosEjes(value);
        break;
      case 'txtPeajeTresEjes':
        setPeajeTresEjes(value);
        break;
      case 'selectCategoriaRuta':
        setCategoriaRuta(value);
        break;
      default:
        break;
    }
  }, []);
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
    const datosCompletos = {
      Km_reales: kmReales,
      Km_oficiales: kmOficiales,
      Km_de_pago: kmDePago,
      Km_Tabulados: kmTabulados,
      Peaje_Dos_Ejes: peajeDosEjes,
      Peaje_Tres_Ejes: peajeTresEjes,
      Alterna: alterna,
      Categoria: categoriaRuta
    };
    onConfirm(datosCompletos);
    onClose();
  };


  const handleCancelar = () => {
    setKmReales('');
    setKmOficiales('');
    setKmDePago('');
    setKmTabulados('');
    setPeajeDosEjes('');
    setPeajeTresEjes('');
    setCategoriaRuta('');
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
                Creando nueva ruta TUSA.
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

              <div className="form-group">
                <label className="font-weight-bold text-gray-800">
                  Datos para la creación de una nueva ruta TUSA <span className="text-danger">*</span>
                </label>
                {/*Se contempla un input para cada uno de los campos de la creación de la ruta TUSA:
                PoblacionOrigen, (estos valores se cargarán de los pill de la interfaz gráfica del Route-Creator.jsx)
                PoblacionDestino, (estos valores se cargarán de los pill de la interfaz gráfica del Route-Creator.jsx)
                id_destino, (estos valores se cargarán de los pill de la interfaz gráfica del Route-Creator.jsx)
                id_origen, (estos valores se cargarán de los pill de la interfaz gráfica del Route-Creator.jsx)


                Latinos, (Select)
                Nacionales, (Select)
                Exportacion, (Select)
                Otros, (Select)
                Cemex, (Estos campos estarán en un select/Option porque solo uno puede estar activo)

                Alterna, (este campo estará con un checkbox, para poder activar/desactivar).


                observaciones, (textArea)
                Km_reales, (text)
                Km_oficiales, (text)
                Km_de_pago, (text)
                Km_Tabulados, (text)
                Peaje_Dos_Ejes, (text)
                Peaje_Tres_Ejes (text)
                */}

                <div className="form-group" >

                  <select className="form-control form-control-lg border-left-primary"
                    style={{ borderLeftWidth: '4px' }}
                    onChange={handleChange}
                    value={categoriaRuta}
                    autoFocus={isOpen}
                    name='selectCategoriaRuta'
                  >
                    <option value="">-- Categoría de la ruta --</option>
                    <option value="latinos">Latinos</option>
                    <option value="nacionales">Nacionales</option>
                    <option value="exportacion">Exportacion</option>
                    <option value="cemex">Cemex</option>
                    <option value="otros">Otros</option>
                  </select>
                  <input type="checkbox" onChange={(e) => setAlterna(e.target.checked)} checked={alterna} id="chkAlterna" className='' /> <label htmlFor="chkAlterna"> Ruta Alterna</label>
                </div>

                <hr />
                <div className="form-group">

                  <div className="row" style={{ justifyContent: 'center' }}>

                    <div className="form-floating pr-2" style={{ maxWidth: '9rem', }}>
                      <input type="number" name="txtKmReales" className="form-control form-control-sm border-left-primary" placeholder='KM Reales' onChange={handleChange} value={kmReales} id='txtKmReales' min={0} />
                      <label className="form-label" htmlFor='txtKmReales'>KM Reales</label>
                    </div>

                    <div className="form-floating pr-2" style={{ maxWidth: '9rem', }}>
                      <input type="number" name="txtKmDePago" className="form-control form-control-sm border-left-primary" placeholder='KM de pago' onChange={handleChange} value={kmDePago} id='txtKmDePago' min={0} />
                      <label className="form-label" htmlFor='txtKmDePago'>KM de pago</label>
                    </div>
                  </div>

                  <div className="row mt-2" style={{ justifyContent: 'center' }}>
                    <div className="form-floating pr-2" style={{ maxWidth: '12rem', }}>
                      <input type="number" name="txtKmOficiales" className="form-control form-control-sm border-left-primary" placeholder='KM Oficiales' onChange={handleChange} value={kmOficiales} id='txtKmOficiales' min={0} />
                      <label className="form-label" htmlFor='txtKmOficiales'>KM Oficiales INEGI</label>
                    </div>

                    <div className="form-floating pr-2" style={{ maxWidth: '12rem', }}>
                      <input type="number" name="txtKmTabulados" className="form-control form-control-sm border-left-primary" placeholder='KM Tabulados' onChange={handleChange} value={kmTabulados} id='txtKmTabulados' min={0} />
                      <label className="form-label" htmlFor='txtKmTabulados'>KM Tabulados</label>
                    </div>
                  </div>
                  <hr />

                  <div className="form-group">

                    <div className="row" style={{ justifyContent: 'center' }}>
                      <div className="form-floating pr-2" style={{ maxWidth: '9rem', }}>
                        <NumericFormat
                          name="txtPeajeDosEjes"
                          className="form-control form-control-sm border-left-primary"
                          placeholder='Peaje 2 Ejes'
                          onValueChange={(values) => {
                            handleChange({ target: { name: 'txtPeajeDosEjes', value: values.floatValue || '' } });
                          }}
                          value={peajeDosEjes}
                          id='txtPeajeDosEjes'
                          thousandSeparator=","
                          decimalSeparator="."
                          prefix="$"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          allowNegative={false}
                        />
                        <label className="form-label" htmlFor='txtPeajeDosEjes'>Peaje 2 Ejes</label>
                      </div>


                      <div className="form-floating pr-2" style={{ maxWidth: '9rem', }}>
                        <NumericFormat
                          name="txtPeajeTresEjes"
                          className="form-control form-control-sm border-left-primary"
                          placeholder='Peaje 3 Ejes'
                          onValueChange={(values) => {
                            handleChange({ target: { name: 'txtPeajeTresEjes', value: values.floatValue || '' } });
                          }}
                          value={peajeTresEjes}
                          id='txtPeajeTresEjes'
                          thousandSeparator=","
                          decimalSeparator="."
                          prefix="$"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          allowNegative={false}
                        />
                        <label className="form-label" htmlFor='txtPeajeTresEjes'>Peaje 3 Ejes</label>
                      </div>

                    </div>
                  </div>





                </div>

                {!validarCamposLlenos() && (
                  <small className="form-text text-muted">
                    <i className="fas fa-info-circle mr-1"></i>
                    Completa todos los campos para continuar.
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
                disabled={!validarCamposLlenos()}
                className="btn btn-success"
                style={{ cursor: validarCamposLlenos() ? 'pointer' : 'not-allowed' }}
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
      * @param {Array < Object >} props.valoresSugeridos - Array de opciones
      * @param {string} props.valoresSugeridos[].id_Tipo_ruta - ID de la ruta
      * @param {string} props.valoresSugeridos[].RazonOrigen - Origen
      * @param {string} props.valoresSugeridos[].RazonDestino - Destino
      * @param {string} props.valoresSugeridos[].Categoria - Categoría
      * @param {string} [props.titulo=""] - Título del modal
      * @param {string} [props.campo=""] - Nombre del campo
      * @param {string} [props.tituloDelSelect="Opciones"] - Etiqueta del select
      * @returns {React.ReactElement | null} Modal o null si no está abierto
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
  const focusRef = useRef(null);

  useEffect(() => {
    if (isOpen && focusRef.current) {
      requestAnimationFrame(() => {
        focusRef.current.focus();
      });
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
                  ref={focusRef}
                  autoFocus={isOpen}
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
  ModalConfirmacion,
  ModalFillCreation,
  ModalUpdateCaseta
};
