# Albru 3.0 - Single-Domain Multi-Tenant Architecture
# UNA SOLA IP - UNA SOLA BASE DE DATOS - INTERFACES PERSONALIZADAS

## Estructura Propuesta

```
albru-3.0/
├── frontend/                   # UNA SOLA APLICACIÓN FRONTEND
│   ├── src/
│   │   ├── components/
│   │   │   ├── shared/        # Componentes compartidos
│   │   │   ├── asesor/        # Componentes específicos asesor
│   │   │   ├── gtr/           # Componentes específicos GTR
│   │   │   └── admin/         # Componentes específicos admin
│   │   ├── pages/
│   │   │   ├── AsesorDashboard.tsx
│   │   │   ├── GtrDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── themes/            # Temas personalizados por usuario
│   │   │   ├── asesor1-theme.ts
│   │   │   ├── asesor2-theme.ts
│   │   │   └── gtr-theme.ts
│   │   └── services/
├── backend/                   # UN SOLO BACKEND
│   ├── middleware/
│   │   └── tenantAuth.js     # Identifica usuario y aplica tema
│   └── controllers/
└── database/                  # UNA SOLA BASE DE DATOS
```

## Cómo Funciona

**MISMA IP → 192.168.1.180:5173**
- Asesor 1 → Ve interfaz azul personalizada
- Asesor 2 → Ve interfaz verde personalizada  
- GTR → Ve interfaz morada con funciones GTR
- Admin → Ve interfaz roja con acceso completo

## Beneficios

1. **Una Sola IP**: Todos acceden a 192.168.1.180
2. **Una Sola BD**: Todos los datos centralizados
3. **Interfaces Personalizadas**: Cada usuario ve SU interfaz
4. **Misma Infraestructura**: Un solo servidor, una sola configuración
5. **Fácil Mantenimiento**: Un solo código base
6. **Datos Centralizados**: Todo en una sola base de datos

## Implementación Técnica

### 1. Login Único con Redirección Personalizada
```
192.168.1.180:5173/login
↓ (Usuario: asesor1)
192.168.1.180:5173/dashboard/asesor1 (Tema azul)

192.168.1.180:5173/login  
↓ (Usuario: gtr)
192.168.1.180:5173/dashboard/gtr (Tema morado)
```

### 2. Backend con Middleware de Identificación
- Detecta el usuario logueado
- Aplica configuración de tema/permisos
- Mantiene misma BD para todos

### 3. Frontend Dinámico
- Cambia colores/componentes según usuario
- Muestra solo funciones permitidas
- Una sola aplicación que se adapta

### 4. Configuración Simple
- Un solo Docker Compose
- Una sola IP
- Una sola base de datos
- Múltiples experiencias de usuario