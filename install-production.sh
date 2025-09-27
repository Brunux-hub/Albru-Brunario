#!/bin/bash

# ============================================================
# SCRIPT DE INSTALACIÓN PARA PRODUCCIÓN - SISTEMA ALBRU
# Reasignación GTR → Asesor con Backend y Base de Datos
# ============================================================

echo "🚀 Iniciando instalación del sistema Albru..."

# 1. Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instálalo desde https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js encontrado: $(node --version)"

# 2. Verificar PostgreSQL
echo "🐘 Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado. Instálalo desde https://postgresql.org/"
    exit 1
fi
echo "✅ PostgreSQL encontrado"

# 3. Crear base de datos (si no existe)
echo "🗄️ Configurando base de datos..."
createdb albru 2>/dev/null || echo "BD 'albru' ya existe"

# 4. Ejecutar script de BD
echo "📊 Ejecutando script de base de datos..."
psql -d albru -f "src/database/albru_completo.sql"

# 5. Instalar dependencias del backend
echo "⚙️ Instalando dependencias del backend..."
cd backend
npm install

# 6. Crear archivo .env para producción
echo "🔧 Configurando variables de entorno..."
cat > .env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=albru
DB_USER=albru_user
DB_PASSWORD=password
EOF

# 7. Volver al directorio raíz e instalar dependencias del frontend
cd ..
echo "🎨 Instalando dependencias del frontend..."
npm install

echo ""
echo "🎉 ¡Instalación completada!"
echo ""
echo "📋 PASOS PARA EJECUTAR EN PRODUCCIÓN:"
echo "=================================="
echo ""
echo "1️⃣ Iniciar el backend:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "2️⃣ En otra terminal, iniciar el frontend:"
echo "   npm start"
echo ""
echo "3️⃣ Acceder a:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo ""
echo "🔗 API Endpoints disponibles:"
echo "   - POST /api/clientes/reasignar"
echo "   - GET /api/clientes/asesor/:id"
echo "   - GET /api/asesores"
echo "   - GET /api/asesores/buscar/:nombre"
echo ""
echo "✅ El sistema está listo para producción!"