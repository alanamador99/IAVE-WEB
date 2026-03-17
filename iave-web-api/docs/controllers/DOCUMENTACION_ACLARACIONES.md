# Documentación - aclaraciones.controllers.js

## 📋 Resumen General

El controlador `aclaraciones.controllers.js` gestiona todas las operaciones relacionadas con **ACLARACIONES** en el sistema IAVE. Una aclaración es un reclamo formal por diferencia en el cobro de peaje.

**Causas comunes de aclaraciones:**
- Tarifa cobrada mayor que la programada
- Error en clasificación del vehículo
- Duplicación de cobro
- Problemas técnicos en caseta
- Error de identificación de vehículo

**Responsabilidades principales:**
- Registrar reclamos por diferencias de cobro
- Seguimiento del proceso de resolución
- Cálculo de montos a reembolsar
- Generación de reportes
- Dictaminación y resolución

---

## 💰 ¿Qué es una Aclaración?

Una **aclaración** es:
- **Reclamo formal**: Cliente disputa un cobro
- **Basada en diferencia**: Importe cobrado vs. importe oficial
- **Documentada**: Registrada en el sistema
- **Con proceso**: Investigación y resolución
- **Reembolsable**: Puede resultar en devolución

**Fórmula de diferencia:**
```
Diferencia = Importe Cobrado - Importe Oficial

Si Diferencia > 0: Cliente pagó de más (potencial reembolso)
Si Diferencia < 0: Cliente pagó de menos (potencial cobro)
```

**Ciclo de vida de una aclaración:**

```
┌──────────────────────┐
│ Aclaración Registrada│ ← Cliente reclama
│ (por diferencia)     │
└──────────┬───────────┘
           │
┌──────────▼──────────────────┐
│ pendiente_aclaracion        │ ← En investigación
│ Diferencia = Imp - ImpOf    │
└──────────┬──────────────────┘
           │
      ┌────┴─────────────────────────┐
      │                              │
  ┌───▼───────────────────┐   ┌──────▼──────────────┐
  │ aclaracion_levantada  │   │ dictaminado        │
  │ (a favor del cliente) │   │ (con resolución)   │
  └───┬───────────────────┘   └──────┬──────────────┘
      │                             │
      └─────────┬───────────────────┘
                │
     ┌──────────▼─────────────┐
     │ completado             │ ← Reembolso procesado
     │ (Resuelto + reembolso) │   o cobro aplicado
     └────────────────────────┘
```

---

## 📊 Estados Secundarios de una Aclaración

| Estado | Descripción | Acción |
|--------|-------------|--------|
| **pendiente_aclaracion** | Reclamo registrado, bajo investigación | Investigar diferencia |
| **aclaracion_levantada** | Aclaración resuelta a favor del cliente | Procesar reembolso |
| **dictaminado** | Dictamen oficial emitido | Aplicar resolución |
| **completado** | Proceso finalizado (reembolso/cobro) | Cierre del expediente |

---

## 📡 API Endpoints

### 1. **Obtener todas las aclaraciones** (`getAclaraciones`)

**Ruta:** `GET /api/aclaraciones`

Retorna lista de todas las aclaraciones registradas.

```bash
# Request
GET /api/aclaraciones

# Response (200 OK)
[
  {
    "ID": 1,
    "Estatus": "Aclaración",
    "Estatus_Secundario": "pendiente_aclaracion",
    "Fecha": "2025-12-01",
    "Importe": 250.00,
    "ImporteOficial": 200.00,
    "diferencia": 50.00,
    "id_orden": "OT-12345",
    "ID_clave": "C-5",
    "Nombre_IAVE": "Tlanalapa",
    "latitud": "20.3456",
    "longitud": "-99.1234",
    "Estado": "HIDALGO",
    "montoDictaminado": null,
    "observaciones": "Cliente reportó sobrecobro"
  },
  {...}
]
```

**Campos importantes:**
- `diferencia`: Importe - ImporteOficial (>0 = favor cliente)
- `ID_clave`: Clasificación de vehículo (A, B, C-2, C-3, C-5, C-9)
- Información de caseta enriquecida

**Ordenado por:** Fecha descendente (más recientes primero)

---

### 2. **Obtener estadísticas de aclaraciones** (`getStats`)

**Ruta:** `GET /api/aclaraciones/stats`

Retorna estadísticas agregadas de aclaraciones.

```bash
# Request
GET /api/aclaraciones/stats

# Response (200 OK)
[
  {
    "pendiente_count": 35,
    "pendiente_monto": 5250.00,
    "aclaracion_levantada_count": 18,
    "aclaracion_levantada_monto": 2700.00,
    "dictaminado_count": 7,
    "dictaminado_monto": 1050.00,
    "total_count": 60,
    "total_monto": 9000.00
  }
]
```

**Métricas:**
- **pendiente**: Aclaraciones bajo investigación
- **aclaracion_levantada**: Resueltas a favor (reembolsos potenciales)
- **dictaminado**: Con dictamen oficial
- **total**: Suma de todas las aclaraciones

**Montos:**
- Se basan en la diferencia (Importe - ImporteOficial)
- Para levantadas: usa montoDictaminado o diferencia calculada

---

### 3. **Obtener aclaraciones por orden de traslado** (`getAclaracionesByOT`)

**Ruta:** `GET /api/aclaraciones/ot/{IDOrden}`

Retorna aclaraciones de una orden de traslado específica.

```bash
# Request
GET /api/aclaraciones/ot/OT-12345

# Response (200 OK)
[
  {
    "ID": 1,
    "id_orden": "OT-12345",
    "Fecha": "2025-12-01",
    "Importe": 250.00,
    "ImporteOficial": 200.00,
    "diferencia": -50.00,
    "Origen": "Tlanalapa",
    "Destino": "Mexico DF",
    "ruta": "Tlanalapa - Mexico DF",
    "ID_Caseta": 5,
    "Nombre_IAVE": "Tlanalapa",
    "IAVE": true,
    "ID_clave": "C-5",
    "cobrado": "Camion5Ejes",
    "Automovil": 50.50,
    "Autobus2Ejes": 75.25,
    "Camion2Ejes": 100.00,
    "Camion3Ejes": 150.00,
    "Camion5Ejes": 200.00,
    "Camion9Ejes": 280.00,
    ...
  }
]
```

**Campos especiales:**
- `ruta`: Concatenación "Origen - Destino"
- `cobrado`: Tipo de vehículo deducido de ID_clave
- Tarifas completas de la caseta
- Información completa de la orden

**Parámetro:**
- `IDOrden`: ID de la orden de traslado (ej: "OT-12345")

---

### 4. **Actualizar aclaración** (`UpdateAclaracion`)

**Ruta:** `PUT /api/aclaraciones/{id}`

Actualiza información completa de una aclaración.

```bash
# Request
PUT /api/aclaraciones/1
Content-Type: application/json

{
  "noAclaracion": "ACL-2025-001",
  "FechaDictamen": "2025-12-01",
  "estatusSecundario": "aclaracion_levantada",
  "observaciones": "Reembolso de $50 autorizado al cliente",
  "dictaminado": true,
  "montoDictaminado": 50.00
}

# Response (200 OK)
{
  "message": "Estatus aclaracion_levantada actualizado correctamente sobre el ID 1"
}
```

**Campos actualizables:**
- `NoAclaracion`: Número de expediente
- `FechaDictamen`: Fecha del dictamen
- `Estatus_Secundario`: Nuevo estado
- `observaciones`: Notas
- `aplicado`: Flag de dictaminado
- `montoDictaminado`: Monto de la resolución

---

## 📊 Estructura de Base de Datos

### Tabla: Cruces (registros de aclaraciones)

```sql
CREATE TABLE Cruces (
    ID INT PRIMARY KEY,
    Fecha DATETIME,
    Estatus NVARCHAR(20),            -- 'Aclaración'
    Estatus_Secundario NVARCHAR(50), -- 'pendiente_aclaracion', etc
    Importe DECIMAL(10,2),           -- Monto cobrado
    ImporteOficial DECIMAL(10,2),    -- Monto oficial/correcto
    montoDictaminado DECIMAL(10,2),  -- Monto del reembolso/cobro
    NoAclaracion NVARCHAR(50),
    FechaDictamen DATETIME,
    aplicado BIT,
    observaciones NVARCHAR(MAX),
    id_orden NVARCHAR(50),
    idCaseta INT,
    ...
    FOREIGN KEY (idCaseta) REFERENCES casetas_Plantillas(ID_Caseta)
);
```

### Tabla: Orden_traslados

```sql
CREATE TABLE Orden_traslados (
    ID_orden NVARCHAR(50) PRIMARY KEY,
    ID_clave NVARCHAR(10),          -- Clasificación (A, B, C-2, etc)
    Id_tipo_ruta INT,
    Fecha_traslado DATETIME,
    ...
);
```

### Tabla: Tipo_de_ruta_N (Rutas)

```sql
CREATE TABLE Tipo_de_ruta_N (
    id_Tipo_ruta INT PRIMARY KEY,
    Id_Ruta INT,
    id_origen INT,
    id_destino INT,
    ...
);
```

### Tabla: casetas_Plantillas (Casetas)

```sql
CREATE TABLE casetas_Plantillas (
    ID_Caseta INT PRIMARY KEY,
    Nombre NVARCHAR(100),
    Nombre_IAVE NVARCHAR(100),
    Automovil DECIMAL(10,2),
    Autobus2Ejes DECIMAL(10,2),
    Camion2Ejes DECIMAL(10,2),
    Camion3Ejes DECIMAL(10,2),
    Camion5Ejes DECIMAL(10,2),
    Camion9Ejes DECIMAL(10,2),
    latitud NVARCHAR(20),
    longitud NVARCHAR(20),
    ...
);
```

---

## 🗺️ Mapeo de Claves (ID_clave)

```javascript
const claveToImporteField = {
  'A':      'Automovil',
  'B':      'Autobus2Ejes',
  'C-2':    'Camion2Ejes',
  'C-3':    'Camion3Ejes',
  'C-4':    'Camion3Ejes',    // Aliás para C-3
  'C-5':    'Camion5Ejes',
  'C-9':    'Camion9Ejes'
};
```

Este mapeo permite:
1. Convertir ID_clave (ej: "C-5") a nombre de campo (ej: "Camion5Ejes")
2. Comparar tarifa cobrada vs. tarifa programada
3. Validar clasificación del vehículo

---

## 💡 Casos de Uso

### Caso 1: Consultar aclaraciones pendientes

```javascript
// Frontend - Panel de aclaraciones
const response = await fetch('/api/aclaraciones');
const aclaraciones = await response.json();

const pendientes = aclaraciones.filter(
  a => a.Estatus_Secundario === 'pendiente_aclaracion'
);

pendientes.forEach(acl => {
  console.log(`
    Orden: ${acl.id_orden}
    Diferencia: $${acl.diferencia}
    Caseta: ${acl.Nombre_IAVE}
  `);
});
```

### Caso 2: Resolver aclaración (reembolso)

```javascript
// Frontend - Formulario de resolución
const updateData = {
  noAclaracion: "ACL-2025-001",
  FechaDictamen: new Date().toISOString(),
  estatusSecundario: "aclaracion_levantada",
  observaciones: "Reembolso aprobado - cliente pagó de más",
  dictaminado: true,
  montoDictaminado: 50.00  // Monto a reembolsar
};

const response = await fetch(`/api/aclaraciones/1`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});

const result = await response.json();
console.log(result.message);
```

### Caso 3: Ver aclaraciones de una orden

```javascript
// Frontend - Detalles de orden
const IDOrden = "OT-12345";
const response = await fetch(`/api/aclaraciones/ot/${IDOrden}`);
const aclaraciones = await response.json();

if (aclaraciones.length > 0) {
  const ruta = aclaraciones[0].ruta;
  const totalDiferencia = aclaraciones.reduce(
    (sum, a) => sum + a.diferencia, 0
  );
  
  console.log(`Orden ${IDOrden}: ${ruta}`);
  console.log(`Diferencia total: $${totalDiferencia}`);
  console.log(`Aclaraciones: ${aclaraciones.length}`);
}
```

### Caso 4: Dashboard de estadísticas

```javascript
// Frontend - Dashboard
const response = await fetch('/api/aclaraciones/stats');
const stats = await response.json();
const stat = stats[0];

console.log(`=== ACLARACIONES DEL SISTEMA ===`);
console.log(`Total: ${stat.total_count} aclaraciones`);
console.log(`Monto en disputa: $${stat.total_monto}`);
console.log(`Pendientes: ${stat.pendiente_count}`);
console.log(`A favor del cliente: ${stat.aclaracion_levantada_count}`);
console.log(`Reembolsos adeudados: $${stat.aclaracion_levantada_monto}`);
```

### Caso 5: Auditar diferencias por caseta

```javascript
// Backend - Análisis
const response = await fetch('/api/aclaraciones');
const aclaraciones = await response.json();

// Agrupar por caseta
const porCaseta = {};
aclaraciones.forEach(acl => {
  const caseta = acl.Nombre_IAVE;
  if (!porCaseta[caseta]) {
    porCaseta[caseta] = { count: 0, totalDif: 0 };
  }
  porCaseta[caseta].count++;
  porCaseta[caseta].totalDif += acl.diferencia;
});

// Mostrar casetas con más diferencias
Object.entries(porCaseta)
  .sort((a, b) => Math.abs(b[1].totalDif) - Math.abs(a[1].totalDif))
  .slice(0, 5)
  .forEach(([caseta, data]) => {
    console.log(`${caseta}: ${data.count} aclaraciones, $${data.totalDif}`);
  });
```

---

## 🔄 Flujo de Resolución

```
┌─────────────────────────────────┐
│ 1. Cliente reclama (diferencia) │
│    Sistema registra aclaración  │
└────────────────┬────────────────┘
                 │
┌────────────────▼──────────────────┐
│ 2. Estado: pendiente_aclaracion   │
│    Supervisor investiga           │
│    Revisa tarifas, vehículo, etc  │
└────────────────┬──────────────────┘
                 │
         ┌───────┴──────────┐
         │                  │
    ┌────▼───────────┐  ┌───▼──────────┐
    │ ¿A favor?      │  │ ¿Denegatoria?│
    │ (diferencia > 0)  │ (diferencia ≤ 0)
    └────┬───────────┘  └───┬──────────┘
         │                  │
    ┌────▼─────────────────┐│
    │ aclaracion_levantada ││
    │ (Reembolso)          ││
    └────┬─────────────────┘│
         │                  │
    ┌────▼───────────┐  ┌───▼──────────────┐
    │ Procesar       │  │ dictaminado      │
    │ reembolso      │  │ (Denegada)       │
    │ a cliente      │  └───┬──────────────┘
    └────┬───────────┘      │
         │                  │
    ┌────▼────────────┐  ┌──▼──────────┐
    │ completado      │  │ completado  │
    │ (Reembolsado)   │  │ (Cerrada)   │
    └─────────────────┘  └─────────────┘
```

---

## ⚙️ Funciones Auxiliares Internas

### `getRutaFromOT(id_orden)`
Obtiene ID de tipo de ruta desde una orden de traslado.
- **Entrada:** ID de orden
- **Salida:** ID de tipo de ruta o null

### `getCasetasFromRuta(idRuta)`
Obtiene casetas asociadas a una ruta.
- **Entrada:** ID de ruta
- **Salida:** Array de casetas o null

---

## 🚨 Problemas Conocidos

1. **Cálculo de diferencia inconsistente**: En algunos lugares es `Importe - ImporteOficial`, en otros al revés
2. **Falta de validación de datos** en UpdateAclaracion
3. **No hay control de acceso** (anyone can update)
4. **Campos de moneda sin validación** de rango o decimales

---

## 📈 Mejoras Futuras

1. **Automatización**: Detectar automáticamente aclaraciones basadas en desviaciones
2. **Integración de pagos**: Procesar reembolsos automáticamente
3. **Reportes**: Generar PDF de aclaraciones resueltas
4. **Notificaciones**: Alertar al operador sobre resoluciones
5. **Auditoría**: Registrar cambios de estado con usuario y timestamp
6. **Apelaciones**: Permitir que clientes apelen resoluciones
7. **SLA tracking**: Monitorear tiempo de resolución

---

**Última actualización:** 1/12/2025  
**Versión:** 1.0  
**Estado:** ✅ Producción
