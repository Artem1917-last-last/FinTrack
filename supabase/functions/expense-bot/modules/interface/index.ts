import { Bot, InlineKeyboard } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { deleteSession } from "../accounting/index.ts";
import { setupDispatcher } from "./dispatcher.ts";

// Точки входа из модулей
import { enterRecordFlow } from "../workflow/index.ts";
import { enterReportFlow } from "../reports/index.ts";
import { enterCategoryFlow } from "../categories/index.ts";
import { enterUsersFlow } from "../users/index.ts";

export const mainMenuKeyboard = new InlineKeyboard()
  .text("💳 Записать расход", "start_record").row()
  .text("📂 Категории", "manage_categories")
  .text("📊 Отчет Excel", "get_report").row()
  .text("👥 Доступ", "manage_users");

export function setupInterface(bot: Bot) {
  
  // ВКЛЮЧАЕМ ДИСПЕТЧЕР ТЕКСТА
  setupDispatcher(bot);

  // Команда /start или /menu — всегда сбрасывает текущий шаг
  bot.command(["start", "menu"], async (ctx) => {
    if (ctx.from) await deleteSession(ctx.from.id);
    await ctx.reply("🏠 **Главное меню Unum**", { 
      reply_markup: mainMenuKeyboard, 
      parse_mode: "Markdown" 
    });
  });

  // Универсальная кнопка "Назад в меню" (сброс сессии)
  bot.callbackQuery("back_to_menu", async (ctx) => {
    if (ctx.from) await deleteSession(ctx.from.id);
    await ctx.editMessageText("🏠 **Главное меню Unum**", { 
      reply_markup: mainMenuKeyboard, 
      parse_mode: "Markdown" 
    });
    await ctx.answerCallbackQuery();
  });

  /**
   * РАСПРЕДЕЛЕНИЕ ПО МОДУЛЯМ (КНОПКИ)
   */

  bot.callbackQuery("start_record", async (ctx) => {
    await enterRecordFlow(ctx);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("manage_categories", async (ctx) => {
    await enterCategoryFlow(ctx);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("get_report", async (ctx) => {
    await enterReportFlow(ctx);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("manage_users", async (ctx) => {
    await enterUsersFlow(ctx);
    await ctx.answerCallbackQuery();
  });
}