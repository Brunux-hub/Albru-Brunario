# Despliegue de producción (local)

Este documento explica los pasos mínimos para poner la app en producción local usando XAMPP/MySQL y Node (backend).

1) Importar la base de datos (MySQL)
- Usar `src/database/albru_completo_mysql.sql` en MySQL Workbench o phpMyAdmin (XAMPP).

2) Configurar variables de entorno
- Copiar `backend/.env.example` a `backend/.env` y completar `DB_USER`/`DB_PASSWORD`.
- No subir `backend/.env` al repositorio.

3) Construir frontend y servirlo
- Desde la raíz:
  ```pwsh
  npm install
  npm run build
  ```
- Puedes copiar `dist` dentro de `backend/dist` para que el backend lo sirva, o dejar `dist` en la raíz (el backend sirve '..\dist' por defecto).

4) Iniciar backend en producción
- Desde `backend`:
  ```pwsh
  npm install
  npm run start:prod
  ```

5) Notas
- Para procesos en producción recomendamos usar `pm2` o similar.
- Revisa permisos y credenciales del usuario MySQL.
