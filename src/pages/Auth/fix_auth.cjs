const fs = require('fs');
const file = 'C:/Users/ushni/Documents/TRACKER/SYSTEM/src/pages/Auth/AuthPage.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replaceAll('redirectTo: \`${window.location.origin}/auth\`,', 'redirectTo: \`${window.location.origin}/\`,');
fs.writeFileSync(file, content, 'utf8');
console.log('Replacement done');
