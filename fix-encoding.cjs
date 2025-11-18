const fs = require('fs');

let content = fs.readFileSync('importar-historial-gestiones.cjs', 'utf8');

// Reemplazar comillas ASCII por Unicode
content = content.replace(/'4 - CON PROGRAMACIÃ"N'/g, "'4 - CON PROGRAMACIÃ"N'");
content = content.replace(/'3 - CON PROGRAMACIÃ"N'/g, "'3 - CON PROGRAMACIÃ"N'");

fs.writeFileSync('importar-historial-gestiones.cjs', content);
console.log('✅ Comillas Unicode corregidas');
