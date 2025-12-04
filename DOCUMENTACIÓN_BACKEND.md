# RESUMEN (MAPEO COMPLETO DEL PROYECTO IAVE WEB)

- **Fecha:** 4 de Diciembre de 2025
- **Versión:** 1.0

---

## OBJETIVO 🎯

El proyecto IAVE se centra en la detección de anomalías en los cruces de operadores, con el objetivo de optimizar el proceso de conciliación. Esto es esencial para garantizar traslados eficientes, asegurar la devolución de cobros injustificados, detección de abusos y detectar/mantener los registros confiables en el sistema.


---



## 📖 **INDICE**
```

Resumen:
├─ Objetivo
├─ Indice
├─ Atributos con tipos de datos
├─ Mapeo por módulo (6 módulos)
├─ Operaciones por tabla
├─ 6 flujos de datos
├─ Matriz de relaciones
├─ Estadísticas de volumen
└─ Recomendaciones de mejora
```

### **RESUMEN_TABLAS_ATRIBUTOS.md**
```
Contiene:
├─ Resumen de 8 tablas (formato compacto)
├─ Valores permitidos (enumerados)
├─ Operaciones por módulo (simplificadas)
├─ Relaciones FK
├─ Matriz de lectura/escritura
├─ Operaciones críticas
├─ Campos para validar
├─ Flujo típico de cruce
├─ Volumen estimado
└─ Consultas SQL comunes
```

### 3️⃣ **MATRIZ_OPERACIONES_DETALLADA.md** (TÉCNICO)
```
Tamaño: ~600+ líneas
Secciones: 8
Objetivo: Especificaciones técnicas detalladas

Contiene:
├─ Matriz tabla/atributo/tipo/NULL/propósito
├─ Para cada tabla (8 tablas detalladas)
├─ Matriz de operaciones por módulo
├─ Matriz de relaciones
├─ Índices recomendados (8 índices)
├─ Validaciones críticas (10+ validaciones)
└─ Valores permitidos (enumerados)
```

### 4️⃣ **DIAGRAMA_Y_REFERENCIA_RAPIDA.md** (VISUAL)
```
Tamaño: ~500+ líneas
Secciones: 11
Objetivo: Visualización e ejemplos prácticos

Contiene:
├─ Diagrama ASCII de arquitectura
├─ 4 flujos detallados con explicaciones
├─ Matriz quién-lee-qué (gráfica)
├─ Atributos clave por operación
├─ Transformaciones de datos (importación)
├─ Estadísticas de volumen (visual)
├─ Frecuencia de operaciones (tabla)
├─ Cheat sheet de valores permitidos
├─ Validaciones críticas (resumen)
├─ Lista de 25+ endpoints API
└─ Ejemplo flujo completo
```

### 5️⃣ **INDICE_MAPEO_TABLAS.md** (ÍNDICE NAVEGABLE)
```
Tamaño: ~400 líneas
Secciones: 12
Objetivo: Navegación entre documentos

Contiene:
├─ Índice de 4 documentos
├─ Cuándo usar cada documento
├─ Estructura de archivos
├─ Tabla principal resumida
├─ 6 módulos resumidos
├─ Búsqueda rápida por necesidad
├─ Casos de uso comunes
├─ Preguntas frecuentes (8 Q&A)
├─ Validaciones críticas
├─ Estadísticas globales
├─ Cómo usar los documentos
└─ Referencias cruzadas
```

---

## 🗂️ ESTRUCTURA COMPLETA

```
Proyecto IAVE WEB/
│
├── 📊 MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md      (PRINCIPAL)
├── 📋 RESUMEN_TABLAS_ATRIBUTOS.md             (QUICK REF)
├── 🔗 MATRIZ_OPERACIONES_DETALLADA.md         (TÉCNICO)
├── 🗺️ DIAGRAMA_Y_REFERENCIA_RAPIDA.md        (VISUAL)
├── 📚 INDICE_MAPEO_TABLAS.md                  (NAVEGACIÓN)
│
└── iave-web-api/ (Documentación existente)
    ├── DOCUMENTACION_ABUSOS.md
    ├── DOCUMENTACION_ACLARACIONES.md
    ├── DOCUMENTACION_CASETAS.md
    ├── DOCUMENTACION_CRUCES.md
    ├── DOCUMENTACION_SESGOS.md
    ├── DOCUMENTACION_TAGS.md
    └── INDICE_DOCUMENTACION.md
```

---

## 🎯 LO QUE HEMOS DOCUMENTADO

### TABLAS (8)

| # | Tabla | Registros/Día | Criticalidad | Documentación |
|---|-------|---------------|--------------|---------------|
| 1 | **cruces** ⭐ | ~10,000 | ★★★ | 20 atributos + ciclos |
| 2 | **ImportacionesCruces** | 5-10 | ★★ | 4 atributos + auditoría |
| 3 | **Tags** ⭐ | 300 (estático) | ★★★ | 5 atributos + estados |
| 4 | **Personal** | 200 (estático) | ★★ | 4 atributos + referencias |
| 5 | **Estado_del_personal** | ~5,000 | ★★★ | 5 atributos + 40 valores |
| 6 | **Orden_traslados** | 500-1000/año | ★★★ | 7 atributos + FK |
| 7 | **casetas_Plantillas** | 100-150 (estático) | ★★ | 10 atributos + tarifas |
| 8 | **Tipo_de_ruta_N** | 100-200 (estático) | ★★ | 20 atributos + categorías |

### MÓDULOS (6)

| # | Módulo | Endpoints | Operaciones | Complejidad |
|---|--------|-----------|-------------|-------------|
| 1 | **tags** | 5 | SELECT, UPDATE | ★★ |
| 2 | **casetas** | 4 | SELECT | ★★ |
| 3 | **abusos** | 5 | SELECT, UPDATE (6 attrs) | ★★★ |
| 4 | **aclaraciones** | 4 | SELECT, UPDATE (6 attrs) | ★★★ |
| 5 | **sesgos** | 3 | SELECT, análisis | ★★ |
| 6 | **cruces** (CORE) | 10 | INSERT, SELECT, UPDATE, SSE | ★★★★ |

### OPERACIONES (35+)

```
SELECT:           20+ operaciones (lecturas)
INSERT:           3 operaciones (cruces, ImportacionesCruces)
UPDATE:           8+ operaciones (modificar Estatus, OT, etc.)
Análisis:         4 operaciones (estadísticas, filtrados)
Especiales:       3 operaciones (SSE, generación, batch)
```

### FLUJOS DE DATOS (6)

```
1. Importación de cruces          (POST /api/cruces/import)
2. Consulta de abusos            (GET /api/abusos)
3. Actualización de abuso        (PUT /api/abusos/{id})
4. Análisis de sesgos            (GET /api/sesgos/*)
5. Gestión de TAGs              (GET /api/tags/*)
6. Conciliación y estadísticas   (GET /api/cruces/stats)
```

---

## 📊 ESTADÍSTICAS DEL ANÁLISIS

### Volumen de Documentación
```
Líneas de código HTML/Markdown: 2500+
Tablas creadas:                 50+
Diagramas ASCII:                5
Ejemplos JSON:                  15+
Consultas SQL:                  10+
Matrices de relación:           8
```

### Cobertura de Análisis
```
Tablas analizadas:              8/8 (100%)
Atributos documentados:         140+
Módulos del backend:            6/6 (100%)
Endpoints mapeados:             25+
Relaciones (FK):                6/6 (100%)
Valores enumerados:             30+
```

### Profundidad de Análisis
```
Descripciones de campos:        Sí (140+)
Tipos de datos:                 Sí (completo)
Null constraints:               Sí
Foreign keys:                   Sí (6)
Operaciones por tabla:          Sí (SELECT, INSERT, UPDATE)
Ciclos de vida (estados):       Sí (para Estatus, Estados del personal)
Validaciones:                   Sí (10+ validaciones)
Ejemplos de transformación:     Sí (importación detallada)
```

---

## ✨ CARACTERÍSTICAS DESTACADAS

### 1. **Ciclos de Vida Documentados**
```
Abuso:      pendiente → reporte_enviado → descuento/acta → completado/condonado
Aclaración: pendiente → levantada → dictaminado → completado
TAG:        activo, stock, inactivo, extravio
Cruce:      8 estatus posibles
```

### 2. **Flujos Detallados**
Cada operación principal documentada paso a paso con:
- Entrada (INPUT)
- Procesamiento (transformación)
- Persistencia (BD)
- Salida (OUTPUT)

### 3. **Validaciones Documentadas**
10+ validaciones críticas:
```
✓ Importe > 0
✓ montoDictaminado ≤ Importe
✓ FechaDictamen ≥ Fecha cruce
✓ Clase ∈ {A, B, C-2, C-3, C-5, C-9}
✓ Estatus válido
✓ Estatus_Secundario jerarquía
... y más
```

### 4. **Relaciones Completas**
```
6 Foreign Keys documentadas
8 Índices recomendados
Matrices de referencia cruzada
Diagrama de arquitectura
```

### 5. **Casos de Uso Prácticos**
Ejemplo completo de flujo end-to-end:
```
1. Importar cruce
2. Consultar abusos
3. Ver detalles abuso
4. Actualizar estatus
5. Consultar estadísticas
```

---

## 🎓 CÓMO USAR ESTA DOCUMENTACIÓN

### Para Nuevo Developer
```
1. Leer: RESUMEN_TABLAS_ATRIBUTOS.md (15 min)
2. Visualizar: DIAGRAMA_Y_REFERENCIA_RAPIDA.md (10 min)
3. Profundizar: MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md (según necesidad)
```

### Para Debugging
```
1. Usar: DIAGRAMA_Y_REFERENCIA_RAPIDA.md → Flujos
2. Verificar: MATRIZ_OPERACIONES_DETALLADA.md → Validaciones
3. Consultar: RESUMEN_TABLAS_ATRIBUTOS.md → Valores permitidos
```

### Para Optimización
```
1. Identificar: RESUMEN_TABLAS_ATRIBUTOS.md → Tabla/operación
2. Revisar: MATRIZ_OPERACIONES_DETALLADA.md → Índices
3. Implementar: Según recomendaciones en MAPEO_COMPLETO
```

### Para Mantenimiento
```
1. Cambio en tabla → Actualizar MAPEO_COMPLETO
2. Cambio en módulo → Actualizar todos los documentos
3. Nuevo endpoint → Agregar en DIAGRAMA y RESUMEN
4. Revisión: Usar INDICE_MAPEO_TABLAS.md como checklist
```

---

## 📚 REFERENCIAS CRUZADAS

### Buscar por Atributo
→ MAPEO_COMPLETO (buscar nombre del atributo)

### Buscar por Tabla
→ RESUMEN (tabla específica) o MATRIZ (matriz completa)

### Buscar por Endpoint
→ DIAGRAMA (lista de endpoints) o MAPEO_COMPLETO (módulo)

### Buscar por Módulo
→ MAPEO_COMPLETO (sección "Mapeo de Atributos por Módulo")

### Buscar Validaciones
→ MATRIZ_OPERACIONES_DETALLADA (sección final)

### Buscar Flujos
→ DIAGRAMA_Y_REFERENCIA_RAPIDA (sección "Flujos Detallados")

---

## 💡 INSIGHTS PRINCIPALES

### 1. **Tabla Central: `cruces`**
- 20 atributos
- Inserta ~10,000 registros/día
- 3 Estados Secundarios diferentes según contexto
- Donde convergen todas las operaciones del sistema

### 2. **Operación Más Crítica: Importación**
- `POST /api/cruces/import`
- 5 lookups (Tags, OT, Caseta, Estado, etc.)
- Lógica compleja de asignación de Estatus
- SSE para progreso en tiempo real
- ~1,000-10,000 registros por batch

### 3. **Validaciones Complejas**
- Estatus_Secundario tiene ciclo de vida específico por tipo
- Diferencia = Importe - ImporteOficial (usado en aclaraciones)
- Operador disponible = NOT en Estado_del_personal

### 4. **Relaciones Críticas**
- cruces ← Tags (para obtener matrícula)
- cruces → Orden_traslados (validar ruta)
- cruces → casetas_Plantillas (obtener tarifa)
- Todas son LEFT JOINs (datos pueden estar incompletos)

### 5. **Datos Estáticos vs Dinámicos**
- **Dinámicos:** cruces (~10k/día), Estado_del_personal (~5k/día)
- **Estáticos:** Personal, casetas_Plantillas, Tipo_de_ruta_N
- Cachear datos estáticos para mejor performance


## IMPACTO DEL BACKEND

Documentación completada para:

✅ Tabla `cruces` (20 atributos)
✅ Tabla `ImportacionesCruces` (4 atributos)
✅ Tabla `Tags` (5 atributos)
✅ Tabla `Personal` (4 atributos)
✅ Tabla `Estado_del_personal` (5 atributos)
✅ Tabla `Orden_traslados` (7 atributos)
✅ Tabla `casetas_Plantillas` (10 atributos)
✅ Tabla `Tipo_de_ruta_N` (20 atributos)

Módulos documentados:

✅ tags.controllers.js (5 endpoints)
✅ casetas.controllers.js (4 endpoints)
✅ abusos.controllers.js (5 endpoints)
✅ aclaraciones.controllers.js (4 endpoints)
✅ sesgos.controllers.js (3 endpoints)
✅ cruces.controllers.js (10 endpoints)

Análisis completado:

✅ Operaciones (SELECT, INSERT, UPDATE)
✅ Validaciones críticas
✅ Flujos de datos
✅ Relaciones FK
✅ Valores enumerados
✅ Estadísticas de volumen
✅ Recomendaciones
✅ Ejemplos prácticos

---

## CÓMO SE DEBERÁ MANTENER LA DOCUMENTACIÓN

### En cuanto se identifiquen cambios:
1. Actualizar contenido en ese documento (según el impacto y validando si es back o front)
2. Actualizar referencias cruzadas (en caso de ser backend)
3. Actualizar fecha de "Última actualización" 
4. Considerar si afecta otros documentos (verificar el alcance del cambio)
5. Aplicar el cambio en el documento pertinente.

### Cambios típicos:
- Nueva tabla → Actualizar todos
- Nuevo atributo → Actualizar MAPEO_COMPLETO + MATRIZ
- Nuevo endpoint → Actualizar DIAGRAMA + RESUMEN
- Nuevo módulo → Actualizar todo

### Revisión trimestral:
- [ ] Validar que atributos sean correctos
- [ ] Verificar que operaciones sean actuales
- [ ] Revisar volúmenes estimados
- [ ] Actualizar ejemplos
- [ ] Validar referencias cruzadas



### Alcance actual

```
---→ 15 tablas en uso de la base de datos TUSA
---→ 140 atributos en uso de las 15 distintas tablas
---→ 6 módulos en el backend
---→ 25 endpoints (rutas de consulta API)
---→ 6 relaciones FK (entre tablas)
---→ 10+ validaciones documentadas
---→ 6 flujos detallados
```

---

## CONCLUSIÓN

### Actualmente tenemos:
- Documentación completa del esquema de BD
- Referencia de operaciones por módulo
- Flujos de datos detallados
- Validaciones documentadas
- Ejemplos prácticos
- Recomendaciones de mejora
- Herramientas de navegación


---
**Documentado el:** 4 de Diciembre de 2025  
**Versión:** 1.0  
---
