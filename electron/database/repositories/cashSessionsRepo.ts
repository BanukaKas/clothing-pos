import { query, get, run, runTransaction } from '../connection';
import type { DbCashSession } from '../types';

export interface OpenSessionInput {
  cashier_id: string;
  cashier_name: string;
  register_number?: string;
  opening_cash: number;
  notes?: string;
}

export interface CloseSessionInput {
  session_id: string;
  actual_closing_cash: number;
  notes?: string;
}

export function getCurrentSession(): DbCashSession | undefined {
  return get<DbCashSession>(
    "SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY opening_time DESC LIMIT 1;"
  );
}

export function getSessionById(id: string): DbCashSession | undefined {
  return get<DbCashSession>('SELECT * FROM cash_sessions WHERE id = ?;', [id]);
}

export function getAllSessions(): DbCashSession[] {
  return query<DbCashSession>('SELECT * FROM cash_sessions ORDER BY opening_time DESC;');
}

export function openCashSession(input: OpenSessionInput): DbCashSession {
  // Check if there is already an open session
  const active = getCurrentSession();
  if (active) {
    throw new Error(`An active cash session (ID: ${active.id}) is already open. Close it first.`);
  }

  const id = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const regNumber = input.register_number || 'Register #01';

  run(
    `INSERT INTO cash_sessions (
      id, cashier_id, cashier_name, register_number,
      opening_time, opening_cash, total_cash_sales, total_cash_refunds,
      total_cash_expenses, expected_closing_cash, status, notes
    ) VALUES (?, ?, ?, ?, datetime('now'), ?, 0, 0, 0, ?, 'open', ?);`,
    [
      id,
      input.cashier_id,
      input.cashier_name,
      regNumber,
      input.opening_cash,
      input.opening_cash, // Initially expected = opening
      input.notes || null,
    ]
  );

  return getSessionById(id)!;
}

export function closeCashSession(input: CloseSessionInput): DbCashSession {
  return runTransaction((db) => {
    const session = get<DbCashSession>('SELECT * FROM cash_sessions WHERE id = ?;', [input.session_id]);
    if (!session) {
      throw new Error(`Cash session ${input.session_id} not found.`);
    }

    if (session.status === 'closed') {
      throw new Error(`Cash session ${input.session_id} is already closed.`);
    }

    // Compute cash transactions that occurred between opening_time and now
    const openTime = session.opening_time;

    // Cash sales
    const salesRow = get<{ total: number }>(
      `SELECT COALESCE(SUM(p.amount), 0) as total
       FROM payments p
       JOIN sales s ON s.id = p.sale_id
       WHERE p.method = 'cash' AND p.created_at >= ?;`,
      [openTime]
    );
    const cashSales = salesRow?.total || 0;

    // Cash refunds
    const refundsRow = get<{ total: number }>(
      `SELECT COALESCE(SUM(refund_amount), 0) as total
       FROM returns
       WHERE refund_method = 'cash' AND created_at >= ?;`,
      [openTime]
    );
    const cashRefunds = refundsRow?.total || 0;

    // Cash expenses
    const expensesRow = get<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE payment_method = 'cash' AND created_at >= ?;`,
      [openTime]
    );
    const cashExpenses = expensesRow?.total || 0;

    const expectedClosing = session.opening_cash + cashSales - cashRefunds - cashExpenses;
    const diff = input.actual_closing_cash - expectedClosing;

    db.run(
      `UPDATE cash_sessions SET
        closing_time = datetime('now'),
        total_cash_sales = ?,
        total_cash_refunds = ?,
        total_cash_expenses = ?,
        expected_closing_cash = ?,
        actual_closing_cash = ?,
        cash_difference = ?,
        status = 'closed',
        notes = COALESCE(?, notes)
       WHERE id = ?;`,
      [
        cashSales,
        cashRefunds,
        cashExpenses,
        expectedClosing,
        input.actual_closing_cash,
        diff,
        input.notes || null,
        input.session_id,
      ]
    );

    // Audit log
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.run(
      `INSERT INTO audit_logs (
        id, user_name, action, entity_type, entity_id, details, created_at
      ) VALUES (?, 'CLOSE_REGISTER', 'cash_sessions', ?, ?, datetime('now'));`,
      [
        auditId,
        input.session_id,
        JSON.stringify({
          opening_cash: session.opening_cash,
          expectedClosing,
          actualClosing: input.actual_closing_cash,
          difference: diff,
        }),
      ]
    );

    return get<DbCashSession>('SELECT * FROM cash_sessions WHERE id = ?;', [input.session_id])!;
  });
}
