import { type SQLiteDatabase } from 'expo-sqlite';

export type Goal = {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  deadline: string | null;
};

export type NewGoal = Omit<Goal, 'id'>;

export async function getAllGoals(db: SQLiteDatabase): Promise<Goal[]> {
  return db.getAllAsync<Goal>('SELECT * FROM goals ORDER BY id DESC');
}

export async function insertGoal(
  db: SQLiteDatabase,
  goal: NewGoal
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO goals (title, target_amount, current_amount, icon, deadline) VALUES (?, ?, ?, ?, ?)',
    [goal.title, goal.target_amount, goal.current_amount, goal.icon, goal.deadline]
  );
  return result.lastInsertRowId;
}

export async function addToGoal(
  db: SQLiteDatabase,
  id: number,
  amount: number
): Promise<void> {
  await db.runAsync(
    'UPDATE goals SET current_amount = MIN(target_amount, current_amount + ?) WHERE id = ?',
    [amount, id]
  );
}

export async function deleteGoal(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
}
