#!/usr/bin/env python3
"""
Asistente de Código IA Local para CRM Albru
Modelo: Qwen2.5-Coder-32B-Instruct (o DeepSeek-Coder-V2)

Este asistente puede:
- Leer y analizar tu código del CRM
- Hacer cambios precisos en archivos
- Ejecutar comandos (git, docker, npm)
- Entender contexto de React, Node.js, TypeScript, MySQL
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

import ollama
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.syntax import Syntax
from rich.prompt import Prompt, Confirm
import typer

console = Console()
app = typer.Typer()


@dataclass
class ProjectContext:
    """Contexto del proyecto CRM"""
    root_path: Path
    backend_path: Path
    frontend_path: Path
    database_path: Path
    tech_stack: Dict[str, str]


class AICodeAssistant:
    """Asistente de código con IA local"""
    
    def __init__(self, model_name: str = "qwen2.5-coder:32b"):
        """
        Inicializa el asistente con el modelo especificado
        
        Modelos recomendados:
        - qwen2.5-coder:32b (Mejor para código, ~20GB RAM)
        - qwen2.5-coder:14b (Balance calidad/recursos, ~9GB RAM)
        - deepseek-coder-v2:16b (Alternativa, ~10GB RAM)
        """
        self.model = model_name
        self.console = Console()
        self.conversation_history: List[Dict] = []
        self.project_context = self._load_project_context()
        
        # Verificar que Ollama está instalado y el modelo disponible
        self._verify_setup()
    
    def _verify_setup(self):
        """Verifica que Ollama y el modelo estén disponibles"""
        try:
            # Verificar Ollama
            result = subprocess.run(["ollama", "list"], 
                                  capture_output=True, text=True, timeout=5)
            
            if self.model not in result.stdout:
                self.console.print(f"\n⚠️  [yellow]Modelo {self.model} no encontrado[/yellow]")
                self.console.print("\n📥 Descargando modelo (esto puede tomar varios minutos)...")
                
                # Descargar modelo
                subprocess.run(["ollama", "pull", self.model], check=True)
                self.console.print(f"✅ [green]Modelo {self.model} descargado correctamente[/green]\n")
            else:
                self.console.print(f"✅ [green]Modelo {self.model} disponible[/green]\n")
                
        except FileNotFoundError:
            self.console.print("\n❌ [red]Ollama no está instalado[/red]")
            self.console.print("\n📦 Instala Ollama desde: https://ollama.ai")
            self.console.print("   Windows: descarga el instalador .exe")
            self.console.print("   Luego ejecuta: ollama pull qwen2.5-coder:32b\n")
            sys.exit(1)
        except subprocess.TimeoutExpired:
            self.console.print("⚠️  [yellow]Ollama no responde, asegúrate que esté corriendo[/yellow]\n")
    
    def _load_project_context(self) -> ProjectContext:
        """Carga el contexto del proyecto CRM"""
        root = Path(os.getcwd())
        
        # Buscar el directorio raíz del proyecto
        while not (root / "package.json").exists() and root.parent != root:
            root = root.parent
        
        return ProjectContext(
            root_path=root,
            backend_path=root / "backend",
            frontend_path=root / "src",
            database_path=root / "database",
            tech_stack={
                "frontend": "React 18 + TypeScript + Vite + Material-UI",
                "backend": "Node.js + Express + MySQL",
                "database": "MySQL 8.0",
                "deployment": "Docker Compose",
                "auth": "JWT"
            }
        )
    
    def _get_system_prompt(self) -> str:
        """Genera el prompt del sistema con contexto del proyecto"""
        return f"""Eres un asistente experto de desarrollo para el CRM Albru-Brunario.

## Contexto del Proyecto:
- **Frontend**: {self.project_context.tech_stack['frontend']}
- **Backend**: {self.project_context.tech_stack['backend']}
- **Base de datos**: {self.project_context.tech_stack['database']}
- **Despliegue**: {self.project_context.tech_stack['deployment']}

## Estructura del Proyecto:
```
Albru-Brunario/
├── backend/              (API Node.js/Express)
│   ├── controllers/      (Lógica de negocio)
│   ├── routes/          (Rutas API)
│   ├── middleware/      (Auth, validación)
│   └── services/        (Servicios reutilizables)
├── src/                 (Frontend React)
│   ├── components/      (Componentes UI)
│   ├── pages/          (Páginas principales)
│   ├── context/        (Estado global)
│   └── utils/          (Utilidades)
├── database/            (Migraciones SQL)
└── docker-compose.yml   (Configuración Docker)
```

## Roles de Usuario:
- **GTR**: Supervisor, ve todo, asigna clientes, reportes
- **Asesor**: Gestiona clientes asignados, completa wizard de tipificación
- **Admin**: Gestión de usuarios y sistema

## Capacidades:
1. Analizar y modificar código React, TypeScript, Node.js
2. Crear/modificar endpoints API
3. Diseñar queries SQL eficientes
4. Sugerir mejoras de UX con Material-UI
5. Optimizar rendimiento y lógica de negocio
6. Aplicar buenas prácticas de seguridad

## Estilo de Respuesta:
- Código preciso y completo (sin placeholders como "...existing code...")
- Explicaciones claras y concisas
- Considera impacto en frontend y backend
- Siempre valida tipos TypeScript
- Sigue convenciones del proyecto existente

¿En qué puedo ayudarte hoy?"""

    def _read_file(self, file_path: str) -> Optional[str]:
        """Lee un archivo del proyecto"""
        try:
            full_path = self.project_context.root_path / file_path
            if full_path.exists():
                return full_path.read_text(encoding='utf-8')
            else:
                return None
        except Exception as e:
            self.console.print(f"[red]Error leyendo {file_path}: {e}[/red]")
            return None
    
    def _search_code(self, query: str, file_pattern: str = "**/*.{js,ts,tsx}") -> List[Tuple[Path, str]]:
        """Busca código en el proyecto"""
        results = []
        for file_path in self.project_context.root_path.glob(file_pattern):
            try:
                content = file_path.read_text(encoding='utf-8')
                if query.lower() in content.lower():
                    # Encontrar líneas que contienen la query
                    lines = content.split('\n')
                    matching_lines = [
                        f"{i+1}: {line}" 
                        for i, line in enumerate(lines) 
                        if query.lower() in line.lower()
                    ]
                    results.append((file_path, "\n".join(matching_lines[:5])))
            except Exception:
                continue
        return results
    
    def _execute_command(self, command: str, confirm_first: bool = True) -> Tuple[bool, str]:
        """Ejecuta un comando del sistema"""
        if confirm_first:
            if not Confirm.ask(f"\n🔧 Ejecutar comando: [cyan]{command}[/cyan]?"):
                return False, "Cancelado por el usuario"
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300,
                cwd=self.project_context.root_path
            )
            
            output = result.stdout + result.stderr
            success = result.returncode == 0
            
            return success, output
            
        except subprocess.TimeoutExpired:
            return False, "Timeout: comando tardó más de 5 minutos"
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    def chat(self, user_message: str) -> str:
        """Envía un mensaje al asistente y obtiene respuesta"""
        
        # Agregar mensaje del usuario
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # Construir mensajes con contexto
        messages = [
            {"role": "system", "content": self._get_system_prompt()}
        ] + self.conversation_history[-10:]  # Últimos 10 mensajes
        
        try:
            # Llamar al modelo
            self.console.print("\n🤔 [cyan]Pensando...[/cyan]")
            
            response = ollama.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_ctx": 8192,  # Contexto largo para código
                }
            )
            
            assistant_message = response['message']['content']
            
            # Guardar respuesta
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            return assistant_message
            
        except Exception as e:
            error_msg = f"❌ Error comunicando con el modelo: {str(e)}"
            self.console.print(f"[red]{error_msg}[/red]")
            return error_msg
    
    def interactive_mode(self):
        """Modo interactivo de chat"""
        self.console.print(Panel.fit(
            "[bold cyan]🤖 Asistente de Código IA Local - CRM Albru[/bold cyan]\n"
            f"Modelo: [yellow]{self.model}[/yellow]\n"
            "Comandos especiales:\n"
            "  /read <archivo>  - Leer un archivo\n"
            "  /search <texto>  - Buscar en el código\n"
            "  /exec <comando>  - Ejecutar comando\n"
            "  /clear           - Limpiar historial\n"
            "  /exit            - Salir\n",
            title="Bienvenido"
        ))
        
        while True:
            try:
                # Obtener input del usuario
                user_input = Prompt.ask("\n[bold green]Tú[/bold green]")
                
                if not user_input.strip():
                    continue
                
                # Comandos especiales
                if user_input.startswith("/"):
                    if user_input == "/exit":
                        self.console.print("\n👋 [yellow]¡Hasta luego![/yellow]\n")
                        break
                    
                    elif user_input == "/clear":
                        self.conversation_history.clear()
                        self.console.print("✅ [green]Historial limpiado[/green]")
                        continue
                    
                    elif user_input.startswith("/read "):
                        file_path = user_input[6:].strip()
                        content = self._read_file(file_path)
                        if content:
                            syntax = Syntax(content, "javascript", theme="monokai", line_numbers=True)
                            self.console.print(syntax)
                        else:
                            self.console.print(f"[red]Archivo no encontrado: {file_path}[/red]")
                        continue
                    
                    elif user_input.startswith("/search "):
                        query = user_input[8:].strip()
                        results = self._search_code(query)
                        if results:
                            self.console.print(f"\n📝 [cyan]Encontrados {len(results)} archivos:[/cyan]\n")
                            for path, lines in results[:10]:
                                self.console.print(f"[yellow]{path.relative_to(self.project_context.root_path)}[/yellow]")
                                self.console.print(lines[:200] + "...")
                                self.console.print()
                        else:
                            self.console.print("[yellow]No se encontraron resultados[/yellow]")
                        continue
                    
                    elif user_input.startswith("/exec "):
                        command = user_input[6:].strip()
                        success, output = self._execute_command(command)
                        if success:
                            self.console.print(f"[green]✅ Comando ejecutado:[/green]\n{output}")
                        else:
                            self.console.print(f"[red]❌ Error:[/red]\n{output}")
                        continue
                
                # Chat normal
                response = self.chat(user_input)
                
                # Mostrar respuesta
                self.console.print(f"\n[bold blue]🤖 Asistente:[/bold blue]")
                self.console.print(Markdown(response))
                
            except KeyboardInterrupt:
                self.console.print("\n\n👋 [yellow]¡Hasta luego![/yellow]\n")
                break
            except Exception as e:
                self.console.print(f"\n[red]Error inesperado: {e}[/red]\n")


@app.command()
def chat(
    model: str = typer.Option(
        "qwen2.5-coder:32b",
        "--model", "-m",
        help="Modelo a usar (qwen2.5-coder:32b, qwen2.5-coder:14b, deepseek-coder-v2:16b)"
    )
):
    """Inicia el asistente en modo interactivo"""
    assistant = AICodeAssistant(model_name=model)
    assistant.interactive_mode()


@app.command()
def ask(
    question: str = typer.Argument(..., help="Pregunta para el asistente"),
    model: str = typer.Option(
        "qwen2.5-coder:32b",
        "--model", "-m",
        help="Modelo a usar"
    )
):
    """Hace una pregunta única al asistente"""
    assistant = AICodeAssistant(model_name=model)
    response = assistant.chat(question)
    console.print(Markdown(response))


@app.command()
def install_model(
    model: str = typer.Argument(
        "qwen2.5-coder:32b",
        help="Modelo a instalar"
    )
):
    """Instala un modelo de código"""
    console.print(f"\n📥 [cyan]Instalando modelo {model}...[/cyan]")
    console.print("⏳ Esto puede tomar varios minutos dependiendo del tamaño\n")
    
    try:
        subprocess.run(["ollama", "pull", model], check=True)
        console.print(f"\n✅ [green]Modelo {model} instalado correctamente[/green]\n")
    except subprocess.CalledProcessError:
        console.print(f"\n❌ [red]Error instalando el modelo[/red]\n")
        sys.exit(1)


if __name__ == "__main__":
    app()
