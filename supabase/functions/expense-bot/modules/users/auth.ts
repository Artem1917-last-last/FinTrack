import { Context, NextFunction } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { getAllowedUsers } from "../accounting/index.ts";

/**
 * Фильтр безопасности: проверяет, есть ли пользователь в белом списке.
 */
export async function authMiddleware(ctx: Context, next: NextFunction) {
  if (!ctx.from) return; // Игнорируем обновления без пользователя (каналы и т.д.)

  const userId = ctx.from.id.toString();

  try {
    const allowedUsers = await getAllowedUsers();
    const isAllowed = allowedUsers?.some(user => user.telegram_id === userId);

    // ПРЯМАЯ КРИТИКА: 
    // Твой текущий ID: ${userId}. Если ты случайно удалишь себя из базы, 
    // бот заблокирует даже тебя. Поэтому добавим "Hardcoded Admin" (твой ID).
    const ADMIN_ID = "410749699"; // Вставь сюда свой ID

    if (isAllowed || userId === ADMIN_ID) {
      return await next(); // Пропускаем к функциям бота
    }

    // Если доступа нет
    if (ctx.callbackQuery) {
      return await ctx.answerCallbackQuery({ 
        text: "⛔️ Доступ запрещен. Обратитесь к администратору.", 
        show_alert: true 
      });
    }

    await ctx.reply("⛔️ **Доступ ограничен**\n\nВашего ID нет в белом списке системы. Сообщите свой ID администратору для получения доступа.");
    console.log(`[AUTH_BLOCKED] User ${userId} tried to access the bot.`);
    
  } catch (err) {
    console.error("[AUTH_ERROR]", err);
    await ctx.reply("⚠️ Ошибка проверки доступа. Попробуйте позже.");
  }
}