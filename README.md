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
├─ 1) Objetivo
├─ 2) Indice
├─ 3) Atributos con tipos de datos
├─ 4) Mapeo por módulo (6 módulos)
├─ 5) Operaciones por tabla
├─ 6) 6 flujos de datos
├─ 7) Matriz de relaciones
├─ 8) Estadísticas de volumen
└─ 9) Recomendaciones de mejora
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

### **RESUMEN_TABLAS_ATRIBUTOS.md**
```
Contiene:
├─ 1) Resumen del contenido de las tablas (BD)
├─ 2) Valores permitidos (enumerados)
├─ 3) Operaciones por módulo
├─ 4) Relaciones FK
├─ 5) Matriz de lectura/escritura
├─ 6) Operaciones críticas
├─ 7) Campos para validar
├─ 8) Flujo típico de cruce
├─ 9) Volumen estimado
└─10) Consultas SQL comunes
```

### 3️⃣ **MATRIZ_OPERACIONES_DETALLADA.md** (TÉCNICO)
```
Objetivo: Especificaciones técnicas detalladas

Contiene:
├─1) Matriz tabla/atributo/tipo/NULL/propósito
├─2) Para cada tabla (8 tablas detalladas)
├─3) Matriz de operaciones por módulo
├─4) Matriz de relaciones
├─5) Índices recomendados (8 índices)
├─6) Validaciones críticas (10+ validaciones)
└─7) Valores permitidos (enumerados)
```

### 4️⃣ **DIAGRAMA_Y_REFERENCIA_RAPIDA.md** (VISUAL)
```
Objetivo: Visualización de los ejemplos prácticos de cada caso

Contiene:
├─  1) Diagrama ASCII de arquitectura
├─  2) 4 flujos detallados con explicaciones
├─  3) Matriz quién-lee-qué (gráfica)
├─  4) Atributos clave por operación
├─  5) Transformaciones de datos (importación)
├─  6) Estadísticas de volumen (visual)
├─  7) Frecuencia de operaciones (tabla)
├─  8) Cheat sheet de valores permitidos
├─  9) Validaciones críticas (resumen)
├─ 10) Lista de 25+ endpoints API
└─ 11) Ejemplo flujo completo
```

### 5️⃣ **INDICE_MAPEO_TABLAS.md** (ÍNDICE NAVEGABLE)
```
Objetivo: Navegación entre documentos

Contiene:
├─  1) Índice de 4 documentos
├─  2) Cuándo usar cada documento
├─  3) Estructura de archivos
├─  4) Tabla principal resumida
├─  5) 6 módulos resumidos
├─  6) Búsqueda rápida por necesidad
├─  7) Casos de uso comunes
├─  8) Preguntas frecuentes (8 Q&A)
├─  9) Validaciones críticas
├─ 10) Estadísticas globales
├─ 11) Cómo usar los documentos
└─ 12) Referencias cruzadas
```



## 🎯 ESTIMACIÓN DE REGISTROS DE MANERA PERIODICA.

### TABLAS (8)

| # | Tabla | Registros/Periodicidad | Importancia(impacto) | Documentación |
|---|-------|---------------|--------------|---------------|
| 1 | **cruces**  | 80 - 350 día | ★★★★★ | 20 atributos + ciclos |
| 2 | **ImportacionesCruces** | 1 - 2 día | ★★★★★ | 4 atributos + auditoría |
| 3 | **Tags**  | 50 mes | ★★★ | 5 atributos + estados |
| 4 | **Personal** | 20 mes | ★★ | 4 atributos + referencias |
| 5 | **Estado_del_personal** | ~500 día | ★★★★ | 5 atributos + 40 valores |
| 6 | **Orden_traslados** | 500-1000/año | ★★★★ | 7 atributos + FK |
| 7 | **casetas_Plantillas** | 10-100 mes | ★★ | 10 atributos + tarifas |
| 8 | **Tipo_de_ruta_N** | 100-200 (estático) | ★★★ | 20 atributos + categorías |


- Los registros de cruces se realizan de manera diaria a través de la conciliación sobre el portal IAVE-WEB, generando a su vez un log por cada importación de cruces. Se estima que podrían llegarse a realizar hasta 2 importaciones, pero lo ideal es 1.
- Se contempla que la asignación, retiro o el extravío de TAGS generan un registro en la tabla, por lo que se contemplan hasta 50 registros (considerando el alta y baja de ops).
- Sobre la tabla de personal se estiman las contrataciones y las bajas de ops, que realmente no es tan alta.
- En la tabla de Estado_del_personal, se contemplan todos los registros que realiza:
      1) Rastreo
      2) Administración y personal 
      3) Los guardías (al momento de ingresar a planta).
Contemplando que en ocasiones llegan a ser hasta 3 registros por operador, de manera diaria.
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
- Aquí es donde convergen todas las operaciones del sistema
- Se insertan hasta 1,500 registros al día
- Los estados secundarios se definen según contexto (aclaración: Pendiente Levantar → En Proceso → Dictaminada )

### 2. **Operación Más Crítica: Importación**
- `POST /api/cruces/import`
- 5 lookups (Tags, OT, Caseta, Estado, etc.)
- Lógica compleja de asignación de Estatus
- SSE para progreso en tiempo real
- ~1,000-1,500 registros por batch

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


## CHECKLIST DE VALIDACIÓN

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

## CÓMO MANTENER ESTA DOCUMENTACIÓN

### Cuando hay cambios:
1. Identificar qué documento afecta
2. Actualizar contenido en ese documento
3. Actualizar referencias cruzadas
4. Actualizar fecha de "Última actualización"
5. Considerar si afecta otros documentos

### Cambios típicos:
- Nueva tabla → Actualizar todos
- Nuevo atributo → Actualizar MAPEO_COMPLETO + MATRIZ
- Nuevo endpoint → Actualizar DIAGRAMA + RESUMEN
- Nuevo módulo → Actualizar todo


---

## 📋 RESUMEN FINAL

### Documentación (con su descripción)

```
📊 MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md
   └─ Para comprender el esquema de la base de datos en uso.

📋 RESUMEN_TABLAS_ATRIBUTOS.md
   └─ 

🔗 MATRIZ_OPERACIONES_DETALLADA.md
   └─ Especificaciones técnicas detalladas

🗺️ DIAGRAMA_Y_REFERENCIA_RAPIDA.md
   └─ Visualización y ejemplos 

📚 INDICE_MAPEO_TABLAS.md
   └─ Cómo tal es la navegación entre las tablas de la BD

```

### Cobertura Alcanzada

- 16 tablas de la base de datos.
- Interacción con 147 campos
- 6 módulos (rutas/controladores)
- 31 API endpoints 
- 6 relaciones FK 
- 30 valores identificados cómo de interacción constante
- 13 validaciones documentadas
- 6 flujos detallados
- 8 índices recomendados



---
**Análisis Completado:** 4 de Diciembre de 2025  
**Versión:** 1.0  
---
