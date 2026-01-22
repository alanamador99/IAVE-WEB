import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// Importaciones necesarias (agregar al inicio del archivo)
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import Ordenamiento from './route-creator/Sortable';
import { ModalConfirmacion, ModalFillCreation, ModalSelector, ModalSelectorOrigenDestino, CustomToast, parsearMinutos, formatearDinero, RouteOption, formatearEnteros } from '../components/shared/utils';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerATM from 'leaflet/dist/images/ATM__.png';
import markerA from 'leaflet/dist/images/A.png';
import markerCaseta from 'leaflet/dist/images/MapPinGreen.png';
import markerB from 'leaflet/dist/images/B.png';
import markerPin from 'leaflet/dist/images/pin_intermedio.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Button, Container } from 'react-bootstrap';
import { result, set } from 'lodash';
import { AlertTriangle, MapPinPlus, GripVertical, CopyPlus, AlignVerticalJustifyCenter } from 'lucide-react';


// ===== CONSTANTES =====
const API_KEY = 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST';
const API_URL = process.env.REACT_APP_API_URL;
const DEBOUNCE_DELAY = 500;
const MIN_SEARCH_LENGTH = 3;

// Iconos de marcadores (fuera del componente para evitar re-creación)
const markerIcons = {
    ATM: L.icon({
        iconUrl: markerATM,
        shadowUrl: markerShadow,
        iconSize: [25, 15],
        shadowSize: [64, 40],
    }),
    caseta: L.icon({
        iconUrl: markerCaseta,
        shadowUrl: markerShadow,
        iconSize: [24, 24],
        shadowSize: [40, 40],
    }),
    pin: L.icon({
        iconUrl: markerPin,
        shadowUrl: markerShadow,
        iconSize: [40, 40],
        shadowSize: [20, 30],
    }),
    A: L.icon({
        iconUrl: markerA,
        shadowUrl: markerShadow,
        iconSize: [24, 24],
        shadowSize: [40, 40],
    }),
    B: L.icon({
        iconUrl: markerB,
        shadowUrl: markerShadow,
        iconSize: [24, 24],
        shadowSize: [64, 40],
    }),
};

var numIcon = L.divIcon({
    className: 'custom-div-icon', // Usamos la clase CSS que definimos
    html: '<span id="custom-number" >1</span>',      // Contenido HTML (el número o texto)
    iconSize: [30, 30],          // Tamaño total del icono (ancho, alto)
    iconAnchor: [15, 15]         // Punto de anclaje (la mitad del tamaño para centrar)
});

// ===== UTILIDADES =====
const normalizarNombre = (lugar) => {
    if (!lugar?.nombre) return '';
    const partes = lugar.nombre.split(',');
    const tmp = partes[0]?.trim() || lugar.nombre.trim();
    const sinAcentos = tmp.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mayusculas = sinAcentos.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
    if (mayusculas === 'FRAY BERNARDINO DE SAHAGUN') return 'Cd Sahagún';
    return mayusculas;
};


const switchTipoVehiculo = (tvehiculo) => {
    let resultado;
    switch (tvehiculo) {
        case "1":
            resultado = "Automovil";
            break;
        case "2":
            resultado = "Autobus 2 Ejes";
            break;
        case "5":
            resultado = "Camion 2 Ejes";
            break;
        case "6":
            resultado = "Camion 3 Ejes";
            break;
        case "7":
            resultado = "Camion 3 Ejes";
            break;
        case "8":
            resultado = "Camion 5 Ejes";
            break;
        case "9":
            resultado = "Camion 5 Ejes";
            break;
        case "10":
            resultado = "Camion 9 Ejes";
            break;
        case "11":
            resultado = "Camion 9 Ejes";
            break;
        case "12":
            resultado = "Camion 9 Ejes";
            break;
        default:
            resultado = "Error";
            break;
    }
    return resultado;
}

const convertirCoordenadasGeoJSON = (geojsonString) => {
    const geojson = typeof geojsonString === 'string' ? JSON.parse(geojsonString) : geojsonString;

    if (geojson.type === 'MultiLineString') {
        return geojson.coordinates.map(lineString =>
            lineString.map(([lng, lat]) => [lat, lng])
        );
    } else if (geojson.type === 'LineString') {
        return [geojson.coordinates.map(([lng, lat]) => [lat, lng])];
    }
    return geojson;
};

// ===== CUSTOM HOOKS =====
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};



const useDestinationSearch = (searchTerm, tipo) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, DEBOUNCE_DELAY);

    useEffect(() => {
        const searchDestinations = async () => {
            if (!debouncedSearch || debouncedSearch.length < MIN_SEARCH_LENGTH) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const formData = new URLSearchParams({
                    buscar: debouncedSearch,
                    type: 'json',
                    num: 10,
                    key: API_KEY
                });

                const response = await fetch('https://gaia.inegi.org.mx/sakbe_v3.1/buscadestino', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                const data = await response.json();
                setResults(data.data || []);
            } catch (error) {
                console.error(`Error al buscar ${tipo}:`, error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        searchDestinations();
    }, [debouncedSearch, tipo]);

    return { results, loading };
};

// ===== COMPONENTE PRINCIPAL =====
const RutasModule = () => {

    const focusRef = useRef(null);

    useEffect(() => {
        if (focusRef.current) {
            focusRef.current.focus();
        }
    }, []);
    // Referencia a la combinación ctrl + enter para atajo de teclado
    const buttonRefCalcularRuta = useRef(null);
    // Estados de búsqueda
    const [txtOrigen, setTxtOrigen] = useState('');
    const [txtPuntoIntermedio, setTxtPuntoIntermedio] = useState('');
    const [txtDestino, setTxtDestino] = useState('');
    const [tipoVehiculo, setTipoVehiculo] = useState("5");

    // Estados de selección
    const [origen, setOrigen] = useState(null);
    const [destino, setDestino] = useState(null);
    const [puntoIntermedio, setPuntoIntermedio] = useState(null);
    const [casetaAEliminar, setCasetaAEliminar] = useState(null);
    const [casetaAAgregar, setCasetaAAgregar] = useState(null);
    const [tipoTraslado, setTipoTraslado] = useState('');

    const [tipoOrigenDestinoSeleccionado, setTipoOrigenDestinoSeleccionado] = useState(null);
    const [casetasEliminadas, setCasetasEliminadas] = useState([]);
    const [casetasOriginales, setCasetasOriginales] = useState([]);
    const [casetasAgregadas, setCasetasAgregadas] = useState([]);
    const [hayCambiosPendientes, setHayCambiosPendientes] = useState(false);



    // Estados de rutas
    const [datosPrecargadosParaLaCreacionDeRuta, setDatosPrecargadosParaLaCreacionDeRuta] = useState(null);
    const [rutaTusa, setRutaTusa] = useState([]);
    const [casetasEnRutaTusa, setCasetasEnRutaTusa] = useState([]);
    const [rutas_OyL, setRutas_OyL] = useState(null);
    const [rutaSeleccionada, setRutaSeleccionada] = useState([]);
    const [rutasPeaje3Ejes, setRutasPeaje3Ejes] = useState(null);
    const [directoriosCoincidentes, setDirectoriosCoincidentes] = useState([]);

    // Estados de UI
    const [activeId, setActiveId] = useState(null);
    const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
    const [colorModalConfirmacion, setColorModalConfirmacion] = useState(null);
    const [mensajeModal, setMensajeModal] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalCreacionOpen, setIsModalCreacionOpen] = useState(false);
    const [isModalSeleccionOrigenDestinoOpen, setIsModalSeleccionOrigenDestinoOpen] = useState(false);
    const [loadingRutas, setLoadingRutas] = useState(false);
    const [loadingRutaSeleccionada, setLoadingRutaSeleccionada] = useState(false);
    const [boolExiste, setBoolExiste] = useState('Consultando ruta');

    // Custom hooks para búsqueda
    const { results: origenes, loading: loadingOrigen } = useDestinationSearch(txtOrigen, 'Origen');
    const { results: destinos, loading: loadingDestino } = useDestinationSearch(txtDestino, 'Destino');
    const { results: puntosIntermedios, loading: loadingPuntoIntermedio } = useDestinationSearch(txtPuntoIntermedio, 'Intermedio');

    // ===== HANDLERS MEMOIZADOS =====
    const detectarCambiosConsecutivos = useCallback(() => {
        if (casetasOriginales.length === 0) return false;

        // Verificar si cambió el orden comparando consecutivos
        for (let i = 0; i < casetasEnRutaTusa.length; i++) {
            const casetaActual = casetasEnRutaTusa[i];
            const casetaOriginal = casetasOriginales.find(
                c => c.ID_Caseta === casetaActual.ID_Caseta
            );

            if (casetaOriginal && casetaOriginal.consecutivo !== casetaActual.consecutivo) {
                return true;
            }
        }
        return false;
    }, [casetasEnRutaTusa, casetasOriginales]);
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;

        switch (name) {
            case 'txtOrigen':
                setTxtOrigen(value);
                break;
            case 'txtDestino':
                setTxtDestino(value);
                break;
            case 'txtIntermedio':
                setTxtPuntoIntermedio(value);
                break;
            case 'selectTipoVehiculo':
                setTipoVehiculo(value);
                break;
            case 'SelectOrigen':
                setOrigen(origenes.find(item => item.nombre === value) || null);
                break;
            case 'SelectDestino':
                setDestino(destinos.find(item => item.nombre === value) || null);
                break;
            case 'SelectIntermedio':
                setPuntoIntermedio(puntosIntermedios.find(item => item.nombre === value) || null);
                break;
            case 'selectTipoTraslado':
                break;
            default:
                break;
        }
    }, [origenes, destinos, puntosIntermedios]);

    const handlerRetirarIntermedio = useCallback(() => {
        setPuntoIntermedio(null);
        calcularRutaHandler('SinIntermedio');
    }, []);

    const cargarCasetasRuta = useCallback((casetas) => {
        // Asignar consecutivos si no los tienen y normalizar coordenadas
        // En caso de que el objeto casetas no sea un array, evitar error
        if (!Array.isArray(casetas)) {
            console.log('Error: casetas no es un array:', casetas);
            return;
        }
        const casetasConConsecutivos = casetas.map((caseta, index) => ({
            ...caseta,
            consecutivo: caseta.consecutivo || index + 1,
            // Normalizar propiedades de coordenadas para evitar undefined
            latitud: caseta.latitud || caseta.lat,
            longitud: caseta.longitud || caseta.lng
        }));

        setCasetasEnRutaTusa(casetasConConsecutivos);
        setCasetasOriginales(JSON.parse(JSON.stringify(casetasConConsecutivos))); // Deep copy
        setCasetasEliminadas([]);
        setCasetasAgregadas([]);
        setHayCambiosPendientes(false);

        console.log('✅ Casetas cargadas y estado limpio:', casetasConConsecutivos.length);
    }, []);
    // ===== MANEJADOR DEL KEYDOWN =====
    const handleKeyDown = (event) => {
        // Verificar si se presionó Ctrl y Enter
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            // Simular un clic en el botón referenciado
            if (buttonRefCalcularRuta.current) {
                buttonRefCalcularRuta.current.click();
            }
        }
    };


    //funcion para que
    //al mandarla a llamar desde cualquiera de las pildoras de origen/destino, haga una petición a la API de TUSA para obtener los directorios que coincidan con el origen o destino seleccionado
    // la API está sobre /api/casetas/rutas/<origenOdestino>/RutasConCoincidencia. (TEPEAPULCO por ejemplo)
    const changeOrigenDestinoHandler = useCallback(async (tipo, origenOdestino) => {
        origenOdestino = (origenOdestino === 'Fray Bernardino de Sahagún') ? 'Sahagun' : origenOdestino;

        if (tipo === 'Origen' && !origen?.id_dest) {
            alert('Por favor primero selecciona un origen');
            return;
        }
        if (tipo === 'Destino' && !destino?.id_dest) {
            alert('Por favor primero selecciona un destino');
            return;
        }
        const coordenadas = (tipo === 'Origen') ? origenCoords : destinoCoords;
        try {
            setLoadingRutaSeleccionada(true);

            // Petición a la API de TUSA para obtener directorios coincidentes
            const responseDirectoriosCoincidentes = await fetch(
                `${API_URL}/api/casetas/rutas/${origenOdestino}/RutasConCoincidencia`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            // Petición a la API de TUSA para obtener directorios CERCANOS
            //http://localhost:3001/api/casetas/rutas/near-directorio?lat=21.46086089975&lng=-104.82778
            const responseDirectoriosCercanos = await fetch(
                `${API_URL}/api/casetas/rutas/near-directorio?lat=${coordenadas[0]}&lng=${coordenadas[1]}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (!responseDirectoriosCoincidentes.ok) {
                throw new Error(`Error en la respuesta del servidor: ${responseDirectoriosCoincidentes.status}`);
            }
            if (!responseDirectoriosCercanos.ok) {
                throw new Error(`Error en la respuesta del servidor: ${responseDirectoriosCercanos.status}`);
            }


            const data = await responseDirectoriosCoincidentes.json();
            //data1 tiene un campo adicional a data que es: "distancia": 1234 (en kms), vamos a unir ambos arreglos en uno solo
            const data1 = await responseDirectoriosCercanos.json();

            // Unir ambos arreglos en uno solo
            data1.push(...data);
            setTipoOrigenDestinoSeleccionado(tipo);
            setDirectoriosCoincidentes(data1);
            setIsModalSeleccionOrigenDestinoOpen(true);

        } catch (error) {
            console.error('Error al obtener directorios coincidentes:', error);
        } finally {
            setLoadingRutaSeleccionada(false);
        }
    }, [origen, destino]);

    const handleDeleteCaseta = (ID) => {
        const caseta = casetasEnRutaTusa.find(c => (c?.ID === ID || c?.ID_Caseta === ID));
        console.log('caseta a eliminar:', caseta);
        setCasetaAEliminar(caseta?.ID);
        setColorModalConfirmacion('danger');
        setMensajeModal(
            `¿Deseas eliminar la caseta de "${caseta?.Nombre}" de la ruta seleccionada? Esta caseta se eliminará definitivamente al guardar la ruta.`
        );
        setIsModalConfirmacionOpen(true);
    };
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    }

    const handleCrearRuta = async () => {

        console.log("Creando ruta con: ", origen, destino);

        setDatosPrecargadosParaLaCreacionDeRuta({
            id_dest_origenINEGI: origen?.id_dest,
            id_dest_destinoINEGI: destino?.id_dest,
            tipo_vehiculo: tipoVehiculo,
            nombre_origen: normalizarNombre(origen),
            nombre_destino: normalizarNombre(destino),
            peajeDosEjes: (rutaSeleccionada[0]?.costoCasetas || 0),
            distanciaTotal: 10 * Math.ceil(rutaSeleccionada[0]?.distancia / 10) || 0,
        });

        if (!origen?.ID_PoblacionTUSA) {
            alert('Es necesario seleccionar una razón social vinculada en el origen para crear la ruta. Por favor, selecciona la razón social en el siguiente modal.');
            changeOrigenDestinoHandler('Origen', normalizarNombre(origen));
            return;
        }
        if (!destino?.ID_PoblacionTUSA) {
            alert('Es necesario seleccionar una razón social vinculada en el destino para crear la ruta. Por favor, selecciona la razón social en el siguiente modal.');
            changeOrigenDestinoHandler('Destino', normalizarNombre(destino));
            return;
        }
        if (origen?.ID_PoblacionTUSA && destino?.ID_PoblacionTUSA) {
            setIsModalCreacionOpen(true);
        }
    }
    const guardarRutaHandler = async () => {
        try {
            if (!rutaTusa[0]?.id_Tipo_ruta) {
                alert('❌ No hay una ruta seleccionada para guardar');
                console.log(rutaTusa);
                return;
            }

            if (!hayCambiosPendientes && casetasEliminadas.length === 0 && casetasAgregadas.length === 0) {
                alert('ℹ️ No hay cambios pendientes para guardar');
                return;
            }

            // Confirmación antes de guardar
            const confirmar = window.confirm(
                `¿Deseas guardar los cambios en la ruta?\n\n` +
                `• Casetas eliminadas: ${casetasEliminadas.length}\n` +
                `• Casetas agregadas: ${casetasAgregadas.length}\n` +
                `• Cambios en consecutivos: ${detectarCambiosConsecutivos() ? 'Sí' : 'No'}`
            );

            if (!confirmar) return;

            // Preparar datos para enviar
            const datosGuardar = {
                id_Tipo_ruta: rutaTusa[0].id_Tipo_ruta,
                Id_Ruta: casetasEnRutaTusa[0].Id_Ruta,
                casetasActualizadas: casetasEnRutaTusa.map((caseta, index) => ({
                    ID_Caseta: caseta.ID_Caseta,
                    consecutivo: index + 1, // Consecutivo basado en posición actual
                    id_Tipo_ruta: rutaTusa[0].id_Tipo_ruta
                })),
                casetasAEliminar: casetasEliminadas.map(caseta => ({
                    ID_Caseta: caseta.ID_Caseta,
                    id_Tipo_ruta: rutaTusa[0].id_Tipo_ruta
                })),
                casetasAAgregar: casetasAgregadas.map((caseta, index) => ({
                    ID_Caseta: caseta.ID_Caseta,
                    consecutivo: caseta.consecutivo,
                    id_Tipo_ruta: rutaTusa[0].id_Tipo_ruta
                }))
            };

            console.log('💾 Guardando cambios:', datosGuardar);

            // Petición al backend
            const response = await axios.post(
                `${API_URL}/api/casetas/rutas/guardar-cambios`,
                datosGuardar
            );

            if (response.status === 200) {
                alert('✅ Ruta guardada exitosamente');

                // Actualizar estado
                setCasetasOriginales(JSON.parse(JSON.stringify(casetasEnRutaTusa)));
                setCasetasEliminadas([]);
                setCasetasAgregadas([]);
                setHayCambiosPendientes(false);

                console.log('✅ Estado actualizado después de guardar');
            }

        } catch (error) {
            console.error('❌ Error al guardar ruta:', error);
            alert(`❌ Error al guardar la ruta: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleRestaurarRuta = useCallback(() => {
        if (casetasOriginales.length === 0) {
            alert('ℹ️ No hay una ruta original para restaurar');
            return;
        }

        const confirmar = window.confirm(
            '¿Deseas restaurar la ruta a su estado original? Se perderán todos los cambios no guardados.'
        );

        if (confirmar) {
            setCasetasEnRutaTusa(JSON.parse(JSON.stringify(casetasOriginales)));
            setCasetasEliminadas([]);
            setCasetasAgregadas([]);
            setHayCambiosPendientes(false);
            alert('✅ Ruta restaurada al estado original');
        }
    }, [casetasOriginales]);

    // NUEVA FUNCIÓN: Actualizar consecutivo manual
    const handleConsecutivoChange = (idCaseta, nuevoValor) => {
        setCasetasEnRutaTusa((prev) =>
            prev.map(caseta =>
                caseta.ID_Caseta === idCaseta
                    ? { ...caseta, consecutivo: nuevoValor }
                    : caseta
            )
        );
    }

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        setCasetasEnRutaTusa((casetasEnRutaTusa) => {
            const oldIndex = casetasEnRutaTusa.findIndex((caseta) => caseta.ID_Caseta === active.id);
            const newIndex = casetasEnRutaTusa.findIndex((caseta) => caseta.ID_Caseta === over.id);

            if (oldIndex === -1 || newIndex === -1) return casetasEnRutaTusa;

            const reordenado = arrayMove(casetasEnRutaTusa, oldIndex, newIndex);

            const conConsecutivosActualizados = reordenado.map((caseta, index) => ({
                ...caseta,
                consecutivo: index + 1
            }));

            // MARCAR CAMBIOS PENDIENTES
            setHayCambiosPendientes(true);

            return conConsecutivosActualizados;
        });
    }

    const handleAddCaseta = (casetaINEGI) => {
        casetaINEGI.lat = JSON.parse(casetaINEGI.geojson)?.coordinates[1];
        casetaINEGI.lng = JSON.parse(casetaINEGI.geojson)?.coordinates[0];
        casetaINEGI.costo = casetaINEGI?.costo_caseta;
        casetaINEGI.ejes = tipoVehiculo;
        casetaINEGI.nombre = casetaINEGI?.direccion.replace('Cruce la caseta ', '');
        casetaINEGI.consecutivo = casetasEnRutaTusa.length + 1; // Asignar el siguiente consecutivo disponible

        //Depuramos CasetaINEGI antes de mandarla al modal de confirmación (eliminando los demás elementos que no se usan)
        const casetaLimpia = {
            lat: casetaINEGI.lat,
            lng: casetaINEGI.lng,
            costo: casetaINEGI.costo,
            ejes: casetaINEGI.ejes,
            nombre: casetaINEGI.nombre,
        };

        setCasetaAAgregar(casetaLimpia); // Aquí no solo guardamos el ID de la caseta a agregar en la ruta, sino que mandamos toda la caseta al componente hijo para que se consulten las casetas cercanas a la ubicación INEGI y también el costo.
        setColorModalConfirmacion('primary');
        setMensajeModal('Seleccione la caseta que desea vincular con la caseta INEGI "' + casetaINEGI?.direccion.replace('Cruce la caseta ', '') + '" cuyo costo es de $' + casetaINEGI.costo + ' sobre la ruta TUSA actual. ');
        setIsModalConfirmacionOpen(true);
    };


    const handleAgregarTodasLasCasetas = async () => {
        alert('Funcionalidad de copiar al portapapeles ejecutandose. Por favor, espere...');

        const casetasLimpias = rutaSeleccionada[1]?.map(casetaINEGI => {
            casetaINEGI.lat = JSON.parse(casetaINEGI.geojson)?.coordinates[1];
            casetaINEGI.lng = JSON.parse(casetaINEGI.geojson)?.coordinates[0];
            casetaINEGI.costo = casetaINEGI?.costo_caseta;
            casetaINEGI.nombre = casetaINEGI?.direccion.replace('Cruce la caseta ', '');
            const casetaLimpia = {
                lat: casetaINEGI.lat,
                lng: casetaINEGI.lng,
                costo: casetaINEGI.costo,
                nombre: casetaINEGI.nombre,
            };
            return casetaLimpia;
        });

        const response = await axios.post(
            `${API_URL}/api/casetas/rutas/casetas-tusa-coincidentes`,
            { casetasLimpias: casetasLimpias }
        );
        
        const casetasConCoincidencias = response.data.data?.casetas || [];
        let casetasAgregadasCount = 0;

        for (const casetaOrigen of casetasConCoincidencias) {
            // Cada caseta tiene un array 'resultado' con sus coincidencias
            const coincidencias = casetaOrigen.resultado || [];
            
            for (const casetaAAgregarModal of coincidencias) {   
                const casetaNormalizada = {
                    ...casetaAAgregarModal,
                    latitud: casetaAAgregarModal.latitud || casetaAAgregarModal.lat,
                    longitud: casetaAAgregarModal.longitud || casetaAAgregarModal.lng,
                    consecutivo: (casetasEnRutaTusa || []).length + casetasAgregadasCount + 1
                };

                // Agregar la caseta que coincide con el ID_Caseta a la lista visible con el consecutivo correcto
                setCasetasEnRutaTusa(prev => [
                    ...prev,
                    casetaNormalizada
                ]);
                // Agregar a la lista de casetas agregadas
                setCasetasAgregadas(prev => [...prev, casetaNormalizada]);
                setHayCambiosPendientes(true);
                console.log('➕ Caseta agregada:', casetaNormalizada);
                casetasAgregadasCount++;
            }
        }

        if (casetasAgregadasCount > 0) {
            setCasetaAAgregar(null);
            alert(`✅ ${casetasAgregadasCount} caseta(s) agregada(s) exitosamente`);
        } else {
            alert('⚠️ No se encontraron casetas coincidentes');
        }
    };



    // ===== FUNCIONES DE API =====
    const getRouteDetails = useCallback(async (tipoDetalleOoL) => {
        if (!origen?.id_dest || !destino?.id_dest) {
            alert('Por favor ingresa los IDs de origen y destino');
            return;
        }

        try {
            setLoadingRutaSeleccionada(true);

            // Primera petición
            const formData1 = new URLSearchParams({
                dest_i: origen.id_dest,
                dest_f: puntoIntermedio ? puntoIntermedio.id_dest : destino.id_dest,
                v: tipoVehiculo,
                type: 'json',
                key: API_KEY
            });

            const response1 = await fetch(
                `https://gaia.inegi.org.mx/sakbe_v3.1/${tipoDetalleOoL}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData1
                }
            );

            const data1 = await response1.json();

            // Si hay punto intermedio, hacer segunda petición
            if (puntoIntermedio) {
                const formData2 = new URLSearchParams({
                    dest_i: puntoIntermedio.id_dest,
                    dest_f: destino.id_dest,
                    v: tipoVehiculo,
                    e: '0',
                    type: 'json',
                    key: API_KEY
                });

                const response2 = await fetch(
                    `https://gaia.inegi.org.mx/sakbe_v3.1/${tipoDetalleOoL}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData2
                    }
                );

                if (!response2.ok) {
                    throw new Error(`Error en la respuesta del servidor: ${response2.status}`);
                }

                const data2 = await response2.json();

                // Combinar datos
                if (Array.isArray(data1) && Array.isArray(data2)) {
                    return [...data1, ...data2];
                } else if (data1?.data && data2?.data && Array.isArray(data1.data) && Array.isArray(data2.data)) {
                    return { ...data1, data: [...data1.data, ...data2.data] };
                } else if (typeof data1 === 'object' && typeof data2 === 'object') {
                    return { ...data1, ...data2 };
                }
            }

            return data1;
        } catch (error) {
            console.error('Error al obtener detalles de ruta:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoadingRutaSeleccionada(false);
        }
    }, [origen, destino, puntoIntermedio, tipoVehiculo]);

    const getDetalleRuta = useCallback(async (params) => {
        const response = await getRouteDetails(params);

        if (params === 'detalle_o') {
            const selectedRoute = [
                rutas_OyL?.optima,
                response.data?.filter(item => item.costo_caseta != 0) || []
            ];
            setRutaSeleccionada(rutas_OyL ? selectedRoute : []);
        }
        if (params === 'detalle_l') {
            const selectedRoute = [
                rutas_OyL?.libre,
                response.data?.filter(item => item.costo_caseta != 0) || []
            ];
            setRutaSeleccionada(rutas_OyL ? selectedRoute : []);
        }
        setBoolExiste(prev => prev.replace(', selecciona una ruta INEGI', ', recuerda guardar'));
    }, [rutas_OyL, getRouteDetails]);

    const calcularRutaHandler = useCallback(async (e) => {
        if (!origen?.id_dest || !destino?.id_dest) {
            alert('Por favor selecciona un origen y destino válidos');
            return;
        }

        setLoadingRutas(true);
        setRutaTusa([]);
        setRutas_OyL(null);
        setRutaSeleccionada([])
        setCasetasEnRutaTusa([]);

        try {
            const crearFormDataINEGI = (idOrigen, idDestino) => new URLSearchParams({
                dest_i: idOrigen,
                dest_f: idDestino,
                v: "5", // Fijo a 2 ejes para cálculo de ruta óptima y libre
                e: '0',
                type: 'json',
                key: API_KEY
            });
            const crearFormDataINEGIPeaje3Ejes = (idOrigen, idDestino) => new URLSearchParams({
                dest_i: idOrigen,
                dest_f: idDestino,
                v: "6", // Fijo a 3 ejes para cálculo de peaje
                e: '0',
                type: 'json',
                key: API_KEY
            });

            const procesarRuta = (data) => ({
                distancia: data?.data?.long_km || 0,
                tiempo: data?.data?.tiempo_min || 0,
                costoCasetas: data?.data?.costo_caseta || 0,
                tienePeaje: data?.data?.peaje === 't',
                advertencias: data?.data?.advertencia || [],
                geometria: data?.data?.geometria || null,
                geojson: data?.data?.geojson || null
            });

            const combinarGeoJSON = (geo1, geo2) => {
                if (!geo1) return geo2;
                if (!geo2) return geo1;

                const geoJSON1 = typeof geo1 === 'string' ? JSON.parse(geo1) : geo1;
                const geoJSON2 = typeof geo2 === 'string' ? JSON.parse(geo2) : geo2;

                return {
                    ...geoJSON1,
                    coordinates: [...geoJSON1.coordinates, ...geoJSON2.coordinates]
                };
            };

            const combinarRutas = (ruta1, ruta2) => ({
                distancia: ruta1.distancia + ruta2.distancia,
                tiempo: ruta1.tiempo + ruta2.tiempo,
                costoCasetas: ruta1.costoCasetas + ruta2.costoCasetas,
                tienePeaje: ruta1.tienePeaje || ruta2.tienePeaje,
                advertencias: [...ruta1.advertencias, ...ruta2.advertencias],
                geometria: ruta1.geometria && ruta2.geometria
                    ? ruta1.geometria + ruta2.geometria
                    : (ruta1.geometria || ruta2.geometria),
                geojson: combinarGeoJSON(ruta1.geojson, ruta2.geojson)
            });

            // Fetch TUSA
            const fetchRutaTUSA = async () => {
                const formData = new URLSearchParams({
                    origen: normalizarNombre(origen),
                    destino: normalizarNombre(destino)
                });

                const response = await fetch(
                    `${API_URL}/api/casetas/rutas/BuscarRutaPorOrigen_Destino`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData
                    }
                );

                if (!response.ok) {
                    throw new Error(`Error en servidor TUSA: ${response.status}`);
                }

                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return text;
                }
            };

            //Vamos a hacer una petición extra para obtener el peaje de 3 ejes entre el origen y el destino (o punto intermedio)
            const fetchRutaINEGI = async (formData, tipoRuta) => {
                const response = await fetch(
                    `https://gaia.inegi.org.mx/sakbe_v3.1/${tipoRuta}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData
                    }
                );

                if (!response.ok) {
                    throw new Error(`Error INEGI (${tipoRuta}): ${response.status}`);
                }

                return response.json();
            };

            const hayIntermedio = puntoIntermedio && e !== 'SinIntermedio';
            const idDestFinal = hayIntermedio ? puntoIntermedio.id_dest : destino.id_dest;
            const formData1 = crearFormDataINEGI(origen.id_dest, idDestFinal);

            const promesas = [
                fetchRutaINEGI(formData1, 'optima'),
                fetchRutaINEGI(formData1, 'libre'),
                fetchRutaTUSA()
            ];

            if (hayIntermedio) {
                const formData2 = crearFormDataINEGI(puntoIntermedio.id_dest, destino.id_dest);
                promesas.push(
                    fetchRutaINEGI(formData2, 'optima'),
                    fetchRutaINEGI(formData2, 'libre')
                );
            }

            const [rutaOptima1, rutaLibre1, dataTusa, rutaOptima2, rutaLibre2] = await Promise.all(promesas);
            const rutaTUSAData = dataTusa?.data || dataTusa || [];
            const existeEnTUSA = Array.isArray(rutaTUSAData) ? rutaTUSAData.length > 0 : dataTusa?.enTUSA;
            setRutaTusa(rutaTUSAData);

            if (dataTusa.total === 1) {
                const casetasEnTUSA = await axios.get(
                    `${API_URL}/api/casetas/rutas/${rutaTUSAData[0]?.id_Tipo_ruta}/casetasPorRuta`
                );
                //setCasetasEnRutaTusa(casetasEnTUSA.data);
                cargarCasetasRuta(casetasEnTUSA.data);
            }

            if (dataTusa.total > 1) {
                setIsModalOpen(true);
            }

            if (!existeEnTUSA) {
                console.warn('⚠️ Ruta no encontrada en TUSA');
            }

            let rutaOptimaFinal, rutaLibreFinal;

            if (hayIntermedio) {
                const optima1 = procesarRuta(rutaOptima1);
                const optima2 = procesarRuta(rutaOptima2);
                const libre1 = procesarRuta(rutaLibre1);
                const libre2 = procesarRuta(rutaLibre2);

                rutaOptimaFinal = combinarRutas(optima1, optima2);
                rutaLibreFinal = combinarRutas(libre1, libre2);
            } else {
                rutaOptimaFinal = procesarRuta(rutaOptima1);
                rutaLibreFinal = procesarRuta(rutaLibre1);
            }

            const stringifyGeoJSON = (geojson) => typeof geojson === 'string' ? geojson : JSON.stringify(geojson);

            setRutas_OyL({
                optima: rutaOptimaFinal,
                libre: rutaLibreFinal,
                polilineaOptima: convertirCoordenadasGeoJSON(stringifyGeoJSON(rutaOptimaFinal.geojson)),
                polilineaLibre: convertirCoordenadasGeoJSON(stringifyGeoJSON(rutaLibreFinal.geojson))
            });

            const mensaje = dataTusa?.[0]?.Categoria ? 'Ruta existente' : 'Creando ruta';
            setBoolExiste(`${mensaje}, selecciona una ruta INEGI`);

        } catch (error) {
            console.error('Error al calcular la ruta:', error);
            setBoolExiste('Error al calcular la ruta');
            alert(`Error: ${error.message}`);
        } finally {
            setLoadingRutas(false);
        }
    }, [origen, destino, puntoIntermedio, tipoVehiculo]);
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        // Función de limpieza que se ejecuta al desmontar el componente
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    // ===== VALORES MEMOIZADOS =====
    const origenCoords = useMemo(() => {
        if (origen?.latitud && origen?.longitud) return [parseFloat(origen.latitud), parseFloat(origen.longitud)];

        if (!origen?.geojson) return null;
        console.log("geojson origenCoords" + typeof (JSON.parse(origen?.geojson).coordinates[0]));
        const coords = JSON.parse(origen.geojson).coordinates;
        return [coords[1], coords[0]];

    }, [origen]);

    const destinoCoords = useMemo(() => {
        if (destino?.latitud && destino?.longitud) return [parseFloat(destino.latitud), parseFloat(destino.longitud)];
        if (!destino?.geojson) return null;
        const coords = JSON.parse(destino.geojson).coordinates;
        return [coords[1], coords[0]];
    }, [destino]);

    const intermedioCoords = useMemo(() => {
        if (!puntoIntermedio?.geojson) return null;
        const coords = JSON.parse(puntoIntermedio.geojson).coordinates;
        return [coords[1], coords[0]];
    }, [puntoIntermedio]);

    return (
        <div className="container-fluid py-0">
            <div className="container-fluid py-0 rounded-top">
                <div className="header-RC py-2 rounded-top">
                    <h1>🚛 Creador de Rutas - Propuesta IAVE-WEB</h1>
                    {rutas_OyL &&
                        <div className="header-actions-RC">
                            {casetasEnRutaTusa.length === 0 && <button
                                className="btn btn-info"
                                onClick={handleCrearRuta}
                            >
                                ➕ Crear Ruta
                            </button>}
                            <button
                                className="btn btn-success"
                                onClick={guardarRutaHandler}
                                disabled={!hayCambiosPendientes && casetasEliminadas.length === 0 && casetasAgregadas.length === 0}
                            >
                                💾 Guardar Cambios
                                {(casetasEliminadas.length > 0 || casetasAgregadas.length > 0) && (
                                    <span className="badge badge-light ml-2">
                                        {casetasEliminadas.length > 0 && `${casetasEliminadas.length} 🗑️`}
                                        {casetasAgregadas.length > 0 && ` ${casetasAgregadas.length} ➕`}
                                    </span>
                                )}
                            </button>
                            {casetasEnRutaTusa.length > 0 && <button
                                className="btn btn-info"
                                onClick={handleRestaurarRuta}
                                disabled={!hayCambiosPendientes && casetasEliminadas.length === 0}
                            >
                                🔄️ Restaurar Ruta
                            </button>}

                        </div>
                    }
                </div>
                {(hayCambiosPendientes || casetasEliminadas.length > 0 || casetasAgregadas.length > 0) && (
                    <div className="alert alert-warning my-0" role="alert">
                        <strong>⚠️ Cambios pendientes de guardar:</strong>
                        <ul className="mb-0 mt-2">
                            {casetasEliminadas.length > 0 && (
                                <li>{casetasEliminadas.length} caseta{casetasEliminadas.length > 1 ? 's' : ''} será{casetasEliminadas.length > 1 ? 'n' : ''} eliminada{casetasEliminadas.length > 1 ? 's' : ''}</li>
                            )}
                            {casetasAgregadas.length > 0 && (
                                <li>{casetasAgregadas.length} caseta{casetasAgregadas.length > 1 ? 's' : ''} será{casetasAgregadas.length > 1 ? 'n' : ''} agregada{casetasAgregadas.length > 1 ? 's' : ''}</li>
                            )}
                            {detectarCambiosConsecutivos() && (
                                <li>Se actualizarán los consecutivos de las casetas</li>
                            )}
                        </ul>
                        <small className="text-muted">Los cambios se aplicarán al dar click en "Guardar Cambios"</small>
                    </div>
                )}

                <div className="container-fluid py-1 border">
                    <div className="alert alert-info border-left-info mb-0" role="alert">
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>Estado de :</strong> {loadingRutas || loadingRutaSeleccionada ? 'Cargando rutas...' : boolExiste} {(rutas_OyL) ? `(${casetasEnRutaTusa.length} casetas en la ruta) ` : ' '} {((casetasEnRutaTusa.length - rutaSeleccionada[1]?.length) > 0) ? `Se tienen ${casetasEnRutaTusa.length - rutaSeleccionada[1]?.length} casetas adicionales en la ruta del INEGI vs TUSA` : ``}
                    </div>

                    <DndContext
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="table-container py-0 my-0" style={{ maxHeight: '12rem' }}>
                            <table
                                className='table table-bordered table-scroll table-sm table-hover align-middle mt-2'
                                style={{ display: casetasEnRutaTusa?.length > 0 ? 'table' : 'none' }}
                            >
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th>ID_Caseta</th>
                                        <th>Nombre</th>
                                        <th>Estado</th>
                                        <th>Latitud</th>
                                        <th>Longitud</th>
                                        <th>{switchTipoVehiculo(tipoVehiculo)}</th>
                                        <th>Consecutivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <SortableContext
                                        items={casetasEnRutaTusa}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {casetasEnRutaTusa?.map((caseta, index) => (
                                            <Ordenamiento
                                                key={caseta.ID + '-' + index}
                                                caseta={caseta}
                                                index={index}
                                                rutaSeleccionada={rutaSeleccionada}
                                                tipoVehiculo={tipoVehiculo}
                                                handleDeleteCaseta={handleDeleteCaseta}
                                                handleConsecutivoChange={handleConsecutivoChange}
                                                formatearEnteros={formatearEnteros}
                                                switchTipoVehiculo={switchTipoVehiculo}
                                            />
                                        ))}
                                    </SortableContext>
                                </tbody>
                            </table>
                        </div>

                        <DragOverlay>
                            {activeId ? (
                                <table className="table table-bordered table-sm" style={{
                                    width: 'auto',
                                    margin: 0,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                    borderRadius: '4px',
                                    background: 'white'
                                }}>
                                    <tbody>
                                        {(() => {
                                            const caseta = casetasEnRutaTusa.find(c => c.ID_Caseta === activeId);
                                            if (!caseta) return null;

                                            return (
                                                <tr className="text-center table-primary">
                                                    <td style={{ padding: '0.5rem', width: '40px' }}>
                                                        <GripVertical size={18} className="text-muted" />
                                                    </td>
                                                    <td className='text-right'>
                                                        {caseta.ID_Caseta}{' '}
                                                        <span>{caseta.IAVE ? '✅' : '❌'}</span>
                                                    </td>
                                                    <td>{caseta.Nombre}</td>
                                                    <td>{caseta.Estado}</td>
                                                    <td>{caseta.latitud}</td>
                                                    <td>{caseta.longitud}</td>
                                                    <td>
                                                        $ {formatearEnteros(caseta[switchTipoVehiculo(tipoVehiculo).replaceAll(" ", "")])}

                                                    </td>
                                                    <td>
                                                        <input
                                                            style={{
                                                                maxWidth: '3rem',
                                                                textAlign: 'center'
                                                            }}
                                                            className="form-control form-control-sm"
                                                            type="text"
                                                            value={caseta.consecutivo || ''}
                                                            readOnly
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div className="main-content-RC mt-0">
                    <div className="sidebar-RC px-3">
                        <div className="form-section-RC">
                            <h3 className='py-0 pb-1 mb-1'>ℹ️ Información General</h3>

                            {/* ORIGEN */}
                            <div className="form-group-RC py-0 mb-1">
                                <label className='py-0 my-0'>Origen</label>
                                <input
                                    type="text"
                                    className="form-control-RC py-2"
                                    name='txtOrigen'
                                    placeholder="Huehuetoca, Huehuetoca"
                                    ref={focusRef}
                                    value={txtOrigen}
                                    onChange={handleChange}
                                />
                                <select
                                    id="SelectOrigen"
                                    className="form-select form-select-sm custom-select py-2 mb-3"
                                    style={{ width: '100%' }}
                                    disabled={loadingOrigen || origenes.length === 0}
                                    onChange={handleChange}
                                    name='SelectOrigen'
                                >
                                    {loadingOrigen && <option>Buscando...</option>}
                                    {!loadingOrigen && origenes.length === 0 && (
                                        <option value="">
                                            {txtOrigen.length < MIN_SEARCH_LENGTH
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Origen (fuente INEGI)'}
                                        </option>
                                    )}
                                    {!loadingOrigen && origenes.length > 0 && (
                                        <>
                                            <option value="">Selecciona un origen</option>
                                            {origenes.map((item, index) => (
                                                <option key={index} value={item.nombre}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* DESTINO */}
                            <div className="form-group-RC py-0 mb-1">
                                <label className='py-0 my-0'>Destino</label>
                                <input
                                    type="text"
                                    className="form-control-RC py-2"
                                    placeholder="Hermosillo, Hermosillo"
                                    value={txtDestino}
                                    onChange={handleChange}
                                    name='txtDestino'
                                />
                                <select
                                    id="SelectDestino"
                                    className="form-select form-select-sm custom-select py-2 mb-3"
                                    style={{ width: '100%' }}
                                    disabled={loadingDestino || destinos.length === 0}
                                    onChange={handleChange}
                                    name='SelectDestino'
                                >
                                    {loadingDestino && <option>Buscando...</option>}
                                    {!loadingDestino && destinos.length === 0 && (
                                        <option value="">
                                            {txtDestino.length < MIN_SEARCH_LENGTH
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Destino (fuente INEGI)'}
                                        </option>
                                    )}
                                    {!loadingDestino && destinos.length > 0 && (
                                        <>
                                            <option value="">Selecciona un destino</option>
                                            {destinos.map((item, index) => (
                                                <option key={index} value={item.nombre}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>


                            {/* Punto intermedio */}
                            <div className="form-group-RC py-0">
                                <label className='py-0 my-0'>Punto Intermedio</label>
                                <input
                                    type="text"
                                    className="form-control-RC py-2"
                                    placeholder="Guadalajara, Jalisco"
                                    value={txtPuntoIntermedio}
                                    onChange={handleChange}
                                    name='txtIntermedio'
                                />
                                <select
                                    id="SelectIntermedio"
                                    className="form-select form-select-sm custom-select py-2 mb-3"
                                    style={{ width: '100%' }}
                                    disabled={loadingPuntoIntermedio || puntosIntermedios.length === 0}
                                    onChange={handleChange}
                                    name='SelectIntermedio'
                                >
                                    {loadingPuntoIntermedio && <option>Buscando...</option>}
                                    {!loadingPuntoIntermedio && puntosIntermedios.length === 0 && (
                                        <option value="">
                                            {txtPuntoIntermedio.length < MIN_SEARCH_LENGTH
                                                ? 'Escribe al menos 3 caracteres'
                                                : 'Fuente oficial (INEGI)'}
                                        </option>
                                    )}
                                    {!loadingPuntoIntermedio && puntosIntermedios.length > 0 && (
                                        <>
                                            <option value="">Selecciona el punto intermedio</option>
                                            {puntosIntermedios.map((item, index) => (
                                                <option key={index} value={item.nombre}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                        {/* PILLS para el origen y destino */}
                        {/* Se manda a llamar un modal que nos permita seleccionar un origen conforme al directorio. */}

                        <div className="route-points-RC">
                            <div className="route-point-RC origin-RC py-1" style={{ cursor: (rutaTusa[0]?.RazonOrigen || origen?.nombre) ? 'pointer' : 'not-allowed' }} onClick={
                                () => {
                                    if (rutaTusa[0]?.RazonOrigen || origen?.nombre)
                                        changeOrigenDestinoHandler('Origen', origen?.nombre.split(',')[0].trim());
                                    else { return; }

                                }}>
                                <div className="route-icon-RC origin-RC"></div>
                                <div>
                                    <strong>Origen</strong><br />
                                    <small style={{
                                        fontWeight: (rutaTusa[0]?.RazonOrigen || origen?.Razon_social) ? 'bold' : 'normal',
                                        color: (rutaTusa[0]?.RazonOrigen || origen?.Razon_social) ? 'green' : 'black',
                                    }}>
                                        {rutaTusa[0]?.RazonOrigen || origen?.nombre || 'Selecciona un origen valido.'}
                                    </small>
                                </div>
                            </div>
                            <div className="route-point-RC py-1">
                                <div className="route-icon-RC waypoint-RC"></div>
                                <div>
                                    <strong>Punto Intermedio</strong><br />
                                    <small>
                                        {puntoIntermedio?.nombre || 'Selecciona un punto intermedio valido.'}
                                    </small>
                                </div>
                            </div>
                            <div className="route-point-RC destination-RC py-1" style={{ cursor: (rutaTusa[0]?.RazonDestino || destino?.nombre) ? 'pointer' : 'not-allowed' }} onClick={() => changeOrigenDestinoHandler('Destino', destino?.nombre.split(',')[0].trim())}>
                                <div className="route-icon-RC destination-RC"></div>
                                <div>
                                    <strong>Destino</strong><br />
                                    <small style={{
                                        fontWeight: (rutaTusa[0]?.RazonDestino || destino?.Razon_social) ? 'bold' : 'normal',
                                        color: (rutaTusa[0]?.RazonDestino || destino?.Razon_social) ? 'red' : 'black',
                                    }}>
                                        {rutaTusa[0]?.RazonDestino || destino?.nombre || 'Selecciona un destino valido.'}
                                    </small>
                                </div>
                            </div>
                            <div className="container text-center my-3">
                                <button className="btn btn-success container-fluid" ref={buttonRefCalcularRuta} onClick={calcularRutaHandler}>
                                    Calcular ruta
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MAPA */}
                    <MapContainer
                        center={[19.4326, -99.1332]}
                        zoom={5}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                    >
                        {/*  span de notificación, se muestra únicamente cuando se ha encontrado una ruta TUSA con casetas vinculadas. */}
                        <div className="container-fluid pb-3"
                            style={{
                                zIndex: 999,
                                display: casetasEnRutaTusa.length > 0 ? 'block' : 'none',
                                borderRadius: '0.6rem',
                                position: 'relative',
                                top: '1vh',
                                justifySelf: 'flex-end',
                                marginRight: '0px',
                                maxWidth: 'fit-content',
                                padding: '0px',
                            }}>
                            <span className='alert alert-primary' role='alert' style={{ margin: '0px', padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}>
                                Se han cargado las casetas que se encuentran en la ruta TUSA.
                            </span>
                        </div>

                        {/* Loading overlay */}
                        {loadingRutas && (
                            <div className="container-fluid pb-3"
                                style={{
                                    zIndex: 999999,
                                    backgroundColor: '#127ddb9d',
                                    width: '40%',
                                    height: '7vh',
                                    textAlign: 'center',
                                    padding: '0px',
                                    position: 'absolute',
                                    display: 'block',
                                    alignContent: 'center',
                                    placeSelf: 'anchor-center',
                                    borderRadius: '1rem',
                                }}>
                                <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#083b86ff', alignContent: 'center' }}>
                                    <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                                        <span className="visually-hidden"></span>
                                    </div>
                                    <h1 className="text-center font-weight-bold ml-4">Cargando</h1>
                                </div>
                            </div>
                        )}

                        {/* Selector de rutas */}
                        {rutas_OyL && !loadingRutas && (
                            <div className="container-fluid row px-0 ml-2 text-center rounded-top pb-3"
                                style={{
                                    zIndex: 999,
                                    left: '0px',
                                    backgroundColor: '#f0f8ff96',
                                    width: '50%',
                                    textAlign: 'center',
                                    bottom: '0px',
                                    position: 'absolute',
                                }}>
                                <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#5a5c69' }}>
                                    <h6 className="text-center font-weight-bold">Selecciona la ruta</h6>
                                </div>

                                <div className='row container-fluid pr-0'>
                                    <div className='col-md mr-1 p-0'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => getDetalleRuta('detalle_o')}
                                    >
                                        <RouteOption
                                            tipo={'Cuota'}
                                            distance={rutas_OyL?.optima?.distancia.toFixed(2)}
                                            time={parsearMinutos(rutas_OyL?.optima?.tiempo)}
                                            costs={{ label: 'Casetas', value: formatearDinero(rutas_OyL?.optima?.costoCasetas) }}
                                            advertencias={rutas_OyL?.optima?.advertencias}
                                            color={'green'}
                                        />
                                    </div>
                                    <div className='col-md ml-1 p-0'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => getDetalleRuta('detalle_l')}
                                    >
                                        <RouteOption
                                            tipo={'Libre'}
                                            distance={rutas_OyL?.libre?.distancia.toFixed(2)}
                                            time={parsearMinutos(rutas_OyL?.libre?.tiempo)}
                                            costs={{
                                                label: 'Casetas',
                                                value: rutas_OyL?.libre?.costoCasetas
                                                    ? formatearDinero(rutas_OyL?.libre?.costoCasetas)
                                                    : 'Sin costo'
                                            }}
                                            advertencias={rutas_OyL?.libre?.advertencias}
                                            color={'red'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors || IAVE-WEB ⭐🚌'
                        />

                        <Marker position={[19.782283538009626, -98.58592613126075]} icon={markerIcons.ATM}>
                            <Popup>Base Sahagún</Popup>
                        </Marker>

                        {origenCoords && (
                            <Marker position={origenCoords} icon={markerIcons.A}>
                                <Popup>Origen</Popup>
                            </Marker>
                        )}

                        {intermedioCoords && (
                            <Marker position={intermedioCoords} icon={markerIcons.pin}>
                                <Popup>
                                    <span style={{ cursor: 'pointer', alignContent: 'center', textAlign: 'center' }} onClick={handlerRetirarIntermedio}>
                                        <strong>Punto intermedio</strong>
                                        <br />
                                        <small>Haz clic para retirarlo</small>
                                    </span>
                                </Popup>
                            </Marker>
                        )}

                        {destinoCoords && (
                            <Marker position={destinoCoords} icon={markerIcons.B}>
                                <Popup>Destino</Popup>
                            </Marker>
                        )}

                        {/* Polylines */}

                        {rutas_OyL?.polilineaLibre?.map((arreglo, i) => (
                            <Polyline key={`libre-${i}`} color='red' positions={arreglo} weight={3} opacity={0.4}>
                                <Popup>Ruta Libre</Popup>
                            </Polyline>
                        ))}

                        {rutas_OyL?.polilineaOptima?.map((arreglo, i) => (
                            <Polyline key={`optima-${i}`} color='green' positions={arreglo} weight={3} opacity={0.4}>
                                <Popup>Ruta Cuota</Popup>
                            </Polyline>
                        ))}

                        {rutaSeleccionada[1]?.map((item, index) => (
                            <Marker
                                key={item?.id || item?.cve_caseta || index}
                                position={[JSON.parse(item?.geojson).coordinates[1], JSON.parse(item?.geojson).coordinates[0]]}
                                icon={markerIcons.caseta}
                            >
                                <Popup>
                                    <span style={{ marginTop: '5px', fontSize: '0.8rem', color: 'green', fontWeight: 'bold' }}>(INEGI)</span>
                                    <br />
                                    {item?.direccion.replace('Cruce la caseta ', '')}
                                    <br />
                                    <strong style={{ color: 'green' }}>${item?.costo_caseta.toFixed(2)}</strong>
                                    <span className='btn btn-outline-success ml-2' style={{ width: '1.5rem', height: '1.5rem', padding: '0', margin: '0', fontSize: '.8rem', textAlign: 'center', borderRadius: '40%', alignContent: 'center' }} onClick={() => handleAddCaseta(item)}>➕</span>
                                </Popup>
                            </Marker>
                        ))}

                        {casetasEnRutaTusa?.map((caseta, index) => {
                            // Validar que la caseta tenga coordenadas válidas
                            const lat = caseta.latitud || caseta.lat;
                            const lng = caseta.longitud || caseta.lng;

                            // Si no tienen coordenadas, no renderizar el marcador
                            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                                console.warn(`⚠️ Caseta sin coordenadas válidas: ${caseta.Nombre || caseta.nombre}`, caseta);
                                return null;
                            }

                            return (
                                <Marker
                                    key={caseta.IDCaseta + ' _ ' + index}
                                    className='text-center'
                                    position={[lat, lng]}
                                >
                                    <Popup>
                                        <span style={{ marginTop: '5px', fontSize: '0.8rem', color: 'blue', fontWeight: 'bold' }}>(TUSA)</span>
                                        <br />
                                        {caseta.Nombre_IAVE || caseta.nombre}
                                        <br />
                                        <strong style={{ color: 'green' }}>${caseta[switchTipoVehiculo(tipoVehiculo).replaceAll(" ", "")]}</strong>
                                        <span className='btn btn-outline-danger ml-2 ' style={{ width: '1.5rem', height: '1.5rem', padding: '0', margin: '0', fontSize: '.8rem', textAlign: 'center', borderRadius: '40%', alignContent: 'center' }} onClick={() => {
                                            if (rutaTusa.length > 0) handleDeleteCaseta(caseta.ID)
                                            if (!rutaTusa?.length) handleDeleteCaseta(caseta.IDCaseta)
                                        }
                                        }>❌</span>

                                    </Popup>
                                </Marker>
                            );
                        })}

                    </MapContainer>

                    {/* Panel de detalles */}
                    {loadingRutaSeleccionada && (
                        <div className="container-fluid border border-dark mx-4 py-5"
                            style={{
                                textAlign: 'center',
                                padding: '0px',
                                display: 'block',
                                alignContent: 'center',
                                placeSelf: 'anchor-center',
                                borderRadius: '15px',
                                height: '100%'
                            }}>
                            <div className='row text-center container-fluid py-1' style={{ justifyContent: 'center', color: '#083b86ff', alignContent: 'center' }}>
                                <div className="spinner-border text-primary" role="status" style={{ height: '3rem', width: '3rem' }}>
                                    <span className="visually-hidden"></span>
                                </div>
                                <h1 className="text-center font-weight-bold ml-4">Cargando</h1>
                            </div>
                        </div>
                    )}

                    <div className="details-panel-RC py-0" style={{ display: loadingRutaSeleccionada ? 'none' : 'block' }}>
                        <div className="route-summary-RC pt-2 mb-2">
                            <h3 className='pb-0 mb-0' style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '1.5rem' }}>📊 Resumen de Ruta INEGI</h3>
                            <center className='pb-3 text-primary'>
                                <small>
                                    <strong>
                                        {tipoTraslado
                                            ? `Esta ruta YA existe en TUSA ${tipoTraslado === 'Latinos' ? '(Latinos)' : tipoTraslado === 'Nacionales' ? '(Nacionales)' : tipoTraslado === 'Exportacion' ? '(Exportación)' : tipoTraslado === 'Cemex' ? '(Cemex)' : tipoTraslado === 'Otros' ? '(Otros)' : ''}. Puedes crear una nueva ruta cambiando el tipo de traslado.`
                                            : ''}
                                    </strong>
                                </small>
                            </center>

                            <div className="form-group py-0" style={{ justifySelf: 'center' }}>
                                <label className='py-0 my-0 mr-2'>Tipo de traslado:</label>
                                <select
                                    className='form-select form-select-sm custom-select py-2 mb-3'
                                    name="selectTipoTraslado"
                                    id='selectTipoTraslado'
                                    style={{ width: 'auto', height: '2.5rem' }}
                                    disabled={!!tipoTraslado}
                                    value={tipoTraslado}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecciona</option>
                                    <option value="Latinos">Latinos</option>
                                    <option value="Nacionales">Nacionales</option>
                                    <option value="Exportacion">Exportación</option>
                                    <option value="Cemex">Cemex</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>

                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Distancia Total:</span>
                                <span className="summary-value-RC">
                                    {rutaSeleccionada[0]?.distancia ? `${rutaSeleccionada[0].distancia.toFixed(2)} Km` : '-'}
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Tiempo Estimado:</span>
                                <span className="summary-value-RC">
                                    {rutaSeleccionada[0]?.tiempo ? parsearMinutos(rutaSeleccionada[0].tiempo) : '-'}
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Costo Peaje 2 ejes:</span>
                                <span className="summary-value-RC">
                                    {rutaSeleccionada[0]?.costoCasetas ? `$${formatearDinero(rutaSeleccionada[0].costoCasetas)}` : '-'}
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Costo Peaje 3 ejes:</span>
                                <span className="summary-value-RC">
                                    {rutaSeleccionada[0]?.costoCasetas ? `$${formatearDinero(rutaSeleccionada[0].costoCasetas)}` : '-'}
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Costo Peaje (TUSA):</span>
                                <span className="summary-value-RC">
                                    {(casetasEnRutaTusa?.length > 0 ? '$' + formatearDinero(casetasEnRutaTusa.reduce((total, caseta) => total + (caseta[switchTipoVehiculo(tipoVehiculo).replaceAll(" ", "")] || 0), 0)) : '-')}
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">Estado:</span>
                                <span className="summary-value-RC">
                                    <span className={`status-indicator-RC ${(boolExiste.includes('Ruta calculada') || boolExiste.includes('Ruta existente'))
                                        ? 'status-active-RC'
                                        : 'status-pendiente-RC'
                                        }`}></span>
                                    <span style={{ fontSize: boolExiste?.length > 12 ? '0.8rem' : '1rem' }}>
                                        {boolExiste}
                                    </span>
                                </span>
                            </div>
                            <div className="summary-item-RC">
                                <span className="summary-label-RC">ID origen:</span>
                                <span className="summary-value-RC">
                                    {origen?.id_dest ? `${origen.id_dest} IdDestino: ${destino?.id_dest}` : ''}
                                </span>
                            </div>
                            <div className="form-floating">
                                <textarea
                                    className="form-control"
                                    placeholder="Observaciones"
                                    id="floatingTextarea2"
                                    style={{ height: '3.3rem', fontSize: '0.8rem' }}
                                ></textarea>
                                <label htmlFor="floatingTextarea2">Observaciones:</label>
                            </div>
                        </div>

                        <div className="route-table-RC">
                            <div className="table-header-RC pl-4 py-0" style={{ fontSize: '1.2rem', lineHeight: '2.5rem' }}>
                                {rutaSeleccionada[1]?.length ? `${rutaSeleccionada[1].length} ` : ' '}Casetas en la ruta INEGI:
                                {rutaSeleccionada[1]?.length &&
                                    <Button variant="success"
                                        style={{
                                            borderRadius: '40%',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            display: 'flex',
                                            float: 'right'
                                        }}
                                        size="sm"
                                        className='btn btn-success py-1 pl-2 pr-1 mt-2'
                                        title='Agregar todas las casetas a la ruta'
                                        onClick={handleAgregarTodasLasCasetas}>
                                        <CopyPlus size={16} className='mr-1 py-0 px-0'></CopyPlus>
                                    </Button>}
                            </div>
                            <div className="table-container" style={{ maxHeight: '24vh' }}>
                                <table className="table table-bordered table-scroll table-sm table-hover align-middle">
                                    <thead className="table-hover">
                                        <tr className='text-center'>
                                            <th>IDx</th>
                                            <th>Caseta</th>
                                            <th>Importes</th>
                                            <th>¿TAG?</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rutaSeleccionada[1]?.map((item, index) => (
                                            <tr key={item?.id || item?.cve_caseta || index} className='text-center align-middle'>
                                                <td className='align-middle'>
                                                    <div className="d-flex" style={{ textAlign: 'left' }}>
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className='align-middle'>
                                                    <div className="d-flex" style={{ textAlign: 'left' }}>
                                                        {item?.direccion.replace('Cruce la caseta ', '')}
                                                    </div>
                                                </td>
                                                <td className='pr-0 pl-0 align-middle'>
                                                    <div className="text-center">
                                                        ${item?.costo_caseta}
                                                    </div>
                                                </td>
                                                <td className='align-middle'>
                                                    <div className="text-center">
                                                        <button className="btn btn-sm btn-outline-success" onClick={() => handleAddCaseta(item)} title='Agregar caseta INEGI a la ruta TUSA.'>
                                                            <MapPinPlus size={20} className='mr-1 py-0 px-0'></MapPinPlus>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* MODAL PARA SELECCIONAR RUTA */}
            {isModalOpen && (
                <ModalSelector
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSelect={async (rutaSeleccionadaDelModal) => {
                        console.log('✅ Ruta TUSA seleccionada:', rutaSeleccionadaDelModal);
                        try {
                            const casetasResponse = await axios.get(
                                `${API_URL}/api/casetas/rutas/${rutaSeleccionadaDelModal}/casetasPorRuta`
                            );
                            cargarCasetasRuta(casetasResponse.data); // CAMBIAR ESTA LÍNEA

                            setIsModalOpen(false);
                            setRutaTusa(rutaTusa.filter(ruta => ruta.id_Tipo_ruta == rutaSeleccionadaDelModal));
                        } catch (error) {
                            console.error('❌ Error al cargar casetas:', error);
                        }
                    }}
                    campo="Se han encontrado múltiples rutas en TUSA. Por favor selecciona la ruta que deseas validar"
                    valorCampo={''}
                    valoresSugeridos={rutaTusa}
                    tituloDelSelect='Rutas'
                    titulo={`Rutas TUSA encontradas (${rutaTusa.length})`}
                />
            )}


            {/* MODAL PARA SELECCIONAR CREAR LA RUTA */}

            <ModalFillCreation
                datosPrecargados={datosPrecargadosParaLaCreacionDeRuta}
                isOpen={isModalCreacionOpen}
                onClose={() => setIsModalCreacionOpen(false)}
                onConfirm={async (datosAGuardar) => {
                    console.log('✅ Se han llenado los siguientes datos para crear la nueva ruta TUSA:', datosAGuardar);
                    datosAGuardar.id_origen = origen?.ID_entidad;
                    datosAGuardar.id_destino = destino?.ID_entidad;
                    datosAGuardar.PoblacionOrigen = origen?.ID_PoblacionTUSA;
                    datosAGuardar.PoblacionDestino = destino?.ID_PoblacionTUSA;
                    try {
                        const rutaResponse = await axios.post(
                            `${API_URL}/api/casetas/rutas/crear-nueva-ruta`,
                            datosAGuardar
                        );
                        if (rutaResponse.data.error) {
                            console.error('❌ Error al crear la ruta:', rutaResponse.data.error);
                            return;
                        } else {
                            setRutaTusa([rutaResponse.data]);
                        }
                        console.log('✅ Ruta creada exitosamente:', rutaResponse.data);
                        //No podemos cargar casetas porque la ruta no tiene casetas vinculadas aún.
                        //Pero si debemos setear la rutaTusa para que el usuario vea que ya existe la ruta.
                        console.log(rutaTusa);


                        setIsModalCreacionOpen(false);
                    } catch (error) {
                        console.error('❌ Error al crear la ruta:', error);
                    }
                }}
            />



            {/* MODAL PARA SELECCIONAR Origen o destino */}
            {isModalSeleccionOrigenDestinoOpen && (
                <ModalSelectorOrigenDestino
                    isOpen={isModalSeleccionOrigenDestinoOpen}
                    onClose={() => setIsModalSeleccionOrigenDestinoOpen(false)}
                    objeto={directoriosCoincidentes[0]}
                    tipo={tipoOrigenDestinoSeleccionado}
                    valoresSugeridos={directoriosCoincidentes}
                    onConfirm={(origenODestinoSeleccionado) => {
                        if (tipoOrigenDestinoSeleccionado === 'Origen') {
                            origenODestinoSeleccionado.latitud = origenCoords?.[0];
                            origenODestinoSeleccionado.longitud = origenCoords?.[1];
                            origenODestinoSeleccionado.id_dest = origen?.id_dest;

                        }
                        if (tipoOrigenDestinoSeleccionado === 'Destino') {
                            origenODestinoSeleccionado.latitud = destinoCoords?.[0];
                            origenODestinoSeleccionado.longitud = destinoCoords?.[1];
                            origenODestinoSeleccionado.id_dest = destino?.id_dest;

                        }
                        console.log('✅ Origen/Destino seleccionado:', origenODestinoSeleccionado);
                        console.log()
                        if (tipoOrigenDestinoSeleccionado === 'Origen') {
                            setOrigen({
                                ...origenODestinoSeleccionado

                            });

                        } else {
                            setDestino({
                                ...origenODestinoSeleccionado
                            });
                        }
                        setIsModalSeleccionOrigenDestinoOpen(false);
                        setTipoOrigenDestinoSeleccionado(null);
                    }}
                />
            )}

            {/* MODAL de confirmación PARA confirmar eliminación/adicion  de una caseta en la ruta*/}
            {isModalConfirmacionOpen && (
                <ModalConfirmacion
                    casetaAAgregar={casetaAAgregar}
                    isOpen={isModalConfirmacionOpen}
                    mensaje={mensajeModal}
                    onSelect={(casetaAAgregarModal) => {
                        if (mensajeModal?.toLowerCase().includes('eliminar')) {
                            // Buscar si la caseta estaba en las originales
                            const casetaOriginal = casetasOriginales.find(
                                c => c.ID === casetaAEliminar
                            );

                            // Si estaba en originales, marcarla para eliminar
                            if (casetaOriginal) {
                                setCasetasEliminadas(prev => {
                                    if (!prev.some(c => c.ID === casetaAEliminar)) {
                                        return [...prev, casetaOriginal];
                                    }
                                    return prev;
                                });
                            } else {
                                // Si no estaba en originales, quitarla de agregadas
                                setCasetasAgregadas(prev =>
                                    prev.filter(c => c.ID !== casetaAEliminar)
                                );
                            }

                            // Eliminar de la lista visible y actualizar consecutivos
                            setCasetasEnRutaTusa(prev => {
                                const filtradas = prev.filter(caseta => caseta.ID !== casetaAEliminar);
                                return filtradas.map((caseta, index) => ({
                                    ...caseta,
                                    consecutivo: index + 1
                                }));
                            });

                            setHayCambiosPendientes(true);
                            console.log('🗑️ Caseta marcada para eliminar:', casetaAEliminar);
                            setCasetaAEliminar(null);
                        }

                        if (mensajeModal?.toLowerCase().includes('vincular')) {
                            // Normalizar propiedades de la caseta para asegurar que tenga latitud y longitud
                            const casetaNormalizada = {
                                ...casetaAAgregarModal,
                                latitud: casetaAAgregarModal.latitud || casetaAAgregarModal.lat,
                                longitud: casetaAAgregarModal.longitud || casetaAAgregarModal.lng,
                                consecutivo: (casetasEnRutaTusa || []).length + 1
                            };

                            // Agregar la caseta que coincide con el ID_Caseta a la lista visible con el consecutivo correcto
                            setCasetasEnRutaTusa(prev => [
                                ...prev,
                                casetaNormalizada
                            ]);
                            // Agregar a la lista de casetas agregadas
                            setCasetasAgregadas(prev => [...prev, casetaNormalizada]);
                            setHayCambiosPendientes(true);
                            console.log('➕ Caseta agregada:', casetaNormalizada);
                            setCasetaAAgregar(null);
                        }
                        setMensajeModal(null);
                        setIsModalConfirmacionOpen(false);
                        setCasetaAAgregar(null);
                        setCasetaAEliminar(null);

                    }}
                    onClose={() => {
                        setIsModalConfirmacionOpen(false);
                        setCasetaAEliminar(null);
                        setMensajeModal(null);
                        setCasetaAAgregar(null);

                    }}
                    color={colorModalConfirmacion}
                />
            )}

            {/* ESPACIO PARA NOTIFICACIONES */}
            <Container style={{ position: 'fixed', bottom: 20, right: '-30px', zIndex: 99999, maxWidth: 'max-content' }}>
                <Container style={{ maxWidth: 'max-content' }}>
                    {rutas_OyL && rutaSeleccionada && !loadingRutas && rutaTusa.length === 0 && (
                        <CustomToast
                            color={'text-warning'}
                            mensaje={'No existe una ruta creada con las poblaciones origen y destino seleccionadas'}
                            tiempo={2000}
                            mostrar={true}
                            titulo={'⚠️ Advertencia'}
                            onClick={() => { alert('Advertencia') }}
                        />
                    )}
                    {rutas_OyL && rutaSeleccionada && !loadingRutas && rutaTusa.length === 1 && (
                        <CustomToast
                            color={'text-success'}
                            mensaje={'Ruta TUSA encontrada y vinculada'}
                            tiempo={2000}
                            titulo={'✅ Éxito'}
                            onClick={() => { alert('Advertencia') }}
                            mostrar={true}
                        />
                    )}
                </Container>
            </Container>
        </div>
    );
};

export default RutasModule;