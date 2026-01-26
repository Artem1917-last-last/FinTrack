import { supabaseAdmin } from "../shared/supabase.ts";

/** * --- ТИПИЗАЦИЯ СЕССИИ --- */
export interface Session {
  step?: string;
  amount?: number;
  comment?: string;
  report_from?: string;
  target_user_id?: string;
}

/** * --- СЕССИИ (Черновики) --- */

export async function setSession(userId: string | number, data: Session) {
  const { error } = await supabaseAdmin
    .from("bot_sessions")
    .upsert({ user_id: userId.toString(), ...data });
  if (error) throw error;
}

export async function getSession(userId: string | number): Promise<Session | null> {
  const { data, error } = await supabaseAdmin
    .from("bot_sessions")
    .select("*")
    .eq("user_id", userId.toString())
    .maybeSingle(); 
    
  if (error) throw error;
  return data as Session | null;
}

export async function deleteSession(userId: string | number) {
  const { error } = await supabaseAdmin
    .from("bot_sessions")
    .delete()
    .eq("user_id", userId.toString());
  if (error) throw error;
}

/** * --- РАСХОДЫ (expenses) --- */

export async function saveExpense(userId: string | number, amount: number, categoryId: string, comment: string = "") {
  const { data, error } = await supabaseAdmin
    .from("expenses")
    .insert([{ 
      user_id: userId.toString(), 
      amount, 
      category_id: categoryId, 
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
    .eq("id", expenseId); 
  if (error) throw error;
}

/** * --- КАТЕГОРИИ (categories) --- */

// 1. ИСПРАВЛЕНО: Теперь берем только НЕ архивные категории
export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .eq("is_archived", false) // Фильтр: только активные
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addCategory(name: string) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert([{ name }]) 
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 2. ИСПРАВЛЕНО: Мягкое удаление (Soft Delete)
export async function deleteCategory(categoryId: string) {
  const { error } = await supabaseAdmin
    .from("categories")
    .update({ is_archived: true }) // Вместо удаления ставим флаг архива
    .eq("id", categoryId); 
  if (error) throw error;
}

/** * --- ДОСТУП (access_list) --- */

export async function getAllowedUsers() {
  const { data, error } = await supabaseAdmin
    .from("access_list")
    .select("telegram_id, name")
    .order("added_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addUser(targetId: string | number, name: string = "Пользователь") {
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