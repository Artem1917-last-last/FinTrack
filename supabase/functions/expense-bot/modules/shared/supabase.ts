import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0';

// Используем оператор "!", потому что в Edge Functions эти ключи ОБЯЗАНЫ быть.
// Если их нет — функция должна упасть сразу, а не выдавать странные ошибки позже.
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// 1. Стандартный клиент (для расходов, где работает RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Админ-клиент (для сессий и системных таблиц, в обход RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});