import { Context, Bot } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { supabaseAdmin } from "../shared/supabase.ts";
import { makeUsersKeyboard } from "./keyboards.ts"; 
import { deleteSession, setSession } from "../accounting/index.ts"; 

interface AccessUser {
  telegram_id: string;
  name: string;
}

/** --- БАЗОВЫЕ ОПЕРАЦИИ С БАЗОЙ --- */

export async function getAllowedUsers(): Promise<AccessUser[] | null> {
  const { data, error } = await supabaseAdmin
    .from("access_list") 
    .select("telegram_id, name");
    
  if (error) throw error;
  return data as AccessUser[];
}

export async function addUser(targetId: string | number, name: string = "Пользователь"): Promise<void> {
  const { error } = await supabaseAdmin
    .from("access_list")
    .insert([{ telegram_id: targetId.toString(), name }]);
    
  if (error) throw error;
}

export async function deleteUser(targetId: string | number): Promise<void> {
  const { error } = await supabaseAdmin
    .from("access_list")
    .delete()
    .eq("telegram_id", targetId.toString());
    
  if (error) throw error;
}

/** --- ТОЧКИ ВХОДА --- */

export async function enterUsersFlow(ctx: Context) {
  if (!ctx.from) return;
  try {
    const users = await getAllowedUsers();
    const text = "👥 **Управление доступом**\n\nСписок пользователей с доступом к системе:";
    
    // Если вызвано кнопкой — редактируем, если командой — новое сообщение
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        reply_markup: makeUsersKeyboard(users || []),
        parse_mode: "Markdown"
      });
    } else {
      await ctx.reply(text, {
        reply_markup: makeUsersKeyboard(users || []),
        parse_mode: "Markdown"
      });
    }
  } catch (_err) {
    await ctx.reply("❌ Не удалось загрузить список.");
  }
}

export async function handleUsersText(ctx: Context) {
  if (!ctx.from || !ctx.message?.text) return;
  const targetId = ctx.message.text.trim();

  try {
    await addUser(targetId, "Новый пользователь");
    await ctx.reply(`✅ Пользователь \`${targetId}\` добавлен.`);
  } catch (_err) {
    await ctx.reply("❌ Ошибка добавления (возможно, ID уже есть в списке).");
  } finally {
    await deleteSession(ctx.from.id);
    await enterUsersFlow(ctx);
  }
}

/** --- ОБРАБОТЧИК КНОПОК (Setup Handler) --- */

export function setupUsersHandlers(bot: Bot) {
  
  // Кнопка: Назад в меню (Исправлено)
  bot.callbackQuery("back_to_menu", async (ctx) => {
    if (!ctx.from) return;
    await deleteSession(ctx.from.id); // Сбрасываем ожидание ввода ID
    await ctx.answerCallbackQuery();
    
    // Вызов главного меню (отредактируй текст под себя)
    await ctx.editMessageText("🏠 Вы вернулись в **Главное меню**", {
      parse_mode: "Markdown"
      // reply_markup: mainKeyboard 
    });
  });

  // Кнопка: Показать форму добавления
  bot.callbackQuery("add_user_prompt", async (ctx) => {
    if (!ctx.from) return;
    await setSession(ctx.from.id, { step: "wait_user_id" });
    await ctx.editMessageText("📝 **Введи Telegram ID нового пользователя:**\n\nЕго можно узнать в @userinfobot", {
      parse_mode: "Markdown"
    });
    await ctx.answerCallbackQuery();
  });

  // Кнопка: Удаление пользователя
  bot.callbackQuery(/^del_user:(.+)$/, async (ctx) => {
    const targetId = ctx.match![1];
    
    try {
      if (targetId === ctx.from!.id.toString()) {
        return await ctx.answerCallbackQuery({ text: "Нельзя удалить самого себя!", show_alert: true });
      }

      await deleteUser(targetId);
      const users = await getAllowedUsers();
      
      await ctx.editMessageReplyMarkup({ 
        reply_markup: makeUsersKeyboard(users || []) 
      });
      await ctx.answerCallbackQuery({ text: "Доступ отозван" });
    } catch (_err) {
      await ctx.answerCallbackQuery({ text: "Ошибка удаления", show_alert: true });
    }
  });
}