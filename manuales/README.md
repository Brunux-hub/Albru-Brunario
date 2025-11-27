# 📚 ÍNDICE DE MANUALES - ALBRU BRUNARIO CRM

## 🎯 ¿QUÉ MANUAL NECESITAS?

Esta carpeta contiene **TODA** la documentación del sistema CRM. Elige según tu necesidad:

---

## 👤 PARA USUARIOS DEL SISTEMA

### 📖 [`MANUAL-USUARIO-SISTEMA-CRM.md`](./MANUAL-USUARIO-SISTEMA-CRM.md)
**Úsalo para:** Operación diaria del sistema

**Contiene:**
- ✅ Cómo iniciar/detener el sistema
- ✅ Usar sistema CRUD Python
- ✅ Crear y restaurar backups
- ✅ Usar panel web de validaciones
- ✅ Entender contador de reasignaciones
- ✅ Solución de problemas comunes

**Ideal para:**
- Administradores
- Personal operativo
- Usuarios avanzados

---

## 🤖 PARA ASISTENTES IA (GROK, CLAUDE, ETC.)

### 🔧 [`INSTRUCCIONES-PARA-GROK-MIGRACION-COMPLETA.md`](./INSTRUCCIONES-PARA-GROK-MIGRACION-COMPLETA.md)
**Úsalo para:** Migrar el sistema a una PC nueva desde cero

**Contiene:**
- ✅ Paso a paso desde `git clone` hasta sistema funcionando
- ✅ Cómo restaurar backups con script Python
- ✅ Cómo restaurar backups manualmente (SQL)
- ✅ Aplicar migración de contador de reasignaciones
- ✅ Verificar que todo funciona correctamente
- ✅ Solución de problemas durante migración

**Ideal para:**
- Configurar sistema en PC nueva
- Migración entre computadoras
- Restauración después de fallo
- Setup inicial de desarrollo

---

## 📂 OTROS DOCUMENTOS IMPORTANTES

### En la raíz del proyecto:

1. **[`GUIA-BACKUP-Y-MIGRACION.md`](../GUIA-BACKUP-Y-MIGRACION.md)**
   - Guía detallada de 45 páginas sobre backups
   - Proceso completo de migración
   - Troubleshooting extenso

2. **[`RESUMEN-SOLUCIONES.md`](../RESUMEN-SOLUCIONES.md)**
   - Resumen de las 3 soluciones principales
   - Sistema CRUD Python
   - Script de backup/restauración
   - Diagnóstico panel GTR

3. **[`IMPLEMENTACION-COMPLETA-RESPUESTAS.md`](../IMPLEMENTACION-COMPLETA-RESPUESTAS.md)**
   - Respuestas a consultas específicas
   - Backup y restauración
   - Pandas e interfaces
   - Contador de reasignaciones

### En carpeta `docs/`:

4. **[`docs/DIAGNOSTICO-GTR-GESTIONES.md`](../docs/DIAGNOSTICO-GTR-GESTIONES.md)**
   - Análisis técnico del panel GTR
   - Por qué no se mostraban todas las gestiones
   - Solución implementada

### En carpeta `scripts/`:

5. **[`scripts/README.md`](../scripts/README.md)**
   - Documentación de scripts Python
   - `crud_clientes_sistema.py`
   - `backup_y_diagnostico.py`
   - `restaurar_backup.py`

---

## 🚀 INICIO RÁPIDO

### Si eres usuario nuevo:
1. Lee [`MANUAL-USUARIO-SISTEMA-CRM.md`](./MANUAL-USUARIO-SISTEMA-CRM.md)
2. Sigue la sección "Inicio Rápido"
3. Prueba el sistema CRUD Python

### Si vas a migrar el sistema:
1. Crea backup en PC actual: `python scripts/backup_y_diagnostico.py`
2. En PC nueva, sigue [`INSTRUCCIONES-PARA-GROK-MIGRACION-COMPLETA.md`](./INSTRUCCIONES-PARA-GROK-MIGRACION-COMPLETA.md)
3. Restaura backup: `python scripts/restaurar_backup.py`

### Si tienes un problema:
1. Revisa "Solución de Problemas" en el manual de usuario
2. Consulta logs: `docker logs <contenedor>`
3. Revisa [`GUIA-BACKUP-Y-MIGRACION.md`](../GUIA-BACKUP-Y-MIGRACION.md)

---

## 📊 NUEVAS FUNCIONALIDADES (Nov 2024)

### ✨ Contador de Reasignaciones

**¿Qué es?**
Campo automático que cuenta cuántas veces un cliente ha sido reasignado entre asesores.

**¿Dónde verlo?**
- Panel web de Validaciones (nueva columna con badges de colores)
- Sistema CRUD Python (en datos del cliente)
- Reportes SQL

**Colores:**
- 🟢 Verde "Original" = 0 reasignaciones
- 🟡 Amarillo "1x", "2x" = 1-2 reasignaciones
- 🔴 Rojo "3x+" = 3+ reasignaciones (evitar reasignar)

**Documentación:**
- Manual de usuario, sección "Nuevo: Contador de Reasignaciones"
- Migración SQL: `backend/migrations/20241126_agregar_contador_reasignaciones.sql`

---

## 🛠️ SCRIPTS DISPONIBLES

### Python

```powershell
# Sistema CRUD completo
python scripts/crud_clientes_sistema.py

# Crear backup con diagnóstico
python scripts/backup_y_diagnostico.py

# Restaurar backup en otra PC
python scripts/restaurar_backup.py
```

### Backup Manual

```powershell
# Solo SQL
docker exec albru-base mysqldump -ualbru -palbru12345 --no-tablespaces albru > backup.sql

# Restaurar SQL
Get-Content backup.sql | docker exec -i albru-base mysql -ualbru -palbru12345 albru
```

### Docker

```powershell
# Iniciar sistema
docker-compose up -d

# Ver estado
docker ps

# Ver logs
docker logs -f albru-backend

# Reiniciar contenedor
docker restart albru-backend

# Detener sistema
docker-compose down
```

---

## 📞 ESTRUCTURA DE AYUDA

```
┌─────────────────────────────────────────────────────────────────┐
│                     ¿TIENES UN PROBLEMA?                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ¿Error al iniciar el sistema?                              │
│     → Manual Usuario > Solución de Problemas                   │
│                                                                 │
│  2. ¿Migrar a nueva PC?                                        │
│     → Instrucciones para Grok                                  │
│                                                                 │
│  3. ¿Crear/Restaurar backup?                                   │
│     → Guía Backup y Migración (raíz del proyecto)             │
│                                                                 │
│  4. ¿Usar scripts Python?                                      │
│     → scripts/README.md                                        │
│                                                                 │
│  5. ¿Problema con panel GTR?                                   │
│     → docs/DIAGNOSTICO-GTR-GESTIONES.md                        │
│                                                                 │
│  6. ¿Entender nuevas funcionalidades?                          │
│     → IMPLEMENTACION-COMPLETA-RESPUESTAS.md                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE DOCUMENTACIÓN

Antes de migrar o hacer cambios importantes, verifica que tienes:

- [ ] Backup reciente creado
- [ ] Manual de usuario leído
- [ ] Scripts Python probados
- [ ] Credenciales de BD conocidas (.env)
- [ ] IP de la red conocida
- [ ] Docker funcionando correctamente

---

## 📅 HISTORIAL DE VERSIONES

### v3.0 - 26 Nov 2024
- ✅ Agregado contador de reasignaciones
- ✅ Script de restauración de backups
- ✅ Corrección panel GTR
- ✅ Manuales completos creados

### v2.0 - 12 Nov 2024
- Sistema CRUD Python
- Script de backup con diagnóstico
- Guía de migración

### v1.0 - Oct 2024
- Sistema CRM base
- Dockerización completa
- Panel de validaciones

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Leer manual de usuario** si eres nuevo
2. **Crear primer backup** para estar seguro
3. **Probar sistema CRUD** para familiarizarte
4. **Configurar backups automáticos** (semanales)
5. **Entrenar equipo** en nuevas funcionalidades

---

**Fecha:** 26 de noviembre de 2024
**Autor:** Claude (Anthropic)
**Sistema:** Albru Brunario CRM v3.0
**Contacto:** Consultar documentación adicional o logs del sistema

---

## 📖 LECTURA RECOMENDADA POR ROL

### 👨‍💼 Administrador/Gerente
1. Manual de Usuario (todo)
2. Resumen de Soluciones
3. Diagnóstico GTR

### 👨‍💻 Técnico/Desarrollador
1. Instrucciones para Grok
2. Guía de Backup y Migración
3. scripts/README.md
4. Migraciones SQL

### 👤 Usuario Final
1. Manual de Usuario > Inicio Rápido
2. Manual de Usuario > Panel Web
3. Manual de Usuario > Solución de Problemas

### 🤖 IA/Asistente Automatizado
1. Instrucciones para Grok (COMPLETO)
2. scripts/README.md
3. Guía de Backup y Migración

---

¡Toda la documentación está lista y actualizada! 🎉
