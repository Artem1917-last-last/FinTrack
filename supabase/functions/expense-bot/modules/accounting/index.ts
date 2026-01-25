import { supabase } from "../shared/supabase.ts";

// 1. Сохранение расхода (возвращает созданную запись с ID)
export async function saveExpense(userId: number, amount: number, category: string = "Без категории") {
  const { data, error } = await supabase
    .from("expenses")
    .insert([{ 
      user_id: userId, 
      amount: amount, 
      category: category,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error("Ошибка БД при сохранении:", error);
    throw new Error("Не удалось сохранить в базу");
  }

  return data;
}

// 2. Получение списка категорий для кнопок в Телеграм
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("name"); // Берем только названия

  if (error) {
    console.error("Ошибка БД при загрузке категорий:", error);
    throw new Error("Не удалось загрузить категории");
  }

  return data;
}