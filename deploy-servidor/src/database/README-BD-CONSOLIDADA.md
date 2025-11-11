# 📄 Base de Datos Consolidada - ALBRU

## 🎯 Archivo Principal
**`albru_consolidado_completo.sql`** - **ÚNICO ARCHIVO SQL NECESARIO**

Este archivo contiene **TODA** la base de datos consolidada:
- ✅ Esquema completo de todas las tablas
- ✅ Todos los campos del wizard del asesor
- ✅ Usuarios de sistema con contraseñas
- ✅ Datos de prueba
- ✅ Índices optimizados

## 🚀 Cómo usar en Docker
```bash
# El docker-compose.yml ya está configurado para usar este archivo automáticamente
docker-compose up -d --build
```

## 🔑 Usuarios creados
```
admin → admin123 (Administrador)
gtr_maria → gtr123 (GTR - Gestor)
asesor_carlos → asesor123 (Asesor de ventas)
supervisor_ana → super123 (Supervisor)
validador_pedro → valid123 (Validaciones)
```

## 📋 Tablas incluidas
- `asesores` - Datos de empleados/asesores
- `clientes` - Clientes con TODOS los campos del wizard
- `usuarios_sistema` - Autenticación y roles
- `historial_cliente` - Auditoría de cambios
- `validaciones` - Proceso de validación

## 🗂️ Archivos eliminados (ya consolidados)
- ~~`albru_produccion_limpia.sql`~~ → Integrado
- ~~`migration_wizard_fields.sql`~~ → Integrado
- ~~`crear-usuarios-prueba.sql`~~ → Integrado
- ~~`actualizar-passwords.sql`~~ → No necesario

## 📂 Archivos mantenidos
- `albru_consolidado_completo.sql` → **ARCHIVO PRINCIPAL**
- `backup_20251013_163628.sql` → Backup de seguridad
- `README-BD-CONSOLIDADA.md` → Esta documentación

## ⚡ Comandos útiles

### Importar manualmente (si es necesario)
```bash
# Desde PowerShell/host
Get-Content src\database\albru_consolidado_completo.sql | docker exec -i albru-base mysql -u root -p"root_password_here" albru

# Desde dentro del contenedor
docker exec -i albru-base mysql -u root -p"root_password_here" albru < /ruta/al/archivo.sql
```

### Verificar tablas
```bash
docker exec -i albru-base mysql -u root -p"root_password_here" -e "USE albru; SHOW TABLES;"
```

### Backup
```bash
docker exec albru-base mysqldump -u root -p"root_password_here" albru > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🎯 Resumen
**Una sola base de datos, un solo archivo, todo consolidado y listo para usar.**
