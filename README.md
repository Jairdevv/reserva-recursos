# Reserva Recursos

Sistema de reservas con React, Express y PostgreSQL. Las reservas confirmadas
no pueden superponerse para el mismo recurso, incluso bajo solicitudes simultáneas.

## Preparación

- PostgreSQL con permiso para habilitar la extensión btree_gist.
- Node.js 20.19+ en la rama 20, o 22.12+ (requisito del frontend).
- Instalar dependencias con npm ci dentro de backend y frontend.
- Copiar backend/.env.example a backend/.env y configurar DATABASE_URL y JWT_SECRET.
- Copiar frontend/.env.example a frontend/.env y configurar VITE_API_URL.
- Nunca publicar los archivos .env ni colocar secretos en variables VITE\_\*.

CORS_ORIGINS contiene los orígenes del frontend separados por comas, sin barra
final. En desarrollo se permiten por defecto http://localhost:5173 y
http://127.0.0.1:5173. En producción es obligatorio definir CORS_ORIGINS y un
JWT_SECRET de al menos 32 caracteres. DATABASE_URL y JWT_SECRET se validan al arrancar.
PORT usa 3000 por defecto.

VITE_API_URL se incorpora durante la compilación: cambiarla requiere recompilar.
En desarrollo existe un valor por defecto http://localhost:3000; para producción
es necesario configurar la variable. El calendario carga por separado del resto
de las pantallas.

## Migraciones

Ejecutar los comandos desde backend.

Base nueva, sin tablas del proyecto:

    npm run migrate

La migración 003:

- Añade recursos.activo, inicialmente true.
- Evita eliminar físicamente recursos con reservas mediante ON DELETE RESTRICT.
- Añade restricciones para nombres, capacidad y rangos finitos no vacíos [inicio, fin).
- Garantiza unicidad del email ignorando mayúsculas y espacios exteriores.
- No borra ni fusiona cuentas, no modifica horarios existentes.

Si existen emails equivalentes, 003 se revierte íntegramente y requiere resolver
esas cuentas antes de reintentar. Las restricciones CHECK son NOT VALID para no
alterar registros históricos inválidos; sí se comprueban al insertar o actualizar.
Antes de validarlas globalmente, revisar y corregir esos registros.

## Ejecución

En backend:

    npm run dev

En frontend, en otra terminal:

    npm run dev

Compilación y ejecución del backend compilado:

    npm run build
    npm start

En frontend:

    npm run build
    npm run preview

## Contrato de fechas

La zona de los horarios civiles almacenados en reservas.rango_horario (TSRANGE)
es **America/Bogota**. Este es el supuesto para los registros históricos:
no se reescriben ni se migra a TSTZRANGE.

La API acepta instantes ISO 8601 con Z u offset explícito y devuelve inicio y fin
como ISO UTC. Ejemplo: 2099-01-02T10:00:00-05:00 se devuelve como
2099-01-02T15:00:00.000Z. No se devuelve el texto interno rango_horario.

- POST /reservas: { recurso_id, inicio, fin }; inicio debe ser futuro y menor que fin.
- GET /recursos/:id/reservas?desde=...&hasta=...: ambos parámetros son instantes ISO
  con zona; fin exclusivo; máximo 366 días. Usar URLSearchParams o params de Axios
  para codificar offsets con signo +.
- GET /recursos/:id/disponibilidad?fecha=YYYY-MM-DD: día civil en America/Bogota.
- GET /mis-reservas: incluye inicio, fin, estado y recurso_nombre.
- PATCH /reservas/:id/cancelar: propietario o administrador; repetir es idempotente.

El calendario muestra los instantes en la zona local del navegador, indicada en
pantalla; envía las fechas completas con zona al consultar y confirmar. No recorta
fechas UTC para calcular días locales. La selección es una propuesta: el servidor
decide si el horario sigue libre al guardar. No se impone horario comercial ni
duración máxima de reserva; esas políticas requieren una definición del negocio.

Si la instalación histórica usaba otra zona, revisar este supuesto antes de
desplegar estos cambios sobre otra base.

## Recursos y sesión

GET /recursos lista solo recursos activos. DELETE /recursos/:id **desactiva**
el recurso: conserva todas sus reservas, incluidas las futuras, y bloquea nuevas
reservas. Las reservas existentes siguen disponibles en el historial y pueden
cancelarse. El bloqueo de fila coordina creación y desactivación concurrentes.

Las respuestas de error tienen formato { error: string }:
400 entrada inválida, 401 sesión ausente/inválida/expirada, 403 permisos,
404 inexistente, 409 conflicto y 500 error inesperado. JSON inválido también
devuelve 400; cuerpos demasiado grandes devuelven 413.

El frontend comparte la sesión entre pantallas y pestañas, cierra al expirar el
JWT y protege las rutas privadas. Una respuesta 401 de una sesión anterior no
invalida una sesión nueva. La firma y los permisos siempre se validan en la API.

## Verificación

En backend:

    npm test
    npm run test:integration
    npm run build

Las pruebas de integración usan TEST*DATABASE_URL si está definida, o DATABASE_URL.
Crean un esquema aleatorio test_reservas*\* y lo eliminan al terminar; no modifican
las tablas existentes de la aplicación. Requieren permiso para crear esquemas y
btree_gist. Para CI es preferible una base exclusiva de pruebas.

En frontend:

    npm test
    npm run lint
    npm run build

La suite cubre validación, fechas, autenticación, permisos, reservas simultáneas,
cancelación, conservación del historial y estado de sesión del frontend.
