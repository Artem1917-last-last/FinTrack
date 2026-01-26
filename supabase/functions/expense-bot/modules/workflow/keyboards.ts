// modules/workflow/keyboards.ts
import { InlineKeyboard } from "https://deno.land/x/grammy@v1.21.1/mod.ts";

// Описываем структуру категории
interface Category {
  id: string;
  name: string;
}

/**
 * Клавиатура выбора категории при записи расхода
 */
export function makeCategorySelectionKeyboard(categories: Category[]) {
  const keyboard = new InlineKeyboard();
  categories.forEach((cat) => {
    // Каждая категория — новая строка для удобства нажатия
    keyboard.text(cat.name, `save_exp:${cat.id}`).row();
  });
  return keyboard;
}

/**
 * Кнопка пропуска комментария
 */
export const skipCommentKeyboard = new InlineKeyboard()
  .text("⏩ Пропустить описание", "skip_comment");

/**
 * Кнопка отмены последнего действия
 */
export function makeUndoKeyboard(expenseId: string) {
  return new InlineKeyboard().text("❌ Удалить (ошибка)", `undo:${expenseId}`);
}