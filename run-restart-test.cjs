const { spawnSync } = require('child_process');
const path = require('path');

console.log('Starting full 2-stage Electron restart & SQLite persistence test...\n');

// Stage 1: Cold start, initialize SQLite, insert record, persist, shut down
console.log('>>> [Stage 1/2] Launching Electron process to initialize DB and insert record...');
const step1 = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['electron', 'test-electron-persistence.cjs', '--step=1'],
  { stdio: 'inherit', shell: true }
);

if (step1.status !== 0) {
  console.error('\nFAILED: Stage 1 exited with non-zero code:', step1.status);
  process.exit(1);
}

console.log('\n>>> [Stage 1/2] Process 1 successfully exited. Application is completely stopped.\n');

// Stage 2: Restart Electron, load SQLite from disk, query record, verify integrity
console.log('>>> [Stage 2/2] Restarting Electron in a fresh process to verify persistence from disk...');
const step2 = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['electron', 'test-electron-persistence.cjs', '--step=2'],
  { stdio: 'inherit', shell: true }
);

if (step2.status !== 0) {
  console.error('\nFAILED: Stage 2 exited with non-zero code:', step2.status);
  process.exit(1);
}

console.log('\n============================================================');
console.log('CONFIRMED: Electron restart test passed with 100% data persistence.');
console.log('============================================================\n');
process.exit(0);
