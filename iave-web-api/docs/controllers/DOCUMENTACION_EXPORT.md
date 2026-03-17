# Documentación - exportController.js

## 📋 Resumen General

El controlador `exportController.js` gestiona la **generación y exportación de documentos** en el sistema IAVE. Actualmente se enfoca en la generación de responsivas legales de asignación de TAGs, pero está diseñado para extensiones futuras con más tipos de reportes y exportaciones.

**Funcionalidades principales:**
- Generar responsivas de asignación de TAGs (documentos Excel legalizados)
- Completar automáticamente campos en plantillas
- Descargar documentos formateados
- Extensible a otros tipos de exportación (reportes, auditorías, etc)

---

## 📄 ¿Qué es una Responsiva?

Una **responsiva** es:
- **Documento legal**: Formaliza la asignación de un TAG a un operador
- **Responsabilidad**: El operador asume custodia del dispositivo
- **Obligaciones**: Detalla cuidados, procedimientos en caso de daño/pérdida
- **Términos legales**: Incluye cláusulas de responsabilidad
- **Firmable**: Espacio para firmas del operador y testigos
- **Archivo**: Se mantiene copia para auditoría

**Contenido de la responsiva:**
```
┌────────────────────────────────────┐
│ RESPONSIVA DE ASIGNACIÓN DE TAG    │
├────────────────────────────────────┤
│ Número de Dispositivo: [E5]        │
│ (Identificador único del TAG)      │
│                                    │
│ TÉRMINOS Y CONDICIONES             │
│ - Custodia responsable             │
│ - Procedimientos de daño/pérdida   │
│ - Obligaciones operacionales       │
│                                    │
│ Operador: [B33]                    │
│ (Nombre completo)                  │
│                                    │
│ Matrícula: [B38]                   │
│ (Identificación operador)          │
│                                    │
│ Lugar y Fecha: [B21]               │
│ (Formato: Ciudad Fecha DD/MM/YYYY) │
│                                    │
│ FIRMAS:                            │
│ Operador:      ___________         │
│ Testigo:       ___________         │
│ Supervisor:    ___________         │
└────────────────────────────────────┘
```

---

## 📡 API Endpoints

### 1. **Generar Responsiva de TAG** (`generarResponsivaDesdePlantilla`)

**Ruta:** `POST /api/export/responsiva-tag`

Genera un documento Excel con la responsiva de asignación de TAG.

```bash
# Request
POST /api/export/responsiva-tag
Content-Type: application/json

{
  "nombre": "Carlos García López",
  "matricula": "123",
  "numeroDispositivo": "IMDM29083641",
  "fechaAsignacion": "2025-12-01"
}

# Response (200 OK)
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename=Responsiva_TAG_IMDM29083641.xlsx

[Archivo Excel descargado con campos rellenados]
```

**Parámetros del body:**
- `nombre` (string, requerido): Nombre completo del operador
- `matricula` (string, requerido): Matrícula/ID del operador
- `numeroDispositivo` (string, requerido): Número de serie del TAG
- `fechaAsignacion` (string, requerido): Fecha ISO (ej: "2025-12-01")

**Campos rellenados en la plantilla:**
| Celda | Campo | Ejemplo |
|-------|-------|---------|
| **B33** | Nombre completo | Carlos García López |
| **B38** | Matrícula | 123 |
| **E5** | Número TAG | IMDM29083641 |
| **B21** | Fecha y lugar | Tlanalapa Hidalgo 01/12/2025 |

**Formato de fecha:**
- Entrada: ISO (2025-12-01)
- Proceso: Conversión con dayjs
- Salida: "Tlanalapa Hidalgo 01/12/2025"

**Descarga:**
- Nombre: `Responsiva_TAG_{numeroDispositivo}.xlsx`
- Formato: Excel moderno (.xlsx)
- Tipo MIME: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## 📂 Estructura de Archivos

### Plantilla Excel

**Ubicación:** `/plantillas/ResponsivaTags.xlsx`

**Estructura esperada:**
```
ResponsivaTags.xlsx
├── Hoja 1 (Responsiva)
│   ├── B21: Lugar y Fecha
│   ├── E5: Número Dispositivo
│   ├── B33: Nombre Operador
│   ├── B38: Matrícula
│   └── Contenido legal/términos (estático)
```

**Requisitos:**
- Archivo debe existir en ruta especificada
- Debe ser formato Excel 2007+ (.xlsx)
- Debe tener al menos 1 hoja
- Celdas B21, E5, B33, B38 deben estar disponibles

---

## 💡 Casos de Uso

### Caso 1: Generar responsiva para nueva asignación

```javascript
// Frontend - Formulario de asignación
const formData = {
  nombre: "Carlos García López",
  matricula: "123",
  numeroDispositivo: "IMDM29083641",
  fechaAsignacion: "2025-12-01"
};

const response = await fetch('/api/export/responsiva-tag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

// Descargar automáticamente
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `Responsiva_TAG_${formData.numeroDispositivo}.xlsx`;
a.click();
window.URL.revokeObjectURL(url);
```

### Caso 2: Generar responsiva desde modal

```javascript
// Frontend - Modal de asignación
async function generarResponsiva() {
  const operador = {
    nombre: document.getElementById('nombre').value,
    matricula: document.getElementById('matricula').value,
    numeroDispositivo: document.getElementById('numeroDispositivo').value,
    fechaAsignacion: new Date().toISOString().split('T')[0]
  };

  try {
    const response = await fetch('/api/export/responsiva-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operador)
    });

    if (response.ok) {
      const blob = await response.blob();
      // Descargar o abrir en nueva ventana
      window.open(window.URL.createObjectURL(blob));
    } else {
      alert('Error al generar responsiva');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Caso 3: Generar múltiples responsivas (lote)

```javascript
// Backend - Procesar lote
async function generarResponsivasLote(operadores) {
  const responsivas = [];

  for (const operador of operadores) {
    try {
      const response = await fetch('/api/export/responsiva-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: operador.nombre,
          matricula: operador.matricula,
          numeroDispositivo: operador.numeroDispositivo,
          fechaAsignacion: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        responsivas.push({
          operador: operador.nombre,
          status: 'generada'
        });
      }
    } catch (error) {
      responsivas.push({
        operador: operador.nombre,
        status: 'error',
        error: error.message
      });
    }
  }

  return responsivas;
}
```

---

## 🔧 Detalles Técnicos

### Librerías Utilizadas

#### ExcelJS
```javascript
import { Workbook } from 'exceljs';

const workbook = new Workbook();
await workbook.xlsx.readFile(rutaPlantilla);
const worksheet = workbook.getWorksheet(1);
worksheet.getCell('B33').value = 'Nuevo valor';
await workbook.xlsx.write(res);
```

**Características:**
- Lectura/escritura de archivos Excel
- Manipulación de celdas individual
- Preserva formato de plantilla
- Streaming directo a respuesta HTTP

#### dayjs
```javascript
import dayjs from 'dayjs';

const fecha = dayjs('2025-12-01').format('DD/MM/YYYY');
// Resultado: "01/12/2025"
```

**Características:**
- Formateo de fechas
- Manejo de timezones
- Alternativa ligera a moment.js

---

## 📋 Plantilla ResponsivaTags.xlsx

### Estructura esperada

La plantilla es un documento Excel preformateado que incluye:

1. **Encabezado** (fijo)
   - Título: "RESPONSIVA DE ASIGNACIÓN DE TAG"
   - Logo de IAVE (si aplica)

2. **Sección de datos** (campos a rellenar)
   - E5: Número de dispositivo
   - B33: Nombre operador
   - B38: Matrícula
   - B21: Lugar y fecha

3. **Términos y condiciones** (contenido legal)
   - Responsabilidades del operador
   - Procedimientos ante daño
   - Procedimientos ante pérdida
   - Obligaciones operacionales
   - Clausulas de responsabilidad

4. **Sección de firmas** (fijo)
   - Línea para firma del operador
   - Línea para testigo
   - Línea para supervisor

### Creación de plantilla (si no existe)

```javascript
// Script para crear plantilla desde cero
import { Workbook } from 'exceljs';

const crearPlantilla = async () => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Responsiva');

  // Encabezado
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'RESPONSIVA DE ASIGNACIÓN DE TAG';
  worksheet.getCell('A1').font = { bold: true, size: 14 };

  // Campos
  worksheet.getCell('B21').value = ''; // Lugar y fecha
  worksheet.getCell('E5').value = '';  // Número TAG
  worksheet.getCell('B33').value = ''; // Nombre
  worksheet.getCell('B38').value = ''; // Matrícula

  // Términos (insertar contenido legal aquí)
  worksheet.getCell('A5').value = 'Términos y Condiciones:';
  
  // Firmas
  worksheet.getCell('A45').value = 'Operador: _______________';
  worksheet.getCell('A47').value = 'Testigo: _______________';
  worksheet.getCell('A49').value = 'Supervisor: _______________';

  await workbook.xlsx.writeFile('ResponsivaTags.xlsx');
};
```

---

## ⚠️ Manejo de Errores

### Error: Plantilla no encontrada

```
Error: ENOENT: no such file or directory, open '...ResponsivaTags.xlsx'
Causa: Ruta de plantilla incorrecta o archivo no existe
Solución: Verificar ubicación: /plantillas/ResponsivaTags.xlsx
```

### Error: Campo no existe en plantilla

```
Error: Cell reference not valid
Causa: Celda especificada no existe (ej: AA999)
Solución: Verificar nombres de celdas (B21, E5, B33, B38)
```

### Error: Permiso denegado

```
Error: EACCES: permission denied
Causa: Sin permisos para leer plantilla o escribir respuesta
Solución: Verificar permisos de carpeta /plantillas
```

---

## 🔐 Consideraciones de Seguridad

1. **Validación de entrada**: Se recomienda validar datos antes de procesar
2. **Límite de tamaño**: Plantilla Excel no debe ser muy grande
3. **Acceso a archivos**: Plantilla debe estar en ruta segura
4. **Tiempo de respuesta**: Generar Excel es operación rápida (<1s usualmente)

---

## 📈 Mejoras Futuras

1. **Exportar reportes de abusos** a Excel con formato
2. **Exportar estadísticas** con gráficos
3. **Generar actas** de cruces/abusos
4. **Exportar auditorías** con histórico
5. **Generación de PDF** (alternativa a Excel)
6. **Plantillas personalizables** por usuario/empresa
7. **Descarga en lote** de múltiples documentos (ZIP)
8. **Envío directo a correo** (sin descarga manual)
9. **Firma digital** en documentos
10. **Watermark/marcas de agua** en exportaciones

---

## 🔗 Relaciones con Otros Controladores

### Dependencias
- **tags.controllers.js**: Usa `generarResponsivaDesdePlantilla()` para responsivas
- **abusos.controllers.js**: Podría exportar reportes de abusos
- **aclaraciones.controllers.js**: Podría exportar reportes de aclaraciones

### Tablas utilizadas
- Ninguna directa (solo lectura de plantilla)

---

## 📚 Referencias

### ExcelJS Documentation
- https://github.com/exceljs/exceljs
- Cell references: A1, B33, E5, etc.
- Workbook API: readFile(), xlsx.write()

### dayjs Documentation
- https://day.js.org/
- Formatos: DD/MM/YYYY, HH:mm:ss, etc.
- Timezones y localizaciones

---

**Última actualización:** 1/12/2025  
**Versión:** 1.0  
**Estado:** ✅ Producción (limitado)  
**Funcionalidad:** 1/10 (solo responsivas, expandible)
