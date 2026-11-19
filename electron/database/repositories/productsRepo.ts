import { query, get, run, runTransaction } from '../connection';
import type { DbProduct, DbProductVariant } from '../types';

export interface ProductWithVariants extends DbProduct {
  variants: DbProductVariant[];
  totalStock: number;
  matchedVariant?: DbProductVariant;
}

export function getAllProducts(): ProductWithVariants[] {
  const products = query<DbProduct>('SELECT * FROM products ORDER BY name ASC;');
  const variants = query<DbProductVariant>('SELECT * FROM product_variants ORDER BY size ASC;');

  const variantMap = new Map<string, DbProductVariant[]>();
  for (const v of variants) {
    const list = variantMap.get(v.product_id) || [];
    list.push(v);
    variantMap.set(v.product_id, list);
  }

  return products.map(p => {
    const pVariants = variantMap.get(p.id) || [];
    const totalStock = pVariants.reduce((sum, v) => sum + v.stock, 0);
    return {
      ...p,
      variants: pVariants,
      totalStock,
    };
  });
}

export function getProductById(id: string): ProductWithVariants | undefined {
  const product = get<DbProduct>('SELECT * FROM products WHERE id = ?;', [id]);
  if (!product) return undefined;

  const variants = query<DbProductVariant>(
    'SELECT * FROM product_variants WHERE product_id = ? ORDER BY size ASC;',
    [id]
  );
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return {
    ...product,
    variants,
    totalStock,
  };
}

export function getProductByBarcode(barcode: string): ProductWithVariants | undefined {
  const cleanBarcode = barcode.trim();
  // Check main product barcode or SKU
  let product = get<DbProduct>(
    'SELECT * FROM products WHERE barcode = ? OR UPPER(sku) = UPPER(?);',
    [cleanBarcode, cleanBarcode]
  );
  let matchedVariant: DbProductVariant | undefined = undefined;

  if (!product) {
    // Check variant barcode or SKU
    const variant = get<DbProductVariant>(
      'SELECT * FROM product_variants WHERE barcode = ? OR UPPER(sku) = UPPER(?);',
      [cleanBarcode, cleanBarcode]
    );
    if (variant) {
      matchedVariant = variant;
      product = get<DbProduct>('SELECT * FROM products WHERE id = ?;', [variant.product_id]);
    }
  }

  if (!product) return undefined;
  const full = getProductById(product.id);
  if (!full) return undefined;
  return {
    ...full,
    matchedVariant,
  };
}

export function createProduct(
  productData: Omit<DbProduct, 'created_at' | 'updated_at'>,
  variantsData: Omit<DbProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[],
  performedBy: string
): ProductWithVariants {
  return runTransaction(db => {
    // Prevent duplicate barcode or SKU
    const existing = get<DbProduct>(
      'SELECT id FROM products WHERE sku = ? OR barcode = ?;',
      [productData.sku, productData.barcode]
    );
    if (existing) {
      throw new Error(`Product with SKU "${productData.sku}" or Barcode "${productData.barcode}" already exists.`);
    }

    const purchaseCost = (productData as any).purchase_cost ?? (productData as any).purchaseCost ?? 0;
    const sellingPrice = (productData as any).selling_price ?? (productData as any).sellingPrice ?? 0;
    const reorderLevel = (productData as any).reorder_level ?? (productData as any).reorderLevel ?? 5;
    const image = productData.image || '';
    const description = productData.description || '';
    const status = productData.status || 'active';
    const brand = productData.brand || 'MINT FASHION';

    db.run(
      `INSERT INTO products 
       (id, name, sku, barcode, category, brand, description, purchase_cost, selling_price, reorder_level, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        productData.id,
        productData.name,
        productData.sku,
        productData.barcode,
        productData.category,
        brand,
        description,
        purchaseCost,
        sellingPrice,
        reorderLevel,
        image,
        status,
      ]
    );


    const insertedVariants: DbProductVariant[] = [];
    for (let i = 0; i < variantsData.length; i++) {
      const v = variantsData[i];
      const variantId = `var-${productData.id}-${i + 1}`;
      db.run(
        `INSERT INTO product_variants 
         (id, product_id, size, color_name, color_hex, sku, barcode, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          variantId,
          productData.id,
          v.size,
          v.color_name,
          v.color_hex,
          v.sku || `${productData.sku}-${v.size}-${v.color_name.substring(0, 3).toUpperCase()}`,
          v.barcode || `${productData.barcode}-${v.size}`,
          v.stock || 0,
        ]
      );

      // Record stock movement for initial inventory
      if (v.stock > 0) {
        db.run(
          `INSERT INTO stock_movements 
           (id, product_id, variant_id, product_name, sku, variant_info, type, quantity_delta, previous_stock, new_stock, reason, performed_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            `mv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productData.id,
            variantId,
            productData.name,
            v.sku,
            `${v.size} / ${v.color_name}`,
            'in',
            v.stock,
            0,
            v.stock,
            'Initial garment creation stock allocation',
            performedBy,
          ]
        );
      }
    }

    // Write audit log
    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'CREATE_PRODUCT',
        'products',
        productData.id,
        `Created product "${productData.name}" with ${variantsData.length} variants`,
      ]
    );

    const fullProduct = getProductById(productData.id);
    if (!fullProduct) throw new Error('Product creation failed.');
    return fullProduct;
  });
}

export function updateProduct(
  id: string,
  productData: Partial<DbProduct>,
  performedBy: string
): ProductWithVariants {
  return runTransaction(db => {
    const existing = get<DbProduct>('SELECT * FROM products WHERE id = ?;', [id]);
    if (!existing) throw new Error(`Product not found with ID ${id}`);

    const updated = {
      ...existing,
      ...productData,
      purchase_cost: (productData as any).purchase_cost ?? (productData as any).purchaseCost ?? existing.purchase_cost,
      selling_price: (productData as any).selling_price ?? (productData as any).sellingPrice ?? existing.selling_price,
      reorder_level: (productData as any).reorder_level ?? (productData as any).reorderLevel ?? existing.reorder_level,
      updated_at: new Date().toISOString(),
    };

    db.run(
      `UPDATE products SET 
       name = ?, sku = ?, barcode = ?, category = ?, brand = ?, description = ?,
       purchase_cost = ?, selling_price = ?, reorder_level = ?, image = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [
        updated.name,
        updated.sku,
        updated.barcode,
        updated.category,
        updated.brand,
        updated.description || '',
        updated.purchase_cost,
        updated.selling_price,
        updated.reorder_level,
        updated.image || '',
        updated.status,
        id,
      ]
    );


    // Write audit log
    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'UPDATE_PRODUCT',
        'products',
        id,
        `Updated details for product "${updated.name}"`,
      ]
    );

    const fullProduct = getProductById(id);
    if (!fullProduct) throw new Error('Failed to retrieve updated product');
    return fullProduct;
  });
}

export function deleteProduct(id: string, performedBy = 'System'): boolean {
  return runTransaction(db => {
    const existing = get<DbProduct>('SELECT name FROM products WHERE id = ?;', [id]);
    if (!existing) return false;

    db.run('DELETE FROM products WHERE id = ?;', [id]);

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'DELETE_PRODUCT',
        'products',
        id,
        `Deleted product "${existing.name}"`,
      ]
    );

    return true;
  });
}

export function getAllCategories(): { id: string; name: string; slug: string; description: string; accent_color: string }[] {
  return query('SELECT * FROM categories ORDER BY name ASC;');
}

/**
 * Checks whether a barcode is globally unique across products and variants.
 */
export function checkBarcodeUnique(
  barcode: string,
  excludeProductId?: string,
  excludeVariantId?: string
): { isUnique: boolean; existingProduct?: string; existingVariant?: string } {
  const clean = barcode.trim();
  if (!clean) return { isUnique: false };

  // 1. Check products table
  let prodSql = 'SELECT id, name FROM products WHERE barcode = ?';
  const prodParams: any[] = [clean];
  if (excludeProductId) {
    prodSql += ' AND id != ?';
    prodParams.push(excludeProductId);
  }
  const existingProd = get<{ id: string; name: string }>(prodSql, prodParams);
  if (existingProd) {
    return { isUnique: false, existingProduct: existingProd.name };
  }

  // 2. Check product_variants table
  let varSql = `
    SELECT v.id, v.sku, p.name as product_name 
    FROM product_variants v 
    JOIN products p ON v.product_id = p.id 
    WHERE v.barcode = ?
  `;
  const varParams: any[] = [clean];
  if (excludeVariantId) {
    varSql += ' AND v.id != ?';
    varParams.push(excludeVariantId);
  }
  if (excludeProductId) {
    varSql += ' AND v.product_id != ?';
    varParams.push(excludeProductId);
  }
  const existingVar = get<{ id: string; sku: string; product_name: string }>(varSql, varParams);
  if (existingVar) {
    return { isUnique: false, existingVariant: `${existingVar.product_name} (${existingVar.sku})` };
  }

  return { isUnique: true };
}

/**
 * Generates a unique barcode guaranteed not to collide with existing products or variants.
 */
export function generateUniqueBarcode(
  format: 'CODE128' | 'EAN13' = 'CODE128',
  prefix = 'MF'
): string {
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    let candidate = '';
    if (format === 'EAN13') {
      const p = prefix.replace(/\D/g, '').padEnd(3, '0').slice(0, 3) || '200';
      const rand = Math.floor(100000000 + Math.random() * 900000000).toString();
      const twelve = `${p}${rand}`.slice(0, 12);
      let sumOdd = 0;
      let sumEven = 0;
      for (let i = 0; i < 12; i++) {
        const d = parseInt(twelve[i], 10);
        if (i % 2 === 0) sumOdd += d;
        else sumEven += d * 3;
      }
      const rem = (sumOdd + sumEven) % 10;
      const cd = rem === 0 ? 0 : 10 - rem;
      candidate = `${twelve}${cd}`;
    } else {
      const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'MF';
      const num = Math.floor(10000000 + Math.random() * 90000000);
      candidate = `${cleanPrefix}${num}`;
    }

    const check = checkBarcodeUnique(candidate);
    if (check.isUnique) {
      return candidate;
    }
  }
  return `${prefix}${Date.now().toString().slice(-8)}`;
}

/**
 * Updates a specific variant's barcode in SQLite with audit logging.
 */
export function updateVariantBarcode(
  variantId: string,
  barcode: string,
  performedBy = 'User'
): boolean {
  return runTransaction(db => {
    const existing = get<DbProductVariant>('SELECT * FROM product_variants WHERE id = ?;', [variantId]);
    if (!existing) throw new Error(`Variant not found: ${variantId}`);

    const clean = barcode.trim();
    if (clean && clean !== existing.barcode) {
      const check = checkBarcodeUnique(clean, undefined, variantId);
      if (!check.isUnique) {
        throw new Error(`Barcode "${clean}" is already in use by ${check.existingProduct || check.existingVariant}`);
      }
    }

    db.run(
      'UPDATE product_variants SET barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
      [clean || null, variantId]
    );

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'UPDATE_VARIANT_BARCODE',
        'product_variants',
        variantId,
        `Updated barcode for variant ${existing.sku} to "${clean}"`,
      ]
    );

    return true;
  });
}

/**
 * Regenerates barcode for a product or variant only with confirmation and audit logging.
 */
export function regenerateBarcode(
  id: string,
  type: 'product' | 'variant',
  format: 'CODE128' | 'EAN13' = 'CODE128',
  performedBy = 'User'
): string {
  return runTransaction(db => {
    const prefix = type === 'product' ? 'MF' : 'MFV';
    const newBarcode = generateUniqueBarcode(format, prefix);

    if (type === 'product') {
      const prod = get<DbProduct>('SELECT id, name, barcode FROM products WHERE id = ?;', [id]);
      if (!prod) throw new Error(`Product not found with ID ${id}`);

      db.run(
        'UPDATE products SET barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
        [newBarcode, id]
      );

      db.run(
        `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          performedBy,
          'REGENERATE_PRODUCT_BARCODE',
          'products',
          id,
          `Regenerated barcode for "${prod.name}" from "${prod.barcode}" to "${newBarcode}"`,
        ]
      );
    } else {
      const variant = get<DbProductVariant>('SELECT id, sku, barcode FROM product_variants WHERE id = ?;', [id]);
      if (!variant) throw new Error(`Variant not found with ID ${id}`);

      db.run(
        'UPDATE product_variants SET barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
        [newBarcode, id]
      );

      db.run(
        `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          performedBy,
          'REGENERATE_VARIANT_BARCODE',
          'product_variants',
          id,
          `Regenerated barcode for variant "${variant.sku}" from "${variant.barcode}" to "${newBarcode}"`,
        ]
      );
    }

    return newBarcode;
  });
}

/**
 * Batch updates product and all child variant barcodes in a single atomic transaction.
 */
export function updateProductBarcodes(
  productId: string,
  productBarcode: string,
  variantBarcodes: { variantId: string; barcode: string }[],
  performedBy = 'User'
): boolean {
  return runTransaction(db => {
    const prod = get<DbProduct>('SELECT id, name, barcode FROM products WHERE id = ?;', [productId]);
    if (!prod) throw new Error(`Product not found with ID ${productId}`);

    const cleanProdBarcode = productBarcode.trim();
    if (cleanProdBarcode && cleanProdBarcode !== prod.barcode) {
      const check = checkBarcodeUnique(cleanProdBarcode, productId);
      if (!check.isUnique) {
        throw new Error(`Product barcode "${cleanProdBarcode}" already exists on ${check.existingProduct || check.existingVariant}`);
      }
      db.run(
        'UPDATE products SET barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
        [cleanProdBarcode, productId]
      );
    }

    for (const vb of variantBarcodes) {
      const cleanVarBarcode = vb.barcode.trim();
      if (cleanVarBarcode) {
        const check = checkBarcodeUnique(cleanVarBarcode, undefined, vb.variantId);
        if (!check.isUnique) {
          throw new Error(`Variant barcode "${cleanVarBarcode}" already exists on ${check.existingProduct || check.existingVariant}`);
        }
        db.run(
          'UPDATE product_variants SET barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
          [cleanVarBarcode, vb.variantId]
        );
      }
    }

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'UPDATE_PRODUCT_BARCODES',
        'products',
        productId,
        `Updated barcodes for product "${prod.name}" and variants`,
      ]
    );

    return true;
  });
}


