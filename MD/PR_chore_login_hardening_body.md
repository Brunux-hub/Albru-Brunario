# PR: chore: consolidación usuarios + endurecimiento login (21-10-2025)

## Qué incluye

- Consolidación de `usuarios_sistema` -> `usuarios`.
- Agregado de `username` y `ultimo_acceso` en `usuarios`.
- Scripts de migración dentro de `backend/scripts/`:
  - `consolidar_usuarios.js`
  - `actualizar_passwords_dni.js`
  - `generar_passwords_unicas.js`
- Refactorización de backend para usar únicamente `usuarios`:
  - `backend/controllers/usuariosController.js`
  - `backend/middleware/authMiddleware.js`
  - `backend/routes/*` (ajustes de rutas y validaciones)
- Ajuste en `backend/server.js` para evitar que el catch-all de producción capture rutas `/api/*`.
- Documentación y backups añadidos en `MD/` y `database/`.

## Por qué

- Evitar inconsistencias entre dos tablas de usuarios legacy.
- Restaurar y asegurar el proceso de login que quedó roto después de una importación CSV.
- Unificar la lógica de autenticación y simplificar futuras mejoras de seguridad.

## Verificado en esta sesión

- Login con DNI para varios usuarios (ej: `mcaceresv`, `acatalanm`, `rramirezt`).
- Endpoints `/api/asesores` y `/api/clientes` responden JSON correctamente.
- NGINX proxy arreglado reiniciando el frontend para actualizar la resolución del backend.

## Riesgos / Consideraciones

- Migración de esquema: requiere backup previo y plan de rollback.
- Revisar que no exista archivo con contraseñas en el repo (p. ej. `CREDENCIALES_DNI.txt`).
- Revisar permisos y middleware (no romper accesos).
- Posible impacto en integraciones externas que esperen la tabla legacy.

## Checklist para revisión

- [ ] Revisión de seguridad (no secrets committed)
- [ ] Ejecutar tests y linters
- [ ] Revisión de scripts de migración y confirmación de backups
- [ ] Pruebas manuales en staging (login, reasignación, endpoints principales)

## Reviewers sugeridos
- @responsable-backend
- @qa-team

---

Adjunto: `MD/SESION_CONSOLIDACION_2025-10-21.md` para histórico y contexto.
