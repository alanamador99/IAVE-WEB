# 📊 MAPEO COMPLETO: TABLAS, ATRIBUTOS Y OPERACIONES - PROYECTO IAVE WEB

**Fecha de generación:** 3 de Diciembre de 2025  
**Base de datos:** SQL Server - Tusa  
**Última actualización:** 2025-12-03

---

## 📋 ÍNDICE DE CONTENIDOS

1. [Tablas Principales](#tablas-principales)
2. [Mapeo de Atributos por Módulo](#mapeo-de-atributos-por-módulo)
3. [Operaciones por Tabla](#operaciones-por-tabla)
4. [Flujos de Datos](#flujos-de-datos)
5. [Matriz de Relaciones](#matriz-de-relaciones)

---

## 🗄️ TABLAS PRINCIPALES

### 1. **Tabla: `cruces`** (Core - Centro del Sistema)

**Descripción:** Registro de cada paso de vehículo por casetas de peaje.

| Atributo | Tipo | Descripción | Operación |
|----------|------|-------------|-----------|
| **ID** | VARCHAR(24) | Identificador único: YYMMDD_HHMMSS_TAG | PK, READ, WRITE |
| **Caseta** | VARCHAR(64) | Nombre de la caseta | READ, WRITE |
| **No_Economico** | VARCHAR(15) | Matrícula del vehículo | READ, WRITE |
| **Fecha** | DATETIME | Fecha/hora del cruce | READ, WRITE |
| **Importe** | NUMERIC(12,3) | Monto cobrado | READ, WRITE |
| **Tag** | VARCHAR(15) | Identificador del TAG | READ, WRITE |
| **Carril** | VARCHAR(50) | Número/identificador del carril | READ, WRITE |
| **Clase** | VARCHAR(15) | Clasificación del vehículo (A, B, C-2, C-3, C-5, C-9) | READ, WRITE |
| **Consecar** | VARCHAR(20) | Código de consecución | READ, WRITE |
| **FechaAplicacion** | DATETIME | Fecha de aplicación del cobro | READ, WRITE |
| **Estatus** | VARCHAR(30) | Estado actual del cruce | READ, WRITE, UPDATE |
| **id_orden** | VARCHAR(30) | FK a Orden_traslados.ID_orden | READ, WRITE, UPDATE |
| **observaciones** | VARCHAR(255) | Notas y comentarios | READ, WRITE, UPDATE |
| **Estatus_Secundario** | VARCHAR(100) | Estado secundario (proceso de resolución) | READ, WRITE, UPDATE |
| **Aplicado** | BIT | ¿Descuento aplicado? | READ, WRITE, UPDATE |
| **FechaDictamen** | DATE | Fecha del dictamen | READ, WRITE, UPDATE |
| **ImporteOficial** | NUMERIC(12,3) | Tarifa oficial según clase | READ, WRITE |
| **NoAclaracion** | VARCHAR(20) | Número de aclaración | READ, WRITE, UPDATE |
| **montoDictaminado** | NUMERIC(12,3) | Monto final después de dictamen | READ, WRITE, UPDATE |
| **idCaseta** | VARCHAR(10) | FK a casetas_Plantillas.ID_Caseta | READ, WRITE |

**Valores de Estatus válidos:**
- `Confirmado` - Cobro correcto
- `Se cobró menos` - Diferencia negativa
- `Aclaración` - Diferencia positiva
- `Abuso` - Personal en situación especial
- `CasetaNoEncontradaEnRuta` - Caseta no existe en OT
- `Ruta Sin Casetas` - OT sin casetas
- `Pendiente` - En espera de resolución
- `Condonado` - Cancelado/Perdonado

**Operaciones por módulo:**
- **cruces.controllers.js**: INSERT, SELECT, UPDATE (masivo e individual)
- **abusos.controllers.js**: SELECT, UPDATE (Estatus_Secundario)
- **aclaraciones.controllers.js**: SELECT, UPDATE (NoAclaracion, montoDictaminado)
- **sesgos.controllers.js**: SELECT (Estatus = 'CasetaNoEncontradaEnRuta')
- **tags.controllers.js**: SELECT (filtro por Tag)

---

### 2. **Tabla: `ImportacionesCruces`** (Auditoría)

**Descripción:** Registro de importaciones masivas de cruces.

| Atributo | Tipo | Descripción | Operación |
|----------|------|-------------|-----------|
| **Id** | INT IDENTITY | Identificador auto-incremento | PK, AUTO |
| **Usuario** | NVARCHAR(50) | Email del usuario que importó | WRITE, READ |
| **FechaImportacion** | DATETIME | Timestamp de la importación | WRITE, READ |
| **TotalInsertados** | INT | Cantidad de registros insertados | WRITE, READ |

**Operaciones:**
- **cruces.controllers.js**: INSERT (registro de cada importación)

---

### 3. **Tabla: `Orden_traslados`** (Relacionada)

**Descripción:** Órdenes de traslado de transporte entre ciudades (referenciada por cruces).

| Atributo | Tipo | Descripción | Operación |
|----------|------|-------------|-----------|
| **ID_orden** | VARCHAR(30) | Identificador único FK | PK, READ |
| **ID_clave** | VARCHAR(10) | Clasificación SCT (A, B, C-2, C-3, C-5, C-9) | READ |
| **Id_tipo_ruta** | VARCHAR | FK a Tipo_de_ruta_N | READ |
| **FechaInicio** | DATE | Inicio de validez de la OT | READ |
| **FechaFin** | DATE | Fin de validez de la OT | READ |
| *(Otros campos)* | Various | Información de transporte | READ |

**Operaciones:**
- **cruces.controllers.js**: SELECT, UPDATE (asignar OT a cruces)
- **aclaraciones.controllers.js**: INNER JOIN (obtener ID_clave)
- **casetas.controllers.js**: SELECT (información de rutas)
- **sesgos.controllers.js**: INNER JOIN (filtrado de sesgos)

---

### 4. **Tabla: `casetas_Plantillas`** (Referencia)

**Descripción:** Catálogo maestro de casetas con tarifas por tipo de vehículo.

| Atributo | Tipo | Descripción | Operación |
|----------|------|-------------|-----------|
| **ID_Caseta** | VARCHAR(10) | Identificador único FK | PK, READ |
| **Nombre_IAVE** | VARCHAR | Nombre oficial de la caseta | READ |
| **Automovil** | NUMERIC | Tarifa para A (automóvil) | READ |
| **Autobus2Ejes** | NUMERIC | Tarifa para B (autobús 2 ejes) | READ |
| **Camion2Ejes** | NUMERIC | Tarifa para C-2 | READ |
| **Camion3Ejes** | NUMERIC | Tarifa para C-3 | READ |
| **Camion5Ejes** | NUMERIC | Tarifa para C-5 | READ |
| **Camion9Ejes** | NUMERIC | Tarifa para C-9 | READ |
| **latitud** | VARCHAR | Coordenada geográfica | READ |
| **longitud** | VARCHAR | Coordenada geográfica | READ |
| **Estado** | VARCHAR | Entidad federativa | READ |

**Operaciones:**
- **cruces.controllers.js**: SELECT (obtener ImporteOficial)
- **aclaraciones.controllers.js**: INNER JOIN (enriquecimiento de datos)
- **casetas.controllers.js**: SELECT (listar casetas)

---

### 5. **Tabla: `Estado_del_personal`** (Temporal - Histórico)

**Descripción:** Registro diario del estado laboral del personal (licencias, vacaciones, etc.).

| Atributo | Tipo | Descripción | Operación |
|----------|------|-------------|-----------|
| **ID_matricula** | INT | FK a Personal.ID_matricula | FK, READ |
| **ID_fecha** | DATE | Fecha del estado | PK, READ |
| **Descripcion** | VARCHAR | Estado (Vacaciones, Incapacidad, Permiso, etc.) | READ |
| **ID_ordinal** | VARCHAR | Identificador ordinal | READ |
| **Encabezado** | VARCHAR | Tipo de cambio | READ |

**Estados registrados (ejemplos):**
- DESCANSO CON DERECHO
- FALTA INJUSTIFICADA
- VACACIONES
- PERMISO
- INCAPACIDAD
- DESCANSO POR DIA FESTIVO
- BAJA
- CURSO
- CAPACITACION
- IMSS
- TRÁMITE LICENCIA
- PATERNIDAD
- INDISCIPLINA
- PROBLEMA DE SALUD
- Y muchos más (~40 estados)

**Operaciones:**
- **abusos.controllers.js**: LEFT JOIN (enriquecimiento con estado personal)
- **tags.controllers.js**: LEFT JOIN (verificar disponibilidad de operadores)
- **cruces.controllers.js**: SELECT (clasificar abuso)

---

### 6. **Tabla: `Personal`** (Maestro - Referencia)

**Descripción:** Catálogo maestro de operadores/personal.

| Atributo | Tipo | Descripción | Operación |
|----------|------|-------------|-----------|
| **ID_matricula** | INT | Identificador único | PK, READ |
| **Nombres** | VARCHAR | Primer nombre | READ |
| **Ap_paterno** | VARCHAR | Apellido paterno | READ |
| **Ap_materno** | VARCHAR | Apellido materno | READ |
| *(Otros campos)* | Various | Información personal | READ |

**Operaciones:**
- **abusos.controllers.js**: LEFT JOIN (obtener nombre completo)
- **tags.controllers.js**: SELECT (información de operadores)
- **cruces.controllers.js**: SELECT (referencia de matrícula)

---

### 7. **Tabla: `Tags`** (Maestro)

**Descripción:** Dispositivos RFID/TAG asignados a operadores.

| Atributo | Tipo | Descripción | Operación |
|----------|------|-------------|-----------|
| **ID_tag** | VARCHAR | Identificador del TAG | PK, READ |
| **ID_matricula** | INT | FK a Personal.ID_matricula | FK, READ |
| **Estado** | VARCHAR | Situación actual (activo, stock, inactivo, extraviado) | READ |
| **FechaAsignacion** | DATE | Cuándo se asignó | READ |
| **FechaDevolucion** | DATE | Cuándo se devolvió (si aplica) | READ |
| *(Otros campos)* | Various | Información adicional | READ |

**Estados válidos:**
- `activo` - TAG asignado a operador en servicio
- `stock` - TAG disponible para asignar
- `inactivo` - TAG fuera de servicio
- `extravio` - TAG perdido/extraviado

**Operaciones:**
- **tags.controllers.js**: SELECT, UPDATE
- **cruces.controllers.js**: SELECT (obtener matrícula del operador)

---

### 8. **Tabla: `Tipo_de_ruta_N`** (Catálogo)

**Descripción:** Catálogo de rutas de transporte con información de recorrido.

| Atributo | Tipo | Descripción | Operación |
|----------|------|-------------|-----------|
| **ID_ruta** | VARCHAR | Identificador único | PK, READ |
| **id_Tipo_ruta** | VARCHAR | Tipo/categoría de ruta | FK, READ |
| **PoblacionOrigen** | VARCHAR | Lugar de partida | READ |
| **PoblacionDestino** | VARCHAR | Lugar de destino | READ |
| **RazonOrigen** | VARCHAR | Terminal/empresa de origen | READ |
| **RazonDestino** | VARCHAR | Terminal/empresa de destino | READ |
| **Km_reales** | NUMERIC | Kilómetros reales | READ |
| **Km_oficiales** | NUMERIC | Kilómetros oficiales | READ |
| **Km_de_pago** | NUMERIC | Kilómetros de pago | READ |
| **Km_Tabulados** | NUMERIC | Kilómetros tabulados | READ |
| **peaje_dos_ejes** | NUMERIC | Tarifa 2 ejes | READ |
| **peaje_tres_ejes** | NUMERIC | Tarifa 3 ejes | READ |
| **Latinos** | BIT | ¿Ruta Latinos? | READ |
| **Nacionales** | BIT | ¿Ruta Nacional? | READ |
| **Exportacion** | BIT | ¿Ruta Exportación? | READ |
| **Otros** | BIT | ¿Otros? | READ |
| **Cemex** | BIT | ¿Ruta Cemex? | READ |
| **Alterna** | BIT | ¿Ruta alternativa? | READ |
| **Observaciones** | VARCHAR | Notas | READ |
| **fecha_Alta** | DATE | Fecha de creación | READ |

**Operaciones:**
- **casetas.controllers.js**: SELECT (listar rutas)
- **sesgos.controllers.js**: INNER JOIN (análisis de rutas con sesgos)

---

## 📋 MAPEO DE ATRIBUTOS POR MÓDULO

### 🏷️ **MÓDULO: tags.controllers.js**

**Descripción:** Gestión de dispositivos TAG asignados a operadores.

**Tablas principales:** `Tags`, `Personal`, `Estado_del_personal`

**Atributos utilizados:**

| Atributo | Tabla | Operación | Propósito |
|----------|-------|-----------|----------|
| ID_tag | Tags | READ, UPDATE | Identificar TAG |
| ID_matricula | Tags | READ | Obtener operador asignado |
| Estado | Tags | READ, UPDATE | Conocer disponibilidad (activo/stock/inactivo/extraviado) |
| FechaAsignacion | Tags | READ | Auditoría |
| FechaDevolucion | Tags | READ | Auditoría |
| Nombres | Personal | READ | Enriquecimiento - nombre completo |
| Ap_paterno | Personal | READ | Enriquecimiento - apellido |
| Ap_materno | Personal | READ | Enriquecimiento - apellido |
| ID_fecha | Estado_del_personal | READ | Filtrar por fecha específica |
| Descripcion | Estado_del_personal | READ | Verificar si operador está disponible |

**Endpoints principales:**
```
GET  /api/tags                              # Obtener todos los TAGs
GET  /api/tags/total                        # Contar TAGs totales
GET  /api/tags/stats                        # Estadísticas por estado
POST /api/tags/responsiva                   # Generar responsiva legal
GET  /api/tags/unavailable/{fecha}          # Operadores no disponibles en fecha
```

**Flujos de datos:**
1. Consultar `Tags` con JOIN a `Personal`
2. Para cada TAG, verificar `Estado_del_personal` en fecha específica
3. Si Descripcion en situacionesAbusivas → NO disponible
4. Retornar TAGs con información completa

---

### 🚗 **MÓDULO: casetas.controllers.js**

**Descripción:** Gestión de casetas (estaciones de peaje) e integración con API INEGI.

**Tablas principales:** `casetas_Plantillas`, `Tipo_de_ruta_N`, `Orden_traslados`

**Atributos utilizados:**

| Atributo | Tabla | Operación | Propósito |
|----------|-------|-----------|----------|
| ID_Caseta | casetas_Plantillas | READ | Identificar caseta |
| Nombre_IAVE | casetas_Plantillas | READ | Nombre para display |
| Automovil | casetas_Plantillas | READ | Tarifa A |
| Autobus2Ejes | casetas_Plantillas | READ | Tarifa B |
| Camion2Ejes | casetas_Plantillas | READ | Tarifa C-2 |
| Camion3Ejes | casetas_Plantillas | READ | Tarifa C-3 |
| Camion5Ejes | casetas_Plantillas | READ | Tarifa C-5 |
| Camion9Ejes | casetas_Plantillas | READ | Tarifa C-9 |
| latitud | casetas_Plantillas | READ | Geolocalización |
| longitud | casetas_Plantillas | READ | Geolocalización |
| Estado | casetas_Plantillas | READ | Entidad federativa |
| ID_ruta | Tipo_de_ruta_N | READ | Identificar ruta |
| PoblacionOrigen | Tipo_de_ruta_N | READ | Origen de ruta |
| PoblacionDestino | Tipo_de_ruta_N | READ | Destino de ruta |
| Km_reales | Tipo_de_ruta_N | READ | Distancia real |
| Latinos/Nacionales/etc | Tipo_de_ruta_N | READ | Categorización |
| ID_orden | Orden_traslados | READ | Identificar OT |

**Endpoints principales:**
```
GET /api/casetas                            # Todas las casetas
GET /api/casetas/{id}                       # Caseta específica
GET /api/casetas/stats                      # Estadísticas
GET /api/rutas                              # Todas las rutas
```

**Flujos de datos:**
1. Consultar `casetas_Plantillas` con tarifas
2. Para rutas: JOIN con `Tipo_de_ruta_N`
3. Enriquecer con datos geográficos
4. Integrar con API INEGI Sakbe v3.1

---

### 🚨 **MÓDULO: abusos.controllers.js**

**Descripción:** Gestión de infracciones detectadas a operadores.

**Tablas principales:** `cruces`, `Estado_del_personal`, `Personal`

**Atributos utilizados:**

| Atributo | Tabla | Operación | Propósito |
|----------|-------|-----------|----------|
| ID | cruces | READ | Identificar cruce (abuso) |
| Estatus | cruces | READ, UPDATE | Filtrar por 'Abuso' |
| Estatus_Secundario | cruces | READ, UPDATE | Seguimiento (pendiente_reporte → completado) |
| No_Economico | cruces | READ | Obtener ID matrícula |
| Fecha | cruces | READ | Fecha del abuso |
| Importe | cruces | READ | Monto de multa original |
| montoDictaminado | cruces | READ, WRITE | Monto final después de dictamen |
| NoAclaracion | cruces | WRITE | Número de aclaración asignada |
| FechaDictamen | cruces | WRITE | Fecha del dictamen |
| observaciones | cruces | WRITE | Comentarios del caso |
| Aplicado | cruces | WRITE | Si se aplicó descuento |
| Caseta | cruces | READ | Ubicación del abuso |
| idCaseta | cruces | READ | FK a caseta |
| ID_matricula | Estado_del_personal | READ | Identificar persona |
| Descripcion | Estado_del_personal | READ | Estado laboral en fecha |
| Nombres | Personal | READ | Enriquecimiento - nombre |
| Ap_paterno | Personal | READ | Enriquecimiento - apellido |
| Ap_materno | Personal | READ | Enriquecimiento - apellido |

**Estados Secundarios (ciclo de vida):**
```
pendiente_reporte 
  → reporte_enviado_todo_pendiente
    → descuento_aplicado_pendiente_acta (O)
    → acta_aplicada_pendiente_descuento (O)
      → completado
O
condonado
```

**Endpoints principales:**
```
GET  /api/abusos                            # Obtener todos
GET  /api/abusos/operador/{id}              # Por operador
GET  /api/abusos/ubicaciones/{IDCruce}      # Geolocalización
PUT  /api/abusos/{id}/estatus               # Actualizar estatus
PATCH /api/abusos/stats                     # Estadísticas
```

---

### 📝 **MÓDULO: aclaraciones.controllers.js**

**Descripción:** Gestión de reclamos por diferencia en cobro de peaje.

**Tablas principales:** `cruces`, `Orden_traslados`, `casetas_Plantillas`

**Atributos utilizados:**

| Atributo | Tabla | Operación | Propósito |
|----------|-------|-----------|----------|
| ID | cruces | READ | Identificar cruce (aclaración) |
| Estatus | cruces | READ | Filtrar por 'Aclaración' |
| Estatus_Secundario | cruces | READ, UPDATE | Seguimiento (pendiente_aclaracion → completado) |
| Importe | cruces | READ | Cobrado |
| ImporteOficial | cruces | READ, WRITE | Tarifa correcta |
| diferencia | (calculado) | DERIVED | Importe - ImporteOficial |
| Fecha | cruces | READ | Fecha del cruce |
| NoAclaracion | cruces | READ, WRITE | Número único para aclaración |
| montoDictaminado | cruces | WRITE | Monto dictaminado |
| FechaDictamen | cruces | WRITE | Fecha del dictamen |
| id_orden | cruces | READ | FK a OT |
| observaciones | cruces | WRITE | Justificación |
| ID_clave | Orden_traslados | READ | Clasificación (A, C-2, etc.) |
| Nombre_IAVE | casetas_Plantillas | READ | Nombre caseta |
| Automovil/Camion* | casetas_Plantillas | READ | Tarifas por clase |
| latitud | casetas_Plantillas | READ | Geolocalización |
| longitud | casetas_Plantillas | READ | Geolocalización |
| Estado | casetas_Plantillas | READ | Entidad |

**Estados Secundarios:**
```
pendiente_aclaracion
  → aclaracion_levantada
  → dictaminado
    → completado
```

**Endpoints principales:**
```
GET  /api/aclaraciones                      # Obtener todas
GET  /api/aclaraciones/stats                # Estadísticas
PUT  /api/aclaraciones/{id}                 # Actualizar
PATCH /api/aclaraciones/status-masivo       # Actualización masiva
GET  /api/aclaraciones/por-operador         # Agrupar por operador
```

---

### ⚙️ **MÓDULO: sesgos.controllers.js**

**Descripción:** Gestión de discrepancias/anomalías en cruces (caseta no encontrada en ruta).

**Tablas principales:** `cruces`, `Tipo_de_ruta_N`, `Orden_traslados`

**Atributos utilizados:**

| Atributo | Tabla | Operación | Propósito |
|----------|-------|-----------|----------|
| ID | cruces | READ | Identificar cruce |
| Estatus | cruces | READ | Filtrar por 'CasetaNoEncontradaEnRuta', 'Sesgos' |
| Caseta | cruces | READ | Caseta no encontrada |
| Importe | cruces | READ | Monto cobrado |
| No_Economico | cruces | READ | Operador |
| id_orden | cruces | READ | FK a OT |
| ID_ruta | Tipo_de_ruta_N | READ | Ruta asociada |
| PoblacionOrigen | Tipo_de_ruta_N | READ | Origen de ruta |
| PoblacionDestino | Tipo_de_ruta_N | READ | Destino de ruta |
| Km_reales | Tipo_de_ruta_N | READ | Distancia |
| Latinos/Nacionales/etc | Tipo_de_ruta_N | READ | Categoría |
| Observaciones | Tipo_de_ruta_N | READ | Notas de ruta |

**Endpoints principales:**
```
GET /api/sesgos                             # Obtener todos los sesgos
GET /api/sesgos/por-casetas                 # Agrupar por caseta
GET /api/sesgos/stats                       # Estadísticas
PUT /api/sesgos/{id}/resolucion             # Marcar como resuelto
```

---

### 🔄 **MÓDULO: cruces.controllers.js** (Core)

**Descripción:** Gestión central de cruces, importación y conciliación.

**Tablas principales:** `cruces`, `ImportacionesCruces`, `Orden_traslados`, `casetas_Plantillas`, `Estado_del_personal`, `Tags`, `Personal`

**Atributos utilizados en importación:**

| Atributo | Tabla | Operación | Propósito |
|----------|-------|-----------|----------|
| *TODOS* | cruces | WRITE | Insertar registro de cruce |
| ID | cruces | WRITE | Generar: YYMMDD_HHMMSS_TAG |
| Tag | cruces | READ (input) | Para generar ID |
| Fecha/Hora | cruces | READ (input) | Para generar ID y Estatus |
| Caseta | cruces | READ (input) | Validar existencia |
| Clase | cruces | READ (input) | Determinar tarifa oficial |
| Importe | cruces | READ (input) | Comparar vs oficial |
| No_Economico | (input) | READ | Buscar en Tags tabla |
| id_orden | cruces | DERIVED | Buscar por matricula+fecha |
| ImporteOficial | cruces | DERIVED | Obtener de casetas_Plantillas |
| Estatus | cruces | DERIVED | Asignar basado en lógica |
| Usuario | ImportacionesCruces | WRITE | Header x-usuario |
| FechaImportacion | ImportacionesCruces | WRITE | Timestamp actual |
| TotalInsertados | ImportacionesCruces | WRITE | Contador de registros |

**Lógica de asignación de Estatus en importación:**

```sql
IF Importe = ImporteOficial THEN Estatus = 'Confirmado'
ELSE IF Importe < ImporteOficial THEN Estatus = 'Se cobró menos'
ELSE IF Importe > ImporteOficial THEN Estatus = 'Aclaración'
ELSE IF Estado_personal IN (Vacaciones, Incapacidad, ...) THEN Estatus = 'Abuso'
ELSE IF Caseta NOT IN Ruta THEN Estatus = 'CasetaNoEncontradaEnRuta'
ELSE IF Ruta HAS NO Casetas THEN Estatus = 'Ruta Sin Casetas'
ELSE Estatus = 'Pendiente'
```

**Endpoints principales:**
```
POST /api/cruces/import                     # Importar masivo
GET  /api/cruces                            # Obtener todos
GET  /api/cruces/stats                      # Estadísticas
GET  /api/cruces/conciliacion               # Validar contra OT
PUT  /api/cruces/:id/status                 # Actualizar estatus individual
PATCH /api/cruces/status-masivo             # Actualizar múltiples
GET  /api/cruces/ots                        # Listar OT
PUT  /api/cruces/:id/ot                     # Asignar OT
POST /api/cruces/update-ots                 # Asignar OT masivamente
GET  /api/cruces/progress                   # SSE - Progreso de importación
```

---

## 🔄 OPERACIONES POR TABLA

### Tabla `cruces` - MATRIZ DE OPERACIONES

| Operación | Módulo | Endpoint | Atributos Afectados |
|-----------|--------|----------|---------------------|
| **SELECT ALL** | cruces | `GET /api/cruces` | Todos (READ) |
| **SELECT by ID** | cruces | `GET /api/cruces/{id}` | Todos (READ) |
| **SELECT by Estatus** | abusos | `GET /api/abusos` | Estatus='Abuso' |
| **SELECT by Estatus** | aclaraciones | `GET /api/aclaraciones` | Estatus='Aclaración' |
| **SELECT by Estatus** | sesgos | `GET /api/sesgos` | Estatus LIKE '%CasetaNoEncontrada%' |
| **INSERT** | cruces | `POST /api/cruces/import` | Todos |
| **UPDATE Estatus** | cruces | `PUT /api/cruces/{id}/status` | Estatus, Estatus_Secundario |
| **UPDATE Estatus (masivo)** | cruces | `PATCH /api/cruces/status-masivo` | Estatus, Estatus_Secundario |
| **UPDATE OT** | cruces | `PUT /api/cruces/{id}/ot` | id_orden |
| **UPDATE Abuso** | abusos | `PUT /api/abusos/{id}` | Estatus_Secundario, montoDictaminado, FechaDictamen, observaciones, Aplicado |
| **UPDATE Aclaración** | aclaraciones | `PUT /api/aclaraciones/{id}` | NoAclaracion, FechaDictamen, Estatus_Secundario, observaciones, montoDictaminado, Aplicado |

---

### Tabla `ImportacionesCruces` - MATRIZ DE OPERACIONES

| Operación | Módulo | Cuando |
|-----------|--------|--------|
| **INSERT** | cruces | En cada `POST /api/cruces/import` |
| **SELECT** | cruces | Auditoría de importaciones |

---

## 📊 FLUJOS DE DATOS

### **FLUJO 1: Importación de Cruces**

```
1. Usuario sube archivo CSV/Excel
   ↓
2. POST /api/cruces/import (header: x-usuario)
   ↓
3. Para cada fila en archivo:
   ├─ Parsear: Tag, Fecha, Hora, Caseta, Clase, Importe
   ├─ Generar ID único: YYMMDD_HHMMSS_TAG
   ├─ Buscar TAG en tabla Tags → obtener ID_matricula
   ├─ Buscar OT por ID_matricula + fecha → obtener id_orden
   ├─ Buscar tarifa en casetas_Plantillas por (idCaseta, Clase)
   ├─ Consultar Estado_del_personal por (ID_matricula, fecha)
   ├─ Aplicar lógica de Estatus
   ├─ INSERT en cruces
   └─ Reportar progreso vía SSE
   ↓
4. INSERT en ImportacionesCruces (auditoria)
   ↓
5. Retornar resumen: {total, insertados, omitidos}
```

**Atributos mapeados:**
- Input: Tag → Output: ID
- Input: Fecha, Hora, Tag → Output: ID  
- Input: Clase + Caseta → Output: ImporteOficial
- Input: ID_matricula, Fecha → Output: id_orden
- Input: ID_matricula, Fecha → Output: Estatus (via Estado_del_personal)

---

### **FLUJO 2: Consulta de Abusos**

```
1. GET /api/abusos
   ↓
2. SELECT * FROM cruces WHERE Estatus = 'Abuso'
   ↓
3. Para cada cruce:
   ├─ Extraer ID_matricula de No_Economico
   ├─ LEFT JOIN Estado_del_personal (fecha exacta o ±1 día)
   ├─ LEFT JOIN Personal por ID_matricula
   ├─ Enriquecer: NombreCompleto = nombres + ap_paterno + ap_materno
   └─ Retornar registro completo
   ↓
4. Response: Array de abusos con información personal
```

**Atributos consultados:**
- cruces: ID, No_Economico, Fecha, Importe, montoDictaminado, Estatus_Secundario, observaciones
- Estado_del_personal: Descripcion (estado laboral)
- Personal: Nombres, Ap_paterno, Ap_materno

---

### **FLUJO 3: Actualización de Abuso**

```
1. PUT /api/abusos/{id}
   Request Body: {
     noAclaracion,
     FechaDictamen,
     estatusSecundario,
     observaciones,
     dictaminado (boolean),
     montoDictaminado
   }
   ↓
2. UPDATE cruces SET
     NoAclaracion = @noAclaracion,
     FechaDictamen = @FechaDictamen,
     Estatus_Secundario = @estatusSecundario,
     observaciones = @observaciones,
     Aplicado = @dictaminado,
     montoDictaminado = @montoDictaminado
   WHERE ID = @id
   ↓
3. Retornar confirmación y datos actualizados
```

**Atributos modificados:**
- NoAclaracion (STRING)
- FechaDictamen (DATE)
- Estatus_Secundario (VARCHAR)
- observaciones (VARCHAR)
- Aplicado (BIT)
- montoDictaminado (NUMERIC)

---

### **FLUJO 4: Consulta de Aclaraciones**

```
1. GET /api/aclaraciones
   ↓
2. SELECT DISTINCT CR.*, OT.ID_clave, CP.Nombre_IAVE, CP.*
   FROM cruces CR
   INNER JOIN Orden_traslados OT ON CR.id_orden = OT.ID_orden
   INNER JOIN casetas_Plantillas CP ON CR.idCaseta = CP.ID_Caseta
   WHERE CR.Estatus = 'Aclaración'
   ORDER BY CR.Fecha DESC
   ↓
3. Para cada registro:
   ├─ Calcular diferencia = Importe - ImporteOficial
   └─ Enriquecer con información de caseta y OT
   ↓
4. Response: Array de aclaraciones enriquecidas
```

**Atributos relacionados:**
- cruces: ID, Fecha, Importe, ImporteOficial, id_orden, Estatus, Estatus_Secundario
- Orden_traslados: ID_clave (clasificación SCT)
- casetas_Plantillas: Nombre_IAVE, Automovil, Camion2Ejes, etc., latitud, longitud, Estado

---

### **FLUJO 5: Análisis de Sesgos**

```
1. GET /api/sesgos
   ↓
2. SELECT * FROM cruces 
   WHERE Estatus IN ('CasetaNoEncontradaEnRuta', 'Sesgos', 'Ruta Sin Casetas%')
   ORDER BY ID DESC
   ↓
3. Retornar lista de cruces con anomalías
   ↓
4. GET /api/sesgos/por-casetas
   ↓
5. Identificar DISTINCT rutas con sesgos
   ↓
6. Para cada ruta:
   ├─ Enriquecer con información de Tipo_de_ruta_N
   ├─ Calcular categoría basada en Latinos, Nacionales, Exportacion, etc.
   └─ Retornar información completa de la ruta
   ↓
7. Response: Array de rutas con sesgos
```

**Atributos relacionados:**
- cruces: ID, Caseta, Importe, No_Economico, id_orden, Estatus
- Orden_traslados: ID_orden, Id_tipo_ruta
- Tipo_de_ruta_N: ID_ruta, PoblacionOrigen, PoblacionDestino, Km_reales, etc.

---

### **FLUJO 6: Gestión de TAGs**

```
1. GET /api/tags
   ↓
2. SELECT T.*, P.Nombres, P.Ap_paterno, P.Ap_materno
   FROM Tags T
   LEFT JOIN Personal P ON T.ID_matricula = P.ID_matricula
   ↓
3. Para cada TAG:
   ├─ Obtener estado actual (activo, stock, inactivo, extraviado)
   ├─ Si estado = 'activo':
   │   └─ Verificar disponibilidad del operador
   │       (consultar Estado_del_personal)
   └─ Enriquecer con datos personales
   ↓
4. GET /api/tags/unavailable/{fecha}
   ↓
5. Para la fecha específica:
   ├─ SELECT * FROM Estado_del_personal WHERE ID_fecha = @fecha
   ├─ Filtrar por situacionesAbusivas
   └─ Retornar operadores NO disponibles
   ↓
6. Response: Array de TAGs con información personal y disponibilidad
```

**Atributos consultados:**
- Tags: ID_tag, ID_matricula, Estado, FechaAsignacion, FechaDevolucion
- Personal: Nombres, Ap_paterno, Ap_materno
- Estado_del_personal: ID_matricula, ID_fecha, Descripcion

---

## 🗺️ MATRIZ DE RELACIONES

### Relaciones entre Tablas (Foreign Keys)

```
┌──────────────────────────────────────────────────────────────┐
│                    DIAGRAMA DE RELACIONES                    │
└──────────────────────────────────────────────────────────────┘

                        ┌─────────────────┐
                        │   cruces (★)    │  ← TABLA CENTRAL
                        └────────┬────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│ Orden_traslados │  │ casetas_Plantillas │  │ ImportacionesCruces
│  id_orden (FK)  │  │  idCaseta (FK)     │  │
└────────┬────────┘  └────────┬───────────┘  └──────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ Tipo_de_ruta_N   │  │  (geolocalización)
│ Id_tipo_ruta     │
└──────────────────┘


┌─────────────────┐
│  Tags (★)       │  ← TABLA DE DISPOSITIVOS
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Personal     │  
│ ID_matricula    │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ Estado_del_personal        │  ← TABLA TEMPORAL (histórico diario)
│ (ID_matricula, ID_fecha)   │
└────────────────────────────┘

(★) = Tablas más consultadas y modificadas
```

### Matriz de Joins principales

| Desde | Hacia | Clave | Módulos que la usan |
|-------|-------|-------|---------------------|
| cruces | Orden_traslados | id_orden | abusos, aclaraciones, sesgos, cruces |
| cruces | casetas_Plantillas | idCaseta | aclaraciones, casetas |
| cruces → No_Economico | Tags | Tag | cruces (importación) |
| Tags | Personal | ID_matricula | tags, abusos |
| Personal | Estado_del_personal | ID_matricula + fecha | abusos, tags, cruces |
| Orden_traslados | Tipo_de_ruta_N | Id_tipo_ruta | sesgos, casetas |

---

## 📈 ESTADÍSTICAS DE USO

### Volumen de Datos (estimado)

| Tabla | Registros | Crecimiento |
|-------|-----------|-------------|
| cruces | ~10,000+ diarios | Continuo durante operación |
| ImportacionesCruces | ~5-10 diarios | Un registro por importación |
| Orden_traslados | ~500-1000 | Estático anualmente |
| casetas_Plantillas | ~100-150 | Catálogo estático |
| Estado_del_personal | ~50,000+ | Histórico diario |
| Tags | ~200-500 | Catálogo, cambios ocasionales |
| Personal | ~100-300 | Catálogo, cambios ocasionales |
| Tipo_de_ruta_N | ~100-200 | Catálogo, cambios ocasionales |

### Frecuencia de Operaciones

| Operación | Frecuencia | Hora pico |
|-----------|-----------|----------|
| Importación de cruces | 1-5 veces/día | Mañana (6-10 AM) |
| Consulta de cruces | 100+ veces/día | Continuo |
| Actualización de estatus | 10-50 veces/día | Tarde (2-5 PM) |
| Consulta de abusos | 20+ veces/día | Continuo |
| Consulta de aclaraciones | 20+ veces/día | Continuo |
| Consulta de sesgos | 10+ veces/día | Continuo |
| Consulta de TAGs | 5-10 veces/día | Mañana |

---

## 🔐 SEGURIDAD Y AUDITORÍA

### Campos de Auditoría

| Tabla | Campo | Propósito |
|-------|-------|----------|
| ImportacionesCruces | Usuario | Quién importó |
| ImportacionesCruces | FechaImportacion | Cuándo se importó |
| ImportacionesCruces | TotalInsertados | Cuántos registros |
| Tags | FechaAsignacion | Cuándo se asignó |
| Tags | FechaDevolucion | Cuándo se devolvió |
| Tipo_de_ruta_N | fecha_Alta | Cuándo se creó |
| cruces | observaciones | Histórico de cambios |

### Operaciones Críticas

1. **Importación de cruces**: Requiere header `x-usuario`
2. **Actualización de estatus**: Modifica información de auditoría
3. **Actualización de TAGs**: Afecta disponibilidad de operadores
4. **Cambios en tarifas**: Impactan comparación Importe vs ImporteOficial

---

## 📝 RECOMENDACIONES

### 1. **Mejoras de Estructura**
- [ ] Crear índices en `cruces` por (Estatus, Fecha) para mejorar queries
- [ ] Crear índice en `cruces` por (No_Economico, Fecha) para conciliación
- [ ] Crear índice en `Estado_del_personal` por (ID_matricula, ID_fecha)
- [ ] Crear índice en `ImportacionesCruces` por (FechaImportacion)

### 2. **Mejoras de Seguridad**
- [ ] Parametrizar todos los queries SQL (actualmente algunos usan interpolación)
- [ ] Validar header `x-usuario` en todas las operaciones críticas
- [ ] Agregar soft delete en lugar de DELETE directo
- [ ] Registrar cambios en tabla de auditoría

### 3. **Mejoras de Performance**
- [ ] Cachear datos de `casetas_Plantillas` en memoria
- [ ] Cachear datos de `Tipo_de_ruta_N` en memoria
- [ ] Usar batch INSERT para mejoras en importación
- [ ] Implementar paginación en consultas de cruces

### 4. **Mejoras de Integridad**
- [ ] Validar referential integrity en todas las FKs
- [ ] Implementar transacciones en importación
- [ ] Validar que montoDictaminado ≤ Importe
- [ ] Validar que FechaDictamen ≥ Fecha

---

## 📞 CONTACTO Y SOPORTE

Para consultas sobre este mapeo:
- **Backend API**: Backend Dev Team
- **Base de Datos**: DBA Team
- **Documentación**: Architecture Team

---

**Versión:** 1.0  
**Última actualización:** 3 de Diciembre de 2025  
**Autor:** Sistema IAVE Análisis Automático
