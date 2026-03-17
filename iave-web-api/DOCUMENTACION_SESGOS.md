# Documentación - sesgos.controllers.js

## 📋 Resumen General

El controlador `sesgos.controllers.js` gestiona los **sesgos** (discrepancias o anomalías) detectadas durante el procesamiento de cruces en el sistema IAVE WEB. Un sesgo principal es cuando se encuentra el **cruce sobre una caseta que no se encuentra en la ruta registrada para esa OT**.

Este módulo proporciona herramientas para:
- Identificar y consultar cruces problemáticos
- Analizar rutas que contienen sesgos
- Crear y gestionar reportes/tickets de investigación
- Rastrear el progreso de resolución de sesgos

---

## Conceptos Clave

### ¿Qué es un Sesgo?

Un **sesgo** es una discrepancia o anomalía detectada en un cruce de peaje. El sesgo más común es:

**"CasetaNoEncontradaEnRuta"**: La caseta registrada en el cruce no existe en la lista de casetas de esa ruta.

**Ejemplo:**
```
Cruce:
- OT: OT-12345 (Ruta: Guadalajara → Monterrey)
- Caseta: "Caseta Desconocida"
- Importe: $150

Ruta definida contiene casetas:
- Caseta Sahagún
- Caseta Irapuato
- Caseta Querétaro
- Caseta Monterrey

❌ SESGO: "Caseta Desconocida" no está en la lista anterior
```

### Estados de un Sesgo

Un sesgo/reporte de investigación pasa por estos estados:

```
┌──────────┐   ┌────────────┐   ┌──────────────┐
│ asignado │──▶│ en_proceso │──▶│ finalizado   │
└──────────┘   └────────────┘   └──────────────┘
     ▲              │                    │
     │              │                    │
  Creado      Investigando        Resuelto
```

| Estado | Descripción |
|--------|-------------|
| **asignado** | Sesgo detectado y asignado a un investigador, pero investigación no ha iniciado |
| **en_proceso** | Se está investigando activamente (recopilando información, contactando proveedores, etc.) |
| **finalizado** | Investigación completada y documentada con conclusiones |

---

## 📡 API Endpoints

### 1. **Obtener todos los sesgos** (`getSesgos`)

**Ruta:** `GET /api/sesgos`

Retorna TODOS los cruces con estatus "CasetaNoEncontradaEnRuta" ordenados por más recientes primero.

```bash
# Request
GET /api/sesgos

# Response (200 OK)
[
  {
    "ID": "251125_143045_1234",
    "Tag": "IMDM29083641",
    "No_Economico": "123 Carlos García",
    "Fecha": "2025-11-25T14:30:45.000Z",
    "Caseta": "Caseta Desconocida",
    "Clase": "C-3",
    "Importe": 150.50,
    "Estatus": "CasetaNoEncontradaEnRuta",
    "id_orden": "OT-12345",
    "ImporteOficial": 0,
    "idCaseta": null
  },
  { ... más cruces }
]
```

**Campos Importantes:**
- `ID`: Identificador único del cruce
- `Caseta`: Nombre de la caseta reportada (la problemática)
- `id_orden`: OT asociada (para rastrear la ruta)
- `No_Economico`: Vehículo involucrado
- `Importe`: Cantidad cobrada

---

### 2. **Obtener rutas con sesgos** (`getSesgosPorCasetas`)

**Ruta:** `GET /api/sesgos/por-casetas`

Retorna información detallada de TODAS las rutas que contienen cruces con sesgo.

```bash
# Request
GET /api/sesgos/por-casetas

# Response (200 OK)
[
  {
    "ID_ruta": "1683",
    "id_Tipo_ruta": "756",
    "Categoria": "Nacionales",
    "PoblacionOrigen": "Monterrey",
    "PoblacionDestino": "Guadalajara",
    "RazonOrigen": "One Mali SA de CV",
    "RazonDestino": "Ferromex",
    "Km_reales": 845,
    "Km_oficiales": 848,
    "Km_de_pago": 845,
    "Km_Tabulados": "",
    "peaje_dos_ejes": 1087.00,
    "peaje_tres_ejes": 1087.00,
    "Observaciones": "-",
    "fecha_Alta": "2018-02-22T00:00:00.000Z"
  },
  { ... más rutas }
]
```

**Lógica de Categorización:**

```javascript
// Campos booleanos disponibles
const campos = ['Latinos', 'Nacionales', 'Exportacion', 'Otros', 'Cemex', 'Alterna'];

// Reglas para asignar categoría:
if (1_campo_activo) {
  Categoria = ese_campo;  // ✅ Ej: Categoria = "Latinos"
}
else if (2_campos_activos && includes('Alterna')) {
  Categoria = el_otro_campo;  // ✅ Ej: Categoria = "Nacionales"
}
else {
  Categoria = null;  // ❌ No cumple reglas
}
```

**Ejemplos:**
```
Campo 1: Latinos=true        → Categoria = "Latinos" ✅
Campo 2: Nacionales=true     → Categoria = "Nacionales" ✅
Campo 3: Latinos=true, Alterna=true  → Categoria = "Latinos" ✅
Campo 4: Latinos=true, Nacionales=true → Categoria = null ❌
```

---

### 3. **Obtener sesgos por Orden de Traslado** (`getSesgosByOT`)

**Ruta:** `GET /api/sesgos/orden/:IDOrden`

Retorna todos los reportes/tickets de investigación creados para una OT específica.

```bash
# Request
GET /api/sesgos/orden/OT-12345

# Response (200 OK)
[
  {
    "ID": 1,
    "IDOrden": "OT-12345",
    "Estatus": "en_proceso",
    "Comentarios": "Se identificó que la caseta fue reportada con nombre diferente",
    "FechaCreacion": "2025-11-25T10:00:00.000Z",
    "FechaActualizacion": "2025-11-25T14:30:00.000Z",
    "AsignadoA": "investigador@iave.mx"
  },
  { ... más sesgos }
]
```

**Parámetros:**
- `IDOrden` (path param): ID de la orden de traslado (ej: "OT-12345")

---

### 4. **Obtener estadísticas de sesgos** (`getStats`)

**Ruta:** `GET /api/sesgos/stats`

Retorna conteos totales de sesgos clasificados por estado.

```bash
# Request
GET /api/sesgos/stats

# Response (200 OK)
[
  {
    "asignados": 15,
    "en_proceso": 28,
    "finalizados": 127
  }
]
```

**Interpretación:**
- 15 sesgos esperando investigación
- 28 sesgos siendo investigados activamente
- 127 sesgos ya resueltos

---

### 5. **Actualizar sesgo** (`UpdateSesgo`)

**Ruta:** `PUT /api/sesgos/:id`

Actualiza el estado y comentarios de un sesgo específico.

```bash
# Request
PUT /api/sesgos/5
Content-Type: application/json

{
  "Estatus": "en_proceso",
  "Comentarios": "Se inició investigación. La caseta fue identificada como 'Caseta Sahagún' reportada con nombre alternativo"
}

# Response (204 No Content)
(Sin body)
```

**Transiciones de Estado Válidas:**

```
asignado ──▶ en_proceso ──▶ finalizado
   ▲            │              │
   └────────────┴──────────────┘
         (Posibles retrocesos)
```

**Ejemplos de Comentarios:**

```javascript
// Asignación
{
  "Estatus": "asignado",
  "Comentarios": "Sesgo asignado a Carlos para investigación"
}

// En Investigación
{
  "Estatus": "en_proceso",
  "Comentarios": "Contactando con operador del vehículo para confirmar caseta"
}

// Finalizado
{
  "Estatus": "finalizado",
  "Comentarios": "HALLAZGO: La caseta reportada era en realidad 'Caseta Sahagún'. El sistema debe actualizar el nombre de la caseta en la BD."
}
```

---

## 🔄 Flujo de Gestión de Sesgos

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. IMPORTACIÓN DE CRUCES                                         │
│    (En cruces.controllers.js)                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Caseta en   │
                    │ ruta?       │
                    └──────┬──────┘
                    ┌──────┴──────┐
                    │ NO          │ SÍ
            ┌───────▼────────┐    │
            │ Estatus =      │    │
            │ "CasetaNo...   │    └───▶ Estatus = "Confirmado"
            │ EnRuta"        │
            └───────┬────────┘
                    │
         ┌──────────▼──────────┐
         │ 2. CONSULTA DE      │
         │    SESGOS           │
         │ getSesgos()         │
         │ getSesgosPorCasetas()
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 3. CREACIÓN DE      │
         │    REPORTE          │
         │ INSERT INTO Sesgos  │
         │ Estatus = asignado  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 4. ASIGNACIÓN A     │
         │    INVESTIGADOR     │
         │ UPDATE Sesgos       │
         │ Estatus = asignado  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 5. INVESTIGACIÓN    │
         │    ACTIVA           │
         │ UpdateSesgo()       │
         │ Estatus = en_proceso│
         │ Comentarios = ...   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 6. RESOLUCIÓN       │
         │ UpdateSesgo()       │
         │ Estatus = finalizado│
         │ Comentarios = HALL. │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 7. ACTUALIZACIÓN DE │
         │    DATOS MAESTROS   │
         │ (Casetas_Plantillas)│
         │ (Control_Tags)      │
         └─────────────────────┘
```

---

## 📊 Tabla de Datos: Sesgos

```sql
CREATE TABLE Sesgos (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    IDOrden NVARCHAR(50),                    -- OT asociada (FK)
    IDCruce NVARCHAR(50),                    -- Cruce con sesgo (FK)
    Estatus NVARCHAR(50),                    -- asignado, en_proceso, finalizado
    Comentarios NVARCHAR(MAX),               -- Observaciones de investigación
    FechaCreacion DATETIME DEFAULT GETDATE(),-- Cuándo se creó
    FechaActualizacion DATETIME DEFAULT GETDATE(),
    AsignadoA NVARCHAR(100),                 -- Email del investigador
    
    FOREIGN KEY (IDOrden) REFERENCES Orden_traslados(ID_orden),
    FOREIGN KEY (IDCruce) REFERENCES Cruces(ID)
);
```

---

## 💡 Casos de Uso

### Caso 1: Identificar todas las rutas problemáticas

```javascript
// Frontend
const response = await fetch('/api/sesgos/por-casetas');
const rutasProblematicas = await response.json();

// Resultado: Lista de rutas con sesgos
// Útil para: Reportes ejecutivos, análisis de calidad
```

### Caso 2: Consultar sesgos de una OT específica

```javascript
// Frontend
const response = await fetch('/api/sesgos/orden/OT-12345');
const sesgosOT = await response.json();

// Resultado: Todos los reportes de investigación para esa OT
// Útil para: Panel de control de OT
```

### Caso 3: Actualizar progreso de investigación

```javascript
// Frontend
const response = await fetch('/api/sesgos/5', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    Estatus: 'en_proceso',
    Comentarios: 'Contactando operador del vehículo ABC-123'
  })
});

// Resultado: Sesgo actualizado
// Útil para: Rastrear progreso en tiempo real
```

### Caso 4: Generar estadísticas para dashboard

```javascript
// Frontend
const response = await fetch('/api/sesgos/stats');
const stats = await response.json();

// Resultado:
// - Total asignados: 15
// - Total en proceso: 28
// - Total finalizados: 127

// Útil para: Dashboard ejecutivo, alertas de carga de trabajo
```

---

## 🔍 Ejemplos Prácticos

### Escenario Completo: Investigación de Sesgo

```
1️⃣ DETECCIÓN
   Cruce: 251125_143045_1234
   - OT: OT-12345 (Ruta: Guadalajara → Monterrey)
   - Caseta reportada: "Caseta Desconocida"
   - Importe: $150
   - Estatus: CasetaNoEncontradaEnRuta

2️⃣ CONSULTA
   GET /api/sesgos
   →  Encontrado el cruce problemático

3️⃣ ANÁLISIS DE RUTA
   GET /api/sesgos/por-casetas
   →  Ruta contiene: [Caseta Sahagún, Caseta Irapuato, ...]
   →  "Caseta Desconocida" NO está en lista

4️⃣ CREACIÓN DE REPORTE
   INSERT INTO Sesgos
   Estatus = 'asignado'
   ID = 42

5️⃣ ASIGNACIÓN
   PUT /api/sesgos/42
   {
     "Estatus": "asignado",
     "Comentarios": "Asignado a Carlos García para investigación"
   }

6️⃣ INVESTIGACIÓN
   PUT /api/sesgos/42
   {
     "Estatus": "en_proceso",
     "Comentarios": "Contactado conductor. Confirma que entró a Caseta Sahagún."
   }

7️⃣ RESOLUCIÓN
   PUT /api/sesgos/42
   {
     "Estatus": "finalizado",
     "Comentarios": "HALLAZGO: La caseta reportada era 'Caseta Sahagún'. Recomendación: Actualizar datos de localización y alias en tabla Casetas_Plantillas"
   }

8️⃣ ACTUALIZACIÓN DE DATOS
   UPDATE Casetas_Plantillas
   SET Alias_Alternos = 'Caseta Desconocida'
   WHERE Nombre_IAVE = 'Caseta Sahagún'
```

---

## 📋 Matriz de Categorías de Ruta

Las rutas se clasifican según campos booleanos:

| Configuración | Categoría | Ejemplo |
|---------------|-----------|---------|
| Latinos=true | Latinos | Rutas Latinoamericanas |
| Nacionales=true | Nacionales | Rutas Nacionales Mexicanas |
| Exportacion=true | Exportacion | Rutas de Exportación |
| Otros=true | Otros | Rutas Especiales |
| Cemex=true | Cemex | Rutas de Cemex |
| Alterna=true (solo) | null | No clasificada |
| Latinos=true + Alterna=true | Latinos | Ruta Latina (alternativa) |
| Otros=true + Alterna=true | Otros | Ruta Especial (alternativa) |
| Latinos=true + Nacionales=true | null | Ambigua (no válida) |

---

## ⚙️ Funciones Auxiliares

### `normalize(nombre)`

Normaliza nombres de casetas para comparaciones exactas.

```javascript
normalize("Caseta-Sólo")      // "CASETA SOLO"
normalize("Café México")      // "CAFE MEXICO"
normalize("Peaje. Irapuato")  // "PEAJE IRAPUATO"
```

**Transformaciones:**
- Convertir a mayúsculas
- Remover puntos y guiones
- Remover acentos (Á→A, É→E, etc.)
- Remover espacios extra

---

## 🚨 Errores Comunes

### Error 1: Intentar obtener sesgos de OT inexistente
```bash
GET /api/sesgos/orden/OT-99999

# Response: 200 OK
[]  # Array vacío (no error)
```

### Error 2: Actualizar sesgo con Estatus inválido
```bash
PUT /api/sesgos/5
{
  "Estatus": "completado"  # ❌ Debe ser: finalizado
}

# Response: 500
{ "error": "..." }
```

### Error 3: Categoría NULL después de `getSesgosPorCasetas`
```javascript
// Si una ruta tiene Categoria = null significa:
// - Tiene más de un campo booleano activo SIN ser + Alterna
// - O tiene solo Alterna sin otros campos
// → La ruta no cumple los criterios de clasificación
```

---

## 📈 Métricas Útiles

```javascript
// Calcular % de sesgos resueltos
const stats = await fetch('/api/sesgos/stats').then(r => r.json());
const total = stats.asignados + stats.en_proceso + stats.finalizados;
const resueltos_pct = (stats.finalizados / total) * 100;

// Calcular carga de trabajo
const en_investigacion = stats.en_proceso;
const promedio_investigadores = 3;
const carga_por_investigador = en_investigacion / promedio_investigadores;
```

---

## 🔗 Relaciones con Otros Controladores

### Dependencias
- **cruces.controllers.js**: Los sesgos se originan en cruces con estatus "CasetaNoEncontradaEnRuta"
- **Tabla: Cruces** (origen de datos)
- **Tabla: Sesgos** (destino de datos)

### Interdependencias
- `getSesgos()` → Consulta tabla `Cruces`
- `getSesgosPorCasetas()` → Consulta tablas `Tipo_de_ruta_N`, `Poblaciones`, `Directorio`
- `getSesgosByOT()` → Consulta tabla `Sesgos`
- `UpdateSesgo()` → Actualiza tabla `Sesgos`

---

## 📞 Soporte

Para reportes de bugs o solicitudes de funcionalidades:
- 📧 Email: alan.amador@atmexicana.com.mx
- 🐛 GitHub Issues: [\[enlace al repo\]](https://github.com/alanamador99/IAVE-WEB/issues)

---

**Última actualización:** 26/11/2025  
**Versión:** 1.0  
**Estado:** Producción
