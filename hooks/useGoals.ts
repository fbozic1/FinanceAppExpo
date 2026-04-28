import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  type Goal,
  type NewGoal,
  getAllGoals,
  insertGoal,
  addToGoal,
  deleteGoal,
} from '@/db/goals';

export function useGoals() {
  const db = useSQLiteContext();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllGoals(db);
    setGoals(data);
    setLoading(false);
  }, [db]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const add = useCallback(
    async (goal: NewGoal) => {
      await insertGoal(db, goal);
      await load();
    },
    [db, load]
  );

  const contribute = useCallback(
    async (id: number, amount: number) => {
      await addToGoal(db, id, amount);
      await load();
    },
    [db, load]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteGoal(db, id);
      await load();
    },
    [db, load]
  );

  return { goals, loading, add, contribute, remove, reload: load };
}
