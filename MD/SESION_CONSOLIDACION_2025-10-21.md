# Sesión de consolidación - 21 de octubre de 2025

Resumen de acciones realizadas en la sesión:

- Consolidación de tablas `usuarios_sistema` -> `usuarios`.
- Agregado campos a `usuarios`: `username`, `ultimo_acceso`.
- Migración de datos y regeneración temporal de contraseñas ('password') y posterior actualización a DNI hasheado para 17 usuarios.
- Refactorización del backend (controllers, middleware, routes, server.js) para usar únicamente `usuarios`.
- Eliminación de tabla `usuarios_sistema`.
- Ajuste en `backend/server.js` para evitar que el catch-all de producción devuelva `index.html` para rutas `/api/*`.
- Reinicio y reconstrucción de contenedores:
  - Reconstruida imagen del backend.
  - Reiniciado `albru-backend` y `albru-frontend` para actualizar resolución de DNS entre contenedores.
- Verificación de endpoints:
  - `/api/asesores` y `/api/clientes` responden con JSON.

Credenciales generadas temporalmente y luego eliminadas: `CREDENCIALES_DNI.txt` (el archivo fue eliminado del host por seguridad).

Notas de seguridad y seguimiento:

- Implementar cambio obligatorio de contraseña al primer login.
- Migrar rate-limit/lockout de in-memory a Redis.
- Implementar recuperación de contraseña por email.

Archivos modificados relevantes:

- `backend/server.js` (catch-all ajustado)
- `backend/controllers/usuariosController.js` (migraciones previas y login actualizado)
- `backend/scripts/consolidar_usuarios.js` (ejecutado)
- `backend/scripts/actualizar_passwords_dni.js` (ejecutado)

Estado de la rama: `chore/login-hardening-202510200243`.

Verificado: login con DNI para: `mcaceresv` (70779032), `acatalanm` (71249673), `rramirezt` (6138315), y otros 14 usuarios.

Registro de debugging: NGINX devolvía 502 porque tenía cached la IP del backend; reiniciar el frontend resolvió el problema.

-- Fin de registro --
