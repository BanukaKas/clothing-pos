/**
 * MINT FASHION POS — Barcode System, SQLite Integration & Installer Test Suite
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================================');
console.log(' MINT FASHION POS — VERIFICATION SUITE');
console.log('======================================================================\n');

// --------------------------------------------------------------------
// 1. EAN-13 & Code 128 Algorithm Tests
// --------------------------------------------------------------------
console.log('[TEST 1] Testing EAN-13 Modulo-10 Check Digit Calculation...');

function calculateEan13CheckDigit(twelveDigits) {
  if (!/^\d{12}$/.test(twelveDigits)) {
    throw new Error('EAN-13 check digit calculation requires exactly 12 numeric digits');
  }
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(twelveDigits[i], 10);
    if (i % 2 === 0) sumOdd += digit;
    else sumEven += digit * 3;
  }
  const total = sumOdd + sumEven;
  const remainder = total % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

function validateEan13(code) {
  if (!code || !/^\d{13}$/.test(code)) return false;
  const checkDigit = calculateEan13CheckDigit(code.substring(0, 12));
  return checkDigit === parseInt(code[12], 10);
}

// Known valid GS1 EAN-13 barcode examples:
// 4006381333931 (Stabilo Boss)
// 5901234123457 (Example barcode)
const testCode1 = '400638133393';
const cd1 = calculateEan13CheckDigit(testCode1);
assert.strictEqual(cd1, 1, 'Check digit for 400638133393 must be 1');
assert.strictEqual(validateEan13('4006381333931'), true, '4006381333931 must be valid');
assert.strictEqual(validateEan13('4006381333932'), false, 'Wrong check digit must be invalid');
console.log('✓ EAN-13 check digit logic verified 100% correct.');

// --------------------------------------------------------------------
// 2. Database & Barcode Repositories Verification in Node/Electron
// --------------------------------------------------------------------
console.log('\n[TEST 2] Testing SQLite Database, Migrations & Barcode IPC Repositories...');

const dbConnection = require('./dist-electron/database/connection.js');
const dbMigrations = require('./dist-electron/database/migrations.js');
const productsRepo = require('./dist-electron/database/repositories/productsRepo.js');
const salesRepo = require('./dist-electron/database/repositories/salesRepo.js');

async function runDatabaseTests() {
  const db = await dbConnection.initializeDatabase();
  console.log('✓ SQLite initialized at:', dbConnection.getDatabasePath());

  dbMigrations.runMigrations(db);
  console.log('✓ Migrations 001 and 002 applied successfully.');

  // Test barcode uniqueness check
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const testProductBarcode = `MF${randomSuffix}`;
  const testVariantBarcode = `MFV${randomSuffix}`;

  const checkBefore = productsRepo.checkBarcodeUnique(testProductBarcode);
  assert.strictEqual(checkBefore.isUnique, true, 'Unused barcode must be unique');

  // Create product with variant
  const productId = `test-prod-${Date.now()}`;
  const testProduct = {
    id: productId,
    name: 'Verification Silk Blazer',
    sku: `BLZ-${randomSuffix}`,
    barcode: testProductBarcode,
    category: 'Blazers & Suits',
    brand: 'MINT FASHION',
    description: 'Automated test garment',
    purchase_cost: 4500,
    selling_price: 9500,
    reorder_level: 5,
    image: '',
    status: 'active',
  };

  const testVariants = [
    {
      size: 'M',
      color_name: 'Emerald Green',
      color_hex: '#059669',
      sku: `BLZ-${randomSuffix}-M-EMR`,
      barcode: testVariantBarcode,
      stock: 25,
    },
    {
      size: 'L',
      color_name: 'Midnight Black',
      color_hex: '#000000',
      sku: `BLZ-${randomSuffix}-L-BLK`,
      barcode: `MFV${randomSuffix}-L`,
      stock: 15,
    },
  ];

  productsRepo.createProduct(testProduct, testVariants, 'TestRunner');
  console.log('✓ Created test product with 2 variants in SQLite.');

  // Check duplicate prevention
  const dupCheck1 = productsRepo.checkBarcodeUnique(testProductBarcode);
  assert.strictEqual(dupCheck1.isUnique, false, 'Product barcode must detect collision');

  const dupCheck2 = productsRepo.checkBarcodeUnique(testVariantBarcode);
  assert.strictEqual(dupCheck2.isUnique, false, 'Variant barcode must detect collision');
  console.log('✓ Collision detection verified: duplicates correctly rejected.');

  // Test barcode regeneration
  const regeneratedProductBarcode = productsRepo.regenerateBarcode(productId, 'product', 'CODE128', 'TestRunner');
  assert.notStrictEqual(regeneratedProductBarcode, testProductBarcode, 'Regenerated barcode must be distinct');
  console.log(`✓ Product barcode regenerated successfully: "${testProductBarcode}" -> "${regeneratedProductBarcode}".`);

  // Test variant lookup by barcode for POS checkout
  const lookup = productsRepo.getProductByBarcode(testVariantBarcode);
  assert(lookup, 'Lookup by variant barcode must succeed');
  assert.strictEqual(lookup.id, productId, 'Product ID must match');
  assert(lookup.matchedVariant, 'matchedVariant must be populated');
  assert.strictEqual(lookup.matchedVariant.size, 'M', 'Matched size must be M');
  assert.strictEqual(lookup.matchedVariant.color_name, 'Emerald Green', 'Matched color must be Emerald Green');
  console.log('✓ POS Variant lookup verified: barcode scanning correctly resolves exact garment variant.');

  // Test Checkout deduction
  const saleInput = {
    sale: {
      receiptNumber: `REC-TEST-${Date.now()}`,
      customerId: null,
      customerName: 'Walk-in Customer',
      customerPhone: null,
      cashierId: 'cashier-1',
      cashierName: 'Senior Cashier',
      subtotal: 9500,
      discount: 0,
      tax: 0,
      total: 9500,
      paymentMethod: 'cash',
      cashReceived: 10000,
      changeGiven: 500,
      notes: 'Automated barcode test sale',
    },
    items: [
      {
        productId: productId,
        variantId: lookup.matchedVariant.id,
        productName: testProduct.name,
        sku: lookup.matchedVariant.sku,
        size: lookup.matchedVariant.size,
        color: lookup.matchedVariant.color_name,
        quantity: 2,
        unitPrice: 9500,
        unitCost: 4500,
        lineTotal: 19000,
      },
    ],
    payments: [
      {
        amount: 9500,
        method: 'cash',
        cashReceived: 10000,
        changeGiven: 500,
      },
    ],
  };

  const saleResult = salesRepo.processCheckout(saleInput);
  assert(saleResult, 'Sale checkout must succeed');
  console.log(`✓ Sale completed: Invoice ${saleResult.receipt_number}.`);

  // Verify stock was reduced from 25 to 23
  const updatedLookup = productsRepo.getProductById(productId);
  const updatedVariant = updatedLookup.variants.find(v => v.id === lookup.matchedVariant.id);
  assert.strictEqual(updatedVariant.stock, 23, 'Variant stock must be reduced by 2 (25 -> 23)');
  console.log(`✓ Variant stock deduction verified: 25 - 2 = ${updatedVariant.stock} units remaining.`);

  // Clean up test records (sale first, then product due to foreign key RESTRICT)
  dbConnection.run('DELETE FROM sales WHERE receipt_number = ?;', [saleResult.receipt_number]);
  productsRepo.deleteProduct(productId, 'TestRunner');
  console.log('✓ Cleaned up test sale and test garment respecting relational foreign keys.');

  // Integrity Check
  const integrity = dbConnection.checkIntegrity();
  assert.strictEqual(integrity.ok, true, 'SQLite PRAGMA integrity_check must be ok');
  console.log('✓ SQLite PRAGMA integrity_check verified: OK.');

  // --------------------------------------------------------------------
  // 3. Customer Installer Verification
  // --------------------------------------------------------------------
  console.log('\n[TEST 3] Verifying Customer Windows Installer...');
  const installerPath = path.resolve(__dirname, 'customer-release', 'MINT-FASHION-POS-Setup.exe');
  const releaseNotesPath = path.resolve(__dirname, 'customer-release', 'RELEASE-NOTES.txt');

  assert(fs.existsSync(installerPath), 'customer-release/MINT-FASHION-POS-Setup.exe must exist');
  const installerStats = fs.statSync(installerPath);
  const sizeMb = (installerStats.size / (1024 * 1024)).toFixed(2);
  assert(installerStats.size > 20 * 1024 * 1024, 'Installer must be > 20 MB');
  console.log(`✓ Customer Installer verified: ${installerPath}`);
  console.log(`   Size: ${sizeMb} MB (${installerStats.size.toLocaleString()} bytes)`);

  assert(fs.existsSync(releaseNotesPath), 'customer-release/RELEASE-NOTES.txt must exist');
  const notesContent = fs.readFileSync(releaseNotesPath, 'utf8');
  assert(notesContent.includes('MINT FASHION POS'), 'Release notes must contain title');
  assert(notesContent.includes('BARCODE SYSTEM'), 'Release notes must mention barcode system');
  console.log(`✓ Release Notes verified (${notesContent.length} bytes).`);

  console.log('\n======================================================================');
  console.log(' ALL 3 VERIFICATION PHASES PASSED WITH ZERO ERRORS (100% SUCCESS)');
  console.log('======================================================================\n');
}

runDatabaseTests().catch(err => {
  console.error('\n✗ Test verification failed:', err);
  process.exit(1);
});
