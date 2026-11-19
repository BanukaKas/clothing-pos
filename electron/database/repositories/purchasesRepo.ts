import { query, get, runTransaction } from '../connection';
import type { DbSupplier, DbPurchase, DbPurchaseItem, DbProductVariant } from '../types';

export interface PurchaseWithItems extends DbPurchase {
  items: DbPurchaseItem[];
}

export function getAllSuppliers(): DbSupplier[] {
  return query<DbSupplier>('SELECT * FROM suppliers ORDER BY name ASC;');
}

export function createSupplier(
  data: Omit<DbSupplier, 'id' | 'created_at'>,
  performedBy: string
): DbSupplier {
  const id = `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  return runTransaction(db => {
    db.run(
      `INSERT INTO suppliers (id, name, contact_person, phone, email, address, categories_supplied, payment_terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.name,
        data.contact_person || '',
        data.phone || '',
        data.email || '',
        data.address || '',
        typeof data.categories_supplied === 'string'
          ? data.categories_supplied
          : JSON.stringify(data.categories_supplied || []),
        data.payment_terms || 'Net 30 Days',
      ]
    );

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'CREATE_SUPPLIER',
        'suppliers',
        id,
        `Added garment supplier "${data.name}"`,
      ]
    );

    const sup = get<DbSupplier>('SELECT * FROM suppliers WHERE id = ?;', [id]);
    if (!sup) throw new Error('Supplier creation failed.');
    return sup;
  });
}

export function getAllPurchases(): PurchaseWithItems[] {
  const purchases = query<DbPurchase>('SELECT * FROM purchases ORDER BY created_at DESC;');
  const items = query<DbPurchaseItem>('SELECT * FROM purchase_items ORDER BY id ASC;');

  const itemMap = new Map<string, DbPurchaseItem[]>();
  for (const it of items) {
    const list = itemMap.get(it.purchase_id) || [];
    list.push(it);
    itemMap.set(it.purchase_id, list);
  }

  return purchases.map(p => ({
    ...p,
    items: itemMap.get(p.id) || [],
  }));
}

export function getPurchaseById(id: string): PurchaseWithItems | undefined {

  const purchase = get<DbPurchase>('SELECT * FROM purchases WHERE id = ?;', [id]);
  if (!purchase) return undefined;

  const items = query<DbPurchaseItem>('SELECT * FROM purchase_items WHERE purchase_id = ?;', [id]);
  return {
    ...purchase,
    items,
  };
}

export function cancelPurchaseOrder(id: string, performedBy = 'System'): PurchaseWithItems {
  return runTransaction(db => {
    const purchase = getPurchaseById(id);
    if (!purchase) throw new Error(`Purchase order ${id} not found.`);
    if (purchase.status === 'received') {
      throw new Error(`Cannot cancel purchase order ${purchase.reference} because goods have already been received.`);
    }

    db.run("UPDATE purchases SET status = 'cancelled' WHERE id = ?;", [id]);

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'CANCEL_PURCHASE',
        'purchases',
        id,
        `Cancelled purchase order ${purchase.reference}`,
      ]
    );

    return getPurchaseById(id)!;
  });
}


export function createPurchaseOrder(
  params: {
    reference: string;
    supplierId: string;
    supplierName: string;
    items: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      sku: string;
      size?: string;
      color?: string;
      quantity: number;
      unitCost: number;
    }>;
    totalCost: number;
    orderDate?: string;
    expectedDate?: string;
    notes?: string;
  },
  performedBy: string
): PurchaseWithItems {
  return runTransaction(db => {
    const purchaseId = `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const reference = params.reference || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    db.run(
      `INSERT INTO purchases (id, reference, supplier_id, supplier_name, total_cost, status, order_date, expected_date, notes)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?);`,
      [
        purchaseId,
        reference,
        params.supplierId,
        params.supplierName,
        params.totalCost,
        params.orderDate || new Date().toISOString().split('T')[0],
        params.expectedDate || null,
        params.notes || null,
      ]
    );

    for (let i = 0; i < params.items.length; i++) {
      const it = params.items[i];
      const itemId = `pitem-${purchaseId}-${i + 1}`;
      const totalCost = it.quantity * it.unitCost;

      db.run(
        `INSERT INTO purchase_items 
         (id, purchase_id, product_id, variant_id, product_name, sku, size, color, quantity, unit_cost, total_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          itemId,
          purchaseId,
          it.productId,
          it.variantId || null,
          it.productName,
          it.sku,
          it.size || null,
          it.color || null,
          it.quantity,
          it.unitCost,
          totalCost,
        ]
      );
    }

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'CREATE_PURCHASE_ORDER',
        'purchases',
        purchaseId,
        `Created purchase order ${reference} to ${params.supplierName} for LKR ${params.totalCost}`,
      ]
    );

    const fullPO = getAllPurchases().find(p => p.id === purchaseId);
    if (!fullPO) throw new Error('Failed to retrieve created purchase order');
    return fullPO;
  });
}

/**
 * Mark purchase as received and update stock.
 * Stock MUST ONLY increase when purchase is received, never upon drafting!
 */
export function receivePurchase(purchaseId: string, performedBy: string): PurchaseWithItems {
  return runTransaction(db => {
    const purchase = get<DbPurchase>('SELECT * FROM purchases WHERE id = ?;', [purchaseId]);
    if (!purchase) throw new Error(`Purchase order not found: ${purchaseId}`);

    if (purchase.status === 'received') {
      throw new Error(`Purchase order ${purchase.reference} has already been received.`);
    }

    const items = query<DbPurchaseItem>('SELECT * FROM purchase_items WHERE purchase_id = ?;', [purchaseId]);

    for (const it of items) {
      let targetVariant: DbProductVariant | undefined;
      if (it.variant_id) {
        targetVariant = get<DbProductVariant>('SELECT * FROM product_variants WHERE id = ?;', [it.variant_id]);
      } else {
        const variants = query<DbProductVariant>(
          'SELECT * FROM product_variants WHERE product_id = ?;',
          [it.product_id]
        );
        targetVariant = variants[0];
      }

      if (targetVariant) {
        const previousStock = targetVariant.stock;
        const newStock = previousStock + it.quantity;

        db.run('UPDATE product_variants SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [
          newStock,
          targetVariant.id,
        ]);

        // Record stock movement for received goods
        db.run(
          `INSERT INTO stock_movements 
           (id, product_id, variant_id, product_name, sku, variant_info, type, quantity_delta, previous_stock, new_stock, reason, reference_id, performed_by)
           VALUES (?, ?, ?, ?, ?, ?, 'in', ?, ?, ?, ?, ?, ?);`,
          [
            `mv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            it.product_id,
            targetVariant.id,
            it.product_name,
            it.sku,
            `${targetVariant.size} / ${targetVariant.color_name}`,
            it.quantity,
            previousStock,
            newStock,
            `Goods received from ${purchase.reference}`,
            purchaseId,
            performedBy,
          ]
        );
      }
    }

    db.run(
      "UPDATE purchases SET status = 'received', received_at = CURRENT_TIMESTAMP WHERE id = ?;",
      [purchaseId]
    );

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'RECEIVE_PURCHASE',
        'purchases',
        purchaseId,
        `Marked ${purchase.reference} as received and reconciled inventory.`,
      ]
    );

    const fullPO = getAllPurchases().find(p => p.id === purchaseId);
    if (!fullPO) throw new Error('Failed to retrieve received purchase order');
    return fullPO;
  });
}

export const receivePurchaseOrder = receivePurchase;

