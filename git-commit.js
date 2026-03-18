const { execSync } = require('child_process');

function runCommand(cmd) {
  try {
    const output = execSync(cmd, { 
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return output;
  } catch (error) {
    console.error(`Error running: ${cmd}`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

// Initialize git if not already initialized
try {
  runCommand('git status');
  console.log('✓ Git already initialized');
} catch (error) {
  console.log('Initializing git repository...');
  runCommand('git init');
  runCommand('git config user.name "Demus Bot"');
  runCommand('git config user.email "bot@demus.com"');
  console.log('✓ Git initialized');
}

// Stage and commit files
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('No files specified to commit');
  process.exit(1);
}

console.log(`Staging ${files.length} file(s)...`);
files.forEach(file => {
  try {
    runCommand(`git add "${file}"`);
    console.log(`  ✓ Staged: ${file}`);
  } catch (error) {
    console.error(`  ✗ Failed to stage: ${file}`);
  }
});

// Get commit message from environment or use default
const commitMsg = process.env.COMMIT_MSG || 'chore: update files';
console.log(`\nCommitting with message: ${commitMsg}`);
const result = runCommand(`git commit -m "${commitMsg}"`);
console.log(result);

// Get and display the commit hash
const hash = runCommand('git rev-parse --short HEAD').trim();
console.log(`\n✓ Commit hash: ${hash}`);
