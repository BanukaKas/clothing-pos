import { query, get, runTransaction } from '../connection';
import type { DbReturn, DbReturnItem, DbSale, DbSaleItem, DbProductVariant } from '../types';

export interface CreateReturnItemInput {
  sale_item_id?: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  reason: string;
  is_restocked?: boolean;
}

export interface CreateReturnInput {
  sale_id: string;
  original_receipt_number: string;
  customer_name: string;
  refund_amount: number;
  refund_method: string;
  reason: string;
  processed_by: string;
  items: CreateReturnItemInput[];
}

export interface ReturnWithDetails extends DbReturn {
  items: DbReturnItem[];
}

export function getAllReturns(): ReturnWithDetails[] {
  const returns = query<DbReturn>('SELECT * FROM returns ORDER BY created_at DESC;');
  const items = query<DbReturnItem>('SELECT * FROM return_items ORDER BY id ASC;');

  const itemMap = new Map<string, DbReturnItem[]>();
  for (const item of items) {
    const list = itemMap.get(item.return_id) || [];
    list.push(item);
    itemMap.set(item.return_id, list);
  }

  return returns.map(ret => ({
    ...ret,
    items: itemMap.get(ret.id) || [],
  }));
}

export function getReturnById(id: string): ReturnWithDetails | undefined {
  const ret = get<DbReturn>('SELECT * FROM returns WHERE id = ?;', [id]);
  if (!ret) return undefined;

  const items = query<DbReturnItem>('SELECT * FROM return_items WHERE return_id = ?;', [id]);
  return {
    ...ret,
    items,
  };
}

export function processReturn(input: CreateReturnInput): ReturnWithDetails {
  return runTransaction((db) => {
    // 1. Validate original sale exists
    const sale = get<DbSale>('SELECT * FROM sales WHERE id = ?;', [input.sale_id]);
    if (!sale) {
      throw new Error(`Original sale with ID ${input.sale_id} not found.`);
    }

    // 2. Fetch original sale items to validate quantities
    const saleItems = query<DbSaleItem>('SELECT * FROM sale_items WHERE sale_id = ?;', [input.sale_id]);
    const previousReturnItems = query<DbReturnItem>(
      `SELECT ri.* FROM return_items ri
       JOIN returns r ON r.id = ri.return_id
       WHERE r.sale_id = ?;`,
      [input.sale_id]
    );

    // Sum already returned quantities by product_id and variant_id
    const returnedMap = new Map<string, number>();
    for (const pri of previousReturnItems) {
      const key = `${pri.product_id}_${pri.variant_id || 'none'}`;
      returnedMap.set(key, (returnedMap.get(key) || 0) + pri.quantity);
    }

    for (const item of input.items) {
      const key = `${item.product_id}_${item.variant_id || 'none'}`;
      const matchingSaleItem = saleItems.find(si =>
        si.product_id === item.product_id && (si.variant_id === item.variant_id || (!si.variant_id && !item.variant_id))
      );

      if (!matchingSaleItem) {
        throw new Error(`Item ${item.product_name} (${item.sku}) was not part of the original sale.`);
      }

      const alreadyReturned = returnedMap.get(key) || 0;
      const maxReturnable = matchingSaleItem.quantity - alreadyReturned;

      if (item.quantity > maxReturnable) {
        throw new Error(
          `Cannot return ${item.quantity} of ${item.product_name}. Maximum returnable: ${maxReturnable}.`
        );
      }
    }

    // 3. Generate return number: RET-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countRow = get<{ count: number }>(
      "SELECT COUNT(*) as count FROM returns WHERE return_number LIKE 'RET-' || ? || '-%';",
      [dateStr]
    );
    const seq = String((countRow?.count || 0) + 1).padStart(4, '0');
    const returnNumber = `RET-${dateStr}-${seq}`;
    const returnId = `ret_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 4. Insert into returns table
    db.run(
      `INSERT INTO returns (
        id, return_number, sale_id, original_receipt_number,
        customer_name, refund_amount, refund_method, reason,
        processed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
      [
        returnId,
        returnNumber,
        input.sale_id,
        input.original_receipt_number,
        input.customer_name,
        input.refund_amount,
        input.refund_method,
        input.reason,
        input.processed_by,
      ]
    );

    // 5. Insert return items and restock if requested
    const savedItems: DbReturnItem[] = [];

    for (const item of input.items) {
      const returnItemId = `reti_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const lineTotal = item.quantity * item.unit_price;
      const isRestocked = item.is_restocked !== false ? 1 : 0;

      db.run(
        `INSERT INTO return_items (
          id, return_id, product_id, variant_id,
          product_name, sku, size, color,
          quantity, unit_price, line_total, reason, is_restocked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          returnItemId,
          returnId,
          item.product_id,
          item.variant_id || null,
          item.product_name,
          item.sku,
          item.size,
          item.color,
          item.quantity,
          item.unit_price,
          lineTotal,
          item.reason,
          isRestocked,
        ]
      );

      savedItems.push({
        id: returnItemId,
        return_id: returnId,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: item.product_name,
        sku: item.sku,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: lineTotal,
        reason: item.reason,
        is_restocked: isRestocked,
      });

      // If restocked, increase variant stock and log movement
      if (isRestocked && item.variant_id) {
        const variant = get<DbProductVariant>(
          'SELECT * FROM product_variants WHERE id = ?;',
          [item.variant_id]
        );

        if (variant) {
          const prevStock = variant.stock;
          const newStock = prevStock + item.quantity;

          db.run(
            'UPDATE product_variants SET stock = ?, updated_at = datetime(\'now\') WHERE id = ?;',
            [newStock, item.variant_id]
          );

          // Log stock movement
          const mvtId = `mvt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          db.run(
            `INSERT INTO stock_movements (
              id, product_id, variant_id, product_name, sku,
              variant_info, type, quantity_delta, previous_stock,
              new_stock, reason, reference_id, performed_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'return', ?, ?, ?, ?, ?, ?, datetime('now'));`,
            [
              mvtId,
              item.product_id,
              item.variant_id,
              item.product_name,
              item.sku,
              `${item.size} / ${item.color}`,
              item.quantity,
              prevStock,
              newStock,
              `Customer Return: ${returnNumber}`,
              returnNumber,
              input.processed_by,
            ]
          );
        }
      }
    }

    // 6. Update sale status (refunded or partially_refunded)
    const allTotalReturned = (previousReturnItems.reduce((s, i) => s + i.line_total, 0)) + input.refund_amount;
    const newSaleStatus = allTotalReturned >= sale.total ? 'refunded' : 'partially_refunded';

    db.run(
      'UPDATE sales SET status = ? WHERE id = ?;',
      [newSaleStatus, input.sale_id]
    );

    // 7. Audit log
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.run(
      `INSERT INTO audit_logs (
        id, user_name, action, entity_type, entity_id, details, created_at
      ) VALUES (?, 'RETURN', 'returns', ?, ?, datetime('now'));`,
      [
        auditId,
        returnNumber,
        JSON.stringify({
          sale_id: input.sale_id,
          receipt: input.original_receipt_number,
          refund_amount: input.refund_amount,
          itemsCount: input.items.length,
        }),
      ]
    );

    return {
      id: returnId,
      return_number: returnNumber,
      sale_id: input.sale_id,
      original_receipt_number: input.original_receipt_number,
      customer_name: input.customer_name,
      refund_amount: input.refund_amount,
      refund_method: input.refund_method,
      reason: input.reason,
      processed_by: input.processed_by,
      created_at: new Date().toISOString(),
      items: savedItems,
    };
  });
}
