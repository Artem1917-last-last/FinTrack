import { Context, Bot } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { 
  saveExpense, 
  getCategories, 
  setSession, 
  getSession, 
  deleteSession,
  deleteExpense 
} from "../accounting/index.ts";
import { 
  makeCategorySelectionKeyboard, 
  skipCommentKeyboard, 
  makeUndoKeyboard 
} from "./keyboards.ts";

/**
 * 1. ВХОД В ПРОЦЕСС
 */
export async function enterRecordFlow(ctx: Context) {
  if (!ctx.from) return;
  // Сбрасываем всё и ставим шаг ввода суммы
  await setSession(ctx.from.id, { step: "wait_amount" }); 
  await ctx.reply("💰 **Введи сумму расхода (₽):**", { parse_mode: "Markdown" });
}

/**
 * 2. ОБРАБОТЧИК ТЕКСТА (Диспетчер)
 */
export async function handleWorkflowText(ctx: Context) {
  if (!ctx.from || !ctx.message?.text) return;
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const session = await getSession(userId);

  // Шаг А: Ввод суммы
  if (!session || session.step === "wait_amount") {
    const amount = parseFloat(text.replace(/\s/g, "").replace(",", "."));
    
    if (isNaN(amount) || amount <= 0) {
      return await ctx.reply("❌ Пожалуйста, введи корректную сумму числом.");
    }
    
    await setSession(userId, { amount, step: "wait_comment", comment: "" });
    return await ctx.reply(`💰 Сумма: **${amount} ₽**\n\nНапиши комментарий или нажми кнопку:`, {
      reply_markup: skipCommentKeyboard,
      parse_mode: "Markdown"
    });
  }

  // Шаг Б: Ввод комментария
  if (session.step === "wait_comment") {
    await setSession(userId, { comment: text, step: "wait_category" });
    return await showCategoryKeyboard(ctx);
  }

  // Шаг В: Защита от лишнего текста
  if (session.step === "wait_category") {
    return await ctx.reply("Выбери категорию из списка ниже 👆");
  }
}

/**
 * 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 */
async function showCategoryKeyboard(ctx: Context) {
  if (!ctx.from) return;
  const categories = await getCategories(); 
  await ctx.reply("📂 **Выбери категорию:**", {
    reply_markup: makeCategorySelectionKeyboard(categories),
    parse_mode: "Markdown"
  });
}

/**
 * 4. ОБРАБОТЧИКИ КНОПОК
 */
export function setupWorkflowHandlers(bot: Bot) {
  // Пропустить комментарий
  bot.callbackQuery("skip_comment", async (ctx) => {
    if (!ctx.from) return;
    await setSession(ctx.from.id, { comment: "Без описания", step: "wait_category" });
    await showCategoryKeyboard(ctx);
    await ctx.answerCallbackQuery();
  });

  // Сохранение записи
  bot.callbackQuery(/^save_exp:(.+)/, async (ctx) => {
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const categoryId = ctx.match![1];
    const session = await getSession(userId);

    if (!session?.amount) {
      return await ctx.reply("❌ Ошибка: сессия истекла. Начни заново через /start");
    }

    try {
      // Ищем название категории для красивого вывода
      const categories = await getCategories();
      const category = categories.find(c => c.id === categoryId);
      const categoryName = category ? category.name : "Общее";

      const saved = await saveExpense(
        userId, 
        session.amount, 
        categoryId, 
        session.comment || "Без описания"
      );
      
      await deleteSession(userId); 

      await ctx.editMessageText(
        `✅ **Запись сохранена!**\n\n` +
        `💰 **Сумма:** ${session.amount} ₽\n` +
        `📂 **Категория:** ${categoryName}\n` +
        `📝 **Описание:** *${session.comment || "Без описания"}*`,
        { reply_markup: makeUndoKeyboard(saved.id), parse_mode: "Markdown" }
      );
    } catch (_err) {
      await ctx.reply("❌ Ошибка при сохранении в базу данных.");
    }
    await ctx.answerCallbackQuery();
  });

  // Отмена (Undo)
  bot.callbackQuery(/^undo:(.+)/, async (ctx) => {
    if (!ctx.from) return;
    try {
      await deleteExpense(ctx.match![1]); 
      await ctx.editMessageText("🗑 Запись удалена.");
    } catch (_err) {
      await ctx.answerCallbackQuery({ text: "Не удалось удалить", show_alert: true });
    }
    await ctx.answerCallbackQuery();
  });
}