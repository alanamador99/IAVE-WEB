# 📚 ÍNDICE COMPLETO: MAPEO DE TABLAS, ATRIBUTOS Y OPERACIONES

**Proyecto:** IAVE WEB  
**Fecha de Generación:** 3 de Diciembre de 2025  
**Alcance:** Todo el sistema (Backend + Base de Datos)  
**Versión:** 1.0

---

## 📖 DOCUMENTOS GENERADOS

Se han creado **4 documentos complementarios** que cubren todos los aspectos del mapeo de tablas y atributos:

### 1. 📊 **MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md** (PRINCIPAL)
   
   **Contenido:**
   - ✅ Descripción completa de todas las 8 tablas principales
   - ✅ Atributos detallados con tipos de datos y NULL
   - ✅ Mapeo de atributos por módulo (tags, casetas, abusos, aclaraciones, sesgos, cruces)
   - ✅ Operaciones por tabla (INSERT, SELECT, UPDATE, DELETE)
   - ✅ Flujos de datos completos (6 flujos principales)
   - ✅ Matriz de relaciones entre tablas
   - ✅ Estadísticas de uso y volumen
   - ✅ Recomendaciones de mejora
   
   **Cuándo usar:** Para entender la estructura general y las relaciones entre tablas

---

### 2. 📋 **RESUMEN_TABLAS_ATRIBUTOS.md** (QUICK REFERENCE)
   
   **Contenido:**
   - ✅ Resumen ejecutivo de 8 tablas principales
   - ✅ Valores permitidos para cada campo
   - ✅ Operaciones por módulo (en formato simplificado)
   - ✅ Relaciones Foreign Keys
   - ✅ Matriz rápida: qué se lee/escribe
   - ✅ Operaciones más críticas
   - ✅ Campos importantes a validar
   - ✅ Flujo típico de un cruce
   - ✅ Volumen estimado
   - ✅ Consultas SQL frecuentes
   
   **Cuándo usar:** Para búsquedas rápidas y referencia durante desarrollo

---

### 3. 🔗 **MATRIZ_OPERACIONES_DETALLADA.md** (TÉCNICO)
   
   **Contenido:**
   - ✅ Matriz completa por tabla y atributo
   - ✅ Tipos de datos, tamaños, nullable
   - ✅ Propósito y uso de cada atributo
   - ✅ Módulos que utilizan cada atributo
   - ✅ Operación (READ, WRITE, UPDATE, DELETE)
   - ✅ Valores válidos/enumerados
   - ✅ Estados secundarios con ciclo de vida
   - ✅ Matriz de operaciones por módulo
   - ✅ Matriz de relaciones
   - ✅ Índices recomendados
   - ✅ Validaciones críticas por atributo
   
   **Cuándo usar:** Para implementación técnica y optimización

---

### 4. 🗺️ **DIAGRAMA_Y_REFERENCIA_RAPIDA.md** (VISUAL)
   
   **Contenido:**
   - ✅ Diagrama ASCII de arquitectura de datos
   - ✅ Flujos detallados de 4 operaciones principales
   - ✅ Matriz rápida: quién lee/escribe qué
   - ✅ Atributos clave por operación
   - ✅ Transformaciones de datos (importación)
   - ✅ Estadísticas de volumen
   - ✅ Frecuencia de operaciones
   - ✅ Quick reference: valores permitidos
   - ✅ Validaciones críticas
   - ✅ Lista de endpoints
   - ✅ Ejemplo de flujo completo
   
   **Cuándo usar:** Para visualización y ejemplos prácticos

---

## 🗂️ ESTRUCTURA DE ARCHIVOS

```
Proyecto IAVE WEB/
├── MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md         ← Documento principal
├── RESUMEN_TABLAS_ATRIBUTOS.md                ← Quick reference
├── MATRIZ_OPERACIONES_DETALLADA.md            ← Detalles técnicos
├── DIAGRAMA_Y_REFERENCIA_RAPIDA.md            ← Visualización
│
└── iave-web-api/
    ├── DOCUMENTACION_ABUSOS.md
    ├── DOCUMENTACION_ACLARACIONES.md
    ├── DOCUMENTACION_CASETAS.md
    ├── DOCUMENTACION_CRUCES.md
    ├── DOCUMENTACION_EXPORT.md
    ├── DOCUMENTACION_SESGOS.md
    ├── DOCUMENTACION_TAGS.md
    └── INDICE_DOCUMENTACION.md
```

---

## 🎯 TABLAS PRINCIPALES DOCUMENTADAS

### 8 Tablas Core del Sistema

```
1. cruces ⭐ (CENTRAL)
   ├─ 20 atributos
   ├─ ~10,000 registros/día
   ├─ Estatus: 8 valores
   ├─ Estatus_Secundario: jerarquía compleja
   └─ Operaciones: INSERT (importación), SELECT ★★★, UPDATE ★★

2. ImportacionesCruces (AUDITORÍA)
   ├─ 4 atributos
   ├─ 5-10 registros/día
   └─ Operaciones: INSERT, SELECT

3. Tags ⭐ (DISPOSITIVOS)
   ├─ 5 atributos base
   ├─ ~300 registros (estático)
   ├─ Estado: 4 valores
   └─ Operaciones: SELECT ★★★, UPDATE ★

4. Personal (MAESTRO)
   ├─ 4 atributos principales
   ├─ ~200 registros (estático)
   └─ Operaciones: SELECT ★★★ (read-only)

5. Estado_del_personal (HISTÓRICO)
   ├─ 5 atributos
   ├─ ~5,000 registros/día
   ├─ Descripción: ~40 estados
   └─ Operaciones: SELECT ★★★ (read-only)

6. Orden_traslados (OT)
   ├─ 7 atributos principales
   ├─ ~500-1000 registros (anual)
   └─ Operaciones: SELECT ★★★, UPDATE ★

7. casetas_Plantillas (CATÁLOGO)
   ├─ 10 atributos
   ├─ ~100-150 registros (estático)
   └─ Operaciones: SELECT ★★★ (read-only)

8. Tipo_de_ruta_N (RUTAS)
   ├─ 20 atributos
   ├─ ~100-200 registros (estático)
   ├─ Categorías: 6 BIT fields
   └─ Operaciones: SELECT ★★★ (read-only)
```

---

## 🔄 MÓDULOS Y SUS OPERACIONES

### 6 Módulos del Backend

```
┌─────────────────────────────────────────────────┐
│ tags.controllers.js                             │
├─────────────────────────────────────────────────┤
│ Tablas: Tags, Personal, Estado_del_personal     │
│ Operaciones:                                    │
│   ✓ GET /api/tags (SELECT)                     │
│   ✓ GET /api/tags/stats (SELECT aggregated)    │
│   ✓ GET /api/tags/unavailable/:fecha           │
│   ✓ POST /api/tags/responsiva (generar)        │
│ Atributos: 15 consultados                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ casetas.controllers.js                          │
├─────────────────────────────────────────────────┤
│ Tablas: casetas_Plantillas, Tipo_de_ruta_N,   │
│         Orden_traslados                         │
│ Operaciones:                                    │
│   ✓ GET /api/casetas (SELECT all)              │
│   ✓ GET /api/casetas/:id (SELECT by id)        │
│   ✓ GET /api/rutas (SELECT rutas)              │
│ Atributos: 12 consultados                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ abusos.controllers.js                           │
├─────────────────────────────────────────────────┤
│ Tablas: cruces, Estado_del_personal, Personal   │
│ Operaciones:                                    │
│   ✓ GET /api/abusos (SELECT, 3 JOINs)          │
│   ✓ GET /api/abusos/operador/:id               │
│   ✓ PUT /api/abusos/:id (UPDATE 6 attrs)       │
│   ✓ PATCH /api/abusos/stats                    │
│ Atributos: 18 consultados, 6 modificados       │
│ Ciclo: pendiente → completado (6 estados)      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ aclaraciones.controllers.js                     │
├─────────────────────────────────────────────────┤
│ Tablas: cruces, Orden_traslados,               │
│         casetas_Plantillas                      │
│ Operaciones:                                    │
│   ✓ GET /api/aclaraciones (SELECT, 2 JOINs)    │
│   ✓ PUT /api/aclaraciones/:id (UPDATE 6 attrs) │
│   ✓ PATCH /api/aclaraciones/status-masivo      │
│ Atributos: 15 consultados, 6 modificados       │
│ Cálculo: diferencia = Importe - ImporteOficial │
│ Ciclo: pendiente → completado (4 estados)      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ sesgos.controllers.js                           │
├─────────────────────────────────────────────────┤
│ Tablas: cruces, Orden_traslados,               │
│         Tipo_de_ruta_N                          │
│ Operaciones:                                    │
│   ✓ GET /api/sesgos (SELECT filtered)          │
│   ✓ GET /api/sesgos/por-casetas (análisis)     │
│   ✓ GET /api/sesgos/stats (agrupado)           │
│ Atributos: 14 consultados                      │
│ Anomalías: CasetaNoEncontrada, RutaSinCasetas  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ cruces.controllers.js (CORE) ⭐                 │
├─────────────────────────────────────────────────┤
│ Tablas: cruces (WRITE), Tags, Orden_traslados, │
│         casetas_Plantillas, Estado_del_personal │
│ Operaciones:                                    │
│   ✓ POST /api/cruces/import (INSERT ★★★)       │
│   ✓ GET /api/cruces (SELECT ★★★)               │
│   ✓ PUT /api/cruces/:id/status (UPDATE ★★)    │
│   ✓ PATCH /api/cruces/status-masivo            │
│   ✓ POST /api/cruces/update-ots (batch)        │
│   ✓ GET /api/cruces/progress (SSE)             │
│ Atributos: 20 insertados, 10 consultados       │
│ Lógica: 7 condiciones para Estatus             │
│ SSE: Progreso en tiempo real (~1000 rec/batch) │
└─────────────────────────────────────────────────┘
```

---

## 📊 MATRIZ DE RELACIONES (FOREIGN KEYS)

```
ORIGEN                      →  DESTINO
─────────────────────────────────────────────────
cruces.id_orden             →  Orden_traslados.ID_orden
cruces.idCaseta             →  casetas_Plantillas.ID_Caseta
cruces.No_Economico (lookup)→  Tags.ID_tag
Tags.ID_matricula           →  Personal.ID_matricula
Estado_del_personal         →  Personal.ID_matricula
Orden_traslados             →  Tipo_de_ruta_N.id_Tipo_ruta
```

---

## 🔍 BÚSQUEDA RÁPIDA POR NECESIDAD

### Si necesito saber...

**"¿Cuáles son los atributos de la tabla cruces?"**
→ Ir a: MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md (Tabla 1)

**"¿Qué estados puede tener un abuso?"**
→ Ir a: RESUMEN_TABLAS_ATRIBUTOS.md (Sección "Estados Secundarios")

**"¿Cómo se relacionan las tablas?"**
→ Ir a: MATRIZ_OPERACIONES_DETALLADA.md (Sección "Matriz de Relaciones")

**"¿Cuáles son los valores válidos de Clase?"**
→ Ir a: DIAGRAMA_Y_REFERENCIA_RAPIDA.md (Sección "Valores Permitidos")

**"¿Qué ocurre al importar un cruce?"**
→ Ir a: DIAGRAMA_Y_REFERENCIA_RAPIDA.md (Sección "Flujos Detallados")

**"¿Cuándo se actualiza Estatus_Secundario?"**
→ Ir a: MATRIZ_OPERACIONES_DETALLADA.md (Tabla: cruces)

**"¿Qué atributos escribe abusos.controllers.js?"**
→ Ir a: MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md (Módulo: abusos)

**"¿Cuáles son los índices recomendados?"**
→ Ir a: MATRIZ_OPERACIONES_DETALLADA.md (Sección "Matriz de Índices")

**"¿Cuántos cruces se procesan por día?"**
→ Ir a: RESUMEN_TABLAS_ATRIBUTOS.md (Sección "Volumen Estimado")

**"¿Cuáles son los estados de un TAG?"**
→ Ir a: DIAGRAMA_Y_REFERENCIA_RAPIDA.md (Cheat Sheet)

---

## 📈 CASOS DE USO COMUNES

### Caso 1: Necesito agregar un nuevo campo a cruces
```
1. Ir a MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md
2. Localizar tabla "cruces" → sección "Tabla 1"
3. Revisar atributos existentes (tipos, NULL)
4. Ir a MATRIZ_OPERACIONES_DETALLADA.md
5. Revisar "Validaciones Críticas"
6. Ir a DIAGRAMA_Y_REFERENCIA_RAPIDA.md
7. Revisar "Flujos Detallados" para impacto
```

### Caso 2: Necesito entender cómo se calcula un estatus
```
1. Ir a DIAGRAMA_Y_REFERENCIA_RAPIDA.md
2. Ir a sección "FLUJO 1: IMPORTACIÓN"
3. Ver "LÓGICA ESTATUS" (7 IF conditions)
4. Ir a RESUMEN_TABLAS_ATRIBUTOS.md
5. Ver atributos involucrados (Importe, ImporteOficial, etc.)
```

### Caso 3: Necesito optimizar una query lenta
```
1. Ir a MATRIZ_OPERACIONES_DETALLADA.md
2. Buscar tabla + operación (SELECT)
3. Ver "Matriz de Índices Recomendados"
4. Ir a MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md
5. Ver frecuencia de la operación
6. Revisar "Recomendaciones" al final
```

### Caso 4: Necesito mapear atributos por módulo
```
1. Ir a MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md
2. Ir a sección "Mapeo de Atributos por Módulo"
3. Buscar el módulo específico
4. Ver tabla con "Atributo | Tabla | Operación | Propósito"
```

---

## 📞 PREGUNTAS FRECUENTES

### P1: ¿Cuál es la tabla más crítica?
**R:** `cruces` - Es la tabla central donde se inserta 1 registro por cada paso de vehículo. ~10,000 registros/día.

### P2: ¿Cuántos JOINs se usan típicamente?
**R:** De 1 a 3 JOINs:
- Abusos: 3 JOINs (cruces + Estado_del_personal + Personal)
- Aclaraciones: 2 JOINs (cruces + Orden_traslados + casetas_Plantillas)
- Sesgos: 2 JOINs (cruces + Orden_traslados + Tipo_de_ruta_N)

### P3: ¿Qué atributo se modifica más frecuentemente?
**R:** `Estatus_Secundario` - Se actualiza cuando cambia el estado de resolución (pendiente → completado)

### P4: ¿Cuál es la operación más costosa?
**R:** `POST /api/cruces/import` - Inserta 1,000-10,000 registros por día con múltiples JOINs y validaciones

### P5: ¿Se pueden eliminar cruces?
**R:** No. No hay operaciones DELETE. Es un registro de auditoría permanente.

### P6: ¿Quién registra los cambios?
**R:** `ImportacionesCruces` registra importaciones. Otros cambios no tienen tabla de auditoría (mejora pendiente).

### P7: ¿Cuántas tablas son estáticas?
**R:** 4 tablas: Personal, casetas_Plantillas, Tipo_de_ruta_N, Orden_traslados (cambios ocasionales)

### P8: ¿Cuándo se escriben datos en la BD?
**R:** En: cruces (INSERT/UPDATE), ImportacionesCruces (INSERT), Tags (UPDATE)

---

## 🔐 VALIDACIONES CRÍTICAS A IMPLEMENTAR

```
✓ Importe debe ser > 0
✓ montoDictaminado debe ser ≤ Importe
✓ FechaDictamen debe ser ≥ Fecha del cruce
✓ Clase debe estar en {A, B, C-2, C-3, C-5, C-9}
✓ Estatus debe tener valor permitido
✓ Estatus_Secundario debe cumplir jerarquía
✓ id_orden debe existir en Orden_traslados
✓ idCaseta debe existir en casetas_Plantillas
✓ No_Economico debe poder mapearse a TAG
✓ Estado del Personal debe existir para la fecha
```

---

## 📊 ESTADÍSTICAS GLOBALES

```
TABLAS ANALIZADAS:              8
ATRIBUTOS DOCUMENTADOS:         140+
MÓDULOS MAPEADOS:               6
OPERACIONES DOCUMENTADAS:       35+
FLUJOS DETALLADOS:              6
VALORES ENUMERADOS:             30+
ENDPOINTS API:                  25+
RELACIONES FK:                  6
VALIDACIONES CRÍTICAS:          10
ÍNDICES RECOMENDADOS:           8

VOLUMEN ANUAL ESTIMADO:         3.6M registros en cruces
CRECIMIENTO ANUAL:              Linear
HORA PICO:                      6-10 AM
OPERACIÓN MÁS FRECUENTE:        SELECT * FROM cruces
OPERACIÓN MÁS COSTOSA:          POST /api/cruces/import
```

---

## 📝 CÓMO USAR ESTOS DOCUMENTOS

### Para Desarrollo
1. Comienza con **RESUMEN_TABLAS_ATRIBUTOS.md** para vista general
2. Consulta **MATRIZ_OPERACIONES_DETALLADA.md** para detalles técnicos
3. Usa **DIAGRAMA_Y_REFERENCIA_RAPIDA.md** para ejemplos
4. Profundiza en **MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md** si necesitas más detalle

### Para Debugging
1. Ve a **DIAGRAMA_Y_REFERENCIA_RAPIDA.md** → Flujos
2. Localiza el endpoint problemático
3. Verifica atributos en **MATRIZ_OPERACIONES_DETALLADA.md**
4. Valida contra **RESUMEN_TABLAS_ATRIBUTOS.md** → Validaciones

### Para Optimización
1. Identifica tabla en **RESUMEN_TABLAS_ATRIBUTOS.md**
2. Revisa operaciones en **MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md**
3. Consulta índices recomendados en **MATRIZ_OPERACIONES_DETALLADA.md**
4. Implementa según recomendaciones en **MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md**

### Para Capacitación
1. Distribuye **RESUMEN_TABLAS_ATRIBUTOS.md** a nuevos miembros
2. Usa **DIAGRAMA_Y_REFERENCIA_RAPIDA.md** en sesiones de entrenamiento
3. Proporciona **MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md** como referencia
4. Muestra **DIAGRAMA_Y_REFERENCIA_RAPIDA.md** → Ejemplo flujo completo

---

## 🔄 ACTUALIZACIÓN Y MANTENIMIENTO

Estos documentos deben actualizarse cuando:
- [ ] Se agreguen nuevas tablas
- [ ] Se agreguen nuevos atributos
- [ ] Se cambien tipos de datos
- [ ] Se modifiquen Foreign Keys
- [ ] Se agreguen nuevas operaciones
- [ ] Se modifiquen valores enumerados
- [ ] Se agreguen nuevos módulos
- [ ] Cambien los SLAs o volúmenes

**Última revisión:** 3 de Diciembre de 2025  
**Próxima revisión programada:** 1 de Marzo de 2026

---

## 📎 REFERENCIAS CRUZADAS

| Si estás en... | Ir a... |
|---|---|
| MAPEO_COMPLETO | RESUMEN (vista rápida) |
| RESUMEN | MAPEO_COMPLETO (detalles) |
| MATRIZ_OPERACIONES | DIAGRAMA (ejemplos) |
| DIAGRAMA | MATRIZ_OPERACIONES (especificaciones) |

---

**Creado:** 3 de Diciembre de 2025  
**Versión:** 1.0  
**Proyecto:** IAVE WEB - Sistema de Gestión de Peajes  
**Actualización:** Automática
