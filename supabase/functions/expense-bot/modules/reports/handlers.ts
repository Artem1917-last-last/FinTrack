import { Context } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { setSession, deleteSession } from "../accounting/index.ts"; 
import { generateExcelFile } from "./service.ts";

export async function enterReportFlow(ctx: Context) {
  if (!ctx.from) return;
  // Установил шаг, который ожидает наш Dispatcher
  await setSession(ctx.from.id, { step: "wait_report_start" });
  await ctx.editMessageText(
    "📊 **Подготовка отчета**\n\nПришли период в формате:\n`с 22.01.2026 по 22.02.2026`",
    { parse_mode: "Markdown" }
  );
}

export async function handleReportDates(ctx: Context) {
  if (!ctx.from || !ctx.message?.text) return;
  
  const dateRegex = /(\d{2}\.\d{2}\.\d{4}).*?(\d{2}\.\d{2}\.\d{4})/;
  const match = ctx.message.text.match(dateRegex);

  if (match) {
    const [_, from, to] = match;
    await ctx.reply("⏳ Генерирую файл...");
    
    try {
      const buffer = await generateExcelFile(ctx.from.id, from, to);
      if (buffer) {
        await ctx.replyWithDocument(
          { source: buffer, filename: `Report_${from}_${to}.xlsx` },
          { caption: `✅ Твой отчет готов` }
        );
      } else {
        await ctx.reply("За этот период данных нет.");
      }
    } catch (err) {
      await ctx.reply("❌ Ошибка генерации.");
    } finally {
      // Чек-лист: Сброс сессии в любом случае после попытки генерации
      await deleteSession(ctx.from.id);
    }
  } else {
    await ctx.reply("Неверный формат. Нужно: `с 01.01.2026 по 01.02.2026`", { parse_mode: "Markdown" });
  }
}