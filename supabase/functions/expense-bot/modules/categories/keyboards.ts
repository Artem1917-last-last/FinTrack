import { InlineKeyboard } from "https://deno.land/x/grammy@v1.21.1/mod.ts";

// Типизация на основе твоей таблицы 'categories'
interface Category {
  id: string;   // uuid в базе
  name: string; // text в базе
}

export function makeCategoriesKeyboard(categories: Category[] = []) {
  const keyboard = new InlineKeyboard();
  
  if (categories.length > 0) {
    categories.forEach(cat => {
      // Используем cat.id и cat.name, теперь IDE будет их подсказывать
      keyboard.text(`❌ ${cat.name}`, `del_cat:${cat.id}`).row();
    });
  }

  keyboard.text("➕ Добавить категорию", "add_category_prompt").row();
  keyboard.text("⬅️ Назад в меню", "back_to_menu");
  
  return keyboard;
}