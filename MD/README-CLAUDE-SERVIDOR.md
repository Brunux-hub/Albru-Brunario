# 📋 RESUMEN PARA EL CLAUDE DEL SERVIDOR

## 🎯 Tu Misión
Eres Claude en el servidor. Debes desplegar el sistema Albru CRM completo usando las instrucciones del repositorio Git.

---

## ⚡ COMANDOS RÁPIDOS (Copiar y Pegar)

### 1️⃣ Obtener el Código
```powershell
# Navegar a donde está el proyecto (ajusta la ruta si es diferente)
cd C:\Users\[USUARIO]\Albru-Brunario

# O si no existe, clonar desde Git:
# git clone https://github.com/Brunux-hub/Albru-Brunario.git
# cd Albru-Brunario

# Actualizar código
git pull origin main
```

### 2️⃣ Leer las Instrucciones Completas
```powershell
# Abrir el archivo de instrucciones
code INSTRUCCIONES-PARA-CLAUDE-SERVIDOR.md
```

### 3️⃣ Ejecutar Despliegue Automático (COMO ADMINISTRADOR)
```powershell
# Método A: Ejecutar el script que lo hace TODO automáticamente
# IMPORTANTE: Abrir PowerShell como Administrador primero
cd C:\Users\[USUARIO]\Albru-Brunario
.\deploy-servidor\instalar-servidor.ps1

# Método B: Seguir paso a paso el archivo INSTRUCCIONES-PARA-CLAUDE-SERVIDOR.md
```

---

## 📦 ¿Qué hace el script automáticamente?

1. ✅ **Detecta la IP del servidor** automáticamente
2. ✅ **Crea archivo .env** con la configuración correcta
3. ✅ **Construye contenedores Docker** (Frontend, Backend, MySQL)
4. ✅ **Importa la base de datos** completa (2.94 MB, 23+ usuarios)
5. ✅ **Configura el Firewall** (puertos 80 y 3001)
6. ✅ **Verifica que todo funciona** correctamente

---

## 🎯 Resultado Esperado

Al finalizar deberías ver:

```
========================================
✅ DESPLIEGUE COMPLETADO
========================================

🌐 Accede a: http://192.168.1.XXX
🔑 Admin: admin@albru.com / admin123

CONTAINER NAME         STATUS
albru-frontend         Up
albru-backend          Up
albru-base            Up

🎉 ¡Sistema listo!
```

---

## 🔑 Credenciales del Sistema

```
Admin:  admin@albru.com / admin123
GTR:    mcaceresv@albru.pe / password
Asesor: jvenancioo@albru.pe / password
```

---

## 📱 Verificación desde otra PC

Desde cualquier PC en la misma red:
1. Abrir navegador
2. Ir a: `http://[IP_DEL_SERVIDOR]`
3. Login con credenciales admin
4. ✅ ¡Listo!

---

## 🐛 Si algo falla

Ver logs:
```powershell
docker compose logs -f
```

Reiniciar todo:
```powershell
docker compose down
docker compose up -d --build
```

---

## 📖 Archivos Importantes en el Repo

- **INSTRUCCIONES-PARA-CLAUDE-SERVIDOR.md** ← TU GUÍA PRINCIPAL
- **deploy-servidor/instalar-servidor.ps1** ← Script automático
- **DEPLOY-SERVIDOR.md** ← Documentación completa
- **deploy-servidor/GUIA-VISUAL.md** ← Guía paso a paso visual
- **database/init.sql** ← Base de datos completa (2.94 MB)

---

## ✅ Checklist Final

Antes de reportar éxito, verifica:

- [ ] `git pull` ejecutado exitosamente
- [ ] `docker ps` muestra 3 contenedores corriendo
- [ ] Base de datos tiene ~23 usuarios
- [ ] Frontend accesible en `http://localhost`
- [ ] Backend responde en `http://localhost:3001/health`
- [ ] Login funciona con admin@albru.com / admin123
- [ ] Acceso funciona desde otra PC en la red

---

## 🎉 ¡Todo Listo!

Una vez completado:
- El sistema estará disponible 24/7 (mientras el servidor esté encendido)
- Accesible desde cualquier PC en la red local
- Base de datos persistente
- Logs automáticos

**¡Éxito en tu despliegue!** 🚀
