import { InlineKeyboard } from "https://deno.land/x/grammy@v1.21.1/mod.ts";

// Типизация на основе твоей таблицы access_list
export interface AccessUser {
  telegram_id: string;
  name: string | null;
  added_at?: string;
}

export function makeUsersKeyboard(users: AccessUser[]) {
  const keyboard = new InlineKeyboard();
  
  users.forEach(user => {
    const uid = user.telegram_id;
    const name = user.name || "Без имени";

    // Обрати внимание: callback_data должна совпадать с тем, что ловит Handler
    keyboard.text(`❌ ${name} (ID: ${uid})`, `del_user:${uid}`).row();
  });

  keyboard.text("➕ Добавить пользователя", "add_user_prompt").row();
  keyboard.text("⬅️ Назад в меню", "back_to_menu");
  
  return keyboard;
}