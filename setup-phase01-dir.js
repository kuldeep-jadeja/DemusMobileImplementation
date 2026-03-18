const fs = require('fs');
const path = require('path');

// Create phase directory
const phaseDir = path.join(__dirname, '.planning', 'phases', '01-foundation-auth');
fs.mkdirSync(phaseDir, { recursive: true });
console.log('✓ Created directory:', phaseDir);

// Write plan files content - files will be created after this script runs
console.log('\nPhase directory ready. Now use the Create tool to write PLAN.md files.');
console.log('Directory:', phaseDir);
