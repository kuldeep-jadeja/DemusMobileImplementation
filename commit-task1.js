const { execSync } = require('child_process');

// Initialize git
try {
  execSync('git status', { stdio: 'pipe' });
  console.log('Git already initialized');
} catch {
  console.log('Initializing git...');
  execSync('git init', { stdio: 'inherit' });
  execSync('git config user.name "Demus Bot"', { stdio: 'inherit' });
  execSync('git config user.email "bot@demus.com"', { stdio: 'inherit' });
}

// Add files
const files = [
  'package.json',
  'tsconfig.json',
  'app.json',
  '.env.example',
  'App.tsx',
  '.gitignore',
  'babel.config.js'
];

files.forEach(f => {
  try {
    execSync(`git add "${f}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed to add ${f}`);
  }
});

// Commit
const msg = 'feat(01-01): initialize Expo project with TypeScript\n\n- Create package.json with all dependencies\n- Configure TypeScript with path mapping\n- Set up app.json with scheme and bundle IDs\n- Add .env.example with OAuth placeholders\n- Create basic App.tsx entry point';

try {
  execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });
  const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  console.log(`\nCommit hash: ${hash}`);
} catch (e) {
  console.error('Commit failed');
}
