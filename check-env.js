const { execSync } = require('child_process');

try {
  // Check node version
  console.log('Node version:', process.version);
  
  // Check if git is available
  const gitVersion = execSync('git --version', { encoding: 'utf-8' });
  console.log('Git version:', gitVersion.trim());
  
  console.log('\nReady to proceed with git operations.');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
