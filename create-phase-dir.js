const fs = require('fs');
const path = require('path');

const phaseDir = path.join(__dirname, '.planning', 'phases', '01-foundation-auth');

// Create phase directory
fs.mkdirSync(phaseDir, { recursive: true });

console.log('✓ Created phase directory:', phaseDir);
