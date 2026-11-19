/**
 * MINT FASHION POS — Build & Installer Verification Script
 * Validates that all distribution files and the customer installer exist and are valid.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const customerReleaseDir = path.join(rootDir, 'customer-release');
const installerPath = path.join(customerReleaseDir, 'MINT-FASHION-POS-Setup.exe');
const releaseNotesPath = path.join(customerReleaseDir, 'RELEASE-NOTES.txt');

console.log('====================================================');
console.log(' MINT FASHION POS — Distribution Verification');
console.log('====================================================\n');

let hasErrors = false;

// 1. Check Installer
if (!fs.existsSync(installerPath)) {
  console.error(`✗ Missing customer installer: ${installerPath}`);
  hasErrors = true;
} else {
  const stats = fs.statSync(installerPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  if (stats.size < 1024 * 1024) {
    console.error(`✗ Installer size suspiciously small (${sizeMb} MB)`);
    hasErrors = true;
  } else {
    console.log(`✓ Customer Installer verified:`);
    console.log(`   Path: ${installerPath}`);
    console.log(`   Size: ${sizeMb} MB (${stats.size.toLocaleString()} bytes)`);
  }
}

// 2. Check Release Notes
if (!fs.existsSync(releaseNotesPath)) {
  console.error(`✗ Missing release notes: ${releaseNotesPath}`);
  hasErrors = true;
} else {
  const notes = fs.readFileSync(releaseNotesPath, 'utf8');
  console.log(`✓ Release Notes verified (${notes.length} characters)`);
}

// 3. Check WebAssembly runtime dependency
const wasmPath = path.join(rootDir, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
if (!fs.existsSync(wasmPath)) {
  console.error(`✗ SQLite WebAssembly engine missing: ${wasmPath}`);
  hasErrors = true;
} else {
  console.log(`✓ SQLite WebAssembly engine present`);
}

if (hasErrors) {
  console.error('\n✗ Verification FAILED with errors.');
  process.exit(1);
} else {
  console.log('\n✓ ALL VERIFICATIONS PASSED! Ready for customer delivery.');
  process.exit(0);
}
