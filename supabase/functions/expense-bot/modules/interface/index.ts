import { Bot, Context } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { saveExpense, getCategories } from "../accounting/index.ts";

// Создаем бота
const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "");

// Улучшенный парсер
function parseMessage(text: string) {
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  
  const amountStr = match[0];
  const amount = parseFloat(amountStr.replace(",", "."));
  const description = text.replace(amountStr, "").trim() || "Без описания";
  
  return { amount, description };
}

bot.command("start", async (ctx: Context) => {
  await ctx.reply("Привет! Пришли сумму и описание (например: 1500 нитки).");
});

// Используем "message:text", чтобы гарантировать наличие текста
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const userId = ctx.from.id;

  const parsed = parseMessage(text);

  if (!parsed) {
    await ctx.reply("❌ Не вижу суммы. Напиши число (например: 1500 фурнитура).");
    return;
  }

  try {
    // 3. Сохраняем в базу
    await saveExpense(userId, parsed.amount, parsed.description);

    // 4. Загружаем категории
    const categories = await getCategories();
    
    // Формируем список категорий аккуратно
    const categoryList = (categories && categories.length > 0)
      ? categories.map((c: { name: string }) => c.name).join(", ")
      : "список пуст";

    await ctx.reply(
      `✅ Записал: ${parsed.amount} ₸ (${parsed.description})\n\n` +
      `Доступные категории: ${categoryList}`
    );
  } catch (err) {
    console.error("Ошибка в боте:", err);
    await ctx.reply("❌ Ошибка при сохранении. Проверь базу данных.");
  }
});

export { bot };