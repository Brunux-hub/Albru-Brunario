# 🚀 INSTALACIÓN EN SERVIDOR

## ⚡ INSTRUCCIONES RÁPIDAS

### 1. Obtener IP del Servidor
```powershell
ipconfig
# Anota la IPv4 (ejemplo: 192.168.1.100)
```

### 2. Configurar .env
```powershell
notepad .env

# Reemplazar TODAS las apariciones de 192.168.1.XXX con tu IP real
# Ejemplo: Si IP es 192.168.1.100
VITE_API_URL=http://192.168.1.100:3001
VITE_BACKEND_URL=http://192.168.1.100:3001
VITE_WS_URL=http://192.168.1.100:3001
CORS_ORIGINS=http://192.168.1.100:5173,http://192.168.1.100,http://localhost
```

### 3. Levantar Docker
```powershell
docker compose up -d --build
```

### 4. Importar Base de Datos
```powershell
# Esperar 10 segundos
Start-Sleep -Seconds 10

# Importar
Get-Content database\init.sql | docker exec -i albru-base mysql -u albru -palbru12345 albru
```

### 5. Configurar Firewall
```powershell
# Como Administrador:
New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Albru Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### 6. Verificar
Desde cualquier PC en la red:
- Frontend: `http://IP_SERVIDOR`
- API: `http://IP_SERVIDOR:3001/health`

## 🔑 Credenciales
- **Admin**: admin@albru.com / admin123
- **GTR**: mcaceresv@albru.pe / password

## 🐛 Troubleshooting
```powershell
# Ver logs
docker compose logs -f

# Reiniciar servicios
docker compose restart

# Verificar contenedores
docker ps
```

¡Listo! 🎉
