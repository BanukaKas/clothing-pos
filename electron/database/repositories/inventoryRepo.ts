import { query, get, runTransaction } from '../connection';
import type { DbStockMovement, DbProductVariant, DbProduct } from '../types';

export function getAllStockMovements(productId?: string, limit = 100): DbStockMovement[] {
  if (productId) {
    return query<DbStockMovement>(
      'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?;',
      [productId, limit]
    );
  }
  return query<DbStockMovement>(
    'SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?;',
    [limit]
  );
}

export const getStockMovements = getAllStockMovements;
export const getLowStock = getLowStockAlerts;


export function adjustStock(params: {
  productId: string;
  variantId?: string;
  type: 'add' | 'deduct' | 'set';
  quantity: number;
  reason: string;
  performedBy: string;
}): { success: boolean; newStock: number } {
  return runTransaction(db => {
    const product = get<DbProduct>('SELECT * FROM products WHERE id = ?;', [params.productId]);
    if (!product) throw new Error(`Product not found: ${params.productId}`);

    let previousStock = 0;
    let newStock = 0;
    let delta = 0;
    let variantInfo = 'All Variants';
    let sku = product.sku;

    if (params.variantId) {
      const variant = get<DbProductVariant>('SELECT * FROM product_variants WHERE id = ?;', [params.variantId]);
      if (!variant) throw new Error(`Variant not found: ${params.variantId}`);

      previousStock = variant.stock;
      variantInfo = `${variant.size} / ${variant.color_name}`;
      sku = variant.sku;

      if (params.type === 'add') {
        delta = params.quantity;
        newStock = previousStock + delta;
      } else if (params.type === 'deduct') {
        delta = -Math.min(previousStock, params.quantity);
        newStock = Math.max(0, previousStock - params.quantity);
      } else {
        newStock = Math.max(0, params.quantity);
        delta = newStock - previousStock;
      }

      db.run('UPDATE product_variants SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [
        newStock,
        params.variantId,
      ]);
    } else {
      // Adjust all variants proportionally or the first variant
      const variants = query<DbProductVariant>('SELECT * FROM product_variants WHERE product_id = ?;', [
        params.productId,
      ]);
      if (variants.length > 0) {
        const v = variants[0];
        previousStock = v.stock;
        newStock = params.type === 'add' ? previousStock + params.quantity : Math.max(0, params.quantity);
        delta = newStock - previousStock;
        db.run('UPDATE product_variants SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [
          newStock,
          v.id,
        ]);
        variantInfo = `${v.size} / ${v.color_name}`;
        sku = v.sku;
      }
    }

    // Insert stock movement record
    db.run(
      `INSERT INTO stock_movements 
       (id, product_id, variant_id, product_name, sku, variant_info, type, quantity_delta, previous_stock, new_stock, reason, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, 'adjustment', ?, ?, ?, ?, ?);`,
      [
        `mv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product.id,
        params.variantId || null,
        product.name,
        sku,
        variantInfo,
        delta,
        previousStock,
        newStock,
        params.reason,
        params.performedBy,
      ]
    );

    // Audit log
    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        params.performedBy,
        'ADJUST_STOCK',
        'inventory',
        params.variantId || product.id,
        `Stock adjusted (${params.type}) by ${delta} units for ${product.name} (${variantInfo}). Reason: ${params.reason}`,
      ]
    );

    return { success: true, newStock };
  });
}

export function getInventoryValuation(): {
  totalUnits: number;
  totalWholesaleValue: number;
  totalRetailValue: number;
} {
  const rows = query<{
    stock: number;
    purchase_cost: number;
    selling_price: number;
  }>(`
    SELECT v.stock, p.purchase_cost, p.selling_price
    FROM product_variants v
    JOIN products p ON v.product_id = p.id;
  `);

  let totalUnits = 0;
  let totalWholesaleValue = 0;
  let totalRetailValue = 0;

  for (const r of rows) {
    totalUnits += r.stock;
    totalWholesaleValue += r.stock * r.purchase_cost;
    totalRetailValue += r.stock * r.selling_price;
  }

  return { totalUnits, totalWholesaleValue, totalRetailValue };
}

export function getLowStockAlerts(): any[] {
  return query(`
    SELECT p.id, p.name, p.sku, p.category, p.image, p.reorder_level,
           SUM(v.stock) as total_stock
    FROM products p
    JOIN product_variants v ON p.id = v.product_id
    GROUP BY p.id
    HAVING total_stock <= p.reorder_level;
  `);
}
