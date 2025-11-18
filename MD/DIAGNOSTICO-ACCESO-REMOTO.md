# 🔍 GUÍA DE DIAGNÓSTICO - Acceso desde otra PC

## 1️⃣ Verificar Conectividad de Red

Desde la **otra PC**, abre PowerShell y ejecuta:

```powershell
# Verificar que puedes hacer ping a tu servidor
ping 192.168.1.44

# Probar conexión al puerto 5173 (Frontend)
Test-NetConnection -ComputerName 192.168.1.44 -Port 5173

# Probar conexión al puerto 3001 (Backend - opcional)
Test-NetConnection -ComputerName 192.168.1.44 -Port 3001
```

**Resultado esperado:**
- ✅ `TcpTestSucceeded : True` para ambos puertos

---

## 2️⃣ Abrir Navegador

Desde la **otra PC**, abre un navegador y ve a:

```
http://192.168.1.44:5173
```

---

## 3️⃣ Verificar Consola del Navegador

Presiona `F12` para abrir DevTools y revisa la consola:

**✅ Deberías ver:**
```
🔌 [useSocket] URL de WebSocket configurada: http://192.168.1.44:5173
✅ Socket conectado: <socket-id>
✅ Socket autenticado: {...}
```

**❌ Si ves errores como:**
```
❌ Error de conexión Socket: <error>
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

Entonces hay un problema de firewall o red.

---

## 4️⃣ Verificar Network Tab

En DevTools, ve a la pestaña **Network**:

- Filtra por `WS` (WebSocket)
- Deberías ver una conexión a `ws://192.168.1.44:5173/socket.io/...`
- Estado: `101 Switching Protocols` (conexión exitosa)

---

## 5️⃣ Problema: Firewall Bloqueando

Si los puertos están bloqueados, **en tu laptop (192.168.1.44)**, ejecuta como **Administrador**:

```powershell
# Clic derecho en PowerShell -> Ejecutar como Administrador
cd C:\Users\DARIO\Albru-Brunario
.\abrir-puertos-firewall.ps1
```

---

## 6️⃣ Alternativa: Desactivar Firewall Temporalmente

**Solo para pruebas**, puedes desactivar temporalmente el firewall:

1. Buscar "Firewall de Windows Defender"
2. Clic en "Activar o desactivar Firewall de Windows Defender"
3. Desactivar para "Red privada"
4. Probar conexión desde otra PC
5. **¡IMPORTANTE!** Volver a activar después

---

## 7️⃣ Verificar que Docker Está Corriendo

En tu laptop:

```powershell
docker-compose ps
```

Deberías ver:
- `albru-frontend` → Up
- `albru-backend` → Up
- `albru-base` (MySQL) → Up
- `albru-redis` → Up

---

## 8️⃣ Ver Logs en Tiempo Real

Para ver qué está pasando cuando la otra PC se conecta:

```powershell
# Logs del frontend (Nginx)
docker logs -f albru-frontend

# Logs del backend (Socket.io)
docker logs -f albru-backend
```

Deberías ver las peticiones HTTP llegando cuando accedas desde la otra PC.

---

## 9️⃣ Comandos de Emergencia

Si algo falla, reinicia los contenedores:

```powershell
docker-compose restart
```

O reconstruye todo:

```powershell
docker-compose down
docker-compose up -d --build
```

---

## 🆘 Problemas Comunes

### Problema: "No se puede acceder al sitio"
**Causa:** Firewall bloqueando puerto 5173
**Solución:** Ejecutar `abrir-puertos-firewall.ps1` como Admin

### Problema: "WebSocket failed to connect"
**Causa:** Navegador intenta conectar a `:3001` en lugar de `:5173`
**Solución:** Ya corregido - WebSocket ahora usa `window.location.origin`

### Problema: "API calls work but no real-time updates"
**Causa:** WebSocket no conectado
**Solución:** Revisar consola del navegador (F12) y verificar firewall

### Problema: "CORS error"
**Causa:** Backend rechazando peticiones desde la IP
**Solución:** Ya configurado - CORS acepta `192.168.1.44:5173`

---

## ✅ Checklist de Verificación

- [ ] Ping a 192.168.1.44 funciona
- [ ] Puerto 5173 responde (Test-NetConnection)
- [ ] Navegador carga http://192.168.1.44:5173
- [ ] Login funciona
- [ ] Consola muestra "Socket conectado"
- [ ] Peticiones API funcionan (Network tab)
- [ ] WebSocket conectado (Network tab, filtro WS)
- [ ] Actualizaciones en tiempo real funcionan

---

## 📞 Soporte

Si todo lo anterior falla, comparte:

1. Resultado de `Test-NetConnection` desde la otra PC
2. Screenshot de la consola del navegador (F12)
3. Screenshot de Network tab mostrando WebSocket
4. Resultado de `docker-compose ps` en tu laptop
