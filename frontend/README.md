# Organización del frontend

El código se agrupa por funcionalidad dentro de `src/features`:

- `auth`: login, registro, sesión y protección de rutas.
- `recursos`: catálogo, servicios, tipos y reglas de los recursos.
- `reservas`: disponibilidad, calendario, confirmación y cancelación.
- `categorias`: servicios, tipos y gestión de categorías.
- `administracion`: gestión de recursos activos e inactivos y sus formularios.
- `inicio`: página pública de presentación.

Cada módulo contiene solo las carpetas que necesita:

- `pages` y `components`: presentación y eventos de la interfaz.
- `hooks`: estado, carga de datos, validaciones del formulario y operaciones.
- `services.ts`: solicitudes al backend.
- `types.ts`: contratos de datos del módulo.
- `utils`: funciones de cálculo y validación sin estado de React.
- `styles`: estilos propios de la funcionalidad.

`src/shared` contiene el cliente HTTP, la conexión con el servidor, el layout,
la página de error y los estilos comunes. `App.tsx` conecta las rutas y mantiene
la carga diferida del calendario. `main.tsx` inicia la aplicación.

Una página llama a su hook; el hook utiliza los servicios y utilidades del módulo.
Los servicios usan el mismo cliente HTTP, que adjunta el token y controla los 401.
Los módulos pueden importar contratos o servicios de otra funcionalidad cuando
los necesitan: por ejemplo, las reservas consultan recursos y administración
coordina recursos y categorías. No hay un archivo global de servicios o tipos.

Las restricciones definitivas y la autorización continúan en el backend.

Desde `frontend`, ejecutar antes de entregar cambios:

```powershell
npm run lint
npm test
npm run build
```

Las pruebas actuales comprueban sesión, franjas y presentación de reglas. Además,
verificar en el navegador login, registro, filtros del catálogo, creación y
cancelación de reservas y administración de recursos y categorías.
