# 🧪 PRUEBAS DE CONEXIÓN GTR Y ASESOR - PASO A PASO

## ✅ ESTADO ACTUAL DEL SISTEMA
- ✅ **Docker**: Base de datos y backend corriendo
- ✅ **Frontend**: http://localhost:5173
- ✅ **Base de datos**: Limpia con usuarios de prueba creados
- ✅ **Usuarios creados**: Admin, GTR y Asesor

---

## 👥 USUARIOS CREADOS PARA PRUEBAS

| Rol | Usuario | Contraseña | Descripción |
|-----|---------|------------|-------------|
| **Admin** | `admin` | `admin123` | Administrador del sistema |
| **GTR** | `gtr_maria` | `gtr123` | María García - Gestión GTR |
| **Asesor** | `asesor_carlos` | `asesor123` | Carlos López - Asesor comercial |

---

## 🔍 PRUEBA 1: LOGIN GTR

### 📋 Pasos:
1. **Abrir**: http://localhost:5173
2. **Credenciales**:
   - Usuario: `gtr_maria`
   - Contraseña: `gtr123`
3. **Click**: "Iniciar Sesión"

### ✅ Resultado Esperado:
- ✅ Login exitoso
- ✅ Redirección a `/gtr` (Dashboard GTR)
- ✅ Ver panel GTR con funciones específicas:
  - Lista de asesores (debe aparecer Carlos López)
  - Lista de clientes (debe aparecer Juan Pérez y Ana Silva)
  - Funciones de reasignación de clientes
  - Estadísticas GTR

### ❌ Problemas Posibles:
- **Error 401**: Credenciales incorrectas
- **Error 500**: Problema con backend
- **Redirección incorrecta**: Problema de roles

---

## 🔍 PRUEBA 2: LOGIN ASESOR

### 📋 Pasos:
1. **Logout** del usuario anterior (si está logueado)
2. **Credenciales**:
   - Usuario: `asesor_carlos`
   - Contraseña: `asesor123`
3. **Click**: "Iniciar Sesión"

### ✅ Resultado Esperado:
- ✅ Login exitoso
- ✅ Redirección a `/asesor` (Dashboard Asesor)
- ✅ Ver panel Asesor con:
  - Sus clientes asignados (Juan Pérez y Ana Silva)
  - Funciones de gestión de clientes
  - Formularios de seguimiento
  - **NO** debe ver funciones de GTR

### ❌ Problemas Posibles:
- **Clientes no aparecen**: Problema de asignación
- **Ve funciones de GTR**: Problema de permisos
- **Error de carga**: Problema con API

---

## 🔍 PRUEBA 3: VERIFICAR PERMISOS POR ROLES

### 📋 Accesos por Rol:

| Función | Admin | GTR | Asesor | Validador |
|---------|-------|-----|--------|-----------|
| **Dashboard Admin** | ✅ | ❌ | ❌ | ❌ |
| **Dashboard GTR** | ✅ | ✅ | ❌ | ❌ |
| **Dashboard Asesor** | ✅ | ❌ | ✅ | ❌ |
| **Validaciones** | ✅ | ❌ | ❌ | ✅ |
| **Reasignar Clientes** | ✅ | ✅ | ❌ | ❌ |
| **Ver Todos los Asesores** | ✅ | ✅ | ❌ | ❌ |

---

## 🔧 VERIFICACIÓN DE BACKEND (APIs)

### Probar Login GTR:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "gtr_maria", "password": "gtr123"}'
```

### Probar Login Asesor:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "asesor_carlos", "password": "asesor123"}'
```

### Verificar Clientes del Asesor:
```bash
curl -X GET http://localhost:3001/api/clientes \
  -H "Authorization: Bearer TU_TOKEN_JWT_ASESOR"
```

---

## 📊 DATOS DE PRUEBA DISPONIBLES

### Asesores:
- **María García** (GTR) - maria.gtr@empresa.com
- **Carlos López** (Asesor) - carlos.asesor@empresa.com

### Clientes Asignados a Carlos:
- **Juan Pérez** - 987654321 - Internet 100MB - Estado: nuevo
- **Ana Silva** - 976543210 - Internet 200MB - Estado: contactado

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Login no funciona:
```sql
-- Verificar usuarios en Adminer (localhost:8080)
SELECT u.username, u.role, a.nombre 
FROM usuarios_sistema u 
LEFT JOIN asesores a ON u.asesor_id = a.id;
```

### Backend no responde:
```bash
# Ver logs del backend
docker-compose logs backend

# Verificar que esté corriendo
docker-compose ps
```

### Frontend muestra errores:
- Verificar consola del navegador (F12)
- Verificar que backend esté en puerto 3001
- Verificar configuración de axios

---

## 📝 CHECKLIST DE PRUEBAS

### GTR (gtr_maria / gtr123):
- [ ] Login exitoso
- [ ] Acceso a dashboard GTR
- [ ] Ve lista de asesores
- [ ] Ve todos los clientes
- [ ] Puede reasignar clientes
- [ ] NO puede acceder a panel Admin
- [ ] NO puede acceder a panel Asesor

### Asesor (asesor_carlos / asesor123):
- [ ] Login exitoso
- [ ] Acceso a dashboard Asesor
- [ ] Ve SOLO sus clientes asignados (Juan y Ana)
- [ ] Puede gestionar sus clientes
- [ ] NO puede ver otros asesores
- [ ] NO puede reasignar clientes
- [ ] NO puede acceder a panel GTR

---

## 🎯 RESULTADO ESPERADO FINAL

**Al completar todas las pruebas deberías confirmar que:**

1. ✅ **Sistema de roles funciona correctamente**
2. ✅ **Cada usuario ve solo lo que debe ver**
3. ✅ **No hay datos ficticios** en ningún panel
4. ✅ **APIs responden correctamente** para cada rol
5. ✅ **Base de datos limpia** funcionando

**¿LISTO PARA EMPEZAR LAS PRUEBAS?** 🚀