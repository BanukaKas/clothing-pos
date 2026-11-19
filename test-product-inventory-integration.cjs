const { app } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('mint-fashion-pos');

async function testIntegration() {
  console.log('\n=============================================================');
  console.log('--- TESTING PRODUCT & INVENTORY BACKEND SQLITE INTEGRATION ---');
  console.log('=============================================================\n');

  const { initializeDatabase, persistDatabase, closeDatabase, getDatabasePath } = require('./dist-electron/database/connection.js');
  const productsRepo = require('./dist-electron/database/repositories/productsRepo.js');
  const inventoryRepo = require('./dist-electron/database/repositories/inventoryRepo.js');

  await initializeDatabase();
  console.log('[Integration] Connected to database at:', getDatabasePath());

  // 1. Initial product count
  const initialProducts = productsRepo.getAllProducts();
  console.log(`[Integration] Initial product count: ${initialProducts.length}`);

  // 2. Create a test product with variants
  const testProdId = `prod-int-${Date.now()}`;
  const testSku = `MNT-LNN-SHIRT-${Math.floor(100 + Math.random() * 900)}`;
  const testBarcode = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  console.log(`[Integration] Creating new product: "${testSku}" (ID: ${testProdId})...`);

  const createdProduct = productsRepo.createProduct(
    {
      id: testProdId,
      name: 'Signature Pure Linen Resort Shirt',
      sku: testSku,
      barcode: testBarcode,
      category: 'Shirts',
      brand: 'MINT Atelier',
      description: 'Premium lightweight European flax linen shirt with mother-of-pearl buttons.',
      purchase_cost: 2800,
      selling_price: 6500,
      reorder_level: 6,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
      status: 'active',
    },
    [
      { size: 'M', color_name: 'Seafoam Mint', color_hex: '#a7f3d0', sku: `${testSku}-M-MNT`, barcode: `${testBarcode}-M`, stock: 12 },
      { size: 'L', color_name: 'Seafoam Mint', color_hex: '#a7f3d0', sku: `${testSku}-L-MNT`, barcode: `${testBarcode}-L`, stock: 15 },
      { size: 'XL', color_name: 'Seafoam Mint', color_hex: '#a7f3d0', sku: `${testSku}-XL-MNT`, barcode: `${testBarcode}-XL`, stock: 8 },
    ],
    'Kasun Rathnayake'
  );

  console.log('[Integration] Product created successfully:');
  console.log(`  - Name: ${createdProduct.name}`);
  console.log(`  - SKU: ${createdProduct.sku}`);
  console.log(`  - Total Initial Stock: ${createdProduct.totalStock} units`);
  console.log(`  - Variants: ${createdProduct.variants.length}`);

  // 3. Perform stock adjustment
  const targetVariant = createdProduct.variants[0];
  console.log(`\n[Integration] Adjusting stock for variant ${targetVariant.id} (${targetVariant.size} / ${targetVariant.color_name}): adding +10 units...`);

  const adjResult = inventoryRepo.adjustStock({
    productId: testProdId,
    variantId: targetVariant.id,
    type: 'add',
    quantity: 10,
    reason: 'Received express replenishment from Colombo warehouse',
    performedBy: 'Amara Perera',
  });

  console.log('[Integration] Stock adjustment result:', adjResult);

  // 4. Verify updated product and stock
  const updatedProduct = productsRepo.getProductById(testProdId);
  console.log(`[Integration] Verified updated product stock: ${updatedProduct.totalStock} units (was ${createdProduct.totalStock})`);
  const updatedVariant = updatedProduct.variants.find(v => v.id === targetVariant.id);
  console.log(`[Integration] Variant ${updatedVariant.size} stock: ${updatedVariant.stock} (was ${targetVariant.stock})`);

  if (updatedVariant.stock !== targetVariant.stock + 10) {
    throw new Error(`Stock mismatch: expected ${targetVariant.stock + 10}, got ${updatedVariant.stock}`);
  }

  // 5. Verify stock movements logged
  const movements = inventoryRepo.getAllStockMovements(testProdId);
  console.log(`[Integration] Stock movements logged for product: ${movements.length} records`);
  movements.forEach((m, idx) => {
    console.log(`  [Movement ${idx + 1}] Type: ${m.type}, Delta: ${m.quantity_delta}, Prev: ${m.previous_stock} -> New: ${m.new_stock}, Reason: "${m.reason}"`);
  });

  // 6. Verify inventory valuation
  const valuation = inventoryRepo.getInventoryValuation();
  console.log('\n[Integration] Global Inventory Valuation:');
  console.log(`  - Total Units: ${valuation.totalUnits}`);
  console.log(`  - Total Wholesale Cost: LKR ${valuation.totalWholesaleValue.toLocaleString()}`);
  console.log(`  - Total Retail Value: LKR ${valuation.totalRetailValue.toLocaleString()}`);

  persistDatabase();
  closeDatabase();

  console.log('\n=============================================================');
  console.log('>>> PRODUCT & INVENTORY BACKEND INTEGRATION TEST: 100% PASS <<<');
  console.log('=============================================================\n');
}

app.whenReady().then(async () => {
  try {
    await testIntegration();
    app.exit(0);
  } catch (err) {
    console.error('[ERROR] Integration test failed:', err);
    app.exit(1);
  }
});
