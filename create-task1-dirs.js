const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create directories
const dirs = ['src/services', 'tests/services'];
dirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log('✓ Created:', fullPath);
});

console.log('\nDirectories created successfully!');
