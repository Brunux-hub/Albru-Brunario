# Sistema de Gestión de Usuarios - ALBRU

## 🎯 Funcionalidad Implementada

El sistema ahora cuenta con un completo sistema de autenticación y gestión de usuarios que permite:

### ✅ Características Principales

1. **Autenticación JWT**: Login seguro con tokens de 24 horas
2. **Roles y Permisos**: Control de acceso basado en roles (admin, gtr, asesor, supervisor, validaciones)
3. **Gestión de Asesores**: El admin puede crear, editar y administrar asesores
4. **Estados de Acceso**: Control de acceso con estados (pendiente, activo, suspendido)
5. **Interfaz Integrada**: Panel de administración con formularios intuitivos

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + Express)
```
backend/
├── middleware/
│   └── authMiddleware.js       # Verificación JWT y roles
├── controllers/
│   └── usuariosController.js   # CRUD de usuarios y login
├── routes/
│   └── usuarios.js            # Rutas protegidas y públicas
└── server.js                  # Configuración de rutas
```

### Frontend (React + TypeScript)
```
src/
├── context/
│   └── AuthContext.tsx        # Estado global de autenticación
├── components/admin/usuarios/
│   └── FormularioAsesor.tsx   # Formulario para crear asesores
├── components/admin/asesores/
│   └── AsesoresPanel.tsx      # Panel de gestión de asesores
└── pages/
    └── LoginPage.tsx          # Página de inicio de sesión
```

### Base de Datos (MySQL)
```sql
-- Tabla principal de usuarios del sistema
usuarios_sistema (
    id, asesor_id, username, password_hash, 
    role, estado_acceso, fecha_creacion, 
    ultimo_login, creado_por
)

-- Relación con tabla existente de asesores
asesores (
    id, nombre, email, telefono, tipo, 
    clientes_asignados, estado
)
```

## 🚀 Cómo Usar el Sistema

### 1. Iniciar los Servicios
```bash
# Con Docker (recomendado)
docker-compose up -d

# O manualmente
cd backend && npm start
cd .. && npm run dev
```

### 2. Acceso Inicial
- **URL**: `http://localhost:5173`
- **Admin**: usuario `admin`, contraseña `admin123`
- **Asesor Demo**: usuario `asesor1`, contraseña `user123`

### 3. Crear Nuevos Asesores
1. Iniciar sesión como admin
2. Ir al panel de "Asesores"
3. Hacer clic en "Agregar Asesor"
4. Completar el formulario:
   - **Información Personal**: Nombre, email, teléfono
   - **Configuración**: Tipo de asesor, rol del sistema, credenciales

### 4. Estados de Acceso
- **Pendiente**: Usuario creado pero sin acceso aún
- **Activo**: Puede iniciar sesión normalmente
- **Suspendido**: Acceso temporalmente bloqueado

## 🔒 Seguridad Implementada

### Autenticación
- **Hashing**: Contraseñas con bcrypt (10 salt rounds)
- **JWT**: Tokens firmados con HS256
- **Expiración**: Tokens válidos por 24 horas
- **Validación**: Verificación en cada request protegido

### Autorización
- **Middleware**: Verificación de roles en endpoints
- **Frontend**: Redirección automática según rol
- **Backend**: Endpoints protegidos por rol específico

### Validación de Datos
- **Input Validation**: express-validator en backend
- **Frontend**: Validación de formularios
- **Sanitización**: Limpieza de datos de entrada

## 📋 Endpoints API

### Autenticación (Público)
```
POST /api/auth/login
Body: { username, password }
Response: { success, token, user }
```

### Gestión de Asesores (Admin Only)
```
GET /api/admin/asesores                    # Listar asesores
POST /api/admin/crear-asesor               # Crear nuevo asesor
PUT /api/admin/actualizar-asesor/:id       # Actualizar asesor
DELETE /api/admin/eliminar-asesor/:id      # Eliminar asesor
```

## 🧪 Testing

### Probar Autenticación
1. Abrir consola del navegador en la página de login
2. Cargar el script: `test-auth.js`
3. Verificar respuestas en consola

### Verificar Base de Datos
```sql
-- Ejecutar en MySQL Workbench o Adminer
SELECT u.username, u.role, u.estado_acceso, a.nombre, a.email
FROM usuarios_sistema u 
LEFT JOIN asesores a ON u.asesor_id = a.id;
```

## 🔧 Configuración

### Variables de Entorno (.env)
```bash
JWT_SECRET=tu_jwt_secret_aqui
DB_NAME=albru
DB_USER=albru
DB_PASSWORD=albru12345
```

### Docker
```yaml
services:
  mysql:
    ports: ["3307:3306"]  # Puerto cambiado para evitar conflictos
  backend:
    ports: ["3001:3001"]
  adminer:
    ports: ["8080:8080"]
```

## 🐛 Troubleshooting

### Error de Conexión Backend
- Verificar que MySQL esté corriendo en puerto 3307
- Comprobar variables de entorno en `.env`
- Revisar logs con `docker-compose logs backend`

### Problemas de Login
- Verificar que existe el usuario en `usuarios_sistema`
- Comprobar que el `estado_acceso` sea 'activo'
- Revisar en consola de navegador errores de CORS

### Base de Datos
- Ejecutar `src/database/albru_completo_mysql.sql` para crear tablas
- Opcional: `src/database/test_usuarios.sql` para datos de prueba

## 📈 Próximos Pasos

1. **Edición de Asesores**: Implementar formulario de edición
2. **Cambio de Estado**: Activar/suspender asesores desde el panel
3. **Logs de Auditoría**: Registrar acciones administrativas
4. **Cambio de Contraseña**: Permitir que usuarios cambien su contraseña
5. **Recuperación**: Sistema de recuperación de contraseñas

---

**Estado**: ✅ Sistema completamente funcional
**Versión**: 1.0.0
**Fecha**: Enero 2025