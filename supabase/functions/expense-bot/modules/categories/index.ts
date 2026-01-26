import { Context, Bot } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { 
  getCategories, 
  addCategory, 
  deleteCategory, 
  setSession, 
  deleteSession 
} from "../accounting/index.ts";
import { makeCategoriesKeyboard } from "./keyboards.ts";

/**
 * 1. Вход в управление (вызывается из главного интерфейса)
 */
export async function enterCategoryFlow(ctx: Context) {
  if (!ctx.from) return;
  const categories = await getCategories(); 
  
  const text = "📂 **Управление категориями**\n\nНажмите на ❌, чтобы удалить, или добавьте новую:";
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      reply_markup: makeCategoriesKeyboard(categories),
      parse_mode: "Markdown"
    });
  } else {
    await ctx.reply(text, {
      reply_markup: makeCategoriesKeyboard(categories),
      parse_mode: "Markdown"
    });
  }
}

/**
 * 2. Обработка текста (вызывается Диспетчером)
 */
export async function handleCategoryText(ctx: Context) {
  if (!ctx.from || !ctx.message?.text) return;

  const name = ctx.message.text.trim(); 
  
  try {
    await addCategory(name);
    await ctx.reply(`✅ Категория "${name}" успешно добавлена!`);
  } catch (_err) {
    await ctx.reply("❌ Ошибка: возможно, такая категория уже существует.");
  } finally {
    await deleteSession(ctx.from.id);
    // Возвращаем пользователя в список категорий (авто-обновление интерфейса)
    await enterCategoryFlow(ctx);
  }
}

/**
 * 3. Регистрация кнопок
 */
export function setupCategoryHandlers(bot: Bot) {
  
  // Кнопка "Назад в меню"
  bot.callbackQuery("back_to_menu", async (ctx) => {
    if (!ctx.from) return;
    
    // Сбрасываем сессию, если пользователь передумал добавлять категорию
    await deleteSession(ctx.from.id);
    await ctx.answerCallbackQuery();

    /** * Здесь важно вызвать функцию отображения вашего ГЛАВНОГО МЕНЮ. 
     * Если она находится в другом модуле (например, modules/main/index.ts), 
     * ее нужно будет импортировать в начало этого файла.
     */
    await ctx.editMessageText("🏠 Вы вернулись в **Главное меню**", {
      parse_mode: "Markdown",
      // reply_markup: mainKeyboard // Сюда подставляем клавиатуру главного меню
    });
  });

  // Кнопка "Добавить"
  bot.callbackQuery("add_category_prompt", async (ctx) => {
    if (!ctx.from) return;
    await setSession(ctx.from.id, { step: "wait_category_name" });
    
    await ctx.editMessageText("📝 **Введи название для новой категории:**", {
      parse_mode: "Markdown"
    });
    await ctx.answerCallbackQuery();
  });

  // Кнопка удаления
  bot.callbackQuery(/^del_cat:(.+)$/, async (ctx) => {
    const categoryId = ctx.match![1];
    
    try {
      await deleteCategory(categoryId);
      const categories = await getCategories();
      // Обновляем клавиатуру мгновенно
      await ctx.editMessageReplyMarkup({ 
        reply_markup: makeCategoriesKeyboard(categories) 
      });
      await ctx.answerCallbackQuery({ text: "Категория удалена" });
    } catch (_err) {
      await ctx.answerCallbackQuery({ text: "Ошибка удаления", show_alert: true });
    }
  });
}