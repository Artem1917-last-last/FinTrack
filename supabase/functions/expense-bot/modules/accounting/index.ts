import { supabaseAdmin } from "../shared/supabase.ts";

/** * --- СЕССИИ (Черновики) --- 
 * ВАЖНО: Предполагаем, что таблица bot_sessions имеет колонку user_id (text)
 */
export async function setSession(userId: string | number, data: { amount?: number, comment?: string, step?: string }) {
  const { error } = await supabaseAdmin
    .from("bot_sessions")
    .upsert({ user_id: userId.toString(), ...data });
  if (error) throw error;
}

export async function getSession(userId: string | number) {
  const { data, error } = await supabaseAdmin
    .from("bot_sessions")
    .select("*")
    .eq("user_id", userId.toString())
    .maybeSingle(); // maybeSingle лучше для проверки наличия
  if (error) throw error;
  return data;
}

export async function deleteSession(userId: string | number) {
  const { error } = await supabaseAdmin
    .from("bot_sessions")
    .delete()
    .eq("user_id", userId.toString());
  if (error) throw error;
}

/** * --- РАСХОДЫ (expenses) --- 
 * Колонки: id(uuid), user_id(text), amount(numeric), category_id(uuid), comment(text)
 */
export async function saveExpense(userId: string | number, amount: number, categoryId: string, comment: string = "") {
  const { data, error } = await supabaseAdmin
    .from("expenses")
    .insert([{ 
      user_id: userId.toString(), 
      amount, 
      category_id: categoryId, // Здесь должен быть UUID
      comment 
    }])
    .select()
    .single();

  if (error) throw new Error(`Ошибка сохранения расхода: ${error.message}`);
  return data;
}

export async function deleteExpense(expenseId: string) {
  const { error } = await supabaseAdmin
    .from("expenses")
    .delete()
    .eq("id", expenseId); // expenseId должен быть строкой-UUID
  if (error) throw error;
}

/** * --- КАТЕГОРИИ (categories) --- 
 * Колонки: id(uuid), name(text), user_id(text)
 */
export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addCategory(name: string) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert([{ name }]) // user_id nullable, оставляем пустым для общих категорий
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", categoryId); // categoryId должен быть строкой-UUID
  if (error) throw error;
}

/** * --- ДОСТУП (access_list) --- 
 * Колонки: telegram_id(text), name(text), added_at(timestamptz)
 */
export async function getAllowedUsers() {
  const { data, error } = await supabaseAdmin
    .from("access_list")
    .select("telegram_id, name")
    .order("added_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addUser(targetId: string | number, name: string = "Новый пользователь") {
  const { data, error } = await supabaseAdmin
    .from("access_list")
    .insert([{ 
        telegram_id: targetId.toString(), 
        name: name 
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUser(targetId: string | number) {
  const { error } = await supabaseAdmin
    .from("access_list")
    .delete()
    .eq("telegram_id", targetId.toString());
  if (error) throw error;
}