
import { supabase } from '../shared/index.ts';

// Логика обработки и сохранения
export async function saveExpense(payload: { amount: number, categoryId: string, userId: string, description?: string }) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      amount: payload.amount,
      category_id: payload.categoryId,
      user_id: payload.userId,
      description: payload.description
    }]);

  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw error;
  return data;
}
