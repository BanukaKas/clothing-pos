import { query, get, run } from '../connection';
import type { DbExpense } from '../types';

export interface CreateExpenseInput {
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  reference?: string;
  recorded_by: string;
  expense_date: string;
}

export function getAllExpenses(filter?: {
  category?: string;
  startDate?: string;
  endDate?: string;
}): DbExpense[] {
  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params: any[] = [];

  if (filter?.category && filter.category !== 'all') {
    sql += ' AND category = ?';
    params.push(filter.category);
  }

  if (filter?.startDate) {
    sql += ' AND expense_date >= ?';
    params.push(filter.startDate);
  }

  if (filter?.endDate) {
    sql += ' AND expense_date <= ?';
    params.push(filter.endDate);
  }

  sql += ' ORDER BY expense_date DESC, created_at DESC;';
  return query<DbExpense>(sql, params);
}

export function getExpenseById(id: string): DbExpense | undefined {
  return get<DbExpense>('SELECT * FROM expenses WHERE id = ?;', [id]);
}

export function addExpense(input: CreateExpenseInput): DbExpense {
  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  run(
    `INSERT INTO expenses (
      id, category, description, amount, payment_method,
      reference, recorded_by, expense_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
    [
      id,
      input.category,
      input.description,
      input.amount,
      input.payment_method,
      input.reference || null,
      input.recorded_by,
      input.expense_date,
    ]
  );

  return {
    id,
    category: input.category,
    description: input.description,
    amount: input.amount,
    payment_method: input.payment_method,
    reference: input.reference || null,
    recorded_by: input.recorded_by,
    expense_date: input.expense_date,
    created_at: new Date().toISOString(),
  };
}

export function deleteExpense(id: string): boolean {
  const result = run('DELETE FROM expenses WHERE id = ?;', [id]);
  return result.changes > 0;
}

export function getExpenseSummary(): {
  totalAmount: number;
  byCategory: { category: string; total: number }[];
} {
  const totalRow = get<{ total: number }>('SELECT COALESCE(SUM(amount), 0) as total FROM expenses;');
  const byCategory = query<{ category: string; total: number }>(
    'SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC;'
  );

  return {
    totalAmount: totalRow?.total || 0,
    byCategory,
  };
}
