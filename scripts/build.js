/**
 * MINT FASHION POS — Production Build Script
 * Builds frontend and Electron backend
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log(' MINT FASHION POS — Production Build');
console.log('====================================================\n');

try {
  // 1. Compile React Frontend
  console.log('[1/2] Compiling React + TypeScript frontend with Vite...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Compile Electron Main & IPC Backend
  console.log('\n[2/2] Compiling Electron backend with TypeScript...');
  execSync('npm run build:electron', { cwd: rootDir, stdio: 'inherit' });

  // Verify build artifacts
  const distHtml = path.join(rootDir, 'dist', 'index.html');
  const distMain = path.join(rootDir, 'dist-electron', 'main.js');

  if (!fs.existsSync(distHtml)) {
    throw new Error(`Frontend build artifact missing: ${distHtml}`);
  }
  if (!fs.existsSync(distMain)) {
    throw new Error(`Electron backend build artifact missing: ${distMain}`);
  }

  console.log('\n✓ Frontend and Backend build completed successfully!');
} catch (error) {
  console.error('\n✗ Build failed:', error.message);
  process.exit(1);
}
