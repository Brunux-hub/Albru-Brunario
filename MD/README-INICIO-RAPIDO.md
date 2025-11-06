# 🚀 INICIO RÁPIDO - ALBRU CRM

## ⚡ PARA MAÑANA (2 MINUTOS)

### **Opción 1: Script Automático** (Recomendado)
```powershell
.\START.ps1
```

### **Opción 2: Manual**
```powershell
# 1. Iniciar Docker Desktop (espera que cargue)
# 2. Levantar servicios
docker-compose up -d

# 3. Verificar que todo esté corriendo
docker-compose ps
```

---

## 🌐 **ACCESO AL SISTEMA**

Una vez iniciado, accede a:

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001  
- **Base de Datos UI**: http://localhost:8080

---

## 📊 **VERIFICAR ESTADO**

```powershell
# Ver servicios corriendo
docker-compose ps

# Ver logs del backend
docker-compose logs -f backend

# Ver logs de todos los servicios
docker-compose logs -f
```

---

## 🔧 **SI ALGO FALLA**

### **Backend no arranca**
```powershell
docker-compose restart backend
docker-compose logs backend
```

### **Reconstruir todo desde cero**
```powershell
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### **Verificar base de datos**
```powershell
docker-compose logs db
```

---

## 📚 **DOCUMENTACIÓN COMPLETA**

Lee el archivo **`SISTEMA_IMPLEMENTADO.md`** para:
- Stack tecnológico completo
- Configuración detallada
- API endpoints disponibles
- Arquitectura del sistema
- Troubleshooting avanzado

---

## ✅ **LO QUE TIENES**

✅ Sistema profesional de call center CRM  
✅ Gestión de sesiones con Redis + MySQL  
✅ WebSocket con Socket.io  
✅ Worker automático de timeouts  
✅ State management con Zustand  
✅ API REST completa  
✅ Sin hardcodeo, todo configurable  
✅ Listo para producción  

---

## 🎯 **FUNCIONALIDADES PRINCIPALES**

1. **Derivación de clientes** (GTR → Asesor)
2. **Gestión en tiempo real** (Wizard con heartbeat)
3. **Timeouts automáticos** (10 minutos inactividad)
4. **Retorno a GTR** (Si no se gestiona)
5. **Tracking completo** (Historial de estados)

---

## 💪 **¡ÉXITO CON TU ENTREGA!**

El sistema está **100% funcional** y listo para demostración.

---

## 🆘 **SOPORTE RÁPIDO**

Si algo no funciona:
1. ✅ Verifica Docker Desktop esté corriendo
2. ✅ Ejecuta `.\START.ps1`  
3. ✅ Revisa logs: `docker-compose logs backend`
4. ✅ Lee `SISTEMA_IMPLEMENTADO.md`
