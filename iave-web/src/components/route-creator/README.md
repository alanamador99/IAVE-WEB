# 📍 Route-Creator - Componente de Cálculo de Rutas

## 🎯 ¿Qué es el Route-Creator?

El **Route-Creator** es la herramienta central de la plataforma IAVE WEB que permite calcular y visualizar rutas de viaje entre dos puntos (u origen y destino con un punto intermedio opcional). 

**En palabras simples:** Es como Google Maps, pero especializado para rutas de transporte terrestre en México, mostrando opciones de pago (cuota) y rutas libres, con información de casetas, distancias, tiempos y costos.

---

## 🌟 Características Principales

### 1. **Búsqueda Inteligente de Ubicaciones**
- Escribe el nombre de una ciudad y automáticamente te muestra opciones
- Funciona con debounce (espera 500ms sin escribir antes de buscar)
- Mínimo 3 caracteres para iniciar la búsqueda
- Se integra con la API de INEGI (Instituto Nacional de Estadística)

### 2. **Cálculo de Rutas Múltiples**
- **Ruta Óptima**: Propone el camino más rápido/eficiente
- **Ruta Libre**: Propone alternativas sin casetas
- Muestra para cada ruta: distancia, tiempo estimado y costo

### 3. **Rutas con Punto Intermedio (Paradas)**
- Permite agregar un punto intermedio (parada obligatoria)
- Calcula automáticamente:
  - Origen → Parada → Destino
  - Suma distancias, tiempos y costos

### 4. **Mapa Interactivo**
- Visualiza las rutas en un mapa
- Muestra marcadores de:
  - **Origen (A)**: Punto de partida
  - **Destino (B)**: Punto final
  - **Parada intermedia**: Si existe
  - **Casetas**: Puntos de pago en ruta verde

### 5. **Información de Casetas**
- Lista todas las casetas en la ruta
- Muestra costo individual de cada una
- Suma total del peaje

### 6. **Gestión de Rutas**
- Guarda rutas personalizadas
- Agrega observaciones
- Selecciona tipo de vehículo (automóvil, autobús, camión, etc.)

---

## 🏗️ Estructura del Componente

```
Route-Creator.jsx (componente principal)
├── route-creator/
│   └── Sortable.jsx (componente para ordenar puntos)
└── shared/utils.jsx (componentes y utilidades compartidas)
```

### Componentes Utilizados

| Componente | Función |
|-----------|---------|
| `ModalConfirmacion` | Confirmar acciones antes de ejecutar |
| `ModalFillCreation` | Crear nuevas rutas |
| `ModalSelector` | Seleccionar opciones de búsqueda |
| `ModalSelectorOrigenDestino` | Selector especial para origen/destino |
| `CustomToast` | Notificaciones al usuario |
| `RouteOption` | Mostrar opciones de ruta en el mapa |

### Librerías Clave

- **React Leaflet**: Mapa interactivo
- **@dnd-kit**: Arrastrar y soltar elementos
- **Axios**: Peticiones HTTP
- **Bootstrap/React-Bootstrap**: Interfaz
- **Lodash**: Funciones utilitarias

---

## 🔄 Flujo de Funcionamiento

### **Paso 1: El Usuario Abre Route-Creator**
```
Usuario accede a la herramienta
    ↓
Se muestra formulario con 3 campos de búsqueda
```

### **Paso 2: Buscar Origen**
```
Usuario escribe "Ciudad de México"
    ↓
Espera 500ms (debounce) sin escribir
    ↓
Se envía búsqueda a INEGI
    ↓
Se muestran opciones en dropdown
    ↓
Usuario selecciona una opción
```

### **Paso 3: Buscar Destino (igual que Origen)**
```
Usuario escribe "Veracruz"
    ↓
[Mismo proceso que Paso 2]
```

### **Paso 4: Opcional - Buscar Punto Intermedio**
```
Usuario escribe ciudad de punto intermedio (o deja vacío) <útil para forzar un cambio en la ruta>
    ↓
[Mismo proceso que Paso 2 - pero opcional]
```


### **Paso 5: Calcular Ruta**
```
Usuario hace clic en botón "Calcular Ruta"
    ↓
Se valida que origen y destino estén seleccionados
    ↓
Se envían peticiones a INEGI:
  - Ruta Óptima
  - Ruta Libre
  - Verificar en TUSA (base de datos de casetas)
    ↓
Se combinan resultados
    ↓
Se muestran en mapa + tabla
```

### **Paso 6: Visualizar Resultados**
```
Se muestra en pantalla:

┌─────────────────────────────────────┐
│ MAPA                                │
│ - Polyline azul (ruta óptima)      │
│ - Polyline roja (ruta libre)       │
│ - Marcadores de casetas            │
└─────────────────────────────────────┘

┌─────────────┬──────────────────────┐
│   TARJETA   │   INFORMACIÓN RUTA   │
│   CUOTA     │  - Distancia: 400km  │
│             │  - Tiempo: 6 horas   │
├─────────────┤  - Costo: $850       │
│   TARJETA   │                      │
│   LIBRE     │  - Distancia: 450km  │
│             │  - Tiempo: 7 horas   │
└─────────────┴──────────────────────┘
```

### **Paso 7: Seleccionar Ruta**
```
Usuario hace clic en "Cuota" o "Libre"
    ↓
Se envía nueva petición a INEGI pidiendo detalles
    ↓
Se recibe lista de casetas con costos individuales
    ↓
Se muestra en panel derecho:
  - Resumen completo de la ruta
  - Tabla de casetas
  - Opciones para guardar
```

---

## 📊 Estados del Componente (Variables Importantes)

Estos son los "contenedores" donde guarda información el componente:

### **Búsqueda**
```javascript
txtOrigen        // Texto que escribe el usuario en origen
txtDestino       // Texto que escribe el usuario en destino
txtPuntoIntermedio // Texto que escribe en parada intermedia

origenes         // Lista de opciones de origen (INEGI)
destinos         // Lista de opciones de destino (INEGI)
puntosIntermedios // Lista de opciones de parada
```

### **Selecciones**
```javascript
origen           // Origen seleccionado
destino          // Destino seleccionado
puntoIntermedio  // Parada intermedia seleccionada (o null)
tipoVehiculo     // Tipo de vehículo elegido
```

### **Carga y Procesamiento**
```javascript
loadingOrigen        // ⏳ Está buscando origen?
loadingDestino       // ⏳ Está buscando destino?
loadingRutas         // ⏳ Está calculando rutas?
loadingRutaSeleccionada // ⏳ Está cargando detalles?
```

### **Resultados**
```javascript
rutas_OyL        // Las rutas calculadas (óptima y libre)
rutaTusa         // Información de TUSA si la ruta existe
rutaSeleccionada // Detalles de la ruta que el usuario eligió
boolExiste       // Dice si es "Ruta existente" o "Creando ruta"
```

---

## 🌐 APIs Utilizadas

### **API de INEGI (Sakbe 3.1)**
Proporciona datos de rutas y geografía de México:

| Función | ¿Para qué? | Entrada | Salida |
|---------|-----------|---------|--------|
| `buscadestino` | Buscar ciudades | Nombre ciudad | Lista de ciudades con coordenadas |
| `optima` | Ruta más rápida (sin peaje) | Origen + Destino + Tipo Vehículo | Distancia, tiempo, costo, polyline |
| `libre` | Ruta libre (sin peaje o alterno) | Origen + Destino + Tipo Vehículo | Distancia, tiempo, costo, polyline |
| `detalle_o` | Detalles completos ruta de cuota | Origen + Destino + Tipo Vehículo | Info casetas, peajes, geometría |
| `detalle_l` | Detalles completos ruta libre | Origen + Destino + Tipo Vehículo | Info casetas (si aplica), geometría |

**Base URL:** `https://gaia.inegi.org.mx/sakbe_v3.1/`

### **API de Backend - TUSA (Casetas)**
Proporciona información sobre casetas y rutas registradas en la base de datos local:

| Endpoint | Método | ¿Para qué? | Entrada | Salida |
|----------|--------|-----------|---------|--------|
| `/api/casetas/rutas/BuscarRutaPorOrigen_Destino` | POST | Buscar si existe ruta en TUSA | Origen normalizado + Destino | Array de rutas coincidentes con ID |
| `/api/casetas/rutas/:IDTipoRuta/casetasPorRuta` | GET | Obtener casetas de una ruta | ID de tipo de ruta | Lista de casetas con ubicación y costo |
| `/api/casetas/rutas/:Poblacion/RutasConCoincidencia` | GET | Rutas por población | Nombre población | Rutas que contienen esa población |
| `/api/casetas/rutas/near-directorio` | GET | Casetas cercanas | Coordenadas (lat, lng) | Casetas próximas al punto |
| `/api/casetas/rutas/crear-nueva-ruta` | POST | Crear ruta nueva | Datos ruta | Ruta creada con ID asignado |
| `/api/casetas/rutas/guardar-cambios` | POST | Guardar cambios en ruta | ID ruta + datos | Confirmación de actualización |
| `/api/casetas/rutas/casetas-tusa-coincidentes` | POST | Casetas que coinciden con ruta | Origen + Destino | Casetas en TUSA para esa ruta |

**Base URL:** Configurada en `API_URL` (por defecto: `http://localhost:3001`)

---

## 🔧 Funciones Principales Explicadas

### **1. searchDestinations()**
**¿Qué hace?** Busca ciudades mientras escribes
```
Usuario escribe → Espera 500ms → Envía al INEGI → Muestra resultados
```

**Validaciones:**
- Mínimo 3 caracteres
- Si el usuario sigue escribiendo, cancela búsqueda anterior
- Muestra "Cargando..." mientras busca

---

### **2. calcularRutaHandler()**
**¿Qué hace?** Calcula las rutas cuando el usuario hace clic

```
1. Valida que exista origen y destino
2. Prepara los datos para INEGI
3. Envía TRES peticiones en paralelo:
   - Ruta óptima
   - Ruta libre
   - Consulta TUSA
4. Procesa las respuestas
5. Muestra en mapa y tabla
```

**Optimización:** Usa `Promise.all()` para enviar todo al mismo tiempo (más rápido)

---

### **3. getDetalleRuta()**
**¿Qué hace?** Trae detalles completos cuando selecciona una ruta

```
Usuario hace clic en "Cuota" o "Libre"
    ↓
Se pide al backend la lista de casetas
    ↓
Si hay parada intermedia, pide dos listas y las combina
    ↓
Muestra tabla de casetas con costos
```

---

### **4. convertirCoordenadasGeoJSON()**
**¿Qué hace?** Convierte las coordenadas para mostrar en el mapa

Las APIs devuelven coordenadas así: `[longitud, latitud]`
El mapa las necesita así: `[latitud, longitud]`

Esta función hace la conversión automáticamente.

---

## 💾 Integración con Otras Partes

### **¿Dónde se guarda la información?**
Las rutas guardadas se almacenan en la base de datos TUSA a través del backend:
- Tabla: `rutas`
- Tabla: `casetas`
- Relación: `rutas_casetas`

### **¿Quién más usa Route-Creator?**
- **Dashboard**: Muestra estadísticas de rutas calculadas
- **Módulo de Casetas**: Gestiona casetas de la red
- **Módulo de Reportes**: Genera reportes de uso

---

## ⚡ Optimizaciones Implementadas

### 1. **Debounce en Búsquedas**
- No busca en cada letra que escribes
- Espera 500ms sin escribir
- **Beneficio:** Reduce carga en servidor INEGI

### 2. **Cálculo Paralelo**
- Envía múltiples peticiones al mismo tiempo
- No espera uno por uno
- **Beneficio:** Más rápido

### 3. **Iconos de Marcadores Fuera del Componente**
- Se crean una sola vez, no cada render
- **Beneficio:** Mejor rendimiento

### 4. **UseMemo para Funciones**
- Evita recrear funciones innecesariamente
- **Beneficio:** Menos re-renders

### 5. **Caché de Búsquedas** (si está implementado)
- No busca lo mismo dos veces
- **Beneficio:** Más rápido si busca mismo lugar

---

## 🎨 Interfaz Visual

### **Sección Izquierda: Formulario**
```
┌────────────────────────────┐
│ ROUTE CREATOR              │
├────────────────────────────┤
│ ORIGEN                     │
│ [_______________________]  │
│ Ej: Ciudad de México       │
├────────────────────────────┤
│ DESTINO                    │
│ [_______________________]  │
│ Ej: Guadalajara            │
├────────────────────────────┤
│ PARADA INTERMEDIA (OPC.)   │
│ [_______________________]  │
│ Ej: Querétaro              │
├────────────────────────────┤
│ TIPO DE VEHÍCULO           │
│ [▼ Seleccionar]            │
├────────────────────────────┤
│ [Calcular Ruta]            │
└────────────────────────────┘
```

### **Centro: Mapa Interactivo**
```
┌────────────────────────────────┐
│                                │
│    [MAPA CON POLYLINES]        │
│    - Azul: Ruta óptima        │
│    - Roja: Ruta libre         │
│    - Marcadores: Casetas      │
│    - A: Origen                │
│    - B: Destino               │
│                                │
└────────────────────────────────┘
```

### **Sección Derecha: Resultados**
```
┌────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ │
│ │  CUOTA   │ │  LIBRE   │ │
│ │          │ │          │ │
│ │ 400km    │ │ 450km    │ │
│ │ 6h       │ │ 7h       │ │
│ │ $850     │ │ $300     │ │
│ └──────────┘ └──────────┘ │
│                            │
│ (Si selecciona):           │
│ ┌──────────────────────┐   │
│ │ RESUMEN RUTA CUOTA   │   │
│ ├──────────────────────┤   │
│ │ Origen: CDMX         │   │
│ │ Destino: Veracruz    │   │
│ │ Distancia: 400 km    │   │
│ │ Tiempo: 6 hrs        │   │
│ │ Costo Total: $850    │   │
│ ├──────────────────────┤   │
│ │ CASETAS EN RUTA      │   │
│ ├─────┬─────┬──────────┤   │
│ │Nombre│Costo│Ubicación│   │
│ ├─────┼─────┼──────────┤   │
│ │Eje 1│$120 │Km 45    │   │
│ │Eje 2│$150 │Km 120   │   │
│ │...  │     │         │   │
│ └─────┴─────┴──────────┘   │
└────────────────────────────┘
```

---

## 🐛 Manejo de Errores

El componente maneja errores comunes:

| Error | ¿Qué pasa? | Solución |
|-------|-----------|----------|
| No selecciona origen/destino | Muestra alert | Seleccionar primero |
| API INEGI no responde | Muestra "Cargando..." indefinido | Reintentar |
| Ubicación no encontrada | Lista vacía | Escribir nombre más exacto |
| Mapa no carga | Pantalla en blanco | Revisar conexión internet |
| Casetas no aparecen | Tabla vacía | Ruta podría no tener casetas |

---

## 📱 Responsive Design

- **Desktop**: Columnas lado a lado (formulario, mapa, resultados)
- **Tablet**: Se reorganiza según espacio
- **Móvil**: Pueden ser pestañas/acordeones

---

## 🚀 Mejoras Futuras Posibles

1. **Exportar Rutas a PDF** - Descargar resumen completo
2. **Historial de Rutas** - Ver rutas calculadas previamente
3. **Rutas Favoritas** - Guardar rutas frecuentes
4. **Comparativa Avanzada** - Gráficos de costo vs tiempo
5. **Modo Offline** - Algunos datos en caché local
6. **Integración GPS** - Detectar ubicación automática
7. **Múltiples Paradas** - Más de una parada intermedia
8. **Cálculo por Peso/Volumen** - Tarificación por carga

---

## 📚 Archivos Relacionados

- **Route-Creator.jsx**: Componente principal
- **route-creator/Sortable.jsx**: Ordenamiento de puntos
- **shared/utils.jsx**: Componentes y funciones comunes
- **docs/frontend/DIAGRAMA_FLUJO_ROUTE_CREATOR.md**: Diagramas técnicos
- **DOCUMENTACION_CASETAS.md**: Info de casetas
- **DOCUMENTACION_EXPORT.md**: Exportación de rutas

---

## 🎓 Para Desarrolladores

### **Agregar una Nueva Función**
1. Crear función dentro del componente
2. Usar `useCallback` si se pasa a componentes hijos
3. Manejar estados de carga con flags
4. Agregar try/catch para errores
5. Mostrar feedback al usuario (toast/alert)

### **Modificar API Calls**
1. Cambiar URL en constantes al inicio
2. Actualizar formatos de datos
3. Ajustar procesamiento de respuestas
4. Testear con ambos escenarios (éxito/error)

### **Agregar Estados Nuevos**
```javascript
const [nuevoEstado, setNuevoEstado] = useState(valorInicial);

// En useEffect si depende de otros estados:
useEffect(() => {
  // código que usa nuevoEstado
}, [dependencias]);
```

---

## ✅ Checklist de Testing

- [ ] Búsqueda con 1-2 caracteres (no busca)
- [ ] Búsqueda con 3+ caracteres (busca)
- [ ] Sin seleccionar origen (error)
- [ ] Sin seleccionar destino (error)
- [ ] Con parada intermedia
- [ ] Con parada intermedia después de seleccionar todo (recalcula)
- [ ] Cambiar tipo de vehículo (recalcula)
- [ ] Mapa carga correctamente
- [ ] Polylines visibles en mapa
- [ ] Marcadores de casetas visibles
- [ ] Click en tarjeta CUOTA (carga detalles)
- [ ] Click en tarjeta LIBRE (carga detalles)
- [ ] Tabla de casetas muestra correctamente
- [ ] Costos sumados correctamente
- [ ] Botón Guardar funciona
- [ ] Conexión a internet perdida (error handling)

---

## 📞 Soporte

Si hay preguntas técnicas específicas, revisar:
1. Logs de navegador (F12 → Console)
2. Respuestas de API (F12 → Network)
3. Documentación técnica en `/docs/frontend/`
4. Código fuente comentado en `Route-Creator.jsx`

---

**Última actualización:** Enero 2026  
**Versión:** 1.0  
**Autor:** Equipo IAVE WEB
