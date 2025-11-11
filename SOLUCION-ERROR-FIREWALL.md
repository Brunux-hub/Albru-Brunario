# 🔥 SOLUCIÓN AL ERROR DE FIREWALL

## ❌ Error Encontrado

```
New-NetFirewallRule : Acceso denegado.
Windows System Error 5,New-NetFirewallRule
```

**Causa:** PowerShell no está ejecutándose como Administrador.

---

## ✅ SOLUCIÓN RÁPIDA

### Método 1: Abrir PowerShell Como Administrador

1. **Cerrar la PowerShell actual**

2. **Abrir PowerShell como Administrador:**
   - Click derecho en el botón de Inicio de Windows
   - Seleccionar: **"Windows PowerShell (Administrador)"**
   - O buscar "PowerShell" → Click derecho → "Ejecutar como administrador"

3. **Navegar al proyecto:**
   ```powershell
   cd C:\Users\DARIO\Albru-Brunario
   ```

4. **Ejecutar el script de nuevo:**
   ```powershell
   .\deploy-servidor\instalar-servidor.ps1
   ```

---

### Método 2: Abrir Puertos Manualmente (Como Administrador)

Si el script ya hizo todo excepto el firewall, solo ejecuta:

```powershell
# Abrir PowerShell como Administrador primero!

# Puerto 80 (Frontend)
New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Puerto 3001 (Backend API)
New-NetFirewallRule -DisplayName "Albru Backend API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# Verificar que se crearon
Get-NetFirewallRule -DisplayName "Albru*"
```

---

### Método 3: Verificar si el Sistema Ya Está Funcionando

**El error del firewall NO impide que Docker funcione**, solo bloquea el acceso desde otras PCs.

**Verifica si el sistema ya está corriendo:**

```powershell
# Ver contenedores (NO requiere admin)
docker ps

# Deberías ver:
# albru-frontend
# albru-backend  
# albru-base
```

**Prueba acceder localmente:**
```
http://localhost
```

Si funciona localmente, solo falta abrir el firewall para acceso desde la red.

---

## 🎯 Pasos Recomendados (EN ORDEN)

### 1. Verificar Estado Actual
```powershell
# Ver si Docker está corriendo
docker ps

# Ver si la base de datos se importó
docker exec albru-base mysql -u albru -palbru12345 -e "SELECT COUNT(*) FROM albru.usuarios;"
```

### 2. Si Docker está corriendo → Solo abrir firewall
```powershell
# Abrir PowerShell COMO ADMINISTRADOR
# Click derecho en Inicio → PowerShell (Administrador)

New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Albru Backend API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### 3. Si Docker NO está corriendo → Ejecutar script como Admin
```powershell
# Abrir PowerShell COMO ADMINISTRADOR
cd C:\Users\DARIO\Albru-Brunario
.\deploy-servidor\instalar-servidor.ps1
```

---

## 🔍 Cómo Saber si PowerShell es Administrador

**En la ventana de PowerShell, el título debe decir:**
```
Administrador: Windows PowerShell
```

**O ejecuta:**
```powershell
([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Debe retornar: True
```

---

## 📋 Checklist de Verificación

**Después de abrir el firewall, verificar:**

- [ ] `docker ps` muestra 3 contenedores corriendo
- [ ] `http://localhost` funciona en el servidor
- [ ] Obtener IP del servidor: `ipconfig`
- [ ] Desde tu PC: `http://IP_SERVIDOR` funciona
- [ ] Login: admin@albru.com / admin123

---

## 💡 Nota Importante

**El sistema puede estar funcionando perfectamente** incluso con este error. El error solo afecta:
- ❌ Acceso desde otras PCs en la red
- ✅ Acceso local en el servidor sigue funcionando

**Si ves los 3 contenedores corriendo con `docker ps`, el despliegue fue exitoso!**

---

## 🎯 Resumen

**Error:** Falta permisos de Administrador
**Solución:** Ejecutar PowerShell como Administrador
**Impacto:** Solo afecta firewall, Docker puede estar funcionando bien

**Comando para verificar:**
```powershell
docker ps
```

Si ves 3 contenedores, solo necesitas abrir el firewall! 🎉
