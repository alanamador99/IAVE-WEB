# Diagrama de Flujo - Componente Route-Creator

## Flujo General del Componente

```mermaid
graph TD
    A["🟢 Usuario accede a Route-Creator"] --> B["Interfaz: Formulario con 3 inputs"]
    B --> C["1️⃣ Input: Origen<br/>2️⃣ Input: Destino<br/>3️⃣ Input: Punto Intermedio"]
    
    C --> D["Usuario escribe en campo Origen"]
    D --> E["Debounce 500ms"]
    E --> F{"¿Texto >= 3 caracteres?"}
    F -->|Sí| G["🔍 searchDestinations<br/>API INEGI: buscadestino"]
    F -->|No| H["❌ Limpiar lista Origenes"]
    G --> I["✅ Mostrar opciones en select"]
    I --> J["Usuario selecciona Origen"]
    
    J --> K["🔄 Mismo flujo para:<br/>- Destino<br/>- Punto Intermedio"]
    
    K --> L["Usuario selecciona Tipo de Vehículo"]
    L --> M["Usuario hace clic en 'Calcular ruta'"]
    M --> N{"¿Validación OK?<br/>Origen + Destino"}
    
    N -->|No| O["❌ Alert: Selecciona origen y destino"]
    N -->|Sí| P["🔄 calcularRutaHandler iniciado"]
    
    P --> Q["setLoadingRutas = true<br/>Mostrar spinner"]
    Q --> R{"¿Hay Punto<br/>Intermedio?"}
    
    R -->|No| S["📍 Ruta Simple<br/>Origen → Destino"]
    R -->|Sí| T["📍 Ruta con 2 Legs<br/>Origen → Intermedio<br/>Intermedio → Destino"]
    
    S --> U["⚡ Fetch paralelo x2:<br/>1. optima<br/>2. libre<br/>+ TUSA"]
    T --> V["⚡ Fetch paralelo x5:<br/>1. optima leg1<br/>2. libre leg1<br/>3. optima leg2<br/>4. libre leg2<br/>5. TUSA"]
    
    U --> W["Procesar respuestas<br/>convertirCoordenadasGeoJSON"]
    V --> W
    
    W --> X["¿Ruta en TUSA?"]
    X -->|Sí| Y["Estado: 'Ruta existente'<br/>Mostrar categoría"]
    X -->|No| Z["Estado: 'Creando ruta'<br/>Habilitar nuevo componente"]
    
    Y --> AA["setRutas_OyL:<br/>- optima (distancia, tiempo, costo)<br/>- libre (distancia, tiempo, costo)<br/>- polilineaOptima (para mapa)<br/>- polilineaLibre (para mapa)"]
    Z --> AA
    
    AA --> AB["Mostrar:<br/>- Tabla resumen (distancia, tiempo, costo)<br/>- Dos tarjetas: Cuota/Libre<br/>- Mapa con polylines"]
    
    AB --> AC["Usuario hace clic en Cuota o Libre"]
    AC --> AD["getDetalleRuta('detalle_o')<br/>o<br/>getDetalleRuta('detalle_l')"]
    
    AD --> AE["getRouteDetails:<br/>Fetch casetas con costo"]
    AE --> AF["Combinar respuestas<br/>si hay intermedio"]
    AF --> AG["setRutaSeleccionada:<br/>[rutaSeleccionada, casetas]"]
    
    AG --> AH["Mostrar en panel derecho:<br/>- Resumen ruta<br/>- Tabla casetas<br/>- Marcadores en mapa"]
    
    AH --> AI["Usuario puede:<br/>1. Cambiar tipo traslado<br/>2. Añadir observaciones<br/>3. Guardar ruta<br/>4. Retirar intermedio"]
    
    AI --> AJ["🔄 Volver a calcular"]
```

---

## Flujo Detallado: searchDestinations (Búsqueda con Debounce)

```mermaid
graph LR
    A["Usuario escribe<br/>en input"] -->|onChange| B["setTxtOrigen<br/>setTxtDestino<br/>setTxtIntermedio"]
    B -->|useEffect| C["clearTimeout<br/>anterior"]
    C --> D["setTimeout 500ms"]
    D -->|500ms sin<br/>más cambios| E{"¿Texto >= 3 char?"}
    
    E -->|No| F["setLista = []"]
    E -->|Sí| G["setLoading = true"]
    
    G --> H["fetch POST<br/>INEGI buscadestino"]
    H --> I["response.json"]
    I --> J{"¿OK?"}
    
    J -->|Sí| K["setLista<br/>con resultados"]
    J -->|No| L["setLista = []<br/>console.error"]
    
    K --> M["setLoading = false"]
    L --> M
    M --> N["Select moestra<br/>opciones"]
```

---

## Flujo Detallado: calcularRutaHandler (Cálculo de Rutas)

```mermaid
graph TD
    A["Click: Calcular Ruta"] --> B{"Validar:<br/>origen?.id_dest<br/>destino?.id_dest"}
    
    B -->|Falta algo| C["❌ Alert"]
    B -->|OK| D["setLoadingRutas = true<br/>Limpiar estados"]
    
    D --> E["crearFormDataINEGI<br/>origen → destino/intermedio"]
    E --> F{"¿Intermedio?"}
    
    F -->|No| G["Promesas = [<br/>optima,<br/>libre,<br/>TUSA<br/>]"]
    
    F -->|Sí| H["crearFormDataINEGI<br/>intermedio → destino"]
    H --> I["Promesas = [<br/>optima_leg1,<br/>libre_leg1,<br/>optima_leg2,<br/>libre_leg2,<br/>TUSA<br/>]"]
    
    G --> J["Promise.all<br/>fetch paralelo"]
    I --> J
    
    J --> K["procesarRuta<br/>Extraer:<br/>distancia, tiempo,<br/>costoCasetas,<br/>geojson"]
    
    K --> L{"¿Intermedio?"}
    L -->|No| M["rutaOptima = procesar leg1<br/>rutaLibre = procesar leg1"]
    L -->|Sí| N["rutaOptima = combinarRutas<br/>leg1_optima + leg2_optima<br/>rutaLibre = combinarRutas<br/>leg1_libre + leg2_libre"]
    
    M --> O["convertirCoordenadasGeoJSON<br/>GeoJSON → [lat,lng]"]
    N --> O
    
    O --> P["setRutas_OyL:<br/>{<br/>  optima: {...},<br/>  libre: {...},<br/>  polilineaOptima: [...],<br/>  polilineaLibre: [...] <br/>}"]
    
    P --> Q["Verificar TUSA:<br/>¿rutaTusa.length > 0?"]
    Q -->|Sí| R["setBoolExiste<br/>'Ruta existente'"]
    Q -->|No| S["setBoolExiste<br/>'Creando ruta'"]
    
    R --> T["setLoadingRutas = false"]
    S --> T
    T --> U["Mostrar UI:<br/>- Tabla resumen<br/>- Mapa con polylines<br/>- 2 tarjetas opciones"]
```

---

## Flujo Detallado: getDetalleRuta (Seleccionar Ruta)

```mermaid
graph TD
    A["Click: Tarjeta Cuota/Libre"] --> B["getDetalleRuta<br/>detalle_o / detalle_l"]
    
    B --> C["setLoadingRutaSeleccionada = true"]
    C --> D["getRouteDetails<br/>tipo = optima/libre"]
    
    D --> E["fetch INEGI<br/>origen → destino/intermedio"]
    E --> F{"¿Intermedio?"}
    
    F -->|No| G["return data"]
    F -->|Sí| H["fetch INEGI<br/>intermedio → destino"]
    
    H --> I["Combinar data + data2:<br/>- Si arrays → concat<br/>- Si objeto.data → concat data<br/>- Si objeto → merge"]
    I --> J["return combinado"]
    
    G --> K["response.data.filter<br/>costo_caseta != 0"]
    J --> K
    
    K --> L["setRutaSeleccionada = [<br/>ruta_optima/libre,<br/>casetas_con_costo<br/>]"]
    
    L --> M["Mostrar Panel Derecho:<br/>- Resumen ruta seleccionada<br/>- Tabla casetas<br/>- Marcadores en mapa"]
    
    M --> N["setLoadingRutaSeleccionada = false"]
```

---

## Flujo: Interfaz Visual (React JSX)

```mermaid
graph LR
    A["SIDEBAR<br/>(Formulario)"] -->|Input| B["Origen"]
    A -->|Input| C["Destino"]
    A -->|Input| D["Punto Intermedio"]
    A -->|Select| E["Tipo Vehículo"]
    A -->|Button| F["Calcular Ruta"]
    
    F -->|Datos| G["MAPA<br/>(Leaflet)"]
    G -->|Marker| H["Origen A"]
    G -->|Marker| I["Destino B"]
    G -->|Marker| J["Intermedio"]
    G -->|Polyline| K["Ruta Óptima<br/>azul"]
    G -->|Polyline| L["Ruta Libre<br/>roja"]
    G -->|Marker| M["Casetas<br/>verde"]
    
    G -->|Flotante| N["Card: Elige Ruta<br/>Cuota/Libre"]
    N -->|Click| O["getDetalleRuta"]
    
    O -->|Datos| P["PANEL DERECHO<br/>(Resumen)"]
    P --> Q["Resumen ruta"]
    P --> R["Tabla casetas"]
    P --> S["Observaciones"]
    P --> T["Botón Guardar"]
```

---

## Estados (React Hooks)

| Estado | Tipo | Propósito |
|--------|------|-----------|
| `txtOrigen` | string | Texto buscado origen |
| `txtDestino` | string | Texto buscado destino |
| `txtPuntoIntermedio` | string | Texto buscado intermedio |
| `origenes` | array | Opciones origen (INEGI) |
| `destinos` | array | Opciones destino (INEGI) |
| `puntosIntermedios` | array | Opciones intermedio (INEGI) |
| `origen` | object | Origen seleccionado |
| `destino` | object | Destino seleccionado |
| `puntoIntermedio` | object \| null | Intermedio seleccionado |
| `tipoVehiculo` | number | Tipo vehículo (1-12) |
| `loadingOrigen` | bool | Cargando búsqueda origen |
| `loadingDestino` | bool | Cargando búsqueda destino |
| `loadingPuntoIntermedio` | bool | Cargando búsqueda intermedio |
| `loadingRutas` | bool | Cargando cálculo rutas |
| `loadingRutaSeleccionada` | bool | Cargando detalles ruta |
| `rutas_OyL` | object \| null | Rutas calculadas (optima, libre, polylines) |
| `rutaTusa` | array | Ruta en TUSA (si existe) |
| `rutaSeleccionada` | array | [ruta_detalle, casetas] |
| `boolExiste` | string | Estado ruta: "Ruta existente", "Creando ruta", etc. |

---

## APIs Externas Utilizadas

| API | Endpoint | Método | Propósito |
|-----|----------|--------|-----------|
| INEGI | `sakbe_v3.1/buscadestino` | POST | Buscar poblaciones |
| INEGI | `sakbe_v3.1/optima` | POST | Calcular ruta óptima |
| INEGI | `sakbe_v3.1/libre` | POST | Calcular ruta libre |
| TUSA (Backend) | `/api/casetas/rutas/BuscarRutaPorOrigen_Destino` | POST | Verificar si ruta existe |

---

## Notas de Flujo

✅ **Debounce**: Se usa para evitar exceso de requests al escribir en inputs (500ms)

✅ **Parallelización**: Fetch de múltiples rutas se hace con `Promise.all` para optimizar

✅ **Combinación de Legs**: Si hay intermedio, se combinan dos legs (origen→intermedio, intermedio→destino) sumando distancias, tiempos y costos

✅ **Conversión GeoJSON**: Las polylines se convierten de [lng, lat] a [lat, lng] para Leaflet

✅ **Estados de Carga**: Múltiples flags para mostrar spinners en diferentes partes de la UI

⚠️ **Manejo de Errores**: Try/catch en funciones async con alerts al usuario

🔄 **Reutilización**: Función `searchDestinations` genérica para los 3 tipos de búsqueda
