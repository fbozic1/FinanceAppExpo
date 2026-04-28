export type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', label: 'Hrana', icon: 'fast-food-outline', color: '#F59E0B' },
  { id: 'housing', label: 'Stan', icon: 'home-outline', color: '#6366F1' },
  { id: 'transport', label: 'Prijevoz', icon: 'car-outline', color: '#3B82F6' },
  { id: 'health', label: 'Zdravlje', icon: 'medical-outline', color: '#EF4444' },
  { id: 'entertainment', label: 'Zabava', icon: 'game-controller-outline', color: '#8B5CF6' },
  { id: 'shopping', label: 'Kupovina', icon: 'bag-outline', color: '#EC4899' },
  { id: 'education', label: 'Obrazovanje', icon: 'school-outline', color: '#14B8A6' },
  { id: 'other', label: 'Ostalo', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', label: 'Plaća', icon: 'cash-outline', color: '#10B981' },
  { id: 'freelance', label: 'Freelance', icon: 'laptop-outline', color: '#14B8A6' },
  { id: 'investment', label: 'Investicija', icon: 'trending-up-outline', color: '#6366F1' },
  { id: 'gift', label: 'Poklon', icon: 'gift-outline', color: '#EC4899' },
  { id: 'other_income', label: 'Ostalo', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
];

export function getCategoryById(id: string): Category | undefined {
  return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.id === id);
}
