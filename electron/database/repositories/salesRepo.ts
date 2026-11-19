import { query, get, runTransaction } from '../connection';
import type { DbSale, DbSaleItem, DbPayment, DbProductVariant } from '../types';

export interface SaleWithDetails extends DbSale {
  items: DbSaleItem[];
  payments: DbPayment[];
}

export interface CheckoutItemParam {
  productId: string;
  variantId?: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface CheckoutParams {
  receiptNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  items: CheckoutItemParam[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'split';
  cashReceived?: number;
  changeGiven?: number;
  notes?: string;
}

export function getAllSales(limit = 100): SaleWithDetails[] {
  const sales = query<DbSale>('SELECT * FROM sales ORDER BY created_at DESC LIMIT ?;', [limit]);
  const saleIds = sales.map(s => s.id);

  if (saleIds.length === 0) return [];

  const items = query<DbSaleItem>('SELECT * FROM sale_items ORDER BY id ASC;');
  const payments = query<DbPayment>('SELECT * FROM payments ORDER BY id ASC;');

  const itemMap = new Map<string, DbSaleItem[]>();
  for (const it of items) {
    const list = itemMap.get(it.sale_id) || [];
    list.push(it);
    itemMap.set(it.sale_id, list);
  }

  const paymentMap = new Map<string, DbPayment[]>();
  for (const pay of payments) {
    const list = paymentMap.get(pay.sale_id) || [];
    list.push(pay);
    paymentMap.set(pay.sale_id, list);
  }

  return sales.map(s => ({
    ...s,
    items: itemMap.get(s.id) || [],
    payments: paymentMap.get(s.id) || [],
  }));
}

export function getSaleById(id: string): SaleWithDetails | undefined {
  const sale = get<DbSale>('SELECT * FROM sales WHERE id = ?;', [id]);
  if (!sale) return undefined;

  const items = query<DbSaleItem>('SELECT * FROM sale_items WHERE sale_id = ?;', [id]);
  const payments = query<DbPayment>('SELECT * FROM payments WHERE sale_id = ?;', [id]);

  return {
    ...sale,
    items,
    payments,
  };
}

export function getSaleByReceipt(receiptNumber: string): SaleWithDetails | undefined {
  const sale = get<DbSale>(
    'SELECT * FROM sales WHERE UPPER(receipt_number) = UPPER(?);',
    [receiptNumber.trim()]
  );
  if (!sale) return undefined;

  return getSaleById(sale.id);
}


/**
 * Execute atomic checkout transaction.
 * 1. Checks inventory availability for each size/color variant.
 * 2. Creates sale, items, payments.
 * 3. Deducts stock from each variant.
 * 4. Logs stock movements and audit log.
 * 5. Updates customer loyalty if linked.
 * Rollback happens automatically on any failure.
 */
export function checkoutTransaction(rawParams: any): SaleWithDetails {
  const params: CheckoutParams = rawParams?.sale
    ? {
        ...rawParams.sale,
        items: rawParams.items || rawParams.sale.items || [],
        payments: rawParams.payments || rawParams.sale.payments || [],
      }
    : rawParams;

  return runTransaction(db => {
    // Generate IDs
    const saleId = `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const receiptNumber =
      params.receiptNumber ||
      `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Prevent duplicate receipt numbers
    const dupCheck = get<DbSale>('SELECT id FROM sales WHERE receipt_number = ?;', [receiptNumber]);
    if (dupCheck) {
      throw new Error(`Duplicate transaction: Receipt number ${receiptNumber} already exists.`);
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('Checkout failed: Order cart cannot be empty.');
    }

    // Step 1: Validate stock for all items BEFORE making changes
    const validatedItems: Array<{
      item: CheckoutItemParam;
      variant: DbProductVariant;
    }> = [];

    for (const item of params.items) {
      // Find variant by ID or size + color
      let variant: DbProductVariant | undefined;
      if (item.variantId) {
        variant = get<DbProductVariant>('SELECT * FROM product_variants WHERE id = ?;', [item.variantId]);
      } else {
        variant = get<DbProductVariant>(
          'SELECT * FROM product_variants WHERE product_id = ? AND size = ? AND color_name = ?;',
          [item.productId, item.size, item.color]
        );
      }

      if (!variant) {
        throw new Error(
          `Variant not found for "${item.productName}" (Size: ${item.size}, Color: ${item.color}).`
        );
      }

      if (variant.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.productName}" (${item.size} / ${item.color}). Only ${variant.stock} available, requested ${item.quantity}.`
        );
      }

      validatedItems.push({ item, variant });
    }

    // Step 2: Insert Sale record
    db.run(
      `INSERT INTO sales 
       (id, receipt_number, customer_id, customer_name, customer_phone, cashier_id, cashier_name,
        subtotal, discount, tax, total, payment_method, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?);`,
      [
        saleId,
        receiptNumber,
        params.customerId || null,
        params.customerName || 'Walk-in Customer',
        params.customerPhone || null,
        params.cashierId,
        params.cashierName,
        params.subtotal,
        params.discount || 0,
        params.tax || 0,
        params.total,
        params.paymentMethod,
        params.notes || null,
      ]
    );

    // Step 3: Insert Sale Items & Deduct Inventory
    const insertedItems: DbSaleItem[] = [];
    for (let i = 0; i < validatedItems.length; i++) {
      const { item, variant } = validatedItems[i];
      const saleItemId = `sitem-${saleId}-${i + 1}`;
      const lineTotal = item.unitPrice * item.quantity;

      db.run(
        `INSERT INTO sale_items 
         (id, sale_id, product_id, variant_id, product_name, sku, size, color, quantity, unit_price, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          saleItemId,
          saleId,
          item.productId,
          variant.id,
          item.productName,
          variant.sku,
          item.size,
          item.color,
          item.quantity,
          item.unitPrice,
          item.unitCost,
          lineTotal,
        ]
      );

      // Deduct variant stock
      const previousStock = variant.stock;
      const newStock = previousStock - item.quantity;
      db.run('UPDATE product_variants SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [
        newStock,
        variant.id,
      ]);

      // Record stock movement
      db.run(
        `INSERT INTO stock_movements 
         (id, product_id, variant_id, product_name, sku, variant_info, type, quantity_delta, previous_stock, new_stock, reason, reference_id, performed_by)
         VALUES (?, ?, ?, ?, ?, ?, 'out', ?, ?, ?, ?, ?, ?);`,
        [
          `mv-${Date.now()}-${i}`,
          item.productId,
          variant.id,
          item.productName,
          variant.sku,
          `${item.size} / ${item.color}`,
          -item.quantity,
          previousStock,
          newStock,
          `Sold on ${receiptNumber}`,
          saleId,
          params.cashierName,
        ]
      );
    }

    // Step 4: Insert Payment Record
    const paymentId = `pay-${saleId}-1`;
    db.run(
      `INSERT INTO payments (id, sale_id, amount, method, cash_received, change_given)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        paymentId,
        saleId,
        params.total,
        params.paymentMethod,
        params.cashReceived || null,
        params.changeGiven || null,
      ]
    );

    // Step 5: Update Customer loyalty and lifetime spend if linked
    if (params.customerId) {
      const pointsEarned = Math.floor(params.total / 100);
      db.run(
        `UPDATE customers 
         SET total_purchases = total_purchases + ?,
             order_count = order_count + 1,
             loyalty_points = loyalty_points + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?;`,
        [params.total, pointsEarned, params.customerId]
      );
    }

    // Step 6: Log in active Cash Session if cash payment
    if (params.paymentMethod === 'cash') {
      db.run(
        `UPDATE cash_sessions 
         SET total_cash_sales = total_cash_sales + ?
         WHERE cashier_id = ? AND status = 'open';`,
        [params.total, params.cashierId]
      );
    }

    // Step 7: Write Audit Log
    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        params.cashierName,
        'COMPLETE_SALE',
        'sales',
        saleId,
        `Completed checkout for receipt ${receiptNumber} with total LKR ${params.total}`,
      ]
    );

    const completed = getSaleByReceipt(receiptNumber);
    if (!completed) throw new Error('Transaction verification failed.');
    return completed;
  });
}

export const processCheckout = checkoutTransaction;

