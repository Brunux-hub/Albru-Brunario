# 🚀 GUÍA COMPLETA DE DESPLIEGUE Y PRUEBAS - PROYECTO ALBRU

## 🎯 OPCIONES DE DESPLIEGUE

### 📋 REQUISITOS PREVIOS
- ✅ Node.js 18+ instalado
- ✅ MySQL 8.0 instalado (o Docker)
- ✅ Git (opcional)

---

## 🐳 OPCIÓN 1: DESPLIEGUE CON DOCKER (RECOMENDADO)

### ✅ **VENTAJAS:**
- Todo en contenedores aislados
- Base de datos incluida
- Fácil de configurar
- Adminer para gestión de BD

### 🚀 **PASOS:**

#### 1. Preparar Variables de Entorno
```bash
# Crear archivo .env en la raíz del proyecto
DB_ROOT_PASSWORD=mi_password_root
DB_NAME=albru
DB_USER=albru
DB_PASSWORD=albru_secure_password
```

#### 2. Ejecutar Docker Compose
```bash
# Cambiar al directorio del proyecto
cd C:\Users\DARIO\Albru-Brunario

# Construir y ejecutar todos los servicios
docker-compose up -d --build
```

#### 3. Verificar Servicios
```bash
# Ver contenedores corriendo
docker-compose ps

# Ver logs si hay problemas
docker-compose logs backend
docker-compose logs db
```

#### 4. Acceder a los Servicios
- **Backend API**: http://localhost:3001
- **Base de Datos (Adminer)**: http://localhost:8080
- **Frontend**: Necesitas ejecutar `npm run dev` por separado

---

## 💻 OPCIÓN 2: DESPLIEGUE MANUAL (SIN DOCKER)

### 🚀 **PASOS:**

#### 1. Usar Script de Instalación Automática
```bash
# Ejecutar el script de instalación (Windows)
install-production.bat

# O manualmente:
cd backend && npm install
cd .. && npm install && npm run build
```

#### 2. Configurar Base de Datos MySQL

**Opción A: Con XAMPP/WAMP**
```sql
-- Abrir phpMyAdmin o MySQL Workbench
-- Ejecutar el archivo: src/database/albru_produccion_limpia.sql
```

**Opción B: Línea de Comandos**
```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar el script
source C:\Users\DARIO\Albru-Brunario\src\database\albru_produccion_limpia.sql

# O directamente:
mysql -u root -p < src/database/albru_produccion_limpia.sql
```

#### 3. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
copy backend\.env.example backend\.env

# Editar backend\.env con tus credenciales:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=albru
NODE_ENV=production
PORT=3001
```

#### 4. Iniciar Servicios

**Backend:**
```bash
cd backend
npm start
# Debería mostrar: "Servidor corriendo en puerto 3001"
```

**Frontend (en otra terminal):**
```bash
# Para desarrollo:
npm run dev
# Acceder a: http://localhost:5173

# Para producción:
npm run build
# Servir la carpeta dist/ con un servidor web
```

---

## 🧪 HACER PRUEBAS REALES

### 1. **VERIFICAR CONEXIÓN A BASE DE DATOS**

#### Usando Adminer (Docker):
1. Ir a http://localhost:8080
2. **Sistema**: MySQL
3. **Servidor**: db (si usas Docker) o localhost
4. **Usuario**: albru (o root)
5. **Contraseña**: tu password
6. **Base de datos**: albru

#### Verificar Tablas:
```sql
USE albru;
SHOW TABLES;
-- Debe mostrar: asesores, clientes, usuarios_sistema, historial_cliente, validaciones

SELECT * FROM usuarios_sistema;
-- Debe mostrar el usuario admin
```

### 2. **PROBAR APIS DEL BACKEND**

#### Usar Postman o curl:

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Obtener Clientes:**
```bash
curl -X GET http://localhost:3001/api/clientes \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

**Crear Asesor:**
```bash
curl -X POST http://localhost:3001/api/asesores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "nombre": "Juan Perez",
    "email": "juan@empresa.com",
    "telefono": "999888777",
    "tipo": "asesor"
  }'
```

### 3. **PROBAR EL FRONTEND COMPLETO**

#### Flujo de Prueba:
1. **Login**: http://localhost:5173
   - Usuario: `admin`
   - Contraseña: `admin123`

2. **Panel Admin**:
   - Crear asesores reales
   - Ver estadísticas (deberían estar en 0)
   - Verificar que no hay datos ficticios

3. **Simular Clientes**:
   - Usar la API para crear clientes de prueba
   - Asignar a asesores
   - Probar el flujo completo

---

## 🔧 COMANDOS ÚTILES PARA PRUEBAS

### Docker:
```bash
# Ver logs en tiempo real
docker-compose logs -f backend

# Reiniciar servicios
docker-compose restart

# Entrar al contenedor de la base de datos
docker-compose exec db mysql -u albru -p albru

# Detener todos los servicios
docker-compose down

# Eliminar volúmenes (resetear BD)
docker-compose down -v
```

### Manual:
```bash
# Verificar que Node está corriendo
netstat -ano | findstr :3001

# Reiniciar backend
cd backend && npm start

# Ver logs del backend
# Los logs aparecen en la consola donde ejecutas npm start
```

---

## 📊 VERIFICAR QUE TODO ESTÁ LIMPIO

### ✅ Checklist de Verificación:

**Base de Datos:**
- [ ] Solo existe usuario `admin`
- [ ] Tablas `asesores`, `clientes`, etc. están vacías
- [ ] No hay datos de Juan, María, Carlos, etc.

**Frontend:**
- [ ] Login funciona con admin/admin123
- [ ] No aparecen clientes ficticios en ninguna tabla
- [ ] Componentes cargan datos desde APIs
- [ ] No hay errores en la consola del navegador

**Backend:**
- [ ] APIs responden correctamente
- [ ] JWT funciona
- [ ] Conexión a BD exitosa
- [ ] No hay referencias a datos ficticios

---

## 🎉 SIGUIENTE PASO: DATOS REALES

Una vez que todo funciona:

1. **Cambiar contraseña del admin**
2. **Crear asesores reales** desde el panel admin
3. **Configurar integración** con tu fuente de leads
4. **Importar clientes reales** (si tienes)
5. **Capacitar usuarios** en el sistema

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Backend no inicia:
- Verificar que MySQL está corriendo
- Revisar credenciales en `.env`
- Verificar que el puerto 3001 esté libre

### Frontend muestra errores:
- Verificar que el backend está corriendo
- Revisar la consola del navegador
- Verificar configuración de axios

### Base de datos no conecta:
- Verificar credenciales MySQL
- Verificar que la BD `albru` existe
- Probar conexión con Adminer

**¿Qué opción prefieres para hacer las pruebas? ¿Docker o instalación manual?**