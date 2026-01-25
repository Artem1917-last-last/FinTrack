import { InlineKeyboard } from "https://deno.land/x/grammy@v1.21.1/mod.ts";

export function makeUsersKeyboard(users: any[] = []) {
  const keyboard = new InlineKeyboard();
  
  users.forEach(user => {
    // ИСПРАВЛЕНО: используем telegram_id, так как это имя колонки в access_list
    const uid = user.telegram_id;
    const name = user.name || "Без имени";

    // Выводим имя (если есть) и ID, чтобы было удобнее ориентироваться
    keyboard.text(`❌ ${name} (ID: ${uid})`, `del_user:${uid}`).row();
  });

  keyboard.text("➕ Добавить пользователя", "add_user_prompt").row();
  keyboard.text("⬅️ Назад в меню", "back_to_menu");
  
  return keyboard;
}