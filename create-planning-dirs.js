const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\Admin\\Desktop\\Pro-Music-App\\DemusMobileImplementation\\.planning';

// Create directories with recursive option
fs.mkdirSync(baseDir, { recursive: true });
fs.mkdirSync(path.join(baseDir, 'research'), { recursive: true });
fs.mkdirSync(path.join(baseDir, 'phases'), { recursive: true });

console.log('✓ Successfully created .planning directory structure:\n');
console.log('C:\\Users\\Admin\\Desktop\\Pro-Music-App\\DemusMobileImplementation');
console.log('└── .planning');
console.log('    ├── research/');
console.log('    └── phases/');
