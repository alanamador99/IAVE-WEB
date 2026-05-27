# MANUAL DE PROCESOS DIARIOS - PORTAL IAVE-WEB

**Fecha:** 1 de Abril de 2026  
**Versión:** 1.0  
**Proyecto:** IAVE-WEB (Portal de Gestión de Transportes y Detección de Anomalías)

---

## INTRODUCCIÓN

El Portal IAVE-WEB surge de la necesidad de conciliar de forma automatizada el registro de cruces realizados en el sistema PASE vs. cruces autorizados en TUSA, mediante el uso del sistema TUSA, con la finalidad de minimizar el tiempo al realizar este proceso además de realizarlo de manera más exacta efectuando el pago correcto.

Este manual describe los procesos diarios realizados en el portal IAVE-WEB, conforme al desarrollo del proyecto. Incluye módulos para gestión de cruces, tags, abusos, aclaraciones, rutas, casetas y sesgos, facilitando la detección de anomalías, devolución de cobros injustificados y mantenimiento de registros confiables.

---

## DASHBOARD PRINCIPAL

El Dashboard es la pantalla principal del portal IAVE-WEB, donde se muestran estadísticas generales, gráficos y filtros para análisis de cruces, abusos y aclaraciones.

1. Al iniciar sesión, se carga automáticamente el Dashboard con datos del día actual o periodo predeterminado.
2. En la parte superior, visualice las métricas clave:
   - Importe total de casetas cruzadas.
   - Total de casetas cruzadas.
   - Detalle de aclaraciones agrupadas.
3. Utilice los filtros disponibles para refinar los datos:
   - Seleccione fechas de inicio y fin.
   - Filtre por operador (vOT), matrícula (mat_OP), caseta (vCaseta), estatus o ruta.
   - Elija tipo de ruta (vIdTipoRuta) para enfocarse en rutas específicas.
4. Observe los gráficos interactivos:
   - Gráfico de dona (Doughnut) para distribución de datos.
   - Gráfico de barras (Bar) para comparaciones.
5. Revise la lista de "Principales rutas con diferencia" para identificar anomalías.
6. Aplique cambios en filtros para actualizar las estadísticas y gráficos en tiempo real.
7. Exporte reportes o navegue a módulos específicos (Cruces, Abusos) para acciones detalladas.

---

## CONSULTA DE CRUCES

El módulo de Cruces permite visualizar y gestionar los registros de cruces realizados por operadores.

1. Desde el dashboard principal, seleccione la opción "Cruces" en la barra lateral o navegue a la ruta `/cruces`.
2. En la pantalla de Cruces, podrá consultar:
   - Detalle de cruces por periodo seleccionado.
   - Estadísticas agregadas de cruces procesados.
   - Filtros por fecha, operador, ruta o caseta.
3. Para visualizar un cruce específico, haga clic en la fila correspondiente en la tabla.
4. Utilice las opciones de exportación para descargar reportes en formato Excel o PDF.

---

## GESTIÓN DE TAGS

El módulo de Tags permite la administración de dispositivos TAG utilizados en el sistema de telepeaje.

1. Acceda al módulo "Tags" desde la barra lateral (ruta `/tags`).
2. En la pantalla principal, visualice la lista de tags activos, inactivos o en stock.
3. Para asignar un tag:
   - Seleccione un tag del inventario (stock).
   - Ingrese la matrícula o nombre del operador.
   - Guarde los cambios; se generará una carta responsiva automáticamente.
4. Para desactivar un tag:
   - Seleccione el tag activo.
   - Marque la opción "Desactivar" y confirme si se devuelve al stock o se marca como inactivo.
5. En caso de extravío:
   - Seleccione el tag.
   - Marque "Extravío" e ingrese el folio de cancelación.
   - Indique si se requiere descuento por reposición.

---

## PROCESAMIENTO DE ABUSOS

Los abusos son cruces por casetas no autorizadas o en días no operativos.

1. Navegue al módulo "Abusos" (ruta `/abusos`).
2. Visualice estadísticas de abusos registrados y su estado de procesamiento.
3. En la tabla de abusos, revise los estados secundarios:
   - Pendiente de reporte.
   - Reporte enviado, pendiente aplicación.
   - Descuento aplicado, pendiente acta.
   - Acta aplicada, pendiente descuento.
   - Completado o condonado.
4. Para actualizar el estatus de un abuso, seleccione la fila y elija la acción correspondiente (e.g., aplicar descuento).
5. Exporte reportes de abusos para seguimiento externo.

---

## GESTIÓN DE ACLARACIONES

El módulo de Aclaraciones permite solicitar y gestionar reclamos por cobros incorrectos.

1. Acceda a "Aclaraciones" desde la barra lateral (ruta `/aclaraciones`).
2. Visualice el listado de aclaraciones solicitadas y su estatus (Dictaminado o Autorizado).
3. Para crear una nueva aclaración:
   - Seleccione un cargo y haga clic en "Aclarar".
   - Elija el motivo: Tarifa incorrecta, Cruce duplicado, Cobro no reconocido, etc.
   - Adjunte comprobantes si es necesario (e.g., pago en efectivo).
   - Cree la aclaración.
4. Para cargas masivas:
   - Seleccione "Aclaraciones Masivas".
   - Suba el archivo Excel con los cruces a aclarar.
   - Verifique el procesamiento y los folios asignados.

---

## VISOR DE RUTAS

El módulo de Rutas permite visualizar y gestionar rutas de transporte.

1. Seleccione "Rutas" en la barra lateral (ruta `/rutas`).
2. Visualice el mapa interactivo con rutas registradas.
3. Utilice filtros para buscar rutas por operador, fecha o tipo.
4. Para crear una nueva ruta, acceda al "Route Creator" (ruta `/route-creator`).
5. Dibuje la ruta en el mapa, defina puntos de control y guarde.

---

## GESTIÓN DE CASETAS Y TARIFAS

1. Navegue a "Casetas" (ruta `/casetas`).
2. Consulte la lista de casetas disponibles con sus tarifas.
3. Actualice tarifas si es necesario, considerando ajustes por corrección monetaria.
4. Exporte listados de casetas para conciliación.

---

## GESTIÓN DE SESGOS

Los sesgos son anomalías detectadas en los datos.

1. Acceda a "Sesgos" (ruta `/sesgos`).
2. Revise las anomalías identificadas en cruces o rutas.
3. Aplique correcciones o marque como resueltos.
4. Genere reportes de sesgos para análisis.

---

## CIERRES Y CONCILIACIÓN

1. En el módulo de Cruces, seleccione periodos para cierres.
2. Descargue archivos de detalwle de cruces (formato Excel).
3. Compare con datos de PASE y TUSA para conciliación.
4. Procese ajustes de tarifa o aclaraciones pendientes.

---

## CIERRE DE SESIÓN

1. Al finalizar sus tareas diarias, haga clic en "Cerrar Sesión" en la barra superior (Topbar).
2. Confirme la salida para asegurar la seguridad de la sesión.

---

## RECOMENDACIONES GENERALES

- Realice respaldos diarios de reportes importantes.
- Verifique actualizaciones del sistema al iniciar sesión.
- Reporte cualquier anomalía al administrador.
- Mantenga la documentación actualizada conforme a cambios en procesos.

---

## REFERENCIAS

- Documentación de Componentes: DOCUMENTACION_COMPONENTES.md
- Manual de Operación PASE y TUSA: ASIG-I-8-007 Portal IAVE_IAVE-WEB.docx
- Código Fuente: Componentes React y APIs Node.js

---

*Última Actualización: 1 de Abril de 2026*</content>
<parameter name="filePath">c:\Users\IAVE\Documents\Proyecto IAVE WEB\iave-web-api\docs\MANUAL_PROCESOS_DIARIOS_IAVE_WEB.md