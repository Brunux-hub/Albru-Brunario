# 🤖 Asistente de Código IA Local - CRM Albru

Asistente de código con IA local usando modelos open source de alta calidad, específicamente entrenados para desarrollo de software.

## 🎯 Características

- ✅ **100% Local y Privado**: No envía tu código a internet
- 🚀 **Alta Precisión**: Usa modelos especializados en código (Qwen2.5-Coder o DeepSeek-Coder-V2)
- 🧠 **Contexto del Proyecto**: Entiende la estructura de tu CRM (React, Node.js, MySQL)
- 📝 **Modifica Código**: Puede leer, analizar y sugerir cambios precisos
- 💻 **Ejecuta Comandos**: Git, Docker, npm, etc.
- 🔍 **Búsqueda de Código**: Encuentra patrones en tu proyecto

## 📋 Requisitos

### Hardware Mínimo:
- **CPU**: 4 cores
- **RAM**: 
  - 32GB para qwen2.5-coder:32b (mejor calidad)
  - 16GB para qwen2.5-coder:14b (balance)
  - 12GB para qwen2.5-coder:7b (mínimo)
- **Disco**: 20-40GB libres (para el modelo)
- **GPU**: Opcional pero recomendado (acelera 10-20x)

### Software:
- Python 3.9 o superior
- [Ollama](https://ollama.ai) (gestor de modelos IA)

## 🚀 Instalación

### 1. Instalar Ollama

**Windows:**
```powershell
# Descargar de https://ollama.ai y ejecutar el instalador
# O con winget:
winget install Ollama.Ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Mac:**
```bash
brew install ollama
```

### 2. Instalar Dependencias Python

```bash
cd ai-assistant
pip install -r requirements.txt
```

### 3. Descargar Modelo de IA

Elige según tu hardware:

```bash
# Mejor calidad (32GB RAM necesarios)
python assistant.py install-model qwen2.5-coder:32b

# Balance calidad/recursos (16GB RAM)
python assistant.py install-model qwen2.5-coder:14b

# Mínimo (12GB RAM)
python assistant.py install-model qwen2.5-coder:7b

# Alternativa: DeepSeek Coder V2
python assistant.py install-model deepseek-coder-v2:16b
```

## 💡 Uso

### Modo Interactivo (Recomendado)

```bash
cd ai-assistant
python assistant.py chat
```

Comandos disponibles en el chat:
- `/read <archivo>` - Leer un archivo del proyecto
- `/search <texto>` - Buscar en el código
- `/exec <comando>` - Ejecutar comando (git, docker, npm)
- `/clear` - Limpiar historial de conversación
- `/exit` - Salir

### Pregunta Única

```bash
python assistant.py ask "¿Cómo puedo agregar validación de email en el formulario de registro?"
```

## 📝 Ejemplos de Uso

### Ejemplo 1: Análisis de Código
```
Tú: ¿Cómo funciona el sistema de autenticación?
Asistente: El sistema usa JWT. Analicé backend/middleware/auth.js...
```

### Ejemplo 2: Modificar Funcionalidad
```
Tú: Necesito agregar un filtro por fecha en la tabla de clientes
Asistente: Puedo ayudarte. Necesitarás modificar:
1. Frontend: src/components/gtr/GtrClientsTable.tsx
2. Backend: backend/controllers/clientesController.js
...
```

### Ejemplo 3: Debug
```
Tú: /read src/components/asesor/GestionarClienteDialog.tsx
[Muestra el código]
Tú: Este componente tiene un error de tipo en línea 1919
Asistente: Veo el problema. cliente.id puede ser undefined...
```

### Ejemplo 4: Crear Funcionalidad Nueva
```
Tú: Quiero agregar un sistema de notificaciones push cuando un GTR asigna un cliente
Asistente: Para implementar esto necesitamos:
1. Backend: Socket.io event 'cliente_asignado'
2. Frontend: Hook useNotifications + componente NotificationBell
3. Base datos: tabla 'notificaciones'
...
```

## 🎯 Modelos Recomendados

### Qwen2.5-Coder-32B ⭐⭐⭐⭐⭐
- **Calidad**: Excelente (casi igual a Claude)
- **RAM**: 32GB
- **Velocidad**: Media
- **Uso**: Proyectos profesionales

### Qwen2.5-Coder-14B ⭐⭐⭐⭐
- **Calidad**: Muy buena
- **RAM**: 16GB
- **Velocidad**: Rápida
- **Uso**: Desarrollo diario

### DeepSeek-Coder-V2-16B ⭐⭐⭐⭐
- **Calidad**: Muy buena
- **RAM**: 12GB
- **Velocidad**: Rápida
- **Uso**: Alternativa a Qwen

### Qwen2.5-Coder-7B ⭐⭐⭐
- **Calidad**: Buena
- **RAM**: 8GB
- **Velocidad**: Muy rápida
- **Uso**: Máquinas con recursos limitados

## 🔧 Configuración Avanzada

### Usar GPU (Mucho más rápido)

El asistente detectará automáticamente tu GPU NVIDIA si tienes CUDA instalado.

```bash
# Verificar que Ollama usa GPU
ollama run qwen2.5-coder:32b "test" --verbose
```

### Ajustar Parámetros del Modelo

Edita `assistant.py` en la función `chat()`:

```python
options={
    "temperature": 0.7,    # Creatividad (0-1, menor = más preciso)
    "top_p": 0.9,         # Diversidad de respuestas
    "num_ctx": 8192,      # Tokens de contexto
}
```

## 📊 Comparación de Calidad

| Modelo | Calidad Código | Velocidad | RAM | Costo |
|--------|---------------|-----------|-----|-------|
| Claude Sonnet 4 | ⭐⭐⭐⭐⭐ | Rápida | N/A | $3-15/mes |
| Qwen2.5-Coder 32B | ⭐⭐⭐⭐ | Media | 32GB | Gratis |
| DeepSeek-Coder-V2 | ⭐⭐⭐⭐ | Rápida | 12GB | Gratis |
| Qwen2.5-Coder 14B | ⭐⭐⭐½ | Rápida | 16GB | Gratis |

## 🐛 Solución de Problemas

### "Ollama no responde"
```bash
# Windows
ollama serve

# Linux/Mac
systemctl start ollama
```

### "Modelo no encontrado"
```bash
ollama list  # Ver modelos instalados
python assistant.py install-model qwen2.5-coder:32b
```

### "Muy lento"
- Usa un modelo más pequeño (7B o 14B)
- Activa GPU si tienes NVIDIA
- Cierra otras aplicaciones

### "Se queda sin memoria"
- Usa un modelo más pequeño
- Reduce `num_ctx` en el código
- Cierra otras aplicaciones

## 🎓 Tutoriales

### Tutorial 1: Análisis de Componente
```bash
python assistant.py chat

> /read src/components/gtr/GtrClientsTable.tsx
> Explica cómo funciona este componente y sugiere mejoras de rendimiento
```

### Tutorial 2: Crear Feature Completo
```bash
> Necesito agregar un sistema de favoritos donde el asesor pueda marcar clientes
> El asesor debe poder filtrar solo sus favoritos
> Implementa backend y frontend completo
```

### Tutorial 3: Debug de Error
```bash
> /search "TypeError: Cannot read"
> Tengo este error en producción, ayúdame a debuggearlo
```

## 📚 Recursos

- [Documentación Ollama](https://github.com/ollama/ollama)
- [Qwen2.5-Coder Paper](https://arxiv.org/abs/2409.12186)
- [DeepSeek-Coder](https://github.com/deepseek-ai/DeepSeek-Coder)

## 🤝 Contribuir

Si encuentras bugs o tienes sugerencias, crea un issue o pull request.

## 📄 Licencia

MIT License - Uso libre para proyectos comerciales y personales.

---

**Nota**: Este asistente es específico para el CRM Albru. El modelo aprende de tu código y estructura, proporcionando respuestas contextualizadas a tu proyecto.
