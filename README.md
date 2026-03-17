# IAVE-WEB

DOCUMENTACIÓN DEL PROYECTO CONSIDERANDOLO UN MONOREPO.


---

## OBJETIVO DEL PROYECTO🎯

El proyecto IAVE se centra en la detección de anomalías en los cruces de operadores, con el objetivo de optimizar el proceso de conciliación. Esto es esencial para garantizar traslados eficientes, asegurar la devolución de cobros injustificados, detección de abusos y detectar/mantener los registros confiables en el sistema.


---


## Estructura del Proyecto


- **`/iave-web-api`** - Backend REST API (Node.js/Express)
- **`/iave-web`** - Frontend (React)
- **`/docs`** - Documentación técnica completa

## Quick Start (Comandos de ejecución actuales)

### Backend
```bash
cd iave-web-api
npm install
npm run dev
```

### Frontend
```bash
cd iave-web
npm install
npm run start
```

## 📚 Documentación

- [Documentación Backend](./docs/backend/)
- [Documentación Frontend](./docs/frontend/)
- [Mapeo Completo de Tablas](./docs/backend/MAPEO_COMPLETO_TABLAS_ATRIBUTOS.md)

## Stack Tecnológico

**Backend:**
- Node.js + Express
- SQL Server
- SSE (Server-Sent Events)

**Frontend:**
- React 
- CSS Modules
- Se hace uso de la plantilla sb-admin-2.css como hoja de estilos bootstrap
- Leaflet
- Fetch API y axios para ejecutar las peticiones a la API

## 📊 Módulos Principales

- Cruces (Core)
- Rutas y Casetas
- Tags
- Casetas
- Abusos
- Aclaraciones
- Sesgos