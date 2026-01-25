import { Context } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { 
  saveExpense, 
  getCategories, 
  setSession, 
  getSession, 
  deleteSession,
  deleteExpense 
} from "../accounting/index.ts";
import { makeCategorySelectionKeyboard, skipCommentKeyboard, makeUndoKeyboard } from "./keyboards.ts";

/**
 * 1. ВХОД В ПРОЦЕСС (Вызывается из Interface)
 */
export async function enterRecordFlow(ctx: Context) {
  if (!ctx.from) return;
  await setSession(ctx.from.id, { step: "wait_amount" }); // Устанавливаем начальный шаг
  await ctx.reply("💰 Введи сумму расхода (₸):");
}

/**
 * 2. ОБРАБОТЧИК ТЕКСТА (Вызывается Диспетчером)
 */
export async function handleWorkflowText(ctx: Context) {
  if (!ctx.from || !ctx.message?.text) return;
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const session = await getSession(userId);

  // Шаг А: Ввод суммы
  if (!session || session.step === "wait_amount") {
    const amount = parseFloat(text.replace(",", "."));
    if (isNaN(amount)) return ctx.reply("Пожалуйста, введи сумму числом.");
    
    await setSession(userId, { amount, step: "wait_comment", comment: "" });
    return await ctx.reply(`💰 Сумма: ${amount} ₸\n\nНапиши комментарий или нажми «Пропустить»:`, {
      reply_markup: skipCommentKeyboard
    });
  }

  // Шаг Б: Ввод комментария
  if (session.step === "wait_comment") {
    await setSession(userId, { comment: text, step: "wait_category" });
    return await showCategoryKeyboard(ctx);
  }

  // Шаг В: Если юзер пишет текст там, где нужны кнопки
  if (session.step === "wait_category") {
    return await ctx.reply("Выбери категорию, нажав на кнопку 👆");
  }
}

/**
 * 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И КНОПКИ
 */
async function showCategoryKeyboard(ctx: Context) {
  if (!ctx.from) return;
  const categories = await getCategories(); // Таблица теперь общая
  await ctx.reply("Выбери категорию для этой записи:", {
    reply_markup: makeCategorySelectionKeyboard(categories)
  });
}

export function setupWorkflowHandlers(bot: any) {
  // Кнопка: Пропустить комментарий
  bot.callbackQuery("skip_comment", async (ctx: Context) => {
    if (!ctx.from) return;
    await setSession(ctx.from.id, { comment: "Без описания", step: "wait_category" });
    await showCategoryKeyboard(ctx);
    await ctx.answerCallbackQuery();
  });

  // Кнопка: Финальное сохранение
  bot.callbackQuery(/^save_exp:(.+)/, async (ctx: Context) => {
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const categoryId = ctx.match![1];
    const session = await getSession(userId);

    if (!session?.amount) return ctx.reply("Ошибка: сессия истекла.");

    try {
      const saved = await saveExpense(userId, session.amount, categoryId, session.comment);
      await deleteSession(userId); // Чек-лист: СБРОС СЕССИИ

      await ctx.editMessageText(
        `✅ Сохранено!\n\n💰 **${session.amount} ₸**\n📝 *${session.comment}*`,
        { reply_markup: makeUndoKeyboard(saved.id), parse_mode: "Markdown" }
      );
    } catch (_err) {
      await ctx.reply("❌ Ошибка сохранения.");
    }
    await ctx.answerCallbackQuery();
  });

  // Кнопка: Удаление (Undo)
  bot.callbackQuery(/^undo:(.+)/, async (ctx: Context) => {
    if (!ctx.from) return;
    try {
      await deleteExpense(ctx.match![1]); // Таблица общая, ID юзера не нужен
      await ctx.editMessageText("🗑 Запись удалена.");
    } catch (_err) {
      await ctx.reply("Не удалось удалить.");
    }
    await ctx.answerCallbackQuery();
  });
}