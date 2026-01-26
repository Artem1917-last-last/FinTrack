// modules/interface/index.ts
import { Bot, Keyboard } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { deleteSession, setSession } from "../accounting/index.ts";
import { setupDispatcher } from "./dispatcher.ts";

// 1. ИМПОРТ ЗАЩИТЫ
import { authMiddleware } from "../users/auth.ts";

// Точки входа и настройки обработчиков из модулей
import { enterRecordFlow, setupWorkflowHandlers } from "../workflow/index.ts";
import { enterReportFlow, setupReportHandlers } from "../reports/index.ts";
import { enterCategoryFlow, setupCategoryHandlers } from "../categories/index.ts";
import { enterUsersFlow, setupUsersHandlers } from "../users/index.ts";

export const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "");

/**
 * ВАЖНО: Устанавливаем замок безопасности ПЕРВЫМ.
 */
bot.use(authMiddleware);

// Главное меню с добавленной физической кнопкой "♻️ Сброс"
export const mainMenuKeyboard = new Keyboard()
  .text("💳 Записать расход").row()
  .text("📂 Категории").text("📊 Отчет Excel").row()
  .text("👥 Доступ").text("♻️ Сброс") // Теперь кнопку видно глазами
  .resized()
  .persistent();

/**
 * 2. ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ МОДУЛЕЙ
 */
setupWorkflowHandlers(bot); 
setupCategoryHandlers(bot); 
setupReportHandlers(bot);   
setupUsersHandlers(bot);    

/**
 * 3. КОМАНДЫ
 */

// Команда СТАРТ / МЕНЮ
bot.command(["start", "menu"], async (ctx) => {
  if (!ctx.from) return;
  await deleteSession(ctx.from.id);
  // По умолчанию сразу предлагаем записать расход
  await setSession(ctx.from.id, { step: "wait_amount" });
  
  await ctx.reply("💰 **Введи сумму расхода (₽):**", { 
    reply_markup: mainMenuKeyboard, 
    parse_mode: "Markdown" 
  });
});

// Команда СБРОСА (текстовая)
bot.command(["reset", "cancel"], async (ctx) => {
  if (!ctx.from) return;
  await deleteSession(ctx.from.id);
  await ctx.reply("♻️ **Состояние сброшено.**", {
    reply_markup: mainMenuKeyboard,
    parse_mode: "Markdown"
  });
});

/**
 * 4. ОБРАБОТКА НАЖАТИЙ REPLY-КНОПОК (Меню)
 */
bot.hears("💳 Записать расход", async (ctx) => await enterRecordFlow(ctx));
bot.hears("📂 Категории", async (ctx) => await enterCategoryFlow(ctx));
bot.hears("📊 Отчет Excel", async (ctx) => await enterReportFlow(ctx));
bot.hears("👥 Доступ", async (ctx) => await enterUsersFlow(ctx));

// ОБРАБОТЧИК ДЛЯ ФИЗИЧЕСКОЙ КНОПКИ СБРОСА
bot.hears("♻️ Сброс", async (ctx) => {
  if (!ctx.from) return;
  try {
    await deleteSession(ctx.from.id);
    await ctx.reply("♻️ **Состояние сброшено.**\nЧерновики удалены, бот готов к работе.", {
      reply_markup: mainMenuKeyboard,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("[RESET_BUTTON_ERROR]", err);
    await ctx.reply("❌ Ошибка сброса. Используй /start");
  }
});

/**
 * 5. ДИСПЕТЧЕР (В самом конце)
 */
setupDispatcher(bot);