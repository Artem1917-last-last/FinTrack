import { InlineKeyboard } from "https://deno.land/x/grammy@v1.21.1/mod.ts";

export function makeCategoriesKeyboard(categories: any[] = []) {
  const keyboard = new InlineKeyboard();
  
  // Если категории есть — выводим их
  if (categories.length > 0) {
    categories.forEach(cat => {
      // Кнопка удаления категории (общая для всех)
      keyboard.text(`❌ ${cat.name}`, `del_cat:${cat.id}`).row();
    });
  }

  keyboard.text("➕ Добавить категорию", "add_category_prompt").row();
  keyboard.text("⬅️ Назад в меню", "back_to_menu");
  
  return keyboard;
}