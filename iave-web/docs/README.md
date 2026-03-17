# 💻 Documentación del Frontend - Proyecto IAVE WEB

Bienvenido a la documentación técnica del frontend de IAVE WEB (`iave-web`). Esta sección detalla la arquitectura, los componentes y las utilidades de la interfaz de usuario.

## 🗂️ Estructura de la Documentación

### 1. 🧩 [Componentes](./components/DOCUMENTACION_COMPONENTES.md)
Documentación detallada de los componentes React del proyecto.

- **[Índice de Componentes](./components/DOCUMENTACION_COMPONENTES.md)**: Lista completa y descripción de cada vista y componente.
  - Vistas principales: Abusos, Aclaraciones, Casetas, Cruces, Rutas, Sesgos.
  - Componentes estructurales: App, Sidebar, Footer.
  - Herramientas: Route-Creator.

### 2. 🛠️ [Utilidades y Helpers](./utils/DOCUMENTACION_UTILS.md)
Funciones auxiliares, formateadores y componentes compartidos.

- **[Utils JSDoc](./utils/DOCUMENTACION_UTILS.md)**: Referencia de `utils.jsx`.
  - Formateadores de datos (fecha, moneda, texto).
  - Componentes UI reutilizables (Modales, Toasts).

### 3. 🏗️ [Arquitectura y Flujos](./architecture/README.md)
Diagramas y explicaciones de flujos complejos.

- **[Route Creator](./architecture/DIAGRAMA_FLUJO_ROUTE_CREATOR.md)**: Diagrama de flujo detallado del componente de creación de rutas.

## 🖼️ Recursos Visuales
Las imágenes y diagramas utilizados en la documentación se encuentran en el directorio `img/`.

---

## 🚀 Guía Rápida para Desarrolladores

### Estructura de Carpetas del Código
```
src/
├── components/      # Componentes de UI reutilizables
├── pages/           # Vistas principales de la aplicación
├── hooks/           # Custom hooks
├── context/         # Context API (Auth, Theme, etc.)
├── utils/           # Funciones de ayuda
└── assets/          # Imágenes y estilos globales
```

### Comandos Principales
```bash
# Iniciar servidor de desarrollo
npm start

# Construir para producción
npm run build

# Ejecutar tests
npm test
```
