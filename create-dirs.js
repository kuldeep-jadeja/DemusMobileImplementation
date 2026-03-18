const fs = require('fs');
const path = require('path');

// Create directories
const dirs = [
  'tests',
  'tests/__mocks__',
  'src',
  'src/types',
  'src/api',
  'assets'
];

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  } else {
    console.log(`  Already exists: ${dir}`);
  }
});

console.log('\nDirectory structure ready!');
