const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════');
console.log('  Plan 01-01 Verification Report');
console.log('═══════════════════════════════════════════\n');

const checks = {
  'Task 1: Initialize Expo Project': {
    files: [
      'package.json',
      'tsconfig.json',
      'app.json',
      '.env.example',
      'App.tsx',
      '.gitignore',
      'babel.config.js'
    ],
    checks: [
      { file: 'package.json', contains: ['"expo"', '"typescript"', '"@react-navigation/native"', '"expo-secure-store"', '"axios"'] },
      { file: 'app.json', contains: ['"scheme": "demus"', '"bundleIdentifier": "com.demus.music"', '"package": "com.demus.music"'] },
      { file: '.env.example', contains: ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_GOOGLE_CLIENT_ID', 'EXPO_PUBLIC_APPLE_CLIENT_ID'] }
    ]
  },
  'Task 2: Configure Jest': {
    files: [
      'jest.config.js',
      'tests/setup.ts',
      'tests/__mocks__/expo-secure-store.ts'
    ],
    checks: [
      { file: 'jest.config.js', contains: ["preset: 'jest-expo'", 'coverageThreshold', 'lines: 80'] },
      { file: 'tests/setup.ts', contains: ["'@testing-library/jest-native/extend-expect'"] },
      { file: 'tests/__mocks__/expo-secure-store.ts', contains: ['setItemAsync', 'getItemAsync', 'deleteItemAsync'] }
    ]
  },
  'Task 3: Create Type Definitions': {
    files: [
      'src/types/user.ts',
      'src/types/auth.ts',
      'src/types/index.ts',
      'src/api/types.ts'
    ],
    checks: [
      { file: 'src/types/user.ts', contains: ['interface User', 'interface UserProfile'] },
      { file: 'src/types/auth.ts', contains: ['LoginRequest', 'RegisterRequest', 'JWTPayload', 'AuthState'] },
      { file: 'src/api/types.ts', contains: ['ApiResponse', 'API_ENDPOINTS', "LOGIN: '/auth/login'"] }
    ]
  }
};

let allPassed = true;

Object.entries(checks).forEach(([taskName, task]) => {
  console.log(`\n${taskName}:`);
  
  // Check file existence
  let taskPassed = true;
  task.files.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✓' : '✗'} ${file}`);
    if (!exists) taskPassed = false;
  });
  
  // Check file contents
  task.checks.forEach(check => {
    try {
      const content = fs.readFileSync(check.file, 'utf-8');
      check.contains.forEach(str => {
        const found = content.includes(str);
        if (!found) {
          console.log(`  ✗ ${check.file} missing: ${str}`);
          taskPassed = false;
        }
      });
    } catch (e) {
      // File doesn't exist, already reported above
    }
  });
  
  if (taskPassed) {
    console.log(`  ✓ All checks passed`);
  } else {
    allPassed = false;
  }
});

console.log('\n═══════════════════════════════════════════');
if (allPassed) {
  console.log('  ✓ ALL TASKS VERIFIED SUCCESSFULLY');
} else {
  console.log('  ✗ SOME CHECKS FAILED');
}
console.log('═══════════════════════════════════════════\n');

process.exit(allPassed ? 0 : 1);
