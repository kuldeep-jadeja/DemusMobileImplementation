#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Create directory structure for Demus Mobile Implementation
const baseDir = path.join(__dirname, '.planning');
const researchDir = path.join(baseDir, 'research');

// Create directories
[baseDir, researchDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created ${dir}`);
  }
});

console.log('\n✓ Directory structure ready for research files');
