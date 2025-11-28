# 📜 Scripts de Importación MySQL - ALBRU

## 🎯 Scripts disponibles

### 1. `import_mysql_docker.ps1` ⭐ **RECOMENDADO**
**Para usar con Docker (contenedores)**
```powershell
# Importar a Docker (por defecto)
.\scripts\import_mysql_docker.ps1

# Con parámetros personalizados
.\scripts\import_mysql_docker.ps1 -Password "mi_password" -DbName "mi_base"
```

**Características:**
- ✅ Funciona con contenedores Docker
- ✅ Usa el contenedor `albru-base` automáticamente
- ✅ Manejo de errores específico para Docker
- ✅ Verificación de estado del contenedor
- ✅ Colores y mensajes claros

### 2. `import_mysql.ps1`
**Para MySQL local (XAMPP, MySQL Workbench)**
```powershell
# Para MySQL local
.\scripts\import_mysql.ps1 -User root -Password "mi_password"
```

**Características:**
- ✅ Funciona con MySQL instalado localmente
- ✅ Compatible con XAMPP, MySQL Workbench
- ⚠️ Requiere cliente mysql en PATH

## 🚀 Uso recomendado

### Con Docker (caso normal)
```powershell
# 1. Levantar contenedores
docker-compose up -d

# 2. Importar base de datos
.\scripts\import_mysql_docker.ps1
```

### Con MySQL local
```powershell
# Solo si tienes MySQL instalado localmente
.\scripts\import_mysql.ps1 -User root -Password "tu_password"
```

## 📂 Archivo importado
Ambos scripts importan: `src/database/albru_consolidado_completo.sql`

Este archivo contiene:
- ✅ Esquema completo (5 tablas)
- ✅ Campos del wizard
- ✅ 5 usuarios de prueba
- ✅ 3 clientes de prueba
- ✅ Índices optimizados

## 🔧 Resolución de problemas

### Error: "Contenedor no está corriendo"
```powershell
docker-compose up -d
```

### Error: "Docker no encontrado"
```powershell
# Instalar Docker Desktop
# O usar el script para MySQL local: import_mysql.ps1
```

### Error: "Archivo SQL no encontrado"
```powershell
# Verificar que existe:
Test-Path "src\database\albru_consolidado_completo.sql"
```

## 📋 Resultado esperado
```
✅ BASE DE DATOS CONSOLIDADA CREADA EXITOSAMENTE
✅ 5 asesores creados
✅ 5 usuarios del sistema creados  
✅ 3 clientes de prueba creados
✅ 5 tablas: asesores, clientes, usuarios_sistema, historial_cliente, validaciones
```

## 🎪 Usuarios creados
```
admin → admin123 (Administrador)
gtr_maria → gtr123 (GTR)
asesor_carlos → asesor123 (Asesor)
supervisor_ana → super123 (Supervisor)
validador_pedro → valid123 (Validador)
```