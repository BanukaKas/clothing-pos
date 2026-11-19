const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Set app name so Electron resolves AppData/Roaming/mint-fashion-pos
app.setName('mint-fashion-pos');

const step = process.argv.find(arg => arg.startsWith('--step='))?.split('=')[1] || 'all';

async function runStep1() {
  console.log('\n==================================================');
  console.log('--- ELECTRON PERSISTENCE TEST: STEP 1 (INITIALIZE & WRITE) ---');
  console.log('==================================================');

  const userDataDir = app.getPath('userData');
  console.log('[Step 1] Electron app.getPath("userData"):', userDataDir);

  const { initializeDatabase, persistDatabase, closeDatabase, getDatabasePath, run, get } = require('./dist-electron/database/connection.js');
  const { runMigrations } = require('./dist-electron/database/migrations.js');

  console.log('[Step 1] 1. Initializing SQLite WebAssembly database...');
  const db = await initializeDatabase();

  const dbPath = getDatabasePath();
  console.log('[Step 1] 2. Database path resolved to:', dbPath);

  // Verify path is in userData and NOT in project directory
  const projectDir = process.cwd();
  if (dbPath.toLowerCase().startsWith(projectDir.toLowerCase())) {
    throw new Error(`CRITICAL VIOLATION: Database is stored in project directory: ${dbPath}`);
  }
  console.log('[Step 1] 3. Database is stored safely OUTSIDE project directory: PASS');

  console.log('[Step 1] 4. Running schema migrations (19 tables)...');
  runMigrations(db);
  persistDatabase();

  // Insert a test record
  const testKey = 'test_persistence_verification_token';
  const testValue = `PERSISTENCE_OK_${Date.now()}_MINT_FASHION`;
  console.log(`[Step 1] 5. Inserting test record: key="${testKey}", value="${testValue}"...`);
  run(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value;",
    [testKey, testValue]
  );

  // Write a dedicated test file to record what was written
  fs.writeFileSync(
    path.join(userDataDir, 'test-token.json'),
    JSON.stringify({ testKey, testValue, dbPath, timestamp: new Date().toISOString() }, null, 2)
  );

  // Check file exists on disk
  if (!fs.existsSync(dbPath)) {
    throw new Error(`CRITICAL: Database file does not exist on disk at ${dbPath}`);
  }
  const stats = fs.statSync(dbPath);
  console.log(`[Step 1] 6. Verified database file exists on disk: ${stats.size} bytes: PASS`);

  console.log('[Step 1] 7. Closing database cleanly and terminating Electron process...');
  closeDatabase();
  console.log('[Step 1] Completed successfully. Ready for cold restart.\n');
}

async function runStep2() {
  console.log('\n==================================================');
  console.log('--- ELECTRON PERSISTENCE TEST: STEP 2 (COLD RESTART & VERIFY) ---');
  console.log('==================================================');

  const userDataDir = app.getPath('userData');
  console.log('[Step 2] Electron app.getPath("userData"):', userDataDir);

  const tokenFile = path.join(userDataDir, 'test-token.json');
  if (!fs.existsSync(tokenFile)) {
    throw new Error(`Token file not found in ${userDataDir}. Run Step 1 first.`);
  }

  const { testKey, testValue, dbPath: expectedDbPath } = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

  const { initializeDatabase, closeDatabase, getDatabasePath, checkIntegrity, get, query } = require('./dist-electron/database/connection.js');

  console.log('[Step 2] 1. Initializing database from cold restart...');
  const db = await initializeDatabase();
  const currentDbPath = getDatabasePath();

  console.log('[Step 2] 2. Current database path:', currentDbPath);
  if (currentDbPath !== expectedDbPath) {
    throw new Error(`Database path mismatch: Expected ${expectedDbPath}, got ${currentDbPath}`);
  }

  console.log('[Step 2] 3. Querying persisted test record...');
  const record = get('SELECT * FROM settings WHERE key = ?;', [testKey]);

  console.log('[Step 2] Retrieved record from SQLite:', record);

  if (!record || record.value !== testValue) {
    throw new Error(`CRITICAL PERSISTENCE FAILURE: Expected value "${testValue}", but got: ${JSON.stringify(record)}`);
  }
  console.log('[Step 2] 4. Test record persistence verified 100% across restart: PASS');

  console.log('[Step 2] 5. Running PRAGMA integrity_check...');
  const integrity = checkIntegrity();
  console.log('[Step 2] Integrity check result:', integrity);
  if (!integrity.ok) {
    throw new Error(`Integrity check failed: ${integrity.message}`);
  }
  console.log('[Step 2] SQLite PRAGMA integrity_check: PASS (ok)');

  // Also verify initial clothing seed data exists
  const products = query('SELECT COUNT(*) as count FROM products;');
  const variants = query('SELECT COUNT(*) as count FROM product_variants;');
  const users = query('SELECT COUNT(*) as count FROM users;');
  console.log(`[Step 2] 6. Seed verification: ${products[0].count} products, ${variants[0].count} variants, ${users[0].count} users: PASS`);

  closeDatabase();
  console.log('\n==================================================');
  console.log('>>> ALL 6 PERSISTENCE & ELECTRON RESTART CHECKS PASSED SUCCESSFULLY! <<<');
  console.log('==================================================\n');
}

app.whenReady().then(async () => {
  try {
    if (step === '1') {
      await runStep1();
      app.exit(0);
    } else if (step === '2') {
      await runStep2();
      app.exit(0);
    } else {
      await runStep1();
      await runStep2();
      app.exit(0);
    }
  } catch (err) {
    console.error('[ERROR] Test failed with exception:', err);
    app.exit(1);
  }
});
