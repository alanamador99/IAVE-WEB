# 📊 MATRIZ DETALLADA: OPERACIONES POR TABLA Y ATRIBUTO

**Última actualización:** 3 de Diciembre de 2025

---

## TABLA 1: `cruces` (TABLA CENTRAL)

### Estructura de Atributos

```
┌─────────────────────────────────────────────────────────────────┐
│ TABLA: cruces                                                   │
│ PK: ID (VARCHAR 24)                                             │
│ Registros/día: ~10,000                                          │
│ Crecimiento: Lineal con operaciones                             │
└─────────────────────────────────────────────────────────────────┘
```

| Atributo | Tipo | Tamaño | NULL | Uso | Módulos | Operación |
|----------|------|--------|------|-----|---------|-----------|
| **ID** | VARCHAR | 24 | NO | PK, ID único generado | todos | INSERT |
| **Caseta** | VARCHAR | 64 | SÍ | Nombre estación peaje | todos | INSERT, READ |
| **No_Economico** | VARCHAR | 15 | SÍ | Matrícula vehículo | cruces, abusos, aclaraciones, sesgos | INSERT, READ |
| **Fecha** | DATETIME | - | SÍ | Timestamp del cruce | todos | INSERT, READ |
| **Importe** | NUMERIC | 12,3 | SÍ | Monto cobrado | todos | INSERT, READ |
| **Tag** | VARCHAR | 15 | SÍ | ID dispositivo RFID | cruces, tags | INSERT, READ |
| **Carril** | VARCHAR | 50 | SÍ | Número carril | cruces | INSERT, READ |
| **Clase** | VARCHAR | 15 | SÍ | Clasificación vehículo (A, C-2, C-3, etc.) | cruces | INSERT, READ |
| **Consecar** | VARCHAR | 20 | SÍ | Código de consecución | cruces | INSERT, READ |
| **FechaAplicacion** | DATETIME | - | SÍ | Fecha aplicación cobro | cruces | INSERT, READ |
| **Estatus** | VARCHAR | 30 | SÍ | Estado: Confirmado, Abuso, Aclaración, etc. | todos | INSERT, READ, UPDATE ★★ |
| **id_orden** | VARCHAR | 30 | SÍ | FK a Orden_traslados | cruces, abusos, aclaraciones | INSERT, READ, UPDATE |
| **observaciones** | VARCHAR | 255 | SÍ | Comentarios, notas | abusos, aclaraciones | INSERT, READ, UPDATE |
| **Estatus_Secundario** | VARCHAR | 100 | SÍ | Estado secundario: pendiente, completado, etc. | abusos, aclaraciones | READ, UPDATE ★★★ |
| **Aplicado** | BIT | 1 | SÍ | ¿Descuento aplicado? | abusos, aclaraciones | READ, UPDATE |
| **FechaDictamen** | DATE | - | SÍ | Fecha dictamen | abusos, aclaraciones | READ, WRITE |
| **ImporteOficial** | NUMERIC | 12,3 | SÍ | Tarifa oficial según clase | cruces, aclaraciones | INSERT, READ |
| **NoAclaracion** | VARCHAR | 20 | SÍ | Número aclaración | abusos, aclaraciones | READ, UPDATE |
| **montoDictaminado** | NUMERIC | 12,3 | SÍ | Monto final tras dictamen | abusos, aclaraciones | READ, UPDATE |
| **idCaseta** | VARCHAR | 10 | SÍ | FK a casetas_Plantillas | todos | INSERT, READ |

### Valores de Estatus válidos

```
┌─────────────────────────────────────────────────────────────┐
│ ESTATUS - CLASIFICACIÓN DE CRUCES                           │
├─────────────────────────────────────────────────────────────┤
│ Confirmado              → Cobro correcto (Importe = Oficial) │
│ Se cobró menos          → Diferencia negativa               │
│ Aclaración              → Diferencia positiva               │
│ Abuso                   → Personal en situación especial     │
│ CasetaNoEncontradaEnRuta → Caseta ∉ Ruta                   │
│ Ruta Sin Casetas        → OT sin casetas definidas          │
│ Pendiente               → En espera (falta info)            │
│ Condonado               → Cancelado/Perdonado               │
└─────────────────────────────────────────────────────────────┘
```

### Valores de Estatus_Secundario (por tipo)

**Para ABUSOS:**
```
pendiente_reporte
├─→ reporte_enviado_todo_pendiente
│   ├─→ descuento_aplicado_pendiente_acta
│   │   └─→ completado
│   │
│   └─→ acta_aplicada_pendiente_descuento
│       └─→ completado
│
└─→ condonado
```

**Para ACLARACIONES:**
```
pendiente_aclaracion
├─→ aclaracion_levantada
│   └─→ dictaminado
│       └─→ completado
│
└─→ (otros estados)
```

### Operaciones por Módulo

| Módulo | Operación | Atributos | Frecuencia |
|--------|-----------|-----------|-----------|
| **cruces** | INSERT (importación) | Todos | 1-5 veces/día (~1000-10000 registros) |
| **cruces** | SELECT (estadísticas) | Todos | 100+ veces/día |
| **cruces** | UPDATE (asignar OT) | id_orden | 10+ veces/día |
| **cruces** | UPDATE (estatus) | Estatus, Estatus_Secundario | 50+ veces/día |
| **abusos** | SELECT (filtrado) | WHERE Estatus='Abuso' | 20+ veces/día |
| **abusos** | UPDATE | Estatus_Secundario, montoDictaminado, FechaDictamen, observaciones, Aplicado, NoAclaracion | 10+ veces/día |
| **aclaraciones** | SELECT (filtrado) | WHERE Estatus='Aclaración' | 20+ veces/día |
| **aclaraciones** | UPDATE | Estatus_Secundario, montoDictaminado, FechaDictamen, observaciones, Aplicado, NoAclaracion | 10+ veces/día |
| **sesgos** | SELECT (filtrado) | WHERE Estatus LIKE '%CasetaNoEncontrada%' | 10+ veces/día |

---

## TABLA 2: `ImportacionesCruces` (AUDITORÍA)

| Atributo | Tipo | Tamaño | NULL | Propósito | Operación |
|----------|------|--------|------|----------|-----------|
| **Id** | INT IDENTITY | - | NO | PK auto-incremento | AUTO |
| **Usuario** | NVARCHAR | 50 | SÍ | Email del usuario que importó | WRITE, READ |
| **FechaImportacion** | DATETIME | - | SÍ | Cuándo se realizó la importación | WRITE, READ |
| **TotalInsertados** | INT | - | SÍ | Cantidad de registros insertados | WRITE, READ |

**Operaciones:**
- INSERT: Una por cada `POST /api/cruces/import`
- SELECT: Para auditoría y reportes

---

## TABLA 3: `Tags` (DISPOSITIVOS RFID)

| Atributo | Tipo | Tamaño | NULL | Propósito | Operación |
|----------|------|--------|------|----------|-----------|
| **ID_tag** | VARCHAR | - | NO | PK - Identificador del dispositivo | READ |
| **ID_matricula** | INT | - | SÍ | FK a Personal.ID_matricula | READ, UPDATE |
| **Estado** | VARCHAR | - | SÍ | activo \| stock \| inactivo \| extravio | READ, UPDATE ★★ |
| **FechaAsignacion** | DATE | - | SÍ | Cuándo se asignó al operador | READ, WRITE |
| **FechaDevolucion** | DATE | - | SÍ | Cuándo se devolvió (si aplica) | READ, WRITE |
| **(...otros)** | - | - | - | Información adicional del TAG | READ |

**Estados válidos:**
```
activo    → TAG asignado a operador en servicio
stock     → TAG disponible para asignar
inactivo  → TAG fuera de servicio
extravio  → TAG perdido/extraviado
```

**Operaciones:**
- SELECT ★★★: Consultas de disponibilidad, estadísticas
- UPDATE: Cambiar estado, asignar/devolver a operador
- READ: En importación de cruces para obtener matrícula

---

## TABLA 4: `Personal` (MAESTRO - OPERADORES)

| Atributo | Tipo | Tamaño | NULL | Propósito | Operación |
|----------|------|--------|------|----------|-----------|
| **ID_matricula** | INT | - | NO | PK - Identificador del operador | READ |
| **Nombres** | VARCHAR | - | SÍ | Primer nombre | READ |
| **Ap_paterno** | VARCHAR | - | SÍ | Apellido paterno | READ |
| **Ap_materno** | VARCHAR | - | SÍ | Apellido materno | READ |
| **(...otros)** | - | - | - | Información personal adicional | READ |

**Operaciones:**
- SELECT ★★★: Enriquecimiento de datos (abusos, tags)
- NO ESCRIBE: Read-only (tabla maestra)

---

## TABLA 5: `Estado_del_personal` (HISTÓRICO DIARIO)

| Atributo | Tipo | Tamaño | NULL | Propósito | Operación |
|----------|------|--------|------|----------|-----------|
| **ID_matricula** | INT | - | NO | FK a Personal.ID_matricula (PK composite) | READ |
| **ID_fecha** | DATE | - | NO | Fecha del estado (PK composite) | READ |
| **Descripcion** | VARCHAR | - | SÍ | Estado laboral: VACACIONES, INCAPACIDAD, etc. | READ |
| **ID_ordinal** | VARCHAR | - | SÍ | Identificador ordinal | READ |
| **Encabezado** | VARCHAR | - | SÍ | Tipo de cambio | READ |

**Descripcion - Valores comunes (~40 estados):**
```
VACACIONES | INCAPACIDAD | PERMISO | DESCANSO CON DERECHO
FALTA INJUSTIFICADA | FALTA JUSTIFICADA | FALTA CON AVISO
DESCANSO POR DIA FESTIVO | DESCANSO POR SEMANA SANTA
BAJA | CURSO | CAPACITACION
IMSS | CONSULTA IMSS | CITA IMSS
TRAMITE LICENCIA | TRAMITE PASAPORTE | TRAMITE VISA
PERMISO SALIDA | PERMISO SALIDA/ENTRADA | PATERNIDAD
INDISCIPLINA | PROBLEMA FAMILIAR | PROBLEMA DE SALUD
IRSE SIN AVISAR | CASTIGADO | CONSULTA
PLÁTICA | AUDITOR INTERNO | COCINERO
(...y otros ~20 más)
```

**Operaciones:**
- SELECT ★★★: Consultas frecuentes en cruces, abusos, tags
- NO ESCRIBE: Read-only (histórico)

---

## TABLA 6: `Orden_traslados` (OT - AUTORIZACIONES DE VIAJE)

| Atributo | Tipo | Tamaño | NULL | Propósito | Operación |
|----------|------|--------|------|----------|-----------|
| **ID_orden** | VARCHAR | 30 | NO | PK - Identificador único | READ, UPDATE |
| **ID_clave** | VARCHAR | 10 | SÍ | Clasificación SCT (A, B, C-2, C-3, C-5, C-9) | READ |
| **Id_tipo_ruta** | VARCHAR | - | SÍ | FK a Tipo_de_ruta_N.id_Tipo_ruta | READ |
| **FechaInicio** | DATE | - | SÍ | Inicio de validez de la OT | READ |
| **FechaFin** | DATE | - | SÍ | Fin de validez de la OT | READ |
| **(...otros)** | - | - | - | Información de transporte | READ |

**Operaciones:**
- SELECT ★★★: Búsqueda por matrícula y fecha en importación
- UPDATE: Asignar OT a cruces
- Tabla crítica para validación

---

## TABLA 7: `casetas_Plantillas` (CATÁLOGO DE CASETAS)

| Atributo | Tipo | Tamaño | NULL | Propósito | Operación |
|----------|------|--------|------|----------|-----------|
| **ID_Caseta** | VARCHAR | 10 | NO | PK - Identificador único | READ |
| **Nombre_IAVE** | VARCHAR | - | SÍ | Nombre oficial para display | READ |
| **Automovil** | NUMERIC | 12,3 | SÍ | Tarifa clase A | READ |
| **Autobus2Ejes** | NUMERIC | 12,3 | SÍ | Tarifa clase B | READ |
| **Camion2Ejes** | NUMERIC | 12,3 | SÍ | Tarifa clase C-2 | READ |
| **Camion3Ejes** | NUMERIC | 12,3 | SÍ | Tarifa clase C-3 | READ |
| **Camion5Ejes** | NUMERIC | 12,3 | SÍ | Tarifa clase C-5 | READ |
| **Camion9Ejes** | NUMERIC | 12,3 | SÍ | Tarifa clase C-9 | READ |
| **latitud** | VARCHAR | - | SÍ | Coordenada geográfica | READ |
| **longitud** | VARCHAR | - | SÍ | Coordenada geográfica | READ |
| **Estado** | VARCHAR | - | SÍ | Entidad federativa | READ |

**Operaciones:**
- SELECT ★★★: Búsqueda por ID y clase para obtener ImporteOficial
- NO ESCRIBE: Read-only (catálogo)

---

## TABLA 8: `Tipo_de_ruta_N` (CATÁLOGO DE RUTAS)

| Atributo | Tipo | Tamaño | NULL | Propósito | Operación |
|----------|------|--------|------|----------|-----------|
| **ID_ruta** | VARCHAR | - | NO | PK - Identificador único | READ |
| **id_Tipo_ruta** | VARCHAR | - | SÍ | Tipo/categoría de ruta | READ |
| **PoblacionOrigen** | VARCHAR | - | SÍ | Lugar de partida | READ |
| **PoblacionDestino** | VARCHAR | - | SÍ | Lugar de destino | READ |
| **RazonOrigen** | VARCHAR | - | SÍ | Terminal/empresa origen | READ |
| **RazonDestino** | VARCHAR | - | SÍ | Terminal/empresa destino | READ |
| **Km_reales** | NUMERIC | - | SÍ | Kilómetros reales recorridos | READ |
| **Km_oficiales** | NUMERIC | - | SÍ | Kilómetros reconocidos oficialmente | READ |
| **Km_de_pago** | NUMERIC | - | SÍ | Kilómetros de pago | READ |
| **Km_Tabulados** | NUMERIC | - | SÍ | Kilómetros tabulados | READ |
| **peaje_dos_ejes** | NUMERIC | 12,3 | SÍ | Tarifa peaje 2 ejes | READ |
| **peaje_tres_ejes** | NUMERIC | 12,3 | SÍ | Tarifa peaje 3 ejes | READ |
| **Latinos** | BIT | 1 | SÍ | ¿Ruta Latinos? (categorización) | READ |
| **Nacionales** | BIT | 1 | SÍ | ¿Ruta Nacional? | READ |
| **Exportacion** | BIT | 1 | SÍ | ¿Ruta Exportación? | READ |
| **Otros** | BIT | 1 | SÍ | ¿Otros? | READ |
| **Cemex** | BIT | 1 | SÍ | ¿Ruta Cemex? | READ |
| **Alterna** | BIT | 1 | SÍ | ¿Ruta alternativa? | READ |
| **Observaciones** | VARCHAR | - | SÍ | Notas sobre la ruta | READ |
| **fecha_Alta** | DATE | - | SÍ | Fecha de creación | READ |

**Lógica de categorización:**
```
Si 1 campo BIT = 1 → Esa es la categoría
Si 2 campos BIT = 1 y uno es Alterna → La categoría es el otro
Si ninguna → null
```

**Operaciones:**
- SELECT ★★★: Análisis de rutas, sesgos
- NO ESCRIBE: Read-only (catálogo)

---

## 🔗 MATRIZ DE RELACIONES

```
┌──────────────────────────────────────────────────────────────────┐
│                   FOREIGN KEY RELATIONSHIPS                      │
├──────────────────────────────────────────────────────────────────┤
│ cruces.id_orden ─────────→ Orden_traslados.ID_orden             │
│ cruces.idCaseta ────────→ casetas_Plantillas.ID_Caseta          │
│ cruces.No_Economico ──→ Tags.ID_tag (búsqueda por Tag)          │
│                                                                   │
│ Orden_traslados.Id_tipo_ruta ──→ Tipo_de_ruta_N.id_Tipo_ruta   │
│                                                                   │
│ Tags.ID_matricula ─────→ Personal.ID_matricula                  │
│ Estado_del_personal.ID_matricula ──→ Personal.ID_matricula      │
│                                                                   │
│ ImportacionesCruces ──→ (registro de auditoría, no FK)           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📈 MATRIZ DE ÍNDICES RECOMENDADOS

| Tabla | Índice | Columnas | Prioridad | Razón |
|-------|--------|----------|-----------|-------|
| cruces | idx_estatus_fecha | (Estatus, Fecha DESC) | ★★★ | Búsquedas frecuentes por estatus |
| cruces | idx_no_economico_fecha | (No_Economico, Fecha DESC) | ★★★ | Conciliación y análisis por operador |
| cruces | idx_id_orden | (id_orden) | ★★ | JOIN con Orden_traslados |
| cruces | idx_id_caseta | (idCaseta) | ★★ | JOIN con casetas_Plantillas |
| Estado_del_personal | idx_matricula_fecha | (ID_matricula, ID_fecha) | ★★★ | Búsquedas por operador y fecha |
| Tags | idx_estado | (Estado) | ★★ | Estadísticas de disponibilidad |
| Tags | idx_matricula | (ID_matricula) | ★★ | Búsquedas por operador |
| ImportacionesCruces | idx_fecha | (FechaImportacion DESC) | ★ | Auditoría |

---

## 🔐 VALIDACIONES CRÍTICAS

### Por Atributo

| Atributo | Regla | Tabla |
|----------|-------|-------|
| `Clase` | IN {A, B, C-2, C-3, C-5, C-9} | cruces |
| `Estatus` | Valores predefinidos (8 valores) | cruces |
| `Estatus_Secundario` | Depende de Estatus (jerarquía) | cruces |
| `Importe` | ≥ 0, NUMERIC(12,3) | cruces |
| `montoDictaminado` | ≤ Importe | cruces |
| `FechaDictamen` | ≥ Fecha del cruce | cruces |
| `ImporteOficial` | ≥ 0, coincide con tarifa en casetas_Plantillas | cruces |
| `id_orden` | Debe existir en Orden_traslados | cruces |
| `idCaseta` | Debe existir en casetas_Plantillas | cruces |
| `No_Economico` | Debe encontrarse en Tags (por Tag) | cruces |
| `ID_matricula` (Tags) | Debe existir en Personal | Tags |
| `Estado` (Tags) | IN {activo, stock, inactivo, extravio} | Tags |

---

**Creado:** 3 de Diciembre de 2025  
**Proyecto:** IAVE WEB  
**Versión:** 1.0 MATRIZ DETALLADA
