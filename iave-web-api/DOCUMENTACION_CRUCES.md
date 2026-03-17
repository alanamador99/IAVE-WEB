# Documentación - cruces.controllers.js

## 📋 Resumen General

El controlador `cruces.controllers.js` gestiona todas las operaciones relacionadas con los registros de **"cruces"** (pasos de vehículos a través de casetas de peaje). Es el corazón del sistema IAVE WEB para el procesamiento, validación y conciliación de datos de tránsito.

---

## 🎯 Funcionalidades Principales

### 1. **Importación Masiva de Cruces** (`importCruces`)
**Ruta:** `POST /api/cruces/import`

Importa cruces desde archivos CSV/Excel con validación inteligente:

#### Flujo de Procesamiento:
1. ✅ Valida campos obligatorios (Tag, Fecha, Hora, Caseta)
2. ✅ Parsea y valida fechas en formato DD/MM/YYYY
3. ✅ Crea ID único para cada cruce: `YYMMDD_HHMMSS_TAG`
4. ✅ Consulta histórico de TAGs para obtener matrícula correcta
5. ✅ Busca Orden de Traslado (OT) asociada por matrícula y fecha
6. ✅ Obtiene tarifa oficial de la caseta según tipo de vehículo
7. ✅ Compara importe cobrado vs tarifa oficial
8. ✅ Asigna estatus basado en diferencia de precios
9. ✅ Inserta en BD y registra importación

#### Estatus Asignados:
| Estatus | Condición |
|---------|-----------|
| **Confirmado** | Importe = Tarifa oficial |
| **Se cobró menos** | Importe < Tarifa oficial |
| **Aclaración** | Importe > Tarifa oficial |
| **Abuso** | Personal en vacaciones/incapacidad |
| **CasetaNoEncontradaEnRuta** | Caseta no existe en la OT |
| **Ruta Sin Casetas** | OT sin casetas asignadas |
| **Pendiente** | Sin OT pero en situación especial |

#### Omisiones (No se insertan):
- Campos incompletos
- Fecha/Hora en formato inválido
- Cruces duplicados (ya existen en BD)

#### SSE (Server-Sent Events):
Envía progreso en tiempo real a clientes conectados:
```json
{
  "type": "progress",
  "total": 1000,
  "processed": 250,
  "inserted": 245,
  "percentage": 25,
  "message": "Procesando cruce 250 de 1000..."
}
```

#### Headers Requeridos:
```
x-usuario: alan.amador@atmexicana.com.mx  // Usuario realizando la importación
```

---

### 2. **Consulta de Estado del Personal** (`getStatusPersonal`)
**Ruta:** `GET /api/cruces/status/:ID_Cruce`

Obtiene el estado laboral del personal en la fecha del cruce.

#### Estrategia:
1. Extrae ID de la matrícula del cruce
2. Busca registro exacto en `Estado_del_personal` por fecha
3. Si no encuentra: busca ±1 día como fallback
4. Retorna estatus (ej: Vacaciones, Incapacidad, Permiso, etc.)

#### Response:
```json
[
  {
    "ID_matricula": "123",
    "ID_fecha": "2025-11-25",
    "Descripcion": "Vacaciones",
    "ID_ordinal": "1",
    "Encabezado": "Alterno"
  }
]
```

---

### 3. **Conciliación de Cruces** (`getConciliacion`)
**Ruta:** `GET /api/cruces/conciliacion`

Compara cada cruce con órdenes de traslado para validar coherencia.

#### Verifica:
- Existencia de OT para la matrícula
- Rango de fechas completo en OT (inicio y fin)
- Si el cruce está dentro del rango

#### Estatus Resultantes:
| Estatus | Significado |
|---------|-------------|
| **Conciliado** | Cruce dentro del rango de la OT |
| **Sin OT** | No existe OT para la matrícula |
| **Sin rango** | OT sin fechas de inicio/fin |
| **Fuera de horario** | Cruce fuera del rango de la OT |

---

### 4. **Actualización de Estatus** 
**Rutas:**
- `PUT /api/cruces/:id/status` (Individual)
- `PATCH /api/cruces/status-masivo` (Múltiples)

Cambia el estatus de cruces entre: `Confirmado`, `Abuso`, `Aclaración`, `Condonado`

#### Lógica Especial:
```javascript
if (estatus === 'Abuso') {
  // Actualiza Estatus_Secundario = 'pendiente_reporte'
}
if (estatus === 'Condonado') {
  // Cambia a 'Confirmado' con Secundario = 'Condonado'
}
```

---

### 5. **Gestión de Órdenes de Traslado (OT)**

#### Obtener todas las OT (`getOTS`)
**Ruta:** `GET /api/cruces/ots`

Retorna todas las órdenes de traslado del año actual.

#### Asignar OT a un cruce (`setOTSbyIDCruce`)
**Ruta:** `PUT /api/cruces/:id/ot`

Asigna una OT a un cruce con validación de formato `OT-XXXXX`.

#### Actualizar OT Masivamente (`actualizarOTMasivo`)
**Ruta:** `POST /api/cruces/update-ots`

Para cada cruce: busca la OT coincidente y la asigna automáticamente.

---

### 6. **Consultas y Estadísticas**

#### Obtener todos los cruces (`getCruces`)
**Ruta:** `GET /api/cruces`

Retorna todos los cruces con información enriquecida de base (Sahagún, Monterrey, Administrativos).

#### Estadísticas por estatus (`getStats`)
**Ruta:** `GET /api/cruces/stats`

Agrupa cruces por estatus y cuenta totales.

```json
[
  { "Estatus": "Confirmado", "total": 2350 },
  { "Estatus": "Abuso", "total": 45 },
  { "Estatus": "Aclaración", "total": 128 }
]
```

---

### 7. **Server-Sent Events (SSE)**

#### Conectarse al stream de progreso (`getImportProgress`)
**Ruta:** `GET /api/cruces/progress`

Establece conexión SSE para recibir actualizaciones en tiempo real.

#### Cliente JavaScript Ejemplo:
```javascript
const eventSource = new EventSource('/api/cruces/progress');

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`Progreso: ${progress.percentage}%`);
  console.log(`Insertados: ${progress.inserted}`);
};

eventSource.onerror = () => {
  console.error('Error en SSE');
  eventSource.close();
};
```

---

## 🔧 Funciones Auxiliares

### Utilidades Internas

| Función | Propósito |
|---------|-----------|
| `normalize(nombre)` | Normaliza nombres removiendo acentos y caracteres especiales |
| `parsearFechaHora(fecha, hora)` | Convierte DD/MM/YYYY HH:MM:SS a objeto Date |
| `crearID_Cruce(fecha, hora, tag)` | Genera ID único: YYMMDD_HHMMSS_TAGPART |
| `limpiarImporte(valor)` | Convierte "$1,234.56" → 1234.56 |
| `limpiarTAG(valor)` | Remueve puntos de TAG |
| `sendProgressToClients(data)` | Envía SSE a todos los clientes conectados |

### Funciones Heredadas (Deprecated)

⚠️ Las siguientes funciones son código de ejemplo de versiones anteriores:
- `deleteProductById`
- `getTotalProducts`
- `updateProductById`

### Función No Utilizada

- **`getCasetaMatch`**: Búsqueda de casetas con fallback a tabla auxiliar. Diseñada para futuro sistema de validación manual.

---

## 📊 Flujo de Importación Detallado

```
┌─────────────────────────────────────────────────────────────────┐
│ INICIO: Array de cruces desde CSV/Excel                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Para c/cruce │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐    ┌──────▼──────┐   ┌────▼─────┐
    │ Validar │───▶│ Parsear     │──▶│ Crear ID │
    │ campos  │    │ fecha/hora  │   │ único    │
    └────┬────┘    └──────┬──────┘   └────┬─────┘
         │                 │               │
         ├─ OMITIR si ─────┴─ OMITIR si ──┤
         │ incompleto       inválida       │
         │                                 │
         │           ┌────────────────┐    │
         │ ┌─────────▶│ Buscar TAG en  │◀───┘
         │ │          │ Control_Tags   │
         │ │          │ Historico      │
         │ │          └────────┬───────┘
         │ │                   │
         │ │          ┌────────▼─────────┐
         │ │ ┌────────▶│ Si no encontrado │
         │ │ │        │ usar No_Economico│
         │ │ │        └────────┬─────────┘
         │ │ │                 │
         │ │ │        ┌────────▼──────────┐
         │ │ └────────│ Buscar OT por    │
         │ │          │ matricula + fecha │
         │ │          └────────┬──────────┘
         │ │                   │
         │ │    ┌──────────────┼──────────────┐
         │ │    │              │              │
         │ │  Si OT        Si sin OT      Si OT
         │ │    │              │              │
         │ │ ┌──▼──┐      ┌────▼─────┐  ┌───▼────┐
         │ │ │Buscar│      │Buscar    │  │Obtener │
         │ │ │tarifa│      │situación │  │tarifa  │
         │ │ │oficial│      │personal  │  │oficial │
         │ │ └──┬───┘      └────┬─────┘  └───┬────┘
         │ │    │               │            │
         │ │ ┌──▼────────┐   ┌──▼───┐    ┌──▼────────┐
         │ │ │Comparar   │   │Si es │    │Comparar   │
         │ │ │importe vs │   │abusiva│   │importe vs │
         │ │ │tarifa     │   │→Abuso│   │tarifa     │
         │ │ └──┬────────┘   └──┬───┘    └──┬────────┘
         │ │    │               │           │
         │ │ ┌──┴──────────────┬┴────────┬──┴────┐
         │ │ │                 │         │       │
         │ │=   =           ┌──▼──┐  ┌──▼──┐ ┌──▼───┐
         │ │Confirmado      │Abuso│  │<    │ │>     │
         │ │                └─────┘  │     │ │      │
         │ │                       Menor  Mayor
         │ │                       ┌──────────┐
         │ │                       │Aclaración│
         │ │                       └──────────┘
         │ │
         │ └────────────────────────┬──────────────────┐
         │                          │                  │
         │            ┌─────────────▼────────────────┐ │
         │            │ INSERTAR en tabla Cruces    │ │
         │            │ - ID                        │ │
         │            │ - Tag                       │ │
         │            │ - No_Economico              │ │
         │            │ - Fecha                     │ │
         │            │ - Caseta                    │ │
         │            │ - Importe                   │ │
         │            │ - ImporteOficial (tarifa)  │ │
         │            │ - Estatus                   │ │
         │            │ - Estatus_Secundario        │ │
         │            │ - id_orden (OT)             │ │
         │            └─────────────┬────────────────┘ │
         │                          │                  │
         │           ┌──────────────▼────────────────┐ │
         │           │ Enviar progreso SSE          │ │
         │           └──────────────┬────────────────┘ │
         │                          │                  │
         │                          │                  │
         └──────────────────────────┼──────────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │ Si hay más cruces, volver   │
                    │ al "Para c/cruce"           │
                    └───────────────┬──────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │ FIN: Registrar importación  │
                    │ en tabla ImportacionesCruces│
                    └────────────────────────────┘
```

---

## 📐 Modelos de Datos

### Tabla: `Cruces`
```sql
CREATE TABLE Cruces (
    ID NVARCHAR(50) PRIMARY KEY,           -- YYMMDD_HHMMSS_TAG
    Tag NVARCHAR(50),                      -- TAG del dispositivo
    No_Economico NVARCHAR(50),             -- Matricula + Nombre
    Fecha DATETIME,                        -- Fecha/hora del cruce
    FechaAplicacion DATETIME,              -- Fecha aplicación de cobro
    Caseta NVARCHAR(100),                  -- Nombre de caseta
    Carril NVARCHAR(10),                   -- Número de carril
    Clase NVARCHAR(10),                    -- Clase de vehículo (A,B,C-2,etc)
    Importe FLOAT,                         -- Importe cobrado
    Consecar NVARCHAR(50),                 -- Consecutivo
    Estatus NVARCHAR(50),                  -- Confirmado/Abuso/Aclaración/etc
    Estatus_Secundario NVARCHAR(100),      -- Detalle del estatus
    id_orden NVARCHAR(50),                 -- ID de la OT
    ImporteOficial FLOAT,                  -- Tarifa oficial
    idCaseta NVARCHAR(50)                  -- ID de la caseta
);
```

### Tabla: `Control_Tags_Historico`
```sql
-- Registro histórico de asignación de TAGs a matrículas
CREATE TABLE Control_Tags_Historico (
    id_control_tags INT,
    id_matricula INT,
    Fecha_Alta_Tag DATETIME,
    Fecha_Baja_Tag DATETIME
);
```

### Tabla: `orden_status`
```sql
-- Estado/progreso de órdenes de traslado
CREATE TABLE orden_status (
    fk_orden NVARCHAR(50),                 -- ID de OT
    fk_matricula INT,                      -- ID de matricula
    iniciada DATETIME,                     -- Fecha inicio
    finalizada DATETIME                    -- Fecha fin
);
```

---

## ⚠️ Validaciones Importantes

### 1. **Duplicados**
Un cruce se considera duplicado si ya existe otro con el mismo ID en la BD.

### 2. **Formato de Fecha**
Debe ser exactamente `DD/MM/YYYY`. Ejemplos válidos:
- ✅ `25/11/2025`
- ❌ `2025-11-25`
- ❌ `11/25/2025`


### 3. **Formato de Hora**
Mínimo `HH:MM`, completo `HH:MM:SS`. Ejemplos:
- ✅ `14:30`
- ✅ `14:30:45`
- ❌ `2:30:45` (debe ser `02:30:45`)

### 4. **Campos Obligatorios**
- `Tag` (no vacío)
- `Fecha` (formato válido)
- `Hora` (formato válido)
- `Caseta` (no vacío)

### 5. **Validación OT**
Solo acepta formato: `OT-XXXXX` (donde X son dígitos númericos)

---

## 🐛 Manejo de Errores

### Errores Capturados Automáticamente

| Error | Acción |
|-------|--------|
| Campo obligatorio vacío | Omite cruce (incremente contador `incompletos`) |
| Fecha inválida | Omite cruce (incremente contador `fechaInvalida`) |
| Cruce duplicado | Omite cruce (incremente contador `duplicado`) |
| Matricula no extraída | Omite cruce |
| Error en BD | Envía SSE de error, retorna 500 |

### Response de Error
```json
{
  "error": "Error al importar los cruces",
  "type": "error",
  "message": "Error durante el procesamiento",
  "error": "Descripción técnica del error"
}
```

---

## 📝 Logs y Debugging

### Niveles de Log

```javascript
console.log(`❌ No se encontró el cruce con ID: ${IDCruce}`);
console.log(`✅ OT ${ID_orden} asignada al cruce ID: ${id}`);
console.warn('⚠️ Ruta no encontrada en TUSA');
console.error('❌ Error al calcular la ruta:', error);
```

### Información Loggada
- Inicio/fin de procesos
- Validaciones fallidas
- Registros omitidos (incompletos, fecha inválida, duplicados)
- Matriz encontrada (o no)
- OT encontrada (o no)
- Tarifa oficial vs importe cobrado
- Actualizaciones realizadas

---

##  Seguridad

### Headers de SSE
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Cache-Control
```

### Parámetros de Query
Todos los parámetros se pasan a través de `sql.NVarChar` para evitar SQL injection.

### Validación de Usuario
Se registra el usuario que realiza importación via header `x-usuario`.

---

## 📞 Contacto y Soporte

Para reportar bugs o solicitar funcionalidades:
- 📧 Email: alan.amador@atmexicana.com.mx
- 🐛 GitHub Issues: [\[enlace al repo\]](https://github.com/alanamador99/IAVE-WEB/issues)

---

**Última actualización:** 25/11/2025  
**Versión:** 1.0  
**Documentado por:** Alan Amador con apoyo de Copilot (usando Claude Sonnet 4.5)
**Estado:** ✅ Producción
