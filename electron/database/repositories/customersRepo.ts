import { query, get, runTransaction } from '../connection';
import type { DbCustomer } from '../types';

export function getAllCustomers(): DbCustomer[] {
  return query<DbCustomer>('SELECT * FROM customers ORDER BY total_purchases DESC;');
}

export function getCustomerById(id: string): DbCustomer | undefined {
  return get<DbCustomer>('SELECT * FROM customers WHERE id = ?;', [id]);
}

export function createCustomer(
  data: Omit<DbCustomer, 'id' | 'total_purchases' | 'order_count' | 'loyalty_points' | 'created_at' | 'updated_at'>,
  performedBy: string
): DbCustomer {
  const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  return runTransaction(db => {
    db.run(
      `INSERT INTO customers (id, name, phone, email, address, total_purchases, order_count, loyalty_points)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0);`,
      [id, data.name, data.phone || '', data.email || '', data.address || '']
    );

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'CREATE_CUSTOMER',
        'customers',
        id,
        `Added customer "${data.name}"`,
      ]
    );

    const created = getCustomerById(id);
    if (!created) throw new Error('Customer creation failed.');
    return created;
  });
}

export function updateCustomer(
  id: string,
  data: Partial<DbCustomer>,
  performedBy: string
): DbCustomer {
  return runTransaction(db => {
    const existing = get<DbCustomer>('SELECT * FROM customers WHERE id = ?;', [id]);
    if (!existing) throw new Error(`Customer not found with ID ${id}`);

    const updated = { ...existing, ...data };
    db.run(
      `UPDATE customers 
       SET name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [updated.name, updated.phone, updated.email, updated.address, id]
    );

    db.run(
      `INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        performedBy,
        'UPDATE_CUSTOMER',
        'customers',
        id,
        `Updated customer profile "${updated.name}"`,
      ]
    );

    const result = getCustomerById(id);
    if (!result) throw new Error('Customer update failed.');
    return result;
  });
}
