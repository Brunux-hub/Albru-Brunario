# 🧪 GUÍA PRÁCTICA DE PRUEBAS - PROYECTO ALBRU

## 🚀 OPCIÓN RÁPIDA: USAR DOCKER (5 MINUTOS)

### 1. **PREPARAR ENTORNO**
```bash
# 1. Navegar al proyecto
cd C:\Users\DARIO\Albru-Brunario

# 2. Copiar variables de entorno
copy .env.example .env

# 3. Ejecutar Docker Compose
docker-compose up -d --build
```

### 2. **VERIFICAR SERVICIOS** (2 minutos después)
```bash
# Ver qué está corriendo
docker-compose ps

# Debería mostrar:
# albru-base     (MySQL)
# albru-backend  (Node.js API)
# adminer        (Administrador BD)
```

### 3. **ACCEDER AL SISTEMA**
- 🗄️ **Base de Datos**: http://localhost:8080 (Adminer)
  - Sistema: MySQL
  - Servidor: db
  - Usuario: albru
  - Contraseña: albru12345
  - BD: albru

- 🔧 **API Backend**: http://localhost:3001
  - Probar: http://localhost:3001/api/auth/login

- 💻 **Frontend**: Ejecutar por separado
```bash
npm run dev
# Acceder: http://localhost:5173
```

---

## 🧪 PRUEBAS PASO A PASO

### ✅ **PRUEBA 1: VERIFICAR BASE DE DATOS LIMPIA**

#### Abrir Adminer (http://localhost:8080):
1. **Conectar** con las credenciales Docker
2. **Verificar tablas**:
```sql
SELECT COUNT(*) as total_usuarios FROM usuarios_sistema; 
-- Resultado esperado: 1 (solo admin)

SELECT COUNT(*) as total_asesores FROM asesores;
-- Resultado esperado: 0 (vacía)

SELECT COUNT(*) as total_clientes FROM clientes;
-- Resultado esperado: 0 (vacía)

SELECT * FROM usuarios_sistema;
-- Debe mostrar solo: admin | hash_password | admin | activo
```

### ✅ **PRUEBA 2: LOGIN Y JWT**

#### Usar Postman o navegador:
```javascript
// POST http://localhost:3001/api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

// Respuesta esperada:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### ✅ **PRUEBA 3: CREAR ASESOR REAL**

#### Con el token JWT obtenido:
```javascript
// POST http://localhost:3001/api/asesores
// Headers: Authorization: Bearer TU_TOKEN_JWT
{
  "nombre": "María González",
  "email": "maria.gonzalez@tuempresa.com",
  "telefono": "999123456",
  "tipo": "asesor"
}

// Verificar en Adminer:
SELECT * FROM asesores;
-- Debe aparecer María González
```

### ✅ **PRUEBA 4: CREAR CLIENTE REAL**

```javascript
// POST http://localhost:3001/api/clientes
// Headers: Authorization: Bearer TU_TOKEN_JWT
{
  "nombre": "Juan Carlos Pérez",
  "telefono": "987654321",
  "dni": "12345678",
  "direccion": "Av. Principal 123, Lima",
  "plan_seleccionado": "Internet 100MB",
  "precio_final": 79.90,
  "asesor_asignado": 1
}

// Verificar en Adminer:
SELECT * FROM clientes;
-- Debe aparecer Juan Carlos Pérez
```

### ✅ **PRUEBA 5: FRONTEND COMPLETO**

#### Iniciar el frontend:
```bash
npm run dev
```

#### Probar flujo completo:
1. **Login**: http://localhost:5173
   - Usuario: admin
   - Contraseña: admin123

2. **Verificar Dashboard Admin**:
   - No debe haber datos ficticios
   - Estadísticas en 0 (correcto)
   - Puede crear asesores

3. **Probar Panel GTR**:
   - Debe mostrar el asesor María González creado
   - Debe mostrar el cliente Juan Carlos Pérez
   - Sin datos ficticios (Juan, JUAN, etc.)

4. **Probar Panel Asesor**:
   - Login como María (si creaste su usuario)
   - Debe ver sus clientes asignados
   - Sin errores ni datos hardcodeados

---

## 📊 DATOS DE PRUEBA SUGERIDOS

### 👥 **ASESORES REALES DE PRUEBA:**
```json
[
  {
    "nombre": "María González",
    "email": "maria@empresa.com",
    "telefono": "999123456",
    "tipo": "asesor"
  },
  {
    "nombre": "Carlos Mendoza",
    "email": "carlos@empresa.com", 
    "telefono": "999654321",
    "tipo": "gtr"
  },
  {
    "nombre": "Ana Rodríguez",
    "email": "ana@empresa.com",
    "telefono": "999789123",
    "tipo": "validador"
  }
]
```

### 🏢 **CLIENTES REALES DE PRUEBA:**
```json
[
  {
    "nombre": "Juan Carlos Pérez",
    "telefono": "987654321",
    "dni": "12345678",
    "direccion": "Av. Principal 123, Lima",
    "plan_seleccionado": "Internet 100MB",
    "precio_final": 79.90
  },
  {
    "nombre": "Ana María Silva",
    "telefono": "976543210",
    "dni": "87654321",
    "direccion": "Jr. Comercio 456, Callao",
    "plan_seleccionado": "Internet 200MB",
    "precio_final": 129.90
  }
]
```

---

## 🔧 COMANDOS ÚTILES DURANTE PRUEBAS

### Ver logs en tiempo real:
```bash
docker-compose logs -f backend
```

### Reiniciar si algo falla:
```bash
docker-compose restart backend
```

### Resetear completamente:
```bash
docker-compose down -v
docker-compose up -d --build
```

### Entrar a la base de datos directamente:
```bash
docker-compose exec db mysql -u albru -p albru
```

---

## ✅ CHECKLIST DE PRUEBAS EXITOSAS

- [ ] **Docker** inicia sin errores
- [ ] **Base de datos** conecta correctamente
- [ ] **Solo usuario admin** existe inicialmente
- [ ] **APIs** responden (login, asesores, clientes)
- [ ] **JWT** se genera y valida correctamente
- [ ] **Frontend** carga sin datos ficticios
- [ ] **CRUD** funciona (crear, leer asesores/clientes)
- [ ] **Sin errores** en consola del navegador
- [ ] **Sin referencias** a JUAN, María García ficticia, etc.

---

## 🎉 PRÓXIMOS PASOS DESPUÉS DE PRUEBAS

1. **Cambiar contraseña admin** por seguridad
2. **Crear usuarios reales** para cada asesor
3. **Configurar integración** con tu fuente de leads
4. **Documentar procesos** internos
5. **Capacitar al equipo** en el uso del sistema

**¿Quieres que te ayude a ejecutar alguna de estas pruebas paso a paso?**