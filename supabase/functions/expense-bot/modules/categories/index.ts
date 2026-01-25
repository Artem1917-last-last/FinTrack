import { Context } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { getCategories, addCategory, deleteCategory, setSession, deleteSession } from "../accounting/index.ts";
import { makeCategoriesKeyboard } from "./keyboards.ts";

// 1. Вход в управление (вызывается из интерфейса)
export async function enterCategoryFlow(ctx: Context) {
  if (!ctx.from) return;
  // Таблица общая, ID не передаем
  const categories = await getCategories(); 
  await ctx.reply("📂 **Управление категориями**\n\nНажмите на ❌, чтобы удалить, или добавьте новую:", {
    reply_markup: makeCategoriesKeyboard(categories),
    parse_mode: "Markdown"
  });
}

// 2. ФУНКЦИЯ ДЛЯ ДИСПЕТЧЕРА (Обработка текста)
export async function handleCategoryText(ctx: Context) {
  if (!ctx.from || !ctx.message?.text) return;

  const name = ctx.message.text;
  
  try {
    await addCategory(name); // Сохраняем в общую таблицу
    await ctx.reply(`✅ Категория "${name}" добавлена!`);
  } catch (err) {
    await ctx.reply("❌ Ошибка при добавлении.");
  } finally {
    // Чек-лист: обязательно сбрасываем сессию
    await deleteSession(ctx.from.id);
    // Возвращаем пользователя в меню категорий
    await enterCategoryFlow(ctx);
  }
}

// 3. Обработка кнопок
export function setupCategoryHandlers(bot: any) {
  
  // Нажали "Добавить" -> ставим шаг для Диспетчера
  bot.callbackQuery("add_category_prompt", async (ctx: Context) => {
    await setSession(ctx.from!.id, { step: "wait_category_name" });
    await ctx.reply("Напишите название для новой категории:");
    await ctx.answerCallbackQuery();
  });

  // Нажали на удаление
  bot.callbackQuery(/^del_cat:(.+)$/, async (ctx: Context) => {
    const categoryId = ctx.match![1];
    // Удаляем из общей таблицы (без привязки к юзеру)
    await deleteCategory(categoryId);
    
    const categories = await getCategories();
    await ctx.editMessageReplyMarkup({ reply_markup: makeCategoriesKeyboard(categories) });
    await ctx.answerCallbackQuery({ text: "Категория удалена" });
  });
}