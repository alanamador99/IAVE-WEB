# Documentación - casetas.controllers.js

## 📋 Resumen General

El controlador `casetas.controllers.js` gestiona todas las operaciones relacionadas con las **CASETAS** (estaciones de peaje) en el sistema IAVE. Las casetas son puntos de cobro electrónico distribuidos estratégicamente en las carreteras mexicanas para recaudar el pago por el uso de autopistas.

**Responsabilidades principales:**
- Consultar información de casetas (ubicación, tarifas, disponibilidad)
- Integración con API INEGI Sakbe v3.1 para cálculo de rutas óptimas
- Mapeo de casetas a rutas de transporte específicas
- Proporcionar coordenadas para visualización en mapas
- Categorización de rutas (Nacionales, Latinos, Exportación, etc)

---

## 🚫 ¿Qué es una Caseta?

Una **caseta de peaje** es:
- **Puesto de cobro**: Ubicación física donde se cobra por el paso
- **Clasificación de vehículos**: Cobra según tipo (Auto, Autobús, Camión 2/3/5/9 ejes)
- **Disponibilidad IAVE**: Puede aceptar TAGs de identificación electrónica
- **Coordenadas GPS**: Ubicadas en mapas para navegación
- **Parte de rutas**: Cada ruta tiene una secuencia de casetas

**Estructura de cobro:**
```
Vehículo → Caseta → Identificación (Placa/TAG) → Cálculo de tarifa → Cobro
```

**Tipos de tarifa por vehículo:**
| Código | Tipo | Descripción |
|--------|------|-------------|
| A | Automóvil | Auto particular |
| B | Autobús 2 Ejes | Transporte de pasajeros |
| C-2 | Camión 2 Ejes | Carga ligera |
| C-3 | Camión 3 Ejes | Carga estándar |
| C-4 | Camión 3 Ejes | Carga estándar (variante) |
| C-5 | Camión 5 Ejes | Carga pesada |
| C-9 | Camión 9 Ejes | Carga muy pesada (dobletes) |

---

## 🗺️ Conceptos Clave

### Rutas de Transporte (TUSA)

Una **ruta** es un trayecto entre dos puntos (origen-destino) que incluye:
- Identificación en el sistema TUSA
- Lista ordenada de casetas
- Categoría de transporte (Nacionales, Latinos, etc)
- Tarifas fijas por tipo de vehículo
- Distancias (reales, oficiales, de pago, tabuladas)

**Ciclo de vida de una ruta:**
```
┌────────────────────────┐
│ Origen (Ciudad)        │
└───────────┬────────────┘
            │
    ┌───────▼────────┐
    │ Caseta 1       │ ← Primer peaje
    │ 20 km          │
    └───────┬────────┘
            │
    ┌───────▼────────┐
    │ Caseta 2       │ ← Segundo peaje
    │ 45 km          │
    └───────┬────────┘
            │
    ┌───────▼────────┐
    │ Caseta 3       │ ← Tercer peaje
    │ 75 km          │
    └───────┬────────┘
            │
┌───────────▼────────────┐
│ Destino (Ciudad)       │
└────────────────────────┘
```

### Categorías de Ruta

| Categoría | Descripción | Cambios |
|-----------|-------------|---------|
| **Nacionales** | Rutas nacionales de transporte | Rutas políticas principales |
| **Latinos** | Transporte de centroamericanos/latinoamericanos | Rutas hacia Centroamérica |
| **Exportación** | Transporte de productos de exportación | Rutas a puertos |
| **Otros** | Transportes especiales | Casos especiales |
| **Cemex** | Transporte exclusivo CEMEX | Rutas de cemento |
| **Alterna** | Ruta alternativa (combinada con otra) | Variantes de ruta principal |

**Lógica de asignación de categoría:**
```javascript
// Campos en tabla: Latinos, Nacionales, Exportacion, Otros, Cemex, Alterna

if (solo_1_campo_activo) {
  categoria = ese_campo;  // "Nacionales", "Latinos", etc
}
else if (2_campos_activos && Alterna_es_uno) {
  categoria = el_otro_campo;  // Ej: Nacionales + Alterna = Nacionales
}
else {
  categoria = null;  // No cumple condiciones
}
```

### API INEGI Sakbe v3.1

INEGI (Instituto Nacional de Estadística y Geografía) proporciona la API **Sakbe v3.1** para:
- Calcular rutas entre dos ciudades
- Obtener información de casetas en la ruta
- Proporcionar distancias y costos estimados
- Sugerir rutas alternas

**Tipos de vehículo en INEGI:**
```javascript
1 = Automóvil
2 = Autobús (2 ejes)
3 = Camión (2 ejes)
4 = Camión (3 ejes)
5 = Camión (5 ejes) ← DEFAULT usado en sistema
6 = Camión (9 ejes)
```

---

## 📡 API Endpoints

### 1. **Obtener todas las casetas** (`getCasetas`)

**Ruta:** `GET /api/casetas`

Retorna lista completa de todas las casetas registradas en la base de datos.

```bash
# Request
GET /api/casetas

# Response (200 OK)
[
  {
    "ID_Caseta": 1,
    "Nombre": "Caseta Tlanalapa",
    "Carretera": "Mex 105",
    "Estado": "HIDALGO",
    "Automovil": 50.50,
    "Autobus2Ejes": 75.25,
    "Camion2Ejes": 100.00,
    "Camion3Ejes": 150.00,
    "Camion5Ejes": 200.00,
    "Camion9Ejes": 280.00,
    "IAVE": true,
    "latitud": "20.3456",
    "longitud": "-99.1234",
    "Nombre_IAVE": "Tlanalapa",
    "Notas": "Caseta principal en Hidalgo"
  },
  { ... más casetas }
]
```

**Campos en respuesta:**
- `ID_Caseta`: Identificador único
- `Nombre`: Nombre de la caseta
- `Carretera`: Carretera donde se ubica
- `Estado`: Entidad federativa
- `Automovil` a `Camion9Ejes`: Tarifas por tipo de vehículo
- `IAVE`: ¿Disponible para pago con TAG?
- `latitud`, `longitud`: Coordenadas GPS
- `Nombre_IAVE`: Nombre registrado en sistema IAVE

---

### 2. **Obtener casetas por ID (enriquecidas con INEGI)** (`getCasetasByID`)

**Ruta:** `GET /api/casetas/byid`

Obtiene casetas con mapeo a IDs INEGI para consultas de rutas.

```bash
# Request
GET /api/casetas/byid

# Response (200 OK)
[
  {
    "ID_Caseta": 1,
    "Nombre_IAVE": "Tlanalapa",
    "Origen": "HIDALGO",
    "Destino": "MEXICO DF",
    "OrigenINEGI": 30655,
    "DestinoINEGI": 2486,
    "ID_orden": "OT-12345",
    "Camion2Ejes": 100.00
  },
  { ... más casetas }
]
```

**Proceso interno:**
1. Consulta todas las casetas y sus rutas
2. Toma la primera ruta por fecha (Fecha_traslado)
3. Normaliza origen/destino
4. Busca IDs INEGI en objeto `poblaciones`
5. Consulta API INEGI para cada par (si aplica)

---

### 3. **Obtener estadísticas de casetas** (`getStatsCasetas`)

**Ruta:** `GET /api/casetas/stats`

Retorna estadísticas/resumen de casetas.

```bash
# Request
GET /api/casetas/stats

# Response (200 OK)
[
  {
    "ID_Caseta": 1,
    "Nombre": "Tlanalapa",
    "Estado": "HIDALGO",
    "IAVE": true,
    ...
  },
  { ... más casetas }
]
```

**Nota:** Actualmente retorna el mismo resultado que `getCasetas()`. Diseñado para futuras agregaciones (promedios, máximos, grupos por estado, etc).

---

### 4. **Obtener detalles de casetas desde INEGI** (`getCasetasDetails`)

**Ruta:** `POST /api/casetas/details`

Consulta la API INEGI Sakbe v3.1 para obtener detalles de casetas en una ruta.

```bash
# Request
POST /api/casetas/details
Content-Type: application/json

{
  "originId": 30655,    # ID INEGI - HIDALGO
  "finalId": 2486,      # ID INEGI - MEXICO DF
  "vehicleType": 5      # 5 = Camión 5 ejes
}

# Response (200 OK)
{
  "resultados": [
    {
      "numero_caseta": 1,
      "nombre": "Caseta Tlanalapa",
      "estado": "HIDALGO",
      "tarifa": 250.00,
      "km_acumulado": 25.5
    }
  ],
  "distancia_total": 125.5,
  "distancia_pago": 120.0,
  "costo_estimado": 450.50
}
```

**Parámetros:**
- `originId`: ID INEGI de ciudad origen (consultar objeto `poblaciones`)
- `finalId`: ID INEGI de ciudad destino
- `vehicleType`: Tipo de vehículo (1-6, default: 5)

---

### 5. **Obtener rutas TUSA** (`getRutasTUSA_TRN`)

**Ruta:** `GET /api/rutas/tusa-trn`

Retorna todas las rutas del sistema TUSA con categorización automática.

```bash
# Request
GET /api/rutas/tusa-trn

# Response (200 OK)
[
  {
    "ID_ruta": 1,
    "id_Tipo_ruta": 100,
    "Latinos": false,
    "Nacionales": true,
    "Exportacion": false,
    "Otros": false,
    "Cemex": false,
    "Alterna": false,
    "Categoria": "Nacionales",
    "Observaciones": "Ruta principal",
    "fecha_Alta": "2024-01-15",
    "Km_reales": 125.5,
    "Km_oficiales": 120.0,
    "Km_de_pago": 120.0,
    "Km_Tabulados": 120.0,
    "peaje_dos_ejes": 450.00,
    "peaje_tres_ejes": 675.00,
    "PoblacionOrigen": "Tlanalapa",
    "PoblacionDestino": "Mexico DF",
    "RazonOrigen": "Tlanalapa",
    "RazonDestino": "Mexico DF"
  },
  { ... más rutas }
]
```

**Cálculo de Categoría:**
1. Cuenta campos booleanos activos (verdadero)
2. Si solo 1: esa es la categoría
3. Si 2 activos y uno es Alterna: el otro es categoría
4. Si no: null (ruta mal configurada)

---

### 6. **Obtener casetas de una ruta** (`getCasetas_por_RutaTUSA_TRN`)

**Ruta:** `GET /api/casetas/ruta/{IDTipoRuta}`

Retorna todas las casetas en una ruta específica, en orden de aparición.

```bash
# Request
GET /api/casetas/ruta/100

# Response (200 OK)
[
  {
    "ID_Caseta": 1,
    "Nombre": "Caseta Tlanalapa",
    "Carretera": "Mex 105",
    "Estado": "HIDALGO",
    "Automovil": 50.50,
    "Autobus2Ejes": 75.25,
    "Camion2Ejes": 100.00,
    "Camion3Ejes": 150.00,
    "Camion5Ejes": 200.00,
    "Camion9Ejes": 280.00,
    "IAVE": true,
    "latitud": "20.3456",
    "longitud": "-99.1234",
    "Nombre_IAVE": "Tlanalapa",
    "Notas": "Primera caseta en ruta",
    "consecutivo": 1
  },
  {
    "ID_Caseta": 2,
    "Nombre": "Caseta Mexico City",
    ...
    "consecutivo": 2
  }
]
```

**Características:**
- Ordenadas por `consecutivo` (orden en la ruta)
- Coordenadas redondeadas a 4 decimales
- Error 404 si no hay casetas
- Incluye tarifas completas por tipo de vehículo

---

### 7. **Obtener coordenadas origen-destino** (`getCoordenadasOrigenDestino`)

**Ruta:** `GET /api/casetas/coordenadas/{IDTipoRuta}`

Retorna coordenadas de inicio y final de una ruta para mapas.

```bash
# Request
GET /api/casetas/coordenadas/100

# Response (200 OK)
{
  "origen": [[20.3456, -99.1234]],
  "destino": [[19.4326, -99.1332]],
  "mensajes": [
    "Coordenadas de origen cargadas correctamente"
  ]
}
```

**Validaciones:**
- Rechaza coordenadas con valor 0 o NULL
- Redondea a 4 decimales
- Retorna array de coordenadas (puede haber multiples si hay varias ciudades)
- Incluye mensajes de alertas si hay problemas

**Formato:** `[latitud, longitud]`

---

### 8. **Obtener nombres origen-destino** (`getNombresOrigenDestino`)

**Ruta:** `GET /api/casetas/nombres/{IDTipoRuta}`

Retorna nombre concatenado de origen y destino.

```bash
# Request
GET /api/casetas/nombres/100

# Response (200 OK)
"Tlanalapa - Mexico DF"
```

**Formato:** Concatenación de Directorio.Nombre con separador " - "

---

### 9. **Buscar ruta por ciudades** (`getRutaPorOrigen_Destino`)

**Ruta:** `POST /api/casetas/ruta/buscar`

Busca rutas en TUSA que coincidan con origen y destino especificados.

```bash
# Request
POST /api/casetas/ruta/buscar
Content-Type: application/json

{
  "origen": "Hidalgo",
  "destino": "Mexico"
}

# Response (200 OK)
{
  "success": true,
  "data": [
    {
      "Origen": "HIDALGO",
      "Destino": "MEXICO DF",
      "id_Tipo_ruta": 100,
      "Categoria": "Nacionales",
      "RutaAlterna": false,
      "RazonOrigen": "Tlanalapa",
      "RazonDestino": "Mexico DF"
    }
  ],
  "total": 1,
  "enTUSA": true,
  "mensaje": "Ruta encontrada en TUSA"
}

# Response si NO hay resultados (200 OK)
{
  "success": true,
  "data": [],
  "total": 0,
  "enTUSA": false,
  "mensaje": "Ruta no encontrada en TUSA. Mostrando solo información de INEGI"
}
```

**Parámetros:**
- `origen`: Nombre de ciudad (búsqueda parcial con LIKE)
- `destino`: Nombre de ciudad (búsqueda parcial con LIKE)

**Comportamiento:**
- Busca con LIKE en Ciudad_SCT (no es exacto)
- Retorna 200 OK incluso si no hay resultados
- Permite que frontend caiga a INEGI automáticamente
- Flag `enTUSA` indica si existe en TUSA

**Validación:**
- 400 Bad Request si falta `origen` o `destino`
- 500 Error si falla la base de datos

---

## 📊 Estructura de Base de Datos

### Tabla: casetas_Plantillas

```sql
CREATE TABLE casetas_Plantillas (
    ID_Caseta INT PRIMARY KEY,
    Nombre NVARCHAR(100),
    Carretera NVARCHAR(50),
    Estado NVARCHAR(50),
    Automovil DECIMAL(10,2),
    Autobus2Ejes DECIMAL(10,2),
    Camion2Ejes DECIMAL(10,2),
    Camion3Ejes DECIMAL(10,2),
    Camion5Ejes DECIMAL(10,2),
    Camion9Ejes DECIMAL(10,2),
    IAVE BIT,
    latitud NVARCHAR(20),
    longitud NVARCHAR(20),
    Nombre_IAVE NVARCHAR(100),
    Notas NVARCHAR(MAX)
);
```

### Tabla: Tipo_de_ruta_N (Rutas TUSA)

```sql
CREATE TABLE Tipo_de_ruta_N (
    id_Tipo_ruta INT PRIMARY KEY,
    Id_Ruta INT,
    id_origen INT,           -- ID_poblacion
    id_destino INT,          -- ID_poblacion
    PoblacionOrigen INT,     -- ID_entidad (Directorio)
    PoblacionDestino INT,    -- ID_entidad (Directorio)
    
    -- Categorías (campos booleanos)
    Latinos BIT,
    Nacionales BIT,
    Exportacion BIT,
    Otros BIT,
    Cemex BIT,
    Alterna BIT,
    
    -- Distancias
    Km_reales DECIMAL(10,2),
    Km_oficiales DECIMAL(10,2),
    Km_de_pago DECIMAL(10,2),
    Km_Tabulados DECIMAL(10,2),
    
    -- Tarifas por tipo de vehículo
    peaje_dos_ejes DECIMAL(10,2),
    peaje_tres_ejes DECIMAL(10,2),
    
    fecha_Alta DATETIME,
    Observaciones NVARCHAR(MAX)
);
```

### Tabla: PCasetasporruta (Relación Casetas-Rutas)

```sql
CREATE TABLE PCasetasporruta (
    Id_Caseta INT,
    Id_Ruta INT,
    id_Tipo_ruta INT,
    consecutivo INT,  -- Orden en la ruta
    
    FOREIGN KEY (Id_Caseta) REFERENCES casetas_Plantillas(ID_Caseta),
    FOREIGN KEY (id_Tipo_ruta) REFERENCES Tipo_de_ruta_N(id_Tipo_ruta)
);
```

### Tabla: Poblaciones (Mapeo INEGI)

```sql
CREATE TABLE Poblaciones (
    ID_poblacion INT PRIMARY KEY,
    Poblacion NVARCHAR(100),
    Ciudad_SCT NVARCHAR(100),
    -- Otras columnas...
);
```

### Tabla: Directorio (Entidades)

```sql
CREATE TABLE Directorio (
    ID_entidad INT PRIMARY KEY,
    Nombre NVARCHAR(100),
    Razon_social NVARCHAR(100),
    latitud DECIMAL(10,6),
    longitud DECIMAL(10,6),
    -- Otras columnas...
);
```

---

## 📍 Objeto Poblaciones (Mapeo INEGI)

El código contiene un objeto JavaScript `poblaciones` que mapea nombres de ciudades a IDs INEGI. Ejemplo:

```javascript
const poblaciones = {
  "HIDALGO": 30655,
  "PUEBLA": 104888,
  "CD SAHAGUN": 235030,
  "MEXICO DF (ZOCALO)": 2486,
  "MONTERREY": 263915,
  "SAN LUIS POTOSI": 262188,
  "GUADALAJARA": 150211,
  // ... más de 150 ciudades
};
```

**Nota:** Este objeto debe sincronizarse con los datos reales de INEGI periódicamente.

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────┐
│ 1. Frontend solicita ruta (origen, destino)         │
└───────────────────┬─────────────────────────────────┘
                    │
         ┌──────────▼─────────────┐
         │ getRutaPorOrigen_Dest  │
         │ Busca en TUSA          │
         └──────────┬─────────────┘
                    │
         ┌──────────▼──────────────────┐
         │ ¿Encontrada en TUSA?       │
         └──────────┬──────────────────┘
                    │
          ┌─────────┴──────────┐
          │                    │
      ┌───▼──────┐        ┌───▼─────────┐
      │ SÍ       │        │ NO          │
      │ Retorna  │        │ (INEGI)     │
      │ TUSA     │        └─────────────┘
      └──────────┘
          │
┌─────────▼──────────────────────────┐
│ 2. Frontend obtiene casetas en ruta│
│    getCasetas_por_RutaTUSA_TRN     │
└──────────────────┬─────────────────┘
                   │
┌──────────────────▼─────────────────┐
│ 3. Frontend obtiene coordenadas    │
│    getCoordenadasOrigenDestino     │
└──────────────────┬─────────────────┘
                   │
┌──────────────────▼─────────────────┐
│ 4. Frontend renderiza en mapa      │
│    - Marcadores de casetas         │
│    - Línea de ruta                 │
│    - Información de peajes         │
└────────────────────────────────────┘
```

---

## 💡 Casos de Uso

### Caso 1: Visualizar todas las casetas

```javascript
// Frontend
const response = await fetch('/api/casetas');
const casetas = await response.json();

// Renderizar tabla o mapa con todas las casetas
casetas.forEach(caseta => {
  console.log(`${caseta.Nombre} en ${caseta.Estado}`);
  console.log(`Tarifa Camión 5 ejes: $${caseta.Camion5Ejes}`);
});
```

### Caso 2: Buscar ruta y mostrar casetas

```javascript
// Frontend
const response = await fetch('/api/casetas/ruta/buscar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origen: 'Hidalgo',
    destino: 'Mexico'
  })
});

const resultado = await response.json();

if (resultado.enTUSA) {
  // Obtener casetas de la ruta
  const idRuta = resultado.data[0].id_Tipo_ruta;
  const casetasResponse = await fetch(`/api/casetas/ruta/${idRuta}`);
  const casetas = await casetasResponse.json();
  
  // Mostrar mapa con casetas
  casetas.forEach((caseta, idx) => {
    console.log(`${idx + 1}. ${caseta.Nombre}`);
    console.log(`   Tarifa: $${caseta.Camion5Ejes}`);
  });
}
```

### Caso 3: Consultar ruta en INEGI si no está en TUSA

```javascript
// Frontend - Fallback a INEGI
const resultado = await fetch('/api/casetas/ruta/buscar', {
  method: 'POST',
  body: JSON.stringify({ origen: 'Origen', destino: 'Destino' })
}).then(r => r.json());

if (!resultado.enTUSA) {
  // Usar API INEGI directamente
  const origenId = poblacionesMap['ORIGEN'];
  const destinoId = poblacionesMap['DESTINO'];
  
  const detalles = await fetch('/api/casetas/details', {
    method: 'POST',
    body: JSON.stringify({
      originId: origenId,
      finalId: destinoId,
      vehicleType: 5
    })
  }).then(r => r.json());
  
  console.log('Ruta de INEGI:', detalles);
}
```

### Caso 4: Calcular costo total de ruta

```javascript
// Backend - Sumar tarifas
const IDTipoRuta = 100;
const vehicleType = 'Camion5Ejes';

const casetasResponse = await fetch(`/api/casetas/ruta/${IDTipoRuta}`);
const casetas = await casetasResponse.json();

const costoTotal = casetas.reduce((sum, caseta) => {
  return sum + (caseta[vehicleType] || 0);
}, 0);

console.log(`Costo total para ruta ${IDTipoRuta}: $${costoTotal}`);
```

---

## ⚙️ Funciones Auxiliares

### `normalize(nombre)`
Normaliza nombres de ciudades para comparación.
```javascript
normalize('San Luis Potosí')    // 'SAN LUIS POTOSI'
normalize('Mexico-DF')         // 'MEXICODF'
```

### `getToken()`
Retorna token para API INEGI Sakbe v3.1.
```javascript
const token = getToken();  // 'Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST'
```

### `obtenerIdINEGI(nombreCiudad)`
Busca ID INEGI de una ciudad en objeto `poblaciones`.
```javascript
const idINEGI = obtenerIdINEGI('Monterrey');  // 263915
const noExiste = obtenerIdINEGI('MiCiudad');  // null
```

### `getCasetasINEGI(originId, finalId, vehicleType)`
Consulta API INEGI internamente.
```javascript
const resultado = await getCasetasINEGI(30655, 2486, 5);
// Retorna JSON stringificado con datos INEGI
```

---

## 🚨 Errores Comunes

### Error 1: ID INEGI no encontrado
```
Error: "Invalid originId or finalId"
Causa: Ciudad no existe en objeto `poblaciones`
Solución: Verificar nombre de ciudad y actualizar objeto `poblaciones`
```

### Error 2: Ruta no encontrada en TUSA
```
Respuesta: {"enTUSA": false, "data": []}
Causa: Origen/destino no coinciden exactamente con valores en BD
Solución: Frontend cae a INEGI automáticamente (comportamiento normal)
```

### Error 3: Coordenadas inválidas
```
Mensaje: "Coordenadas de origen no cargadas"
Causa: latitud o longitud son 0 o NULL en Directorio
Solución: Actualizar coordenadas en BD o usar API de geolocalización
```

### Error 4: Tipo de vehículo inválido
```
Error: "Invalid vehicleType"
Causa: Valor vehicleType fuera de rango 1-6
Solución: Usar valores válidos (1=Auto, ..., 5=Camión 5 ejes, ...)
```

---

## 🔗 Relaciones con Otros Controladores

### Dependencias
- **rutas.controllers.js**: Usa casetas para calcular rutas completas
- **cruces.controllers.js**: Registra cruce en cada caseta
- **exportController.js**: Exporta información de casetas a Excel

### Tablas relacionadas
- **casetas_Plantillas**: Datos maestros de casetas
- **Tipo_de_ruta_N**: Definición de rutas TUSA
- **PCasetasporruta**: Relación N:N entre casetas y rutas
- **Poblaciones**: Mapeo INEGI de ciudades
- **Directorio**: Entidades geográficas

---

## 📚 Referencias Externas

### API INEGI Sakbe v3.1
- **Endpoint:** `https://gaia.inegi.org.mx/sakbe_v3.1/detalle_c`
- **Método:** POST
- **Parámetros:** dest_i, dest_f, v (vehicle type), type, key
- **Respuesta:** JSON con información de casetas y rutas

### Token Actual
```
Jq92BpFD-tYae-BBj2-rEMc-MnuytuOB30ST
```

⚠️ **IMPORTANTE**: Este token debe rotarse periódicamente por seguridad.

---

## 📈 Mejoras Futuras

1. **Caché de consultas INEGI**: Evitar consultas redundantes
2. **Estadísticas avanzadas**: Agregaciones por estado, carretera, categoría
3. **Validación de coordenadas**: Verificar exactitud GPS
4. **Sincronización INEGI**: Actualizar periódicamente datos de población
5. **Historial de precios**: Seguimiento de cambios tarifarios
6. **Alertas de mantenimiento**: Casetas cerradas o en reparación

---

**Última actualización:** 1/12/2025  
**Versión:** 1.0  
**Estado:** ✅ Producción
