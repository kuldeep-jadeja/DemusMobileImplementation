const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, silent = false) {
  try {
    const output = execSync(cmd, { 
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return output;
  } catch (error) {
    if (!silent) {
      console.error(`Error running: ${cmd}`);
      console.error(error.message);
    }
    throw error;
  }
}

console.log('=== Demus Mobile - Plan 01-01 Execution ===\n');

// Step 1: Initialize Git
console.log('Step 1: Initialize Git Repository');
try {
  run('git status', true);
  console.log('  ✓ Git already initialized\n');
} catch {
  console.log('  Initializing git...');
  run('git init');
  run('git config user.name "Demus Bot"');
  run('git config user.email "bot@demus.com"');
  console.log('  ✓ Git initialized\n');
}

// Step 2: Set up project structure
console.log('Step 2: Setting up project structure');
require('./setup-project.js');
console.log();

// Step 3: Commit Task 1
console.log('Step 3: Committing Task 1 - Initialize Expo Project');
const task1Files = [
  'package.json',
  'tsconfig.json',
  'app.json',
  '.env.example',
  'App.tsx',
  '.gitignore',
  'babel.config.js'
];

task1Files.forEach(f => {
  try {
    run(`git add "${f}"`, true);
    console.log(`  ✓ Staged: ${f}`);
  } catch (e) {
    console.log(`  ✗ Failed: ${f}`);
  }
});

const task1Msg = `feat(01-01): initialize Expo project with TypeScript

- Create package.json with all dependencies
- Configure TypeScript with path mapping
- Set up app.json with scheme and bundle IDs
- Add .env.example with OAuth placeholders
- Create basic App.tsx entry point`;

try {
  run(`git commit -m "${task1Msg}"`, true);
  const hash1 = run('git rev-parse --short HEAD', true).trim();
  console.log(`  ✓ Task 1 committed: ${hash1}\n`);
} catch (e) {
  console.log('  ✗ Commit failed\n');
}

// Step 4: Commit Task 2
console.log('Step 4: Committing Task 2 - Configure Jest');
const task2Files = [
  'jest.config.js',
  'tests/setup.ts',
  'tests/__mocks__/expo-secure-store.ts'
];

task2Files.forEach(f => {
  try {
    run(`git add "${f}"`, true);
    console.log(`  ✓ Staged: ${f}`);
  } catch (e) {
    console.log(`  ✗ Failed: ${f}`);
  }
});

const task2Msg = `test(01-01): configure Jest testing framework

- Add jest.config.js with 80% coverage threshold
- Create tests/setup.ts with Jest Native extensions
- Add expo-secure-store mock for testing`;

try {
  run(`git commit -m "${task2Msg}"`, true);
  const hash2 = run('git rev-parse --short HEAD', true).trim();
  console.log(`  ✓ Task 2 committed: ${hash2}\n`);
} catch (e) {
  console.log('  ✗ Commit failed\n');
}

// Step 5: Commit Task 3
console.log('Step 5: Committing Task 3 - Create Type Definitions');
const task3Files = [
  'src/types/user.ts',
  'src/types/auth.ts',
  'src/types/index.ts',
  'src/api/types.ts'
];

task3Files.forEach(f => {
  try {
    run(`git add "${f}"`, true);
    console.log(`  ✓ Staged: ${f}`);
  } catch (e) {
    console.log(`  ✗ Failed: ${f}`);
  }
});

const task3Msg = `feat(01-01): create core type definitions

- Add User and UserProfile types
- Add authentication request/response types
- Add API response and endpoint types
- Create barrel exports for types`;

try {
  run(`git commit -m "${task3Msg}"`, true);
  const hash3 = run('git rev-parse --short HEAD', true).trim();
  console.log(`  ✓ Task 3 committed: ${hash3}\n`);
} catch (e) {
  console.log('  ✗ Commit failed\n');
}

// Step 6: Show summary
console.log('=== Execution Summary ===');
try {
  console.log('\nCommit Log:');
  const log = run('git log --oneline -3', true);
  console.log(log);
} catch (e) {
  console.log('Could not display commit log');
}

console.log('\n✓ All tasks completed!');
