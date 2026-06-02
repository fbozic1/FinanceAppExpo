import { type SQLiteDatabase } from 'expo-sqlite';

export type RecurringInterval = 'monthly' | 'yearly';

export type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note: string | null;
  is_recurring: number;
  recurring_interval: RecurringInterval;
};

export type NewTransaction = Omit<Transaction, 'id'>;

export async function getTransactionsByMonth(
  db: SQLiteDatabase,
  year: number,
  month: number
): Promise<Transaction[]> {
  const pad = (n: number) => String(n).padStart(2, '0');
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC',
    [`${year}-${pad(month)}%`]
  );
}

export async function getRecentTransactions(
  db: SQLiteDatabase,
  limit = 5
): Promise<Transaction[]> {
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC LIMIT ?',
    [limit]
  );
}

export async function insertTransaction(
  db: SQLiteDatabase,
  tx: NewTransaction
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO transactions
      (title, amount, type, category, date, note, is_recurring, recurring_interval)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.title,
      tx.amount,
      tx.type,
      tx.category,
      tx.date,
      tx.note,
      tx.is_recurring,
      tx.recurring_interval,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteTransaction(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function stopRecurringTransaction(
  db: SQLiteDatabase,
  title: string,
  category: string,
  type: string,
  currentMonthPrefix: string  // e.g. '2026-07' — entries after this month get deleted
): Promise<void> {
  await db.runAsync(
    `DELETE FROM transactions
     WHERE title = ? AND category = ? AND type = ? AND is_recurring = 1
       AND substr(date, 1, 7) > ?`,
    [title, category, type, currentMonthPrefix]
  );
  await db.runAsync(
    'UPDATE transactions SET is_recurring = 0 WHERE title = ? AND category = ? AND type = ? AND is_recurring = 1',
    [title, category, type]
  );
}

export async function getTransactionsByYear(
  db: SQLiteDatabase,
  year: number
): Promise<Transaction[]> {
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC',
    [`${year}%`]
  );
}

export async function getAllTransactions(db: SQLiteDatabase): Promise<Transaction[]> {
  return db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC');
}

export async function syncSalaryTransaction(
  db: SQLiteDatabase,
  year: number,
  month: number,
  salary: number
): Promise<void> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const monthPrefix = `${year}-${pad(month)}`;

  const existing = await db.getFirstAsync<{ id: number; amount: number }>(
    `SELECT id, amount FROM transactions
     WHERE title = 'Plaća' AND type = 'income' AND is_recurring = 1 AND date LIKE ?`,
    [`${monthPrefix}%`]
  );

  if (!existing) {
    const date = new Date(year, month - 1, 1, 8, 0, 0);
    await db.runAsync(
      `INSERT INTO transactions (title, amount, type, category, date, note, is_recurring, recurring_interval)
       VALUES ('Plaća', ?, 'income', 'salary', ?, NULL, 1, 'monthly')`,
      [salary, date.toISOString()]
    );
  } else if (existing.amount !== salary) {
    await db.runAsync('UPDATE transactions SET amount = ? WHERE id = ?', [salary, existing.id]);
  }
}

export async function getAllTimeTotals(
  db: SQLiteDatabase
): Promise<{ totalIncome: number; totalExpense: number }> {
  const result = await db.getFirstAsync<{ totalIncome: number; totalExpense: number }>(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
     FROM transactions`
  );
  return { totalIncome: result?.totalIncome ?? 0, totalExpense: result?.totalExpense ?? 0 };
}

export async function getTransactionsByWeek(db: SQLiteDatabase): Promise<Transaction[]> {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE date >= ? ORDER BY date DESC',
    [monday.toISOString()]
  );
}

// Prevents concurrent sync calls for the same month from creating duplicates
const activeSyncs = new Set<string>();

/**
 * Auto-generates recurring transactions for the target year/month if not yet present.
 * Safe to call concurrently — second call for the same month is a no-op.
 */
export async function syncRecurringTransactions(
  db: SQLiteDatabase,
  year: number,
  month: number
): Promise<void> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const monthPrefix = `${year}-${pad(month)}`;

  if (activeSyncs.has(monthPrefix)) return;
  activeSyncs.add(monthPrefix);

  try {
    // Get recurring templates — exclude salary (handled separately by syncSalaryTransaction)
    const templates = await db.getAllAsync<Transaction>(`
      SELECT * FROM transactions
      WHERE is_recurring = 1 AND category != 'salary'
        AND id IN (
          SELECT MIN(id)
          FROM transactions
          WHERE is_recurring = 1 AND category != 'salary'
          GROUP BY title, category, type
        )
    `);

    for (const tmpl of templates) {
      const tmplMonthPrefix = tmpl.date.substring(0, 7);

      // Never generate entries for months before the template was created
      if (monthPrefix < tmplMonthPrefix) continue;

      if (tmpl.recurring_interval === 'yearly') {
        const origMonth = tmpl.date.substring(5, 7);
        if (origMonth !== pad(month)) continue;
      }

      const existing = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM transactions
         WHERE is_recurring = 1 AND title = ? AND category = ? AND type = ?
           AND date LIKE ?`,
        [tmpl.title, tmpl.category, tmpl.type, `${monthPrefix}%`]
      );

      if (!existing) {
        const origDay = parseInt(tmpl.date.substring(8, 10), 10);
        const lastDay = new Date(year, month, 0).getDate();
        const day = Math.min(origDay, lastDay);
        const date = new Date(year, month - 1, day, 12, 0, 0);

        await db.runAsync(
          `INSERT INTO transactions
            (title, amount, type, category, date, note, is_recurring, recurring_interval)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
          [
            tmpl.title,
            tmpl.amount,
            tmpl.type,
            tmpl.category,
            date.toISOString(),
            tmpl.note,
            tmpl.recurring_interval,
          ]
        );
      }
    }
  } finally {
    activeSyncs.delete(monthPrefix);
  }
}
