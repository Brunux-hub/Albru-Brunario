# Test de Creación de Asesor
# Ejecutar en PowerShell para probar que los datos se guarden

# 1. Primero hacer login como admin para obtener token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'

if ($loginResponse.success) {
    Write-Host "✅ Login exitoso. Token obtenido." -ForegroundColor Green
    $token = $loginResponse.token
    
    # 2. Crear un asesor de prueba
    $asesorData = @{
        nombre = "María Testez"
        email = "maria.testez@albru.com"
        telefono = "987654321"
        tipo = "asesor"
        username = "maria.testez"
        password = "password123"
        role = "asesor"
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $createResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/admin/crear-asesor" -Method POST -Headers $headers -Body $asesorData
        
        if ($createResponse.success) {
            Write-Host "✅ Asesor creado exitosamente!" -ForegroundColor Green
            Write-Host "ID del Asesor: $($createResponse.asesorId)" -ForegroundColor Cyan
            Write-Host "ID del Usuario: $($createResponse.usuarioId)" -ForegroundColor Cyan
            
            # 3. Verificar que el asesor se creó listando todos los asesores
            $listResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/admin/asesores" -Method GET -Headers $headers
            
            Write-Host "`n📊 Lista de asesores en la BD:" -ForegroundColor Yellow
            $listResponse.data | ForEach-Object {
                Write-Host "- $($_.nombre) ($($_.username)) - Estado: $($_.estado_acceso)" -ForegroundColor White
            }
        } else {
            Write-Host "❌ Error al crear asesor: $($createResponse.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error en la solicitud: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Error en login: $($loginResponse.message)" -ForegroundColor Red
}