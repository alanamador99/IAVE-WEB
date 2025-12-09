# 🗺️ DIAGRAMA VISUAL Y REFERENCIA RÁPIDA

**Proyecto:** IAVE WEB  
**Fecha:** 3 de Diciembre de 2025

---

## 📊 DIAGRAMA DE ARQUITECTURA DE DATOS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA IAVE WEB - ARQUITECTURA                 │
└─────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────┐
                          │   IMPORTACIÓN    │
                          │  CSV/Excel File  │
                          └────────┬─────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  cruces.controllers.js      │
                    │  POST /api/cruces/import    │
                    │  (procesa 1000-10000/día)   │
                    └──────────────┬──────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
       ┌────▼────┐            ┌────▼────┐          ┌─────▼────┐
       │   TAGS  │            │   Tags  │   READ   │ casetas_ │
       │ lookup  │            │ find()  │──────────│Plantillas│
       │ID_mat   │            │         │          │GetTarifa │
       └────┬────┘            └────────┘          └─────┬────┘
            │                                            │
            │  ┌────────────────────────────────┐       │
            │  │ Orden_traslados  │  lookup OT   │       │
            │  │ find(mat, fecha) │  por fecha   │       │
            └─►├────────────────────────────────┤◄──────┘
               │ Estado_del_personal             │
               │ find(mat, fecha)                │
               │ ¿Vacaciones? ¿Incapacidad?      │
               └────────────────────────────────┘
                              │
                         ┌────▼─────────────┐
                         │ LÓGICA ESTATUS   │
                         │                  │
                         │ IF Importe       │
                         │   = ImporteOf ──→ Confirmado
                         │   < ImporteOf ──→ Se cobró menos
                         │   > ImporteOf ──→ Aclaración
                         │   + vacation ──→ Abuso
                         │   + no ruta  ──→ CasetaNoEncontrada
                         │                  │
                         └────┬─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   INSERT cruces   │
                    │   + auditoria     │
                    │(ImportacionesCruces)
                    └─────────┬─────────┘
                              │
            ┌─────────────────┼──────────────────┐
            │                 │                  │
       ┌────▼────┐      ┌─────▼─────┐    ┌─────▼──────┐
       │ abusos  │      │aclaraciones│    │  sesgos    │
       │.js      │      │.js        │    │ .js        │
       │GET /    │      │GET /      │    │GET /       │
       │abusos   │      │aclaraciones│    │sesgos      │
       └─────────┘      └───────────┘    └────────────┘
            │                 │                  │
            └─────────────────┴──────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │  Dashboard Frontend │
                   │  (React/Vue)        │
                   └─────────────────────┘
```

---

## 🔄 FLUJO DE DATOS DETALLADO

### FLUJO 1: IMPORTACIÓN

```
┌─ INPUT: CSV/Excel
│  └─ Columnas: Tag, Fecha, Hora, Caseta, Clase, Importe
│
├─ VALIDACIÓN
│  ├─ Campos obligatorios ✓
│  ├─ Formato fecha DD/MM/YYYY ✓
│  ├─ Valores válidos ✓
│  └─ Duplicados ✓
│
├─ ENRIQUECIMIENTO
│  ├─ Generar ID: YYMMDD_HHMMSS_TAG
│  ├─ Tags.find(Tag) → ID_matricula
│  ├─ Orden_traslados.find(ID_matricula, Fecha) → id_orden
│  ├─ casetas_Plantillas.getTarifa(Caseta, Clase) → ImporteOficial
│  ├─ Estado_del_personal.find(ID_matricula, Fecha) → Descripcion
│  └─ Aplicar lógica Estatus (8 ramificaciones)
│
├─ PERSISTENCIA
│  ├─ INSERT cruces (20 campos)
│  ├─ INSERT ImportacionesCruces (auditoría)
│  └─ SSE → Progreso en tiempo real
│
└─ OUTPUT: {total: 1000, insertados: 950, omitidos: 50}
```

### FLUJO 2: CONSULTA DE ABUSOS

```
┌─ GET /api/abusos
│
├─ QUERY
│  └─ SELECT * FROM cruces WHERE Estatus = 'Abuso'
│
├─ ENRIQUECIMIENTO (para cada registro)
│  ├─ Extraer ID_matricula de No_Economico
│  ├─ LEFT JOIN Estado_del_personal
│  │  (ID_matricula, Fecha ±1 día)
│  │  → Descripcion
│  ├─ LEFT JOIN Personal
│  │  (ID_matricula)
│  │  → Nombres, Ap_paterno, Ap_materno
│  └─ Calcular NombreCompleto = Nombres + Ap_paterno + Ap_materno
│
└─ OUTPUT: Array[Abuso]
   {
     ID, No_Economico, Fecha, Importe, montoDictaminado,
     Estatus_Secundario, NombreCompleto, Estado_Personal
   }
```

### FLUJO 3: ACTUALIZACIÓN DE ABUSO

```
┌─ PUT /api/abusos/{id}
│  Body: {
│    noAclaracion, FechaDictamen, estatusSecundario,
│    observaciones, dictaminado, montoDictaminado
│  }
│
├─ VALIDACIÓN
│  ├─ montoDictaminado ≤ Importe ✓
│  ├─ FechaDictamen ≥ Fecha del cruce ✓
│  └─ Estatus_Secundario válido ✓
│
├─ UPDATE cruces
│  SET NoAclaracion = @noAclaracion,
│      FechaDictamen = @FechaDictamen,
│      Estatus_Secundario = @estatusSecundario,
│      observaciones = @observaciones,
│      Aplicado = @dictaminado,
│      montoDictaminado = @montoDictaminado
│  WHERE ID = @id
│
└─ OUTPUT: Confirmación + datos actualizados
```

### FLUJO 4: ANÁLISIS DE SESGOS

```
┌─ GET /api/sesgos
│  └─ SELECT * FROM cruces 
│     WHERE Estatus LIKE '%CasetaNoEncontrada%'
│     ORDER BY ID DESC
│
├─ GET /api/sesgos/por-casetas
│  ├─ Identificar DISTINCT rutas con sesgos
│  ├─ Para cada ruta:
│  │  ├─ LEFT JOIN Tipo_de_ruta_N
│  │  ├─ Leer Latinos, Nacionales, Exportacion, etc.
│  │  ├─ Calcular categoría (lógica especial)
│  │  └─ Enriquecer con Km, poblaciones, tarifas
│  │
│  └─ OUTPUT: Array[Ruta]
│     {
│       ID_ruta, PoblacionOrigen, PoblacionDestino,
│       Categoria, Km_reales, Km_oficiales,
│       peaje_dos_ejes, peaje_tres_ejes
│     }
```

---

## 🎯 MATRIZ RÁPIDA: QUIÉN LEE/ESCRIBE QUÉ

```
┌──────────────────┬──────────────────────────────────────────────┐
│ TABLA            │ OPERACIONES POR MÓDULO                       │
├──────────────────┼──────────────────────────────────────────────┤
│ cruces           │ cruces:    W★★★ R★★★ U★★ (INSERT, SELECT)   │
│                  │ abusos:    R★★★ U★★   (filtrado)            │
│                  │ aclaraciones: R★★★ U★★ (filtrado)           │
│                  │ sesgos:    R★★   (filtrado)                 │
│                  │                                              │
│ ImportacionesCruces│ cruces: W★ (auditoría)                     │
│                  │                                              │
│ Tags             │ tags:      R★★★ U★   (estadísticas)         │
│                  │ cruces:    R★★   (lookup en import)         │
│                  │                                              │
│ Personal         │ abusos:    R★★★ (enriquecimiento)           │
│                  │ tags:      R★★★ (enriquecimiento)           │
│                  │                                              │
│ Estado_del_personal│ abusos:  R★★★ (contexto laboral)          │
│                  │ tags:      R★★★ (disponibilidad)            │
│                  │ cruces:    R★★★ (clasificación Estatus)     │
│                  │                                              │
│ Orden_traslados  │ cruces:    R★★★ U★ (lookup + asignación)   │
│                  │ aclaraciones: R★★ (JOIN)                    │
│                  │ sesgos:    R★★ (análisis)                   │
│                  │                                              │
│ casetas_Plantillas│ cruces:   R★★★ (obtener tarifas)           │
│                  │ aclaraciones: R★★ (enriquecimiento)         │
│                  │ casetas:   R★★★ (listados)                  │
│                  │                                              │
│ Tipo_de_ruta_N   │ sesgos:    R★★★ (análisis rutas)            │
│                  │ casetas:   R★★★ (listados)                  │
└──────────────────┴──────────────────────────────────────────────┘

Legend: W=Write, R=Read, U=Update
★★★ = Muy frecuente, ★★ = Frecuente, ★ = Ocasional
```

---

## 🔑 ATRIBUTOS CLAVE POR OPERACIÓN

### OPERACIÓN: IMPORTAR CRUCE

**INPUT:**
```javascript
{
  Tag: "ABC123456789",
  Fecha: "01/12/2025",
  Hora: "14:30:45",
  Caseta: "Caseta Palmillas",
  Clase: "C-3",
  Importe: 350.00
}
```

**TRANSFORMACIÓN:**
```javascript
{
  // Generado
  ID: "251201_143045_ABC123456789",
  
  // Copiado del input
  Tag: "ABC123456789",
  Fecha: "2025-12-01 14:30:45",
  Caseta: "Caseta Palmillas",
  Clase: "C-3",
  Importe: 350.00,
  
  // Buscado en Tags
  No_Economico: "123 Carlos García López",
  
  // Buscado en Orden_traslados
  id_orden: "OT-123456",
  
  // Buscado en casetas_Plantillas
  idCaseta: "PALM001",
  ImporteOficial: 340.00,
  
  // Buscado en Estado_del_personal
  Estado_Laborar: "ACTIVO",
  
  // Calculado - LÓGICA
  Estatus: "Aclaración",
  Estatus_Secundario: "pendiente_aclaracion",
  
  // Valores por defecto
  Aplicado: false,
  FechaDictamen: null,
  montoDictaminado: null,
  NoAclaracion: null,
  observaciones: null,
  Carril: null,
  Consecar: null,
  FechaAplicacion: null
}
```

### OPERACIÓN: ACTUALIZAR ESTATUS DE ABUSO

**INPUT:**
```javascript
{
  id: "251201_143045_ABC123456789",
  estatus: "Abuso",
  estatusSecundario: "descuento_aplicado_pendiente_acta",
  noAclaracion: "ACL-2025-001",
  FechaDictamen: "2025-12-03",
  montoDictaminado: 250.00,
  observaciones: "Operador en situación irregular",
  dictaminado: true
}
```

**ACTUALIZACIÓN EN BD:**
```sql
UPDATE cruces SET
  Estatus_Secundario = 'descuento_aplicado_pendiente_acta',
  NoAclaracion = 'ACL-2025-001',
  FechaDictamen = '2025-12-03',
  montoDictaminado = 250.00,
  observaciones = 'Operador en situación irregular',
  Aplicado = 1
WHERE ID = '251201_143045_ABC123456789'
```

---

## 📊 ESTADÍSTICAS DE VOLUMEN

```
┌─────────────────────────────────────────────────────────┐
│ VOLUMEN TÍPICO DE DATOS (estimado)                      │
├─────────────────────────────────────────────────────────┤
│ cruces                    ~10,000 registros/día         │
│ ImportacionesCruces       5-10 registros/día            │
│ Tags                      ~300 registros (estático)     │
│ Personal                  ~200 registros (estático)     │
│ Estado_del_personal       ~5,000 registros/día          │
│ Orden_traslados           ~500-1000 registros (anual)   │
│ casetas_Plantillas        ~100-150 registros (estático) │
│ Tipo_de_ruta_N            ~100-200 registros (estático) │
└─────────────────────────────────────────────────────────┘

CRECIMIENTO ANUAL: ~3.6M cruces/año
```

---

## ⏱️ FRECUENCIA DE OPERACIONES

```
┌────────────────────────────────────────────────┐
│ OPERACIÓN                │ FRECUENCIA          │
├────────────────────────────────────────────────┤
│ Importación de cruces    │ 1-5 veces/día       │
│ SELECT de cruces         │ 100+ veces/día      │
│ UPDATE de estatus        │ 50+ veces/día       │
│ Consulta de abusos       │ 20+ veces/día       │
│ Consulta de aclaraciones │ 20+ veces/día       │
│ Consulta de sesgos       │ 10+ veces/día       │
│ Consulta de TAGs         │ 5-10 veces/día      │
│ UPDATE de OT             │ 10+ veces/día       │
└────────────────────────────────────────────────┘

HORA PICO: 6-10 AM (importaciones)
HORA MEDIA: 2-5 PM (actualizaciones)
```

---

## 🔗 QUICK REFERENCE: FOREIGN KEYS

```
┌────────────────────────────────────────────────────┐
│ RELACIONES ENTRE TABLAS                            │
├────────────────────────────────────────────────────┤
│ cruces.id_orden             → Orden_traslados      │
│ cruces.idCaseta             → casetas_Plantillas   │
│ cruces.No_Economico + Tag   → Tags                 │
│ Tags.ID_matricula           → Personal             │
│ Estado_del_personal.ID_matricula → Personal        │
│ Orden_traslados.Id_tipo_ruta → Tipo_de_ruta_N    │
└────────────────────────────────────────────────────┘
```

---

## 📝 CHEAT SHEET: VALORES PERMITIDOS

### Clase de Vehículo (8 valores)
```
A     = Automóvil
B     = Autobús (2 ejes)
C-2   = Camión (2 ejes)
C-3   = Camión (3 ejes)
C-4   = Camión (3 ejes) - alias C-3
C-5   = Camión (5 ejes)
C-9   = Camión (9 ejes)
```

### Estatus Principal (8 valores)
```
Confirmado                    (Importe = ImporteOficial)
Se cobró menos                (Importe < ImporteOficial)
Aclaración                    (Importe > ImporteOficial)
Abuso                         (Personal en situación especial)
CasetaNoEncontradaEnRuta      (Caseta ∉ Ruta)
Ruta Sin Casetas              (OT sin casetas)
Pendiente                     (En espera)
Condonado                     (Cancelado)
```

### Estados de TAG (4 valores)
```
activo       = Asignado a operador en servicio
stock        = Disponible para asignar
inactivo     = Fuera de servicio
extravio     = Perdido/extraviado
```

### Categorías de Ruta (combinaciones BIT)
```
Latinos       = Transporte Latinos
Nacionales    = Transporte Nacional
Exportacion   = Rutas de exportación
Otros         = Otros tipos
Cemex         = Rutas específicas Cemex
Alterna       = Rutas alternativas
```

---

## 🔐 VALIDACIONES CRÍTICAS

### Antes de INSERT cruces:
- [ ] Importe > 0
- [ ] Clase ∈ {A, B, C-2, C-3, C-5, C-9}
- [ ] Fecha es válida
- [ ] Tag existe en tabla Tags
- [ ] Caseta existe en casetas_Plantillas

### Antes de UPDATE Estatus_Secundario:
- [ ] Transición es válida (jerarquía)
- [ ] montoDictaminado ≤ Importe (si aplica)
- [ ] FechaDictamen ≥ Fecha del cruce
- [ ] NoAclaracion no es null (si Estatus = Aclaración)

### Antes de INSERT en ImportacionesCruces:
- [ ] Usuario no es null
- [ ] FechaImportacion = GETDATE()
- [ ] TotalInsertados ≥ 0

---

## 📱 ENDPOINTS PRINCIPALES

### cruces.controllers.js
```
POST   /api/cruces/import              # Importar masivo
GET    /api/cruces                     # Listar todos
GET    /api/cruces/stats               # Estadísticas
GET    /api/cruces/conciliacion        # Validar vs OT
PUT    /api/cruces/:id/status          # Actualizar (individual)
PATCH  /api/cruces/status-masivo       # Actualizar (masivo)
GET    /api/cruces/ots                 # Listar OT
PUT    /api/cruces/:id/ot              # Asignar OT
POST   /api/cruces/update-ots          # Asignar OT (masivo)
GET    /api/cruces/progress            # SSE progreso
```

### abusos.controllers.js
```
GET    /api/abusos                     # Obtener todos
GET    /api/abusos/operador/:id        # Por operador
GET    /api/abusos/ubicaciones/:id     # Geolocalización
PUT    /api/abusos/:id/estatus         # Actualizar
PATCH  /api/abusos/stats               # Estadísticas
```

### aclaraciones.controllers.js
```
GET    /api/aclaraciones               # Obtener todas
GET    /api/aclaraciones/stats         # Estadísticas
PUT    /api/aclaraciones/:id           # Actualizar
PATCH  /api/aclaraciones/status-masivo # Actualizar (masivo)
```

### sesgos.controllers.js
```
GET    /api/sesgos                     # Obtener sesgos
GET    /api/sesgos/por-casetas         # Agrupar por caseta
GET    /api/sesgos/stats               # Estadísticas
```

### tags.controllers.js
```
GET    /api/tags                       # Obtener todos
GET    /api/tags/total                 # Contar
GET    /api/tags/stats                 # Estadísticas
POST   /api/tags/responsiva            # Generar responsiva
GET    /api/tags/unavailable/:fecha    # No disponibles
```

### casetas.controllers.js
```
GET    /api/casetas                    # Listar casetas
GET    /api/casetas/:id                # Caseta específica
GET    /api/casetas/stats              # Estadísticas
GET    /api/rutas                      # Todas las rutas
```

---

## 🎓 EJEMPLO: FLUJO COMPLETO

### Escenario: Importar un cruce y resolver como abuso

```
PASO 1: Importar
POST /api/cruces/import
  Body: CSV con 1000 cruces
  Header: x-usuario = admin@iave.mx
  → 950 insertados, 50 omitidos

PASO 2: Consultar abusos
GET /api/abusos
  → Retorna 45 abusos detectados

PASO 3: Ver detalles del abuso
GET /api/abusos/operador/123
  → Muestra todos los abusos del operador 123
  → NombreCompleto: "Carlos García López"
  → Estado: "Vacaciones"

PASO 4: Actualizar estatus del abuso
PUT /api/abusos/251201_143045_ABC123456789
  Body: {
    estatusSecundario: "descuento_aplicado_pendiente_acta",
    montoDictaminado: 250.00,
    FechaDictamen: "2025-12-03",
    observaciones: "Descuento aplicado por nómina",
    dictaminado: true
  }
  → Estatus_Secundario: pendiente_reporte 
                        → descuento_aplicado_pendiente_acta

PASO 5: Consultar estadísticas
PATCH /api/abusos/stats
  → {
      total_abusos: 45,
      pendiente_reporte: 10,
      descuento_aplicado: 20,
      completado: 15
    }
```

---

**Versión:** 1.0  
**Última actualización:** 3 de Diciembre de 2025  
**Proyecto:** IAVE WEB - Sistema de Gestión de Peajes
