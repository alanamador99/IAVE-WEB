# 📋 RESUMEN EJECUTIVO: MAPEO DE TABLAS Y ATRIBUTOS

**Proyecto:** IAVE WEB  
**Fecha:** 3 de Diciembre de 2025  
**Alcance:** Todo el sistema (Backend + Base de Datos)

---

## 🎯 TABLAS PRINCIPALES (QUICK REFERENCE)

### Tabla 1: `cruces` ⭐ (CENTRAL)
```
PK: ID (VARCHAR 24)  
├─ Datos del cruce:
│  ├─ Caseta, No_Economico, Fecha, Importe, Tag
│  ├─ Carril, Clase, Consecar, FechaAplicacion
│  └─ ImporteOficial, Aplicado, FechaDictamen
├─ Relaciones:
│  ├─ FK: id_orden → Orden_traslados
│  ├─ FK: idCaseta → casetas_Plantillas
│  └─ DERIVED: Estatus (16 valores posibles)
├─ Estados secundarios:
│  ├─ pendiente_reporte, reporte_enviado, descuento_aplicado
│  ├─ acta_aplicada, completado, condonado
│  └─ pendiente_aclaracion, aclaracion_levantada, dictaminado
└─ Operaciones: INSERT, SELECT ★★★, UPDATE ★★, DELETE (raro)
```

**Valores de Estatus:**
```
Confirmado | Se cobró menos | Aclaración | Abuso
CasetaNoEncontradaEnRuta | Ruta Sin Casetas | Pendiente | Condonado
```

---

### Tabla 2: `ImportacionesCruces` (AUDITORÍA)
```
PK: Id (INT AUTO)
├─ Usuario (NVARCHAR 50)
├─ FechaImportacion (DATETIME)
└─ TotalInsertados (INT)

Operaciones: INSERT (1 por importación), SELECT (auditoría)
```

---

### Tabla 3: `Tags` ⭐ (DISPOSITIVOS)
```
PK: ID_tag (VARCHAR)
├─ FK: ID_matricula → Personal
├─ Estado (activo | stock | inactivo | extravio)
├─ FechaAsignacion, FechaDevolucion
└─ Operaciones: SELECT ★★★, UPDATE ★

Enriquecimiento automático: LEFT JOIN Personal + Estado_del_personal
```

---

### Tabla 4: `Personal` (MAESTRO)
```
PK: ID_matricula (INT)
├─ Nombres, Ap_paterno, Ap_materno
├─ (Otros campos personales)
└─ Operaciones: SELECT ★★★ (read-only)

Usado por: Tags, Estado_del_personal, abusos
```

---

### Tabla 5: `Estado_del_personal` (HISTÓRICO DIARIO)
```
PK: (ID_matricula, ID_fecha)
├─ Descripcion (estado laboral)
├─ Encabezado, ID_ordinal
└─ Operaciones: SELECT ★★★ (read-only)

Estados: VACACIONES | INCAPACIDAD | PERMISO | DESCANSO | FALTA | etc. (~40)
```

---

### Tabla 6: `Orden_traslados` (OT)
```
PK: ID_orden (VARCHAR)
├─ FK: Id_tipo_ruta → Tipo_de_ruta_N
├─ ID_clave (clasificación SCT: A, B, C-2, C-3, C-5, C-9)
├─ FechaInicio, FechaFin
└─ Operaciones: SELECT ★★★, UPDATE ★ (asignar a cruces)
```

---

### Tabla 7: `casetas_Plantillas` (CATÁLOGO)
```
PK: ID_Caseta (VARCHAR)
├─ Nombre_IAVE
├─ Tarifas por clase:
│  ├─ Automovil, Autobus2Ejes, Camion2Ejes
│  ├─ Camion3Ejes, Camion5Ejes, Camion9Ejes
│  └─ (Campos: NUMERIC para cada tarifa)
├─ Localización: latitud, longitud, Estado
└─ Operaciones: SELECT ★★★ (read-only)
```

---

### Tabla 8: `Tipo_de_ruta_N` (RUTAS)
```
PK: ID_ruta (VARCHAR)
├─ PoblacionOrigen, PoblacionDestino
├─ RazonOrigen, RazonDestino
├─ Distancias: Km_reales, Km_oficiales, Km_de_pago, Km_Tabulados
├─ Tarifas: peaje_dos_ejes, peaje_tres_ejes
├─ Categorías: Latinos, Nacionales, Exportacion, Otros, Cemex, Alterna (BIT)
├─ Observaciones, fecha_Alta
└─ Operaciones: SELECT ★★★ (read-only)
```

---

## 🔄 OPERACIONES POR MÓDULO

### 📱 **tags.controllers.js**
```
Tablas: Tags → Personal + Estado_del_personal

ENDPOINTS:
  GET  /api/tags                      # Todos los TAGs
  GET  /api/tags/total                # Contar TAGs
  GET  /api/tags/stats                # Estadísticas por estado
  POST /api/tags/responsiva           # Generar responsiva
  GET  /api/tags/unavailable/{fecha}  # Operadores no disponibles

ATRIBUTOS CLAVE:
  ✓ Lee: ID_tag, Estado, ID_matricula, FechaAsignacion
  ✓ Lee: Nombres, Ap_paterno, Ap_materno (Personal)
  ✓ Lee: Descripcion (Estado_del_personal) - para disponibilidad
  ✓ Escribe: FechaDevolucion (cuando se devuelve TAG)
```

---

### 🚗 **casetas.controllers.js**
```
Tablas: casetas_Plantillas → Tipo_de_ruta_N + Orden_traslados

ENDPOINTS:
  GET /api/casetas                    # Listar casetas
  GET /api/casetas/{id}               # Caseta específica
  GET /api/casetas/stats              # Estadísticas
  GET /api/rutas                      # Todas las rutas

ATRIBUTOS CLAVE:
  ✓ Lee: ID_Caseta, Nombre_IAVE, latitud, longitud, Estado
  ✓ Lee: Automovil...Camion9Ejes (tarifas)
  ✓ Lee: ID_ruta, PoblacionOrigen, PoblacionDestino, Km_*
  ✓ Lee: Latinos, Nacionales, Exportacion (categorías)
```

---

### 🚨 **abusos.controllers.js**
```
Tablas: cruces (Estatus='Abuso') ← Estado_del_personal + Personal

ENDPOINTS:
  GET  /api/abusos                    # Obtener todos
  GET  /api/abusos/operador/{id}      # Por operador
  GET  /api/abusos/ubicaciones/{id}   # Geolocalización
  PUT  /api/abusos/{id}/estatus       # Actualizar
  PATCH /api/abusos/stats             # Estadísticas

ATRIBUTOS CLAVE:
  ✓ Lee:  ID, No_Economico, Fecha, Importe, Estatus, idCaseta
  ✓ Lee:  Estado_del_personal (Descripcion) para contexto
  ✓ Lee:  Personal (nombre completo)
  ✓ Escr: Estatus_Secundario (pendiente → completado)
  ✓ Escr: montoDictaminado, FechaDictamen, NoAclaracion
  ✓ Escr: observaciones, Aplicado (BIT)

CICLO DE VIDA:
  pendiente_reporte 
    → reporte_enviado_todo_pendiente
      → descuento_aplicado_pendiente_acta
      → acta_aplicada_pendiente_descuento
        → completado
  O
  → condonado
```

---

### 📝 **aclaraciones.controllers.js**
```
Tablas: cruces (Estatus='Aclaración') ← Orden_traslados + casetas_Plantillas

ENDPOINTS:
  GET  /api/aclaraciones              # Obtener todas
  GET  /api/aclaraciones/stats        # Estadísticas
  PUT  /api/aclaraciones/{id}         # Actualizar
  PATCH /api/aclaraciones/status-masivo

ATRIBUTOS CLAVE:
  ✓ Lee:  ID, Importe, ImporteOficial, Fecha, id_orden
  ✓ Lee:  Orden_traslados (ID_clave - clasificación)
  ✓ Lee:  casetas_Plantillas (Nombre_IAVE, tarifas, geolocalización)
  ✓ Escr: NoAclaracion, FechaDictamen, montoDictaminado
  ✓ Escr: Estatus_Secundario, observaciones, Aplicado
  
CÁLCULO: diferencia = Importe - ImporteOficial

CICLO:
  pendiente_aclaracion
    → aclaracion_levantada
    → dictaminado
      → completado
```

---

### ⚙️ **sesgos.controllers.js**
```
Tablas: cruces (Estatus LIKE '%CasetaNoEncontrada%') ← Orden_traslados + Tipo_de_ruta_N

ENDPOINTS:
  GET /api/sesgos                     # Obtener sesgos
  GET /api/sesgos/por-casetas         # Agrupar por caseta
  GET /api/sesgos/stats               # Estadísticas
  PUT /api/sesgos/{id}/resolucion     # Marcar resuelto

ATRIBUTOS CLAVE:
  ✓ Lee:  ID, Caseta, Importe, No_Economico, Estatus
  ✓ Lee:  Orden_traslados (ID_orden, Id_tipo_ruta)
  ✓ Lee:  Tipo_de_ruta_N (poblaciones, Km, categorías)

ANOMALÍAS DETECTADAS:
  - CasetaNoEncontradaEnRuta: caseta ∉ ruta
  - Ruta Sin Casetas: OT sin casetas definidas
```

---

### 🔄 **cruces.controllers.js** (CORE)
```
Tablas: cruces (WRITE) ← Tags + Orden_traslados + casetas_Plantillas + Estado_del_personal

ENDPOINTS:
  POST /api/cruces/import             # Importar masivo ★★★
  GET  /api/cruces                    # Obtener todos
  GET  /api/cruces/stats              # Estadísticas
  GET  /api/cruces/conciliacion       # Validar vs OT
  PUT  /api/cruces/{id}/status        # Actualizar estatus
  PATCH /api/cruces/status-masivo     # Masivo
  GET  /api/cruces/ots                # Listar OT
  PUT  /api/cruces/{id}/ot            # Asignar OT
  POST /api/cruces/update-ots         # Asignar OT masivo
  GET  /api/cruces/progress           # SSE progreso

LÓGICA DE IMPORTACIÓN:
  1. Input: {Tag, Fecha, Hora, Caseta, Clase, Importe}
  2. Generar ID: YYMMDD_HHMMSS_TAG
  3. Tags.find(Tag) → ID_matricula
  4. Orden_traslados.find(ID_matricula, Fecha) → id_orden
  5. casetas_Plantillas.getTarifa(Caseta, Clase) → ImporteOficial
  6. Estado_del_personal.find(ID_matricula, Fecha) → Descripcion
  7. Asignar Estatus según lógica
  8. INSERT cruces + ImportacionesCruces

LÓGICA DE ESTATUS:
  IF Importe = ImporteOficial → 'Confirmado'
  ELSE IF Importe < ImporteOficial → 'Se cobró menos'
  ELSE IF Importe > ImporteOficial → 'Aclaración'
  ELSE IF Estado_personal IN (Vacaciones, Incapacidad, ...) → 'Abuso'
  ELSE IF Caseta ∉ Ruta → 'CasetaNoEncontradaEnRuta'
  ELSE IF Ruta.sin_casetas → 'Ruta Sin Casetas'
  ELSE → 'Pendiente'
```

---

## 🔗 RELACIONES (Foreign Keys)

```
cruces.id_orden ────→ Orden_traslados.ID_orden
cruces.idCaseta ────→ casetas_Plantillas.ID_Caseta
cruces.No_Economico ┴─ Tags.ID_tag (lookup indirecto)

Orden_traslados.Id_tipo_ruta ────→ Tipo_de_ruta_N.id_Tipo_ruta

Tags.ID_matricula ────→ Personal.ID_matricula
Estado_del_personal.ID_matricula ────→ Personal.ID_matricula

cruces.No_Economico ─┐
                     ├─→ Estado_del_personal (lookup por fecha)
cruces.Fecha ─────────┘
```

---

## 📊 MATRIZ RÁPIDA: QUÉ SE LEE/ESCRIBE EN CADA TABLA

| Tabla | READ | WRITE | UPDATE | DELETE |
|-------|------|-------|--------|--------|
| cruces | ★★★ | ★★★ | ★★ | - |
| ImportacionesCruces | ★ | ★ | - | - |
| Tags | ★★★ | ★ | ★ | - |
| Personal | ★★★ | - | - | - |
| Estado_del_personal | ★★★ | - | - | - |
| Orden_traslados | ★★★ | - | ★ | - |
| casetas_Plantillas | ★★★ | - | - | - |
| Tipo_de_ruta_N | ★★★ | - | - | - |

---

## 🎯 OPERACIONES MÁS CRÍTICAS

### 1. **Importación de cruces** (POST /api/cruces/import)
```
Complejidad: ★★★
Impacto: Escribe ~1000-10000 registros por día
Requiere: Header x-usuario para auditoría
Usa SSE para progreso en tiempo real
```

### 2. **Consulta de abusos** (GET /api/abusos)
```
Complejidad: ★★
Impacto: Lee cruces + Estado_del_personal + Personal
JOINs: 3 tablas
Enriquecimiento: Completa información personal
```

### 3. **Actualización de estatus** (PUT /api/cruces/{id}/status)
```
Complejidad: ★
Impacto: Modifica Estatus + Estatus_Secundario
Cascada: Afecta lógica en abusos, aclaraciones, sesgos
```

### 4. **Asignación de OT masiva** (POST /api/cruces/update-ots)
```
Complejidad: ★★
Impacto: Batch UPDATE cruces.id_orden
Requiere: Lógica de matching por No_Economico + Fecha
```

---

## ⚠️ CAMPOS IMPORTANTES A VALIDAR

### Validación de Datos

| Campo | Validación | Tabla |
|-------|-----------|-------|
| `Clase` | Debe estar en {A, B, C-2, C-3, C-5, C-9} | cruces |
| `Estatus` | Valores predefinidos | cruces |
| `Importe` | NUMERIC(12,3), ≥ 0 | cruces |
| `montoDictaminado` | ≤ Importe | cruces |
| `FechaDictamen` | ≥ Fecha del cruce | cruces |
| `Estado` | Debe existir en Estado_del_personal | Tags |
| `ID_orden` | Debe existir en Orden_traslados | cruces |
| `idCaseta` | Debe existir en casetas_Plantillas | cruces |

---

## 🚀 FLUJO TÍPICO DE UN CRUCE

```
1. IMPORTACIÓN
   ├─ CSV/Excel entra → validación
   ├─ Consultar Tags para obtener matrícula
   ├─ Consultar Orden_traslados para OT
   ├─ Consultar casetas_Plantillas para tarifa
   ├─ Consultar Estado_del_personal para clasificar
   ├─ Asignar Estatus
   └─ INSERT en cruces + ImportacionesCruces

2. PROCESAMIENTO
   ├─ Cruce queda en Confirmado/Abuso/Aclaración/etc.
   ├─ Usuario ve en dashboard (GET /api/cruces)
   └─ Se agrupan por módulo (abusos, aclaraciones, sesgos)

3. RESOLUCIÓN (depende del estatus)
   ├─ Si Abuso:
   │  ├─ UPDATE Estatus_Secundario (pendiente → completado)
   │  ├─ UPDATE montoDictaminado (si corresponde)
   │  └─ UPDATE Aplicado (BIT)
   │
   ├─ Si Aclaración:
   │  ├─ UPDATE NoAclaracion
   │  ├─ UPDATE FechaDictamen
   │  └─ UPDATE montoDictaminado
   │
   └─ Si Sesgo:
      ├─ Investigar ruta
      └─ Marcar como resuelto

4. AUDITORÍA
   └─ ImportacionesCruces registra qué usuario hizo qué
```

---

## 📈 VOLUMEN ESTIMADO

| Tabla | Registros/Día | Crecimiento |
|-------|-------|-----------|
| cruces | ~10,000 | Lineal con operaciones |
| ImportacionesCruces | 5-10 | Una por importación |
| Tags | - | Estático (~300) |
| Personal | - | Estático (~200) |
| Estado_del_personal | ~5,000 | Histórico diario |

---

## 🔍 CONSULTAS FRECUENTES

```sql
-- Todos los cruces de hoy
SELECT * FROM cruces WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)

-- Abusos sin resolver
SELECT * FROM cruces 
WHERE Estatus = 'Abuso' AND Estatus_Secundario != 'completado'

-- Aclaraciones por operador
SELECT No_Economico, COUNT(*) as total, SUM(Importe) as total_importe
FROM cruces 
WHERE Estatus = 'Aclaración'
GROUP BY No_Economico
ORDER BY total DESC

-- TAGs disponibles (activos + stock)
SELECT * FROM Tags WHERE Estado IN ('activo', 'stock')

-- Operadores no disponibles en fecha
SELECT DISTINCT ID_matricula FROM Estado_del_personal 
WHERE ID_fecha = '2025-12-03' 
AND Descripcion IN ('VACACIONES', 'INCAPACIDAD', 'PERMISO')
```

---

**Creado:** 3 de Diciembre de 2025  
**Sistema:** IAVE WEB  
**Versión:** 1.0 RESUMEN EJECUTIVO
