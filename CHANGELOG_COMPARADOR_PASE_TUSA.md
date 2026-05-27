# 🔧 Cambios Implementados - Comparador PASE vs TUSA

## Fecha: 2026-05-23

### 📝 Resumen

Se ha integrado una nueva funcionalidad completa en `TagsTable.jsx` que permite:

1. ✅ **Carga de archivos JSON** de PASE
2. ✅ **Comparación automática** de estados entre PASE y TUSA
3. ✅ **Visualización de discrepancias** en modal interactivo
4. ✅ **Exportación a CSV** para análisis offline

---

## 📂 Archivos Modificados

### `iave-web/src/components/tags/TagsTable.jsx`

**Cambios realizados:**

#### 1. **Nuevos Estados (States)**
```javascript
const [paseData, setPaseData] = useState(null);           // Almacena JSON de PASE
const [discrepancias, setDiscrepancias] = useState([]);   // Lista de discrepancias
const [loadingComparison, setLoadingComparison] = useState(false); // Estado de carga
const [showComparisonModal, setShowComparisonModal] = useState(false); // Modal
```

#### 2. **Nuevas Funciones**

**`handleLoadPaseJSON(event)`**
- Lee el archivo JSON seleccionado
- Parsea y valida el contenido
- Llama automáticamente a `compararDatos()`

**`compararDatos(paseContent)`**
- Compara cada TAG de PASE con los de TUSA
- Detecta diferencias de estado (activo/inactivo)
- Identifica TAGs en PASE que no existen en TUSA
- Genera lista de discrepancias con detalles

**`generarCSVDiscrepancias()`**
- Crea un CSV con los datos de discrepancias
- Incluye 9 columnas de información relevante
- Escapa caracteres especiales correctamente

**`descargarCSV(csv)`**
- Genera un blob del CSV
- Descarga automáticamente el archivo
- Nombre: `discrepancias_tags_YYYY-MM-DD_HH-mm-ss.csv`

**`generarResponsiva(tag)`** (Movida dentro del componente)
- Función existente, ahora dentro del componente para mejor mantenibilidad

#### 3. **Nuevo Botón en UI**
```jsx
<label htmlFor="paseJsonInput" className="btn btn-sm btn-outline-info rounded-3 m-0">
  📄 Cargar JSON PASE
</label>
<input id="paseJsonInput" type="file" accept=".json" onChange={handleLoadPaseJSON} style={{ display: 'none' }} />
```
- Botón estilizado con Bootstrap
- Acepta solo archivos `.json`
- Ubicado junto al botón de reset de filtros

#### 4. **Nuevo Modal de Comparación**
```jsx
<Modal show={showComparisonModal} size="xl">
  {/* Tabla interactiva con discrepancias */}
  {/* Resumen de hallazgos */}
  {/* Botón de descarga CSV */}
</Modal>
```

**Características del Modal:**
- Muestra 8 columnas de información
- Codificación de colores (azul para diferencias, amarillo para no encontrados)
- Tabla scrolleable (máximo 70vh de altura)
- Botón de descarga cuando hay discrepancias
- Mensaje de éxito si está sincronizado

#### 5. **Estructura de Datos de Discrepancia**
```javascript
{
  id: "IMDM30992039..",
  prefijo: "IMDM",
  numero: 30992039,
  statusPase: "ACTIVO" | "INACTIVO",
  statusTusa: "Activo" | "Inactivo" | "NO ENCONTRADO EN TUSA",
  clase: "Autobús / Camión de 2 ejes",
  tipo: "PORTATIL IMDM PASE",
  observaciones: "Sin observaciones",
  saldo: 0,
  domiciliado: false,
  regionalizado: true
}
```

---

## 🎨 UI/UX

### Nuevo Botón
- **Posición**: Sección de filtros (derecha)
- **Estilo**: Outline info con color azul
- **Icono**: 📄
- **Interacción**: Click abre selector de archivos

### Modal de Comparación
- **Tamaño**: Extra Large (xl)
- **Header**: Título descriptivo "🔍 Comparación de TAGs: PASE vs TUSA"
- **Body**: 
  - Resumen de discrepancias encontradas
  - Tabla responsive con datos detallados
  - Coding de colores por tipo de discrepancia
- **Footer**:
  - Botón "Cerrar"
  - Botón "Descargar CSV" (solo si hay discrepancias)

### Tabla de Discrepancias
| Columna | Contenido |
|---------|-----------|
| TAG (ID) | Identificador del TAG |
| Estado PASE | Badge ACTIVO (verde) / INACTIVO (gris) |
| Estado TUSA | Badge con color según estado |
| Clase | Clasificación del vehículo |
| Tipo Físico | Tipo de TAG |
| Saldo | Saldo en formato moneda |
| Domiciliado | ✓ o - |
| Observaciones | Texto de hasta 200px |

---

## 🔍 Lógica de Comparación

```
Para cada TAG en PASE:
  1. Buscar en TUSA por Dispositivo (ID)
  2. Si NO existe → Agregar como "NO ENCONTRADO EN TUSA"
  3. Si existe:
     - Comparar: paseTag.activo === (tusaTag.Estatus_Secundario === 'activo')
     - Si ≠ → Agregar a discrepancias
     - Si = → Ignorar (sincronizado)
```

---

## 📦 Dependencias

No se agregaron nuevas dependencias. Se usa:
- `React` (useState, useEffect)
- `axios` (existente)
- `dayjs` (existente)
- `react-bootstrap` (Modal, Button - existente)
- API Nativa (Fetch, Blob, FileReader)

---

## ✅ Validaciones Implementadas

✓ Verificar que el JSON sea válido
✓ Validar que contenga un array "content"
✓ Manejar archivos tanto con "content" como arrays directos
✓ Validar que los datos de TUSA existan antes de comparar
✓ Escape de caracteres especiales en CSV

---

## 🧪 Casos de Uso Probados

1. ✅ Carga de JSON válido con discrepancias
2. ✅ JSON válido sin discrepancias
3. ✅ TAG en PASE que no existe en TUSA
4. ✅ Diferencia de estados activo/inactivo
5. ✅ Exportación a CSV
6. ✅ Lectura de archivos grandes (1000+ registros)

---

## 📊 Ejemplo de Salida CSV

```
TAG (ID),Número,Estado PASE,Estado TUSA,Clase,Tipo Físico,Saldo,Domiciliado,Observaciones
IMDM30992039..,30992039,ACTIVO,INACTIVO,2,PORTATIL IMDM PASE,0.00,No,"Sin observaciones"
IMDM30992038..,30992038,INACTIVO,Activo,2,PORTATIL IMDM PASE,125.50,Sí,"Problemas reportados"
```

---

## 🔐 Consideraciones de Seguridad

- ✓ El archivo JSON se procesa localmente (no se envía a servidor)
- ✓ No se ejecuta código JavaScript del archivo
- ✓ Validación de estructura antes de procesar
- ✓ Los datos originales no se modifican

---

## 🚀 Próximas Mejoras Sugeridas

- [ ] Agregar filtro por "Estado" en el modal de comparación
- [ ] Opción de "auto-sync" para actualizar estados en TUSA
- [ ] Historial de comparaciones realizadas
- [ ] Notificación por correo de discrepancias críticas
- [ ] API endpoint para cargar directamente de PASE (sin JSON manual)
- [ ] Gráficos de tendencia de sincronización

---

## 📖 Documentación

Consulta `COMPARADOR_PASE_TUSA.md` para guía de usuario completa.

## 🔗 Ubicación del Componente

`iave-web/src/components/tags/TagsTable.jsx`

---

**Desarrollo completado**: 2026-05-23
**Estado**: ✅ Listo para Producción
