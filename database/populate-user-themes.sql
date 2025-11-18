-- Script para poblar configuraciones de usuario dinámicas

-- Asesores con temas únicos
UPDATE usuarios SET 
    theme_primary = '#2196f3',
    theme_secondary = '#ff9800', 
    theme_accent = '#64b5f6',
    theme_background = '#e3f2fd',
    theme_surface = '#ffffff',
    brand_name = 'Jeyson Venancio - Asesor',
    logo_path = '/assets/logo-jvenancioo.png',
    permissions = JSON_ARRAY('view_clients', 'edit_clients', 'create_clients', 'wizard_access'),
    dashboard_path = '/dashboard/asesor'
WHERE email = 'jvenancioo@albru.pe';

UPDATE usuarios SET 
    theme_primary = '#e91e63',
    theme_secondary = '#9c27b0',
    theme_accent = '#f48fb1',
    theme_background = '#fce4ec',
    theme_surface = '#ffffff',
    brand_name = 'Andrea Catalán - Asesor',
    logo_path = '/assets/logo-acatalanm.png',
    permissions = JSON_ARRAY('view_clients', 'edit_clients', 'create_clients', 'wizard_access'),
    dashboard_path = '/dashboard/asesor'
WHERE email = 'acatalanm@albru.pe';

UPDATE usuarios SET 
    theme_primary = '#4caf50',
    theme_secondary = '#ff5722',
    theme_accent = '#81c784',
    theme_background = '#e8f5e8',
    theme_surface = '#ffffff',
    brand_name = 'Angelo Díaz - Asesor',
    logo_path = '/assets/logo-adiazc.png',
    permissions = JSON_ARRAY('view_clients', 'edit_clients', 'create_clients', 'wizard_access'),
    dashboard_path = '/dashboard/asesor'
WHERE email = 'adiazc@albru.pe';

UPDATE usuarios SET 
    theme_primary = '#ff9800',
    theme_secondary = '#3f51b5',
    theme_accent = '#ffb74d',
    theme_background = '#fff3e0',
    theme_surface = '#ffffff',
    brand_name = 'Cristhian Macedo - Asesor',
    logo_path = '/assets/logo-cmacedol.png',
    permissions = JSON_ARRAY('view_clients', 'edit_clients', 'create_clients', 'wizard_access'),
    dashboard_path = '/dashboard/asesor'
WHERE email = 'cmacedol@albru.pe';

UPDATE usuarios SET 
    theme_primary = '#795548',
    theme_secondary = '#607d8b',
    theme_accent = '#a1887f',
    theme_background = '#efebe9',
    theme_surface = '#ffffff',
    brand_name = 'Daryl Sánchez - Asesor',
    logo_path = '/assets/logo-dsanchezc.png',
    permissions = JSON_ARRAY('view_clients', 'edit_clients', 'create_clients', 'wizard_access'),
    dashboard_path = '/dashboard/asesor'
WHERE email = 'dsanchezc@albru.pe';

-- Supervisor
UPDATE usuarios SET 
    theme_primary = '#ff9800',
    theme_secondary = '#2196f3',
    theme_accent = '#ffb74d',
    theme_background = '#fff3e0',
    theme_surface = '#ffffff',
    brand_name = 'Reilex Ramirez - Supervisor',
    logo_path = '/assets/logo-rramirezt.png',
    permissions = JSON_ARRAY('view_all_clients', 'view_reports', 'monitor_asesores', 'manage_team'),
    dashboard_path = '/dashboard/supervisor'
WHERE email = 'rramirezt@albru.pe';

-- GTR
UPDATE usuarios SET 
    theme_primary = '#009688',
    theme_secondary = '#ff5722',
    theme_accent = '#4db6ac',
    theme_background = '#e0f2f1',
    theme_surface = '#ffffff',
    brand_name = 'Matias Cáceres - GTR',
    logo_path = '/assets/logo-mcaceresv.png',
    permissions = JSON_ARRAY('view_all_clients', 'assign_clients', 'view_asesores', 'manage_assignments'),
    dashboard_path = '/dashboard/gtr'
WHERE email = 'mcaceresv@albru.pe';

-- Resto de asesores
UPDATE usuarios SET 
    theme_primary = '#3f51b5',
    theme_secondary = '#4caf50',
    theme_accent = '#7986cb',
    theme_background = '#e8eaf6',
    theme_surface = '#ffffff',
    brand_name = CONCAT(SUBSTRING_INDEX(nombre, ' ', 2), ' - Asesor'),
    logo_path = CONCAT('/assets/logo-', SUBSTRING_INDEX(email, '@', 1), '.png'),
    permissions = JSON_ARRAY('view_clients', 'edit_clients', 'create_clients', 'wizard_access'),
    dashboard_path = '/dashboard/asesor'
WHERE tipo = 'asesor' AND email NOT IN ('jvenancioo@albru.pe', 'acatalanm@albru.pe', 'adiazc@albru.pe', 'cmacedol@albru.pe', 'dsanchezc@albru.pe');

-- Validadores
UPDATE usuarios SET 
    theme_primary = '#673ab7',
    theme_secondary = '#e91e63',
    theme_accent = '#9575cd',
    theme_background = '#ede7f6',
    theme_surface = '#ffffff',
    brand_name = CONCAT(SUBSTRING_INDEX(nombre, ' ', 2), ' - Validador'),
    logo_path = CONCAT('/assets/logo-', SUBSTRING_INDEX(email, '@', 1), '.png'),
    permissions = JSON_ARRAY('view_validations', 'process_validations', 'approve_documents'),
    dashboard_path = '/dashboard/validaciones'
WHERE tipo = 'validador';