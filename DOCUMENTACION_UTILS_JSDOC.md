# Documentación JSDoc - utils.jsx

## Resumen General

El archivo `utils.jsx` es un módulo de utilidades compartidas que contiene:
- **3 Componentes de UI**: CopiarTag, CopiarFecha, CasetaMapModal, CustomToast, RouteOption, ModalSelector
- **6 Funciones de Formateo**: formatearFecha, formatearFechaConHora, formatearNombre, formatearDinero, formatearEnteros, formatearRazonesSociales
- **2 Funciones Auxiliares**: parsearMinutos, configuración de Leaflet

---

## Tabla de Referencia Rápida

### Componentes

| Componente | Props | Retorna | Uso |
|-----------|-------|---------|-----|
| `CopiarTag` | `cruceSeleccionado: {Tag}` | JSX | Copiar TAG al portapapeles |
| `CopiarFecha` | `cruceSeleccionado: {Fecha}` | JSX | Copiar fecha al portapapeles |
| `CasetaMapModal` | `isOpen, onClose, nombreCaseta, lat, lng` | JSX | Modal con mapa de caseta |
| `CustomToast` | `titulo, mensaje, mostrar, color, tiempo` | JSX | Notificación emergente |
| `RouteOption` | `tipo, distance, time, costs, advertencias, color` | JSX | Tarjeta de opción de ruta |
| `ModalSelector` | `isOpen, onClose, onSelect, valorCampo, valoresSugeridos, titulo, campo` | JSX | Modal con dropdown |

### Funciones de Formateo

| Función | Entrada | Salida | Ejemplo |
|---------|---------|--------|---------|
| `formatearFecha` | `"2025-12-01"` | `string` | `"01-Dic-2025"` |
| `formatearFechaConHora` | `"2025-12-01T14:30:45"` | `string` | `"01-Dic-2025 a las 14:30:45"` |
| `formatearNombre` | `{Nombres, Ap_paterno, Ap_materno}` | `string` | `"Carlos García López"` |
| `formatearDinero` | `1234.5` | `string` | `"1,234.50"` |
| `formatearEnteros` | `1000000` | `string` | `"1,000,000"` |
| `formatearRazonesSociales` | `"Empresa S.A. de C.V."` | `string` | `"Empresa"` |

### Funciones Auxiliares

| Función | Entrada | Salida | Ejemplo |
|---------|---------|--------|---------|
| `parsearMinutos` | `1505` | `string` | `"1 día, 1 h, 5 min"` |

---

## Ejemplos de Uso

### 1. Copiar TAG al portapapeles
```jsx
import { CopiarTag } from './shared/utils';

export default function MiComponente() {
  const cruce = { Tag: 'ABC123456789' };
  
  return (
    <div>
      <span>TAG: {cruce.Tag}</span>
      <CopiarTag cruceSeleccionado={cruce} />
    </div>
  );
}
```

### 2. Mostrar notificación Toast
```jsx
import { CustomToast } from './shared/utils';
import { useState } from 'react';

export default function MiComponente() {
  const [showToast, setShowToast] = useState(false);
  
  const guardar = () => {
    // lógica de guardado
    setShowToast(true);
  };
  
  return (
    <>
      <button onClick={guardar}>Guardar</button>
      <CustomToast
        titulo="Éxito"
        mensaje="Datos guardados correctamente"
        mostrar={showToast}
        color="text-success"
        tiempo={3000}
      />
    </>
  );
}
```

### 3. Formatear dinero
```jsx
import { formatearDinero } from './shared/utils';

export default function MiComponente() {
  const importe = 1234.56;
  
  return <p>Total: ${formatearDinero(importe)}</p>;
  // Renderiza: Total: $1,234.56
}
```

### 4. Formatear fecha
```jsx
import { formatearFecha, formatearFechaConHora } from './shared/utils';

export default function MiComponente() {
  const fecha = "2025-12-01T14:30:45";
  
  return (
    <div>
      <p>Fecha: {formatearFecha(fecha)}</p>
      {/* Fecha: 01-Dic-2025 */}
      
      <p>Con hora: {formatearFechaConHora(fecha)}</p>
      {/* Con hora: 01-Dic-2025 a las 14:30:45 */}
    </div>
  );
}
```

### 5. Mostrar mapa de caseta
```jsx
import { CasetaMapModal } from './shared/utils';
import { useState } from 'react';

export default function MiComponente() {
  const [mapOpen, setMapOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setMapOpen(true)}>Ver en mapa</button>
      <CasetaMapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        nombreCaseta="Caseta Tlanalapa"
        lat={20.3456}
        lng={-99.1234}
      />
    </>
  );
}
```

### 6. Modal selector de rutas
```jsx
import { ModalSelector } from './shared/utils';
import { useState } from 'react';

export default function MiComponente() {
  const [modalOpen, setModalOpen] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  
  const rutas = [
    {
      id_Tipo_ruta: "1",
      RazonOrigen: "Transportes ACME S.A. de C.V.",
      RazonDestino: "Logística XYZ S.A. de C.V.",
      Categoria: "Latinos"
    }
  ];
  
  return (
    <>
      <button onClick={() => setModalOpen(true)}>Seleccionar ruta</button>
      <ModalSelector
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(ruta) => {
          setRutaSeleccionada(ruta);
          setModalOpen(false);
        }}
        valorCampo="Guadalajara"
        valoresSugeridos={rutas}
        titulo="Seleccionar Ruta"
        campo="Origen"
        tituloDelSelect="Rutas disponibles"
      />
    </>
  );
}
```

### 7. Parsear minutos a formato legible
```jsx
import { parsearMinutos } from './shared/utils';

export default function MiComponente() {
  const duracion = 1505; // minutos
  
  return <p>Duración: {parsearMinutos(duracion)}</p>;
  // Renderiza: Duración: 1 día, 1 h, 5 min
}
```

### 8. Opción de ruta
```jsx
import { RouteOption } from './shared/utils';

export default function MiComponente() {
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <RouteOption
        tipo="Óptima"
        distance="850"
        time="12 h, 30 min"
        distanceUnit=" KM"
        costs={{ label: "Peaje", value: "450.00" }}
        advertencias="Incluye 3 casetas"
        color="green"
      />
      <RouteOption
        tipo="Libre"
        distance="920"
        time="14 h"
        distanceUnit=" KM"
        costs={{ label: "Peaje", value: "Sin costo" }}
        color="orange"
      />
    </div>
  );
}
```

---

## Casos de Uso Comunes

### Mostrar información de operador con nombre formateado
```jsx
import { formatearNombre } from './shared/utils';

const operador = {
  Nombres: "Carlos",
  Ap_paterno: "García",
  Ap_materno: "López"
};

console.log(formatearNombre(operador));
// "Carlos García López"
```

### Formatear razón social para dropdown
```jsx
import { formatearRazonesSociales } from './shared/utils';

const options = [
  "Transportes ACME S.A. de C.V.",
  "Logística XYZ SA de CV",
  "Distribuidora ABC S.A. de C.V."
];

options.forEach(opt => {
  console.log(formatearRazonesSociales(opt));
});
// "Transportes ACME"
// "Logística XYZ"
// "Distribuidora ABC"
```

### Mostrar múltiples formatos de fecha
```jsx
import { formatearFecha, formatearFechaConHora } from './shared/utils';

const evento = "2025-12-15T10:30:45";

console.log(`Fecha: ${formatearFecha(evento)}`);
// "Fecha: 15-Dic-2025"

console.log(`Evento: ${formatearFechaConHora(evento)}`);
// "Evento: 15-Dic-2025 a las 10:30:45"
```

---

## Notas Importantes

### JSDoc Tags Utilizados
- `@fileoverview`: Descripción del archivo
- `@module`: Nombre del módulo
- `@component`: Indica que es componente React
- `@function`: Función JavaScript
- `@param`: Parámetro
- `@returns`: Valor retornado
- `@example`: Ejemplo de uso
- `@description`: Descripción detallada
- `@requires`: Dependencias
- `@exports`: Lo que se exporta

### Patrones de Validación
Todas las funciones de formateo validan entrada:
```javascript
if (!valor) return '';
```

### Configuración de Leaflet
El módulo configura automáticamente iconos de Leaflet:
```javascript
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({...});
```
Esto es necesario porque webpack/vite no carga las imágenes automáticamente.

### Estados Controlados
Los componentes usan hooks de React para estado:
- `CopiarTag` y `CopiarFecha`: State para mostrar confirmación
- `ModalSelector`: State para valor seleccionado
- `CustomToast`: State para controlar visibilidad

---

## Integración con Bootstrap

Todos los estilos utilizan:
- **Bootstrap 4/5**: Clases CSS estándar
- **SB Admin 2**: Tema admin personalizado
- **Colores**: Primario (#4e73df), Success (rgb(40, 167, 69)), etc.

---

## Performance

### Optimizaciones Implementadas
1. **Debouncing**: No usado en este archivo (ver Route-Creator)
2. **Memoización**: No aplicada (componentes son simples)
3. **Regex Compiladas**: `/\B(?=(\d{3})+(?!\d))/g` para formateo

### Recomendaciones Futuras
```javascript
// Considerar React.memo para componentes que reciben props estáticas
export const CopiarTag = React.memo(CopiarTagComponent);

// O usar useMemo para funciones de formateo si se llaman frecuentemente
const memoFecha = useMemo(() => formatearFecha(fecha), [fecha]);
```

---

**Documento generado**: Diciembre 2025  
**Versión**: 1.0  
**Estándar**: JSDoc 3.x  
**Framework**: React 18.2.0  
**UI Framework**: Bootstrap 5 / SB Admin 2
