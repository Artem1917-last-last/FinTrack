// modules/accounting/index.ts
import { supabaseAdmin } from "../shared/supabase.ts";

/** ... (Session interface и функции сессий без изменений) ... **/

export interface Session {
  step?: string;
  amount?: number;
  comment?: string;
  report_from?: string;
  target_user_id?: string;
}

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

/** --- РАСХОДЫ (expenses) --- **/

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

/** --- КАТЕГОРИИ (categories) --- **/

export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .eq("is_archived", false)
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

// ИСПРАВЛЕНО: Умное добавление с восстановлением из архива
export async function addCategory(name: string) {
  const cleanName = name.trim();
  
  const { data, error } = await supabaseAdmin
    .from("categories")
    .upsert(
      { name: cleanName, is_archived: false }, 
      { onConflict: "name" } // Если имя уже есть, обновляем is_archived на false
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabaseAdmin
    .from("categories")
    .update({ is_archived: true })
    .eq("id", categoryId); 
  if (error) throw error;
}

/** --- ДОСТУП (access_list) --- **/

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