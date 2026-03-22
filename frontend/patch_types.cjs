const fs = require('fs');
let code = fs.readFileSync('src/services/api/types.ts', 'utf8');

// Replace duplicate properties.
code = code.replace(/phones\?: string\[\];\s+phones\?: string\[\];/g, 'phones?: string[];');
code = code.replace(/phones\?: string\[\];\s+phones: string\[\];/g, 'phones?: string[];');

fs.writeFileSync('src/services/api/types.ts', code);
