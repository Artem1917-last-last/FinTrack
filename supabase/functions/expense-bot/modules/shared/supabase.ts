import { createClient } from "https://esm.sh/@supabase/supabase-js@2.92.0";;

// Берем ключи из переменных окружения Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Создаем клиент. Этот файл ничего не знает о логике, он просто "труба" к базе.
export const supabase = createClient(supabaseUrl, supabaseKey);
