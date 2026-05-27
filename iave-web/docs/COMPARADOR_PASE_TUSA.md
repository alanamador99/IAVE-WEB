# Comparador de TAGs: PASE vs TUSA

## 📋 Descripción

Esta funcionalidad permite cargar archivos JSON del sistema PASE y compararlos automáticamente con los datos del sistema TUSA (tu empresa) para identificar discrepancias en el estado de activación/desactivación de los TAGs.

## 🎯 Propósito

- **Sincronizar datos**: Verificar que los estados de los TAGs entre PASE (proveedor) y TUSA (empresa) coincidan
- **Identificar problemas**: Detectar TAGs que tienen diferentes estados en ambos sistemas
- **Auditoría**: Documentar discrepancias para investigación y resolución
- **Exportación**: Generar reportes en CSV para análisis posterior

## 📁 Formato del Archivo JSON de PASE

El archivo JSON debe tener la siguiente estructura:

```json
{
  "content": [
    {
      "id": "IMDM30992039..",
      "prefijo": "IMDM",
      "numero": 30992039,
      "activo": false,
      "estatus": "INACTIVO",
      "domiciliado": false,
      "saldo": 0,
      "clase": 2,
      "tipoFisico": "PORTATIL IMDM PASE",
      "recargasProgramadas": false,
      "nombreClase": "Autobús / Camión de 2 ejes",
      "regionalizado": true
    },
    {...}
  ]
}
```

**Campos principales:**
- `id`: Identificador único del TAG
- `activo`: Estado booleano (true = ACTIVO, false = INACTIVO)
- `nombreClase`: Clasificación del vehículo
- `tipoFisico`: Tipo de TAG (físico)
- `saldo`: Saldo disponible en el TAG
- `domiciliado`: Si está domiciliado o no

## 🚀 Cómo Usar

### 1. **Cargar el archivo JSON**

1. Dirígete al componente **TagsTable** (Tabla de TAGs)
2. En la sección superior de filtros, encontrarás un botón **"📄 Cargar JSON PASE"**
3. Haz clic en el botón para abrir el selector de archivos
4. Selecciona el archivo JSON descargado de PASE
5. Espera a que se complete la comparación (verás un spinner si el proceso es lento)

### 2. **Revisar Discrepancias**

Se abrirá automáticamente un modal con los resultados:

- **Número de discrepancias**: Se muestra en rojo al inicio
- **Tabla de hallazgos**: Muestra cada TAG con discrepancia
- **Columnas:**
  - **TAG (ID)**: Identificador del TAG
  - **Estado PASE**: Estado en el sistema del proveedor (ACTIVO/INACTIVO)
  - **Estado TUSA**: Estado en tu sistema (Activo/Inactivo/NO ENCONTRADO EN TUSA)
  - **Clase**: Clasificación del vehículo
  - **Tipo Físico**: Tipo de TAG
  - **Saldo**: Saldo disponible
  - **Domiciliado**: Si está domiciliado (✓ o -)
  - **Observaciones**: Notas adicionales del sistema TUSA

### 3. **Interpretar los Resultados**

#### Tres tipos de discrepancias:

**🔴 Diferencia de Estado (filas azules)**
- El TAG existe en ambos sistemas pero con estados diferentes
- Ejemplo: PASE dice ACTIVO pero TUSA dice INACTIVO
- **Acción sugerida**: Investigar la causa y sincronizar manualmente

**🟡 TAG No Encontrado en TUSA (filas amarillas)**
- El TAG existe en PASE pero no en TUSA
- Puede ser un TAG nuevo o que no fue cargado
- **Acción sugerida**: Verificar si necesita ser agregado a TUSA

**✅ Sincronizados (no aparecen en la tabla)**
- Los TAGs tienen el mismo estado en ambos sistemas
- No requieren acción

### 4. **Exportar Resultados**

1. Si hay discrepancias, verás un botón **"📥 Descargar CSV"** en el footer del modal
2. Haz clic para descargar un archivo CSV con los datos
3. El archivo se nombrará: `discrepancias_tags_YYYY-MM-DD_HH-mm-ss.csv`
4. Ábrelo en Excel o Google Sheets para análisis adicional

## 📊 Estructura del CSV Exportado

```
TAG (ID),Número,Estado PASE,Estado TUSA,Clase,Tipo Físico,Saldo,Domiciliado,Observaciones
IMDM30992039..,30992039,ACTIVO,INACTIVO,2,PORTATIL IMDM PASE,0.00,No,Sin observaciones
IMDM30992038..,30992038,INACTIVO,Activo,2,PORTATIL IMDM PASE,125.50,Sí,Problemas reportados
```

## 🔄 Workflow Recomendado

1. **Obtener JSON de PASE** → Contacta a PASE para descargar el archivo de TAGs
2. **Cargar en IAVE** → Usa el botón "Cargar JSON PASE"
3. **Revisar discrepancias** → Analiza cada diferencia encontrada
4. **Exportar CSV** → Descarga el reporte para seguimiento
5. **Actualizar TUSA** → Realiza los cambios necesarios en tu sistema
6. **Verificación** → Carga el JSON nuevamente para confirmar sincronización

## ⚙️ Validaciones

- ✅ El archivo JSON debe ser válido
- ✅ Debe contener un array en "content" o ser directamente un array
- ✅ Se ignoran TAGs que no tienen concordancia exacta en ID
- ⚠️ Si hay muchos registros (1000+), la comparación puede tomar unos segundos

## 🐛 Resolución de Problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| "Error al cargar el archivo JSON" | Formato inválido | Verifica que el JSON sea válido. Usa un validador JSON online |
| No aparecen discrepancias | Todos están sincronizados | ✅ Es correcto, los sistemas están en sincronía |
| No se encuentra un TAG conocido | TAG no en el JSON de PASE | Verifica si el TAG fue eliminado en PASE o si el JSON está actualizado |
| Botón no responde | Error de carga | Recarga la página y reintentar |

## 📝 Notas Importantes

- **Frecuencia**: Se recomienda hacer comparaciones semanales o después de cambios importantes en PASE
- **Backup**: Los datos originales no se modifican, solo se comparan
- **Responsabilidad**: El estado "ACTIVO" en PASE es el definitivo para cruces en casetas
- **Escalabilidad**: Soporta archivos con miles de registros

## 🎓 Ejemplo Completo

```
1. Descargas tags.json de PASE (5000 registros)
2. Haces clic en "Cargar JSON PASE" en TagsTable
3. Se carga el archivo y se ejecuta la comparación
4. Se encuentra que 47 TAGs tienen discrepancias
5. Descargas el CSV con los 47 TAGs con problemas
6. Contactas a PASE sobre los discrepancias críticas
7. Actualizas los estados en TUSA
8. Cargas el JSON nuevamente → 0 discrepancias ✅
```

## 📞 Contacto

Para reportar problemas o sugerencias sobre esta funcionalidad, consulta con el equipo de desarrollo.
