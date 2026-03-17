# Documentación - abusos.controllers.js

## 📋 Resumen General

El controlador `abusos.controllers.js` gestiona todas las operaciones relacionadas con **ABUSOS** en el sistema IAVE. Un abuso es una infracción cometida por un operador de transporte, detectada mediante el sistema de monitoreo de carreteras.

**Tipos de abusos comunes:**
- Exceso de velocidad
- Circulación en carril restringido
- Incumplimiento de horarios de circulación
- Otras infracciones de tránsito

**Responsabilidades principales:**
- Registrar y consultar abusos detectados
- Seguimiento del proceso disciplinario
- Cálculo de multas/descuentos
- Generación de reportes
- Obtener historial geográfico del operador

---

## 🚨 ¿Qué es un Abuso?

Un **abuso** es:
- **Infracción detectada**: Operador incumpliendo normas
- **Registrado automáticamente**: Sistema detecta violación
- **Con monto de multa**: Importe asociado a la infracción
- **Multidisciplinario**: Involucra proceso legal y administrativo
- **Rastreable**: Se registra ubicación, hora, operador, tipo de infracción

**Ciclo de vida de un abuso:**

```
┌─────────────────────┐
│ Abuso Detectado     │ ← Sistema identifica violación
│ (auto-registrado)   │
└──────────┬──────────┘
           │
┌──────────▼────────────────┐
│ pendiente_reporte         │ ← En espera de reporte formal
│ Importe = Multa original  │
└──────────┬────────────────┘
           │
┌──────────▼──────────────────────────┐
│ reporte_enviado_todo_pendiente      │ ← Reporte enviado al operador
│ Pendiente acción (descuento/acta)   │
└──────────┬──────────────────────────┘
           │
      ┌────┴──────────────────┐
      │                       │
  ┌───▼──────────────┐   ┌────▼─────────────────┐
  │ Descuento        │   │ Acta (proceso legal) │
  │ aplicado         │   │ en progreso          │
  │ (pago realizado) │   └────┬─────────────────┘
  └───┬──────────────┘        │
      │                       │
  ┌───▼──────────────────────────┐
  │ acta_aplicada_pendiente_      │
  │ descuento                     │ ← Ambas partes completadas
  └───┬──────────────────────────┘
      │
┌─────▼─────────────┐
│ completado        │ ← Proceso finalizado
│ (resuelto)        │
└───────────────────┘

O alternativa:
┌─────────────┐
│ condonado   │ ← Abuso perdonado/anulado
│ (anulado)   │
└─────────────┘
```

---

## 📊 Estados Secundarios de un Abuso

| Estado | Descripción | Monto |
|--------|-------------|-------|
| **pendiente_reporte** | Abuso detectado, sin reporte | Importe original |
| **reporte_enviado_todo_pendiente** | Reporte enviado al operador | Importe original |
| **descuento_aplicado_pendiente_acta** | Descuento aplicado, acta pendiente | montoDictaminado |
| **acta_aplicada_pendiente_descuento** | Acta aplicada, descuento pendiente | Importe original |
| **completado** | Ambas partes completadas | montoDictaminado |
| **condonado** | Abuso perdonado/condonado | 0 |

---

## 📡 API Endpoints

### 1. **Obtener todos los abusos** (`getAbusos`)

**Ruta:** `GET /api/abusos`

Retorna lista completa de abusos con información enriquecida.

```bash
# Request
GET /api/abusos

# Response (200 OK)
[
  {
    "ID": 1,
    "ID_Cruce": 1001,
    "ID_Matricula": 123,
    "NombreCompleto": "Carlos García López",
    "Nombres": "Carlos",
    "Apellidos": "García López",
    "FechaAbuso": "2025-12-01",
    "No_Economico": "123 Carlos García López",
    "Estatus": "Abuso",
    "Estatus_Secundario": "pendiente_reporte",
    "Importe": 250.00,
    "montoDictaminado": null,
    "Estado_Personal": "ACTIVO",
    "idCaseta": 5,
    "Observaciones": "Exceso de velocidad en caseta Tlanalapa"
  },
  {...}
]
```

**Características especiales:**
- Obtiene PRIMER estado del operador por fecha (evita duplicados)
- Enriquece NombreCompleto si está vacío usando No_Economico
- Incluye estado personal del operador en esa fecha

---

### 2. **Obtener abusos de un operador** (`getAbusosByOperador`)

**Ruta:** `GET /api/abusos/operador/{operador}`

Retorna todos los abusos de un operador específico.

```bash
# Request
GET /api/abusos/operador/123

# Response (200 OK)
[
  {
    "ID": 1,
    "Estatus": "Abuso",
    "Estatus_Secundario": "completado",
    "Fecha": "2025-12-01",
    "Importe": 250.00,
    "No_Economico": "123 Carlos García",
    ...
  },
  {
    "ID": 2,
    "Estatus": "Abuso",
    "Estatus_Secundario": "condonado",
    ...
  }
]
```

**Parámetro:**
- `operador`: ID de matrícula del operador

**Características:**
- Incluye abusos y abusos condonados
- Ordenados por estado (asc) y fecha (desc)

⚠️ **NOTA DE SEGURIDAD:** Usa interpolación SQL directa (vulnerable a SQL injection). Debería parametrizarse.

---

### 3. **Obtener ubicaciones de un abuso** (`getUbicacionesinADayByOperador`)

**Ruta:** `GET /api/abusos/ubicaciones/{IDCruce}`

Obtiene geolocalización del operador durante el día del abuso.

```bash
# Request
GET /api/abusos/ubicaciones/1001

# Response (200 OK)
{
  "ubicaciones": [
    {
      "latitud": "20.3456",
      "longitud": "-99.1234",
      "fecha": "2025-12-01T10:30:00",
      "fk_op": 123,
      "Nombres": "Carlos",
      "Ap_paterno": "García",
      "Ap_materno": "López"
    },
    {
      "latitud": "20.3500",
      "longitud": "-99.1300",
      "fecha": "2025-12-01T10:45:00",
      ...
    }
  ],
  "polylines": [
    [20.3456, -99.1234],
    [20.3500, -99.1300],
    [20.3545, -99.1367]
  ]
}
```

**Características:**
- Obtiene registros de tabla geo_op
- Filtra coordenadas válidas (descarta [0,0])
- Retorna polylines para visualizar ruta en mapa
- Fallback a datos del cruce si no hay geolocalización

**Formato de coordenadas:** `[latitud, longitud]`

---

### 4. **Obtener abusos agrupados** (`getAbusosAgrupados`)

**Ruta:** `GET /api/abusos/agrupados`

Retorna abusos agrupados por fecha y operador.

```bash
# Request
GET /api/abusos/agrupados

# Response (200 OK)
[
  {
    "ID_Matricula_Agrupado": "2025-12-01_123",
    "Fecha_Cruce": "2025-12-01",
    "NumAbusos": 3,
    "TotalImporte": 750.00,
    "Nombre_Operador": "Carlos García López",
    "Descripcion": "ACTIVO",
    "Operador_Verificado": 1
  },
  {
    "ID_Matricula_Agrupado": "2025-12-01_456",
    "Fecha_Cruce": "2025-12-01",
    "NumAbusos": 1,
    "TotalImporte": 250.00,
    "Nombre_Operador": "Miguel González",
    "Descripcion": "VACACIONES",
    "Operador_Verificado": 0
  }
]
```

**Información por grupo:**
- Conteo de abusos en el día
- Importe total del día
- Estado del operador en esa fecha
- Flag de verificación (¿operador válido en BD?)

**Ordenado por:** Fecha descendente

---

### 5. **Actualizar comentario de abuso** (`actualizarComentarioAbuso`)

**Ruta:** `PUT /api/abusos/comentario/{ID}`

Actualiza el campo de observaciones de un abuso.

```bash
# Request
PUT /api/abusos/comentario/1
Content-Type: application/json

{
  "nuevoComentario": "Operador reportó cambio de ruta autorizado"
}

# Response (200 OK)
{
  "message": "Comentario actualizado correctamente"
}
```

---

### 6. **Actualizar abuso completo** (`UpdateAbuso`)

**Ruta:** `PUT /api/abusos/{id}`

Actualiza información completa de un abuso.

```bash
# Request
PUT /api/abusos/1
Content-Type: application/json

{
  "noAclaracion": "AC-2025-001",
  "FechaDictamen": "2025-12-01",
  "estatusSecundario": "completado",
  "observaciones": "Descuento de $250 aplicado correctamente",
  "dictaminado": true,
  "montoDictaminado": 250.00
}

# Response (200 OK)
{
  "message": "Estatus completado actualizado correctamente sobre el ID 1"
}
```

**Campos actualizados:**
- NoAclaracion
- FechaDictamen
- Estatus_Secundario
- observaciones
- aplicado (flag de dictaminado)
- montoDictaminado

---

### 7. **Actualizar abusos en masa** (`actualizarEstatusMasivo`)

**Ruta:** `PUT /api/abusos/masivo`

Actualiza el estado de múltiples abusos simultáneamente.

```bash
# Request
PUT /api/abusos/masivo
Content-Type: application/json

{
  "ids": ["1", "2", "3", "4"],
  "nuevoEstatus": "completado"
}

# Response (200 OK)
{
  "message": "Estatus actualizado correctamente"
}
```

**Validaciones:**
- ids debe ser array
- nuevoEstatus es obligatorio
- Solo afecta registros donde Estatus='Abuso'

**Errores:**
- 400: Si datos son inválidos
- 500: Si falla BD

---

### 8. **Obtener estadísticas de abusos** (`getStatsAbusos`)

**Ruta:** `GET /api/abusos/stats`

Retorna estadísticas agregadas de abusos.

```bash
# Request
GET /api/abusos/stats

# Response (200 OK)
[
  {
    "pendiente_reporte_count": 45,
    "pendiente_reporte_monto": 11250.00,
    "reporte_enviado_todo_pendiente_count": 30,
    "reporte_enviado_todo_pendiente_monto": 7500.00,
    "descuento_aplicado_pendiente_acta_count": 12,
    "descuento_aplicado_pendiente_acta_monto": 3000.00,
    "acta_aplicada_pendiente_descuento_count": 8,
    "acta_aplicada_pendiente_descuento_monto": 2000.00,
    "completado_count": 25,
    "completado_monto": 6250.00,
    "total_count": 120,
    "total_monto": 30000.00
  }
]
```

**Métricas:**
- Conteo por estado: `{estado}_count`
- Monto por estado: `{estado}_monto`
- Totales generales

---

## 📊 Estructura de Base de Datos

### Tabla: Cruces (registros de abusos)

```sql
CREATE TABLE Cruces (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ID_Cruce INT,
    Fecha DATETIME,
    No_Economico NVARCHAR(50),      -- "123 Nombre Apellido"
    Estatus NVARCHAR(20),            -- 'Abuso', 'Aclaración', etc
    Estatus_Secundario NVARCHAR(50), -- 'pendiente_reporte', etc
    Importe DECIMAL(10,2),           -- Monto original
    montoDictaminado DECIMAL(10,2),  -- Monto del dictamen
    NoAclaracion NVARCHAR(50),       -- Número de aclaración
    FechaDictamen DATETIME,          -- Fecha del dictamen
    aplicado BIT,                    -- ¿Dictaminado?
    observaciones NVARCHAR(MAX),
    idCaseta INT,
    id_orden NVARCHAR(50),
    ...
    FOREIGN KEY (idCaseta) REFERENCES casetas_Plantillas(ID_Caseta)
);
```

### Tabla: Estado_del_personal

```sql
CREATE TABLE Estado_del_personal (
    ID_Matricula INT,
    ID_fecha DATE,
    Descripcion NVARCHAR(100),  -- 'ACTIVO', 'VACACIONES', etc
    Fecha_captura DATETIME,
    ...
);
```

### Tabla: geo_op (Geolocalización)

```sql
CREATE TABLE geo_op (
    id INT PRIMARY KEY,
    fk_op INT,                  -- ID_matricula
    latitud DECIMAL(10,6),
    longitud DECIMAL(10,6),
    fecha DATETIME,
    ...
);
```

---

## 💡 Casos de Uso

### Caso 1: Consultar abusos de un operador

```javascript
// Frontend
const operadorId = 123;
const response = await fetch(`/api/abusos/operador/${operadorId}`);
const abusos = await response.json();

// Mostrar en tabla
abusos.forEach(abuso => {
  console.log(`${abuso.Fecha}: ${abuso.Estatus_Secundario} - $${abuso.Importe}`);
});
```

### Caso 2: Resolver abuso (descuento + acta)

```javascript
// Frontend - Formulario de resolución
const updateData = {
  noAclaracion: "AC-2025-001",
  FechaDictamen: "2025-12-01",
  estatusSecundario: "completado",
  observaciones: "Descuento aplicado + acta levantada",
  dictaminado: true,
  montoDictaminado: 250.00
};

const response = await fetch(`/api/abusos/1`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});

const result = await response.json();
console.log(result.message);
```

### Caso 3: Actualizar múltiples abusos

```javascript
// Frontend - Acción en masa
const response = await fetch('/api/abusos/masivo', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ids: ["1", "2", "3", "4"],
    nuevoEstatus: "completado"
  })
});

const result = await response.json();
console.log(`${result.message} - 4 abusos procesados`);
```

### Caso 4: Ver ruta del operador durante abuso

```javascript
// Frontend - Mapa
const response = await fetch(`/api/abusos/ubicaciones/1001`);
const { ubicaciones, polylines } = await response.json();

// Renderizar polylines en mapa Leaflet
const polyline = L.polyline(polylines, {
  color: 'red',
  weight: 3,
  opacity: 0.7
}).addTo(map);

// Añadir marcadores de ubicaciones
ubicaciones.forEach(ubicacion => {
  L.marker([ubicacion.latitud, ubicacion.longitud])
    .bindPopup(`${ubicacion.fecha}`)
    .addTo(map);
});
```

### Caso 5: Dashboard de estadísticas

```javascript
// Frontend - Dashboard
const response = await fetch('/api/abusos/stats');
const stats = await response.json();
const stat = stats[0];

console.log(`=== ABUSOS DEL SISTEMA ===`);
console.log(`Total: ${stat.total_count} abusos`);
console.log(`Monto total: $${stat.total_monto}`);
console.log(`Pendientes: ${stat.pendiente_reporte_count}`);
console.log(`Completados: ${stat.completado_count}`);
console.log(`Recuperado: $${stat.completado_monto}`);
```

---

## 🔐 Campos Sensibles

- **No_Economico**: Contiene nombre del operador (PII)
- **Importe**: Multa/sanción
- **montoDictaminado**: Cantidad adeudada
- **observaciones**: Comentarios internos

---

## 🚨 Problemas Conocidos

### ⚠️ SQL Injection en getAbusosByOperador

```javascript
// VULNERABLE - Interpolación directa
.query(`...WHERE SUBSTRING(No_Economico, ...) = '${operador}'...`)

// DEBERÍA SER - Parametrizado
.query(`...WHERE SUBSTRING(No_Economico, ...) = @operador`)
  .input("operador", sql.VarChar, operador)
```

### Otros problemas:

1. **Falta de validación** en algunos endpoints
2. **Manejo inconsistente de errores**
3. **No hay autenticación/autorización** en los endpoints
4. **Consultas N+1** en getAbusosAgrupados

---

## 📈 Mejoras Futuras

1. **Corregir SQL Injection** en getAbusosByOperador
2. **Implementar auditoría** de cambios
3. **Notificaciones por correo** cuando se resuelven abusos
4. **Integración con sistema de descuentos** automáticos
5. **Reportes PDF** de abusos
6. **Historial de cambios** de estado

---

**Última actualización:** 1/12/2025  
**Versión:** 1.0  
**Estado:** ✅ Producción
