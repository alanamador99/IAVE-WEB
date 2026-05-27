const fs = require('fs');
const file = 'c:/Users/IAVE/Documents/Proyecto IAVE WEB/iave-web/src/components/NuevoComponente.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/timeZone: 'UTC'/g, "timeZone: 'America/Mexico_City'");
fs.writeFileSync(file, content);
console.log('TZ replacement complete!');
