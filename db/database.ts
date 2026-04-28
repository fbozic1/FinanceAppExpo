import { type SQLiteDatabase } from 'expo-sqlite';

export async function migrateDb(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Initial schema
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      title     TEXT NOT NULL,
      amount    REAL NOT NULL,
      type      TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category  TEXT NOT NULL,
      date      TEXT NOT NULL,
      note      TEXT
    );

    CREATE TABLE IF NOT EXISTS goals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      title          TEXT NOT NULL,
      target_amount  REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      icon           TEXT NOT NULL DEFAULT 'star-outline',
      deadline       TEXT
    );
  `);

  // Migration v2: recurring transactions support
  const cols = await db.getAllAsync<{ name: string }>(
    'SELECT name FROM pragma_table_info("transactions")'
  );
  const names = cols.map((c) => c.name);
  if (!names.includes('is_recurring')) {
    await db.runAsync(
      'ALTER TABLE transactions ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0'
    );
  }
  if (!names.includes('recurring_interval')) {
    await db.runAsync(
      "ALTER TABLE transactions ADD COLUMN recurring_interval TEXT NOT NULL DEFAULT 'monthly'"
    );
  }
}
