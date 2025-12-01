# Documentación - tags.controllers.js

## 📋 Resumen General

El controlador `tags.controllers.js` gestiona todas las operaciones relacionadas con los **TAGs de peaje**, dispositivos de identificación electrónica asignados a operadores de vehículos de transporte. Un TAG es fundamental para:

- Identificación automática en casetas de peaje
- Procesamiento de peajes electrónicos
- Seguimiento de disponibilidad de operadores
- Control de custodia de dispositivos
- Generación de responsivas legales

---

## 🎯 Conceptos Clave

### ¿Qué es un TAG?

Un **TAG** es:
- **Dispositivo físico**: Pequeño transceptor electrónico de identificación
- **Número de serie**: Código único (ej: "ABC123456789")
- **Asignación personal**: Se asigna a un operador específico
- **Responsabilidad legal**: El operador es responsable del dispositivo

**Ciclo de vida de un TAG:**

```
┌──────────────┐
│ Stock Inicial│ (Almacén)
└──────┬───────┘
       │
┌──────▼────────┐
│  Asignación   │ (Se entrega a operador)
│  al Operador  │ (Genera responsiva)
└──────┬────────┘
       │
┌──────▼────────┐
│   Activo      │ (Operador usando TAG)
│   (En uso)    │
└──────┬────────┘
       │
       ├──────────────────────────┐
       │                          │
  ┌────▼──────────┐      ┌───────▼──────┐
  │  Inactivado   │      │  Extraviado  │
  │  (Retirado)   │      │  (Perdido)   │
  └───────────────┘      └──────────────┘
```

### Estados de un TAG

| Estado | Activa | Fecha_Inactiva | Fecha_Extravio | Significado |
|--------|--------|----------------|-----------------|------------|
| **activo** | true | NULL | NULL | TAG en uso por operador |
| **stockM** | true | NULL | NULL | TAG en stock Monterrey (matricula 5001) |
| **stockS** | true | NULL | NULL | TAG en stock Sahagún (matricula 5007) |
| **inactivo** | false | ✓ | NULL | TAG retirado/devuelto |
| **extravio** | false | ✓ | ✓ | TAG reportado como extraviado/perdido |

---

## 📡 API Endpoints

### 1. **Obtener todos los TAGs** (`getTags`)

**Ruta:** `GET /api/tags`

Retorna lista completa de TAGs con información enriquecida de personal.

```bash
# Request
GET /api/tags

# Response (200 OK)
[
  {
    "id_control_tags": 1,
    "Dispositivo": "ABC123456789",
    "id_matricula": 123,
    "Nombres": "Carlos",
    "Ap_paterno": "García",
    "Ap_materno": "López",
    "Activa": true,
    "Fecha_inactiva": null,
    "Fecha_Extravio": null,
    "Estatus_Secundario": "activo",
    "No_Economico": "123 Carlos García López",
    ...
  },
  { ... más TAGs }
]
```

**Lógica de Estatus_Secundario:**

```javascript
if (Activa === true) {
  if (id_matricula === 5001) → "stockM"
  else if (id_matricula === 5007) → "stockS"
  else → "activo"
}
else if (Activa === false) {
  if (Fecha_inactiva IS NOT NULL && Fecha_Extravio IS NULL) → "inactivo"
  else if (Fecha_Extravio IS NOT NULL) → "extravio"
}
```

---

### 2. **Obtener total de TAGs** (`getTotalStatsTags`)

**Ruta:** `GET /api/tags/total`

Retorna el conteo simple de todos los TAGs en el sistema.

```bash
# Request
GET /api/tags/total

# Response (200 OK)
[
  {
    "Total": 257
  }
]
```

---

### 3. **Obtener estadísticas de TAGs** (`getStatsTags`)

**Ruta:** `GET /api/tags/stats`

Retorna desglose de TAGs por estado/categoría.

```bash
# Request
GET /api/tags/stats

# Response (200 OK)
[
  {
    "asignados": 185,
    "stockM": 35,
    "stockS": 28,
    "inactivos": 8,
    "extravios": 1
  }
]
```

**Interpretación:**
- **185 TAGs** en operadores activos (trabajando)
- **35 TAGs** en stock Monterrey (disponibles para asignar)
- **28 TAGs** en stock Sahagún (disponibles para asignar)
- **8 TAGs** retirados/devueltos (fuera de servicio)
- **1 TAG** reportado extraviado (perdido)

**Total del sistema:** 185 + 35 + 28 + 8 + 1 = 257 TAGs

---

### 4. **Generar Responsiva** (`generarResponsivaDesdePlantilla`)

**Ruta:** `POST /api/tags/responsiva`

Genera un documento Excel legalizado con la responsiva de asignación de TAG.

```bash
# Request
POST /api/tags/responsiva
Content-Type: application/json

{
  "nombre": "Carlos García López",
  "matricula": "123",
  "numeroDispositivo": "ABC123456789",
  "fechaAsignacion": "2025-11-29"
}

# Response
Descarga archivo: Responsiva_TAG_ABC123456789.xlsx
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

**Campos completados en plantilla:**
- **Celda B33**: Nombre del operador
- **Celda B38**: Matrícula del operador
- **Celda E5**: Número del TAG/dispositivo
- **Celda B21**: Fecha y lugar ("Tlanalapa Hidalgo DD/MM/YYYY")

**Contenido del documento:**
- Términos y condiciones legales
- Obligaciones del operador
- Procedimiento en caso de daño/pérdida
- Espacio para firmas

---

### 5. **Obtener Operadores No Disponibles** (`getUnavailableOps`)

**Ruta:** `GET /api/tags/unavailable/:fechaBuscada`

Identifica operadores que NO deberían trabajar en una fecha específica.

```bash
# Request
GET /api/tags/unavailable/29-11-2025

# Response (200 OK)
[
  {
    "ID_matricula": 45,
    "Nombres": "Miguel",
    "Ap_paterno": "González",
    "Ap_materno": "Martínez",
    "Descripcion": "VACACIONES",
    "Fecha_captura": "2025-11-20T08:00:00.000Z",
    "ID_fecha": "2025-11-29",
    "Captor": "admin@iave.mx",
    "ID_orden": "OT-12345",
    "Tag": "DEF987654321"
  },
  { ... más operadores }
]
```

**Parámetro:**
- `fechaBuscada` (path param): Formato "DD-MM-YYYY" (ej: "29-11-2025")

**Situaciones que inhabilitan:**
- VACACIONES
- PERMISO / PERMISO SALIDA
- INCAPACIDAD / PROBLEMA DE SALUD
- DESCANSO POR DIA FESTIVO / SEMANA SANTA
- CURSO / CAPACITACIÓN / CURSO ICECCT
- TRÁMITES (Licencia, Pasaporte, Visa)
- FALTA INJUSTIFICADA / FALTA SIN AVISAR
- BAJA / RENUNCIA
- INDISCIPLINA / CASTIGO

**Casos de uso:**
- Validar inconsistencias: ¿Por qué hay cruce de operador en vacaciones?
- Auditoría: Verificar que no hay fraude en registros
- Reportes: Identificar anomalías en datos

---

## 🔄 Flujo de Gestión de TAGs

```
┌─────────────────────────────────────────────────────────┐
│ 1. IMPORTACIÓN INICIAL / COMPRA DE TAGs                 │
│    Stock Inicial → Base Monterrey o Base Sahagún        │
│    (matricula 5001 o 5007)                              │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │ 2. ASIGNACIÓN A OPERADOR  │
         │    getTags() → Mostrar    │
         │    stock disponible       │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼──────────────────┐
         │ 3. GENERACIÓN DE RESPONSIVA    │
         │    generarResponsivaDesdePlant│
         │    → Documento legal          │
         │    → Firma de operador        │
         └─────────────┬──────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │ 4. TAG EN OPERACIÓN       │
         │    Estatus = "activo"     │
         │    Registra cruces        │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼──────────────────────┐
         │ 5. VALIDACIÓN DE CONSISTENCIA      │
         │    getUnavailableOps() →           │
         │    Detectar operadores             │
         │    en situación especial           │
         └─────────────┬──────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │ 6. RETIRO O EXTRAVIADO     │
         │    - Devuelto: inactivo    │
         │    - Perdido: extravio     │
         │    UPDATE Control_Tags     │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │ 7. REPORTE DE ESTADÍSTICAS │
         │    getStatsTags()          │
         │    getTotalStatsTags()     │
         └────────────────────────────┘
```

---

## 📊 Tabla de Datos: Control_Tags

```sql
CREATE TABLE Control_Tags (
    id_control_tags INT PRIMARY KEY AUTO_INCREMENT,
    Dispositivo NVARCHAR(50),              -- Número de serie del TAG
    id_matricula INT,                       -- ID del operador asignado
    Activa BIT,                            -- ¿Está activo? 1=sí, 0=no
    Fecha_Alta DATETIME,                   -- Cuándo se asignó
    Fecha_inactiva DATETIME,               -- Cuándo se retiró (si aplica)
    Fecha_Extravio DATETIME,               -- Cuándo se reportó extraviado
    
    FOREIGN KEY (id_matricula) REFERENCES Personal(ID_matricula)
);
```

### Tabla de Datos: Personal (relevante para TAGs)

```sql
CREATE TABLE Personal (
    ID_matricula INT PRIMARY KEY,
    Nombres NVARCHAR(100),
    Ap_paterno NVARCHAR(100),
    Ap_materno NVARCHAR(100),
    Puesto CHAR(1),                        -- 'O' para Operador
    Fecha_de_baja DATETIME,                -- NULL si está activo
    ...
);
```

---

## 💡 Casos de Uso

### Caso 1: Consultar disponibilidad de TAGs para asignación

```javascript
// Frontend
const response = await fetch('/api/tags/stats');
const stats = await response.json();

// Calcular TAGs disponibles
const disponibles = stats.stockM + stats.stockS;
console.log(`TAGs disponibles: ${disponibles}`);

// Si hay pocos, alertar al administrador
if (disponibles < 10) {
  console.warn('⚠️ Stock bajo de TAGs disponibles');
}
```

### Caso 2: Generar responsiva para nueva asignación

```javascript
// Frontend - Formulario de asignación
const formData = {
  nombre: "Carlos García López",
  matricula: "123",
  numeroDispositivo: "ABC123456789",
  fechaAsignacion: "2025-11-29"
};

const response = await fetch('/api/tags/responsiva', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

// Descargar automáticamente
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `Responsiva_TAG_${formData.numeroDispositivo}.xlsx`;
a.click();
```

### Caso 3: Detectar anomalías en operadores

```javascript
// Frontend - Auditoría
const unavailable = await fetch('/api/tags/unavailable/29-11-2025')
  .then(r => r.json());

// Analizar operadores que NO debían trabajar pero tienen cruces
unavailable.forEach(op => {
  console.log(`⚠️ ${op.Nombres} ${op.Ap_paterno}:
    - Estado: ${op.Descripcion}
    - Fecha: ${op.ID_fecha}
    - TAG usado: ${op.Tag}`);
});
```

### Caso 4: Monitoreo de inventario

```javascript
// Frontend - Dashboard
const stats = await fetch('/api/tags/stats').then(r => r.json());
const total = await fetch('/api/tags/total').then(r => r.json());

console.log(`=== INVENTARIO DE TAGs ===`);
console.log(`Total del sistema: ${total.Total}`);
console.log(`- En operadores: ${stats.asignados}`);
console.log(`- Stock Monterrey: ${stats.stockM}`);
console.log(`- Stock Sahagún: ${stats.stockS}`);
console.log(`- Retirados: ${stats.inactivos}`);
console.log(`- Extraviados: ${stats.extravios}`);

// Alertas
if (stats.extravios > 0) {
  console.warn(`⚠️ ${stats.extravios} TAG(s) extraviado(s) reportado(s)`);
}
```

---

## 📋 Formato de Responsiva (Plantilla)

La plantilla `ResponsivaTags.xlsx` incluye:

```
┌─────────────────────────────────────┐
│ RESPONSIVA DE ASIGNACIÓN DE TAG     │
│                                     │
│ Número de Dispositivo: [E5]         │
│ (Se completa con numeroDispositivo) │
│                                     │
│ ...legal terms...                   │
│                                     │
│ Operador: [B33]                     │
│ (Se completa con nombre)            │
│                                     │
│ Matrícula: [B38]                    │
│ (Se completa con matricula)         │
│                                     │
│ Lugar y Fecha: [B21]                │
│ (Se completa con ciudad y fecha)    │
│                                     │
│ Lugar: Tlanalapa Hidalgo            │
│ Fecha: DD/MM/YYYY                   │
│                                     │
│ Firmas:                             │
│ Operador: ___________               │
│ Testigo:  ___________               │
│ Supervisor: ___________             │
└─────────────────────────────────────┘
```

---

## 🔐 Situaciones Abusivas (No Disponibilidad)

La lista completa de situaciones que inhabilitan a un operador:

```javascript
const situacionesAbusivas = [
  // Descansos y permisos
  "DESCANSO CON DERECHO",
  "DESCANSO POR DIA FESTIVO",
  "DESCANSO POR SEMANA SANTA",
  "VACACIONES",
  "PERMISO",
  "PERMISO SALIDA",
  "PERMISO SALIDA / ENTRADA",
  "PATERNIDAD",
  
  // Situaciones de salud
  "INCAPACIDAD",
  "IMSS",
  "CONSULTA IMSS",
  "CITA IMSS",
  "PROBLEMA DE SALUD",
  "SE REPORTO ENFERMO",
  
  // Capacitación y desarrollo
  "CURSO",
  "CURSO ICECCT",
  "CAPACITACION",
  "CURSO DE AUDITOR",
  "CURSO AUDITORIA SAHAGUN",
  "AUDITOR INTERNO",
  "COCINERO",
  
  // Trámites
  "TRAMITE LICENCIA",
  "TRAMITE PASAPORTE",
  "TRAMITE VISA",
  "TRAMITE LIC FEDERAL",
  "PASAPORTE",
  
  // Faltas y sanciones
  "FALTA INJUSTIFICADA",
  "FALTA JUSTIFICADA",
  "FALTA CON AVISO",
  "IRSE SIN AVISAR",
  "INDISCIPLINA",
  "CASTIGADO",
  "QUITAR PREMIO",
  
  // Cambios laborales
  "BAJA",
  "PRESENTO SU RENUNCIA",
  
  // Problemas personales
  "PROBLEMA FAMILIAR",
  "INASISTENCIA A CURSO",
  "CONSULTA",
  "PLATICA",
  "SE REPORTO"
];
```

---

## 🔍 Ejemplos de Inconsistencias Detectadas

**Ejemplo 1: Operador en vacaciones con cruce registrado**
```
GET /api/tags/unavailable/20-11-2025
→ Operador 45 (Miguel González) en VACACIONES
→ Pero hay cruce con TAG DEF987654321 en esa fecha
⚠️ ALERTA: ¿Fraude? ¿Error de registro? ¿Suplantación?
```

**Ejemplo 2: Operador en incapacidad pero con múltiples cruces**
```
GET /api/tags/unavailable/22-11-2025
→ Operador 78 (Juan Pérez) en INCAPACIDAD
→ 3 cruces registrados ese día
⚠️ ALERTA: Necesita investigación urgente
```

**Ejemplo 3: Operador sin cruces en vacaciones (normal)**
```
GET /api/tags/unavailable/15-11-2025
→ Operador 32 (Ana López) en VACACIONES
→ Sin cruces ese día
✅ NORMAL: Consistencia esperada
```

---

## ⚙️ Funciones Auxiliares

### `normalize(nombre)`
Normaliza nombres para comparaciones.
```javascript
normalize("Sólo-la Paz")  // "SOLOLA PAZ"
normalize("Café México")  // "CAFE MEXICO"
```

### `limpiarImporte(valor)`
Limpia valores monetarios.
```javascript
limpiarImporte("$1,234.56")  // 1234.56
limpiarImporte("150")        // 150
```

### `limpiarTAG(valor)`
Limpia números de TAG.
```javascript
limpiarTAG("ABC123456789.")  // "ABC123456789"
```

---

## 📈 Métricas y KPIs

### Tasa de Disponibilidad de TAGs
```javascript
const stats = await getStatsTags();
const asignados = stats.asignados;
const total = asignados + stats.stockM + stats.stockS;
const disponibilidad = ((asignados / total) * 100).toFixed(2);
console.log(`Disponibilidad: ${disponibilidad}%`);
// Si > 70%: ✅ Bueno
// Si 50-70%: ⚠️ Regular
// Si < 50%: ❌ Bajo
```

### Tasa de Extraviados
```javascript
const stats = await getStatsTags();
const tasa_extravio = ((stats.extravios / total) * 100).toFixed(2);
console.log(`Tasa de extraviados: ${tasa_extravio}%`);
```

### Vida Promedio de un TAG
```javascript
// No directamente calculable con esta API
// Se puede hacer con análisis de Fecha_Alta vs Fecha_inactiva
```

---

## 🚨 Errores Comunes

### Error 1: Formato de fecha incorrecto
```bash
# ❌ INCORRECTO
GET /api/tags/unavailable/2025-11-29

# ✅ CORRECTO
GET /api/tags/unavailable/29-11-2025
```

### Error 2: Responsiva con datos incompletos
```javascript
// ❌ Error
{
  "nombre": "",           // Vacío
  "numeroDispositivo": "ABC123456789"
  // Falta matricula y fechaAsignacion
}

// ✅ Correcto
{
  "nombre": "Carlos García López",
  "matricula": "123",
  "numeroDispositivo": "ABC123456789",
  "fechaAsignacion": "2025-11-29"
}
```

---

## 🔗 Relaciones con Otros Controladores

### Dependencias
- **cruces.controllers.js**: Los TAGs se usan en cruces (campo Tag)
- **Personal**: Información de operadores a quienes se asignan TAGs
- **Estado_del_personal**: Información de disponibilidad de operadores

### Tablas relacionadas
- **Control_Tags**: Registro maestro de TAGs
- **Control_Tags_Historico**: Historial de cambios de asignación (si existe)
- **Personal**: Datos de operadores
- **Estado_del_personal**: Estados laborales por fecha

---

## 📞 Soporte

Para reportes de bugs o solicitudes:
- 📧 Email: desarrollo@iave.mx
- 🐛 GitHub Issues: [enlace al repo]

---

**Última actualización:** 29/11/2025  
**Versión:** 2.0  
**Documentado por:** Sistema de IA  
**Estado:** ✅ Producción
