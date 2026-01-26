import { Context as _Context, Bot } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { setSession, getSession, deleteSession } from "../accounting/index.ts"; 
import { generateExcelFile } from "./service.ts";
import { createCalendar, createMonthPicker, createYearPicker } from "./calendar.ts";

/**
 * Вспомогательная функция для прямой отправки файла через Telegram Bot API.
 * Позволяет избежать багов типизации в grammY при работе в Supabase.
 */
async function sendFileDirectly(chatId: number, buffer: Uint8Array, fileName: string, caption: string) {
  const token = Deno.env.get("BOT_TOKEN");
  if (!token) throw new Error("BOT_TOKEN is not defined in environment variables");

  const formData = new FormData();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  formData.append("chat_id", chatId.toString());
  formData.append("document", blob, fileName);
  formData.append("caption", caption);
  formData.append("parse_mode", "Markdown");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
  }
  return response.json();
}

export function setupReportHandlers(bot: Bot) {
  
  // А. Переключатель видов (Дни / Месяцы / Годы)
  bot.callbackQuery(/^rep_view:(\w+):(-?\d+):(-?\d+):(.+)$/, async (ctx) => {
    const [_, view, yearStr, monthStr, prefix] = ctx.match;
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    let kb;
    if (view === "pick_month") kb = createMonthPicker(year, prefix);
    else if (view === "pick_year") kb = createYearPicker(year, prefix);
    else kb = createCalendar(year, month, prefix);

    await ctx.editMessageReplyMarkup({ reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  // Б. Быстрая навигация (Стрелки)
  bot.callbackQuery(/^rep_nav:(-?\d+):(-?\d+):(.+)$/, async (ctx) => {
    const year = parseInt(ctx.match[1]);
    const month = parseInt(ctx.match[2]);
    const prefix = ctx.match[3];
    const date = new Date(year, month);
    
    await ctx.editMessageReplyMarkup({ 
      reply_markup: createCalendar(date.getFullYear(), date.getMonth(), prefix) 
    });
    await ctx.answerCallbackQuery();
  });

  // В. Выбор даты начала
  bot.callbackQuery(/^rep_start:(\d{2}\.\d{2}\.\d{4})$/, async (ctx) => {
    const dateStart = ctx.match[1];
    await setSession(ctx.from.id, { report_from: dateStart, step: "wait_report_end" });
    const now = new Date();
    
    await ctx.editMessageText(`✅ Начало: **${dateStart}**\n📅 Теперь выбери **дату конца**:`, {
      reply_markup: createCalendar(now.getFullYear(), now.getMonth(), "rep_end"),
      parse_mode: "Markdown"
    });
    await ctx.answerCallbackQuery();
  });

  // Г. Финальный выбор и генерация
  bot.callbackQuery(/^rep_end:(\d{2}\.\d{2}\.\d{4})$/, async (ctx) => {
    const dateEnd = ctx.match[1];
    const userId = ctx.from.id;
    const session = await getSession(userId);
    const dateStart = session?.report_from;

    if (!dateStart) return ctx.answerCallbackQuery({ text: "Ошибка: сессия истекла", show_alert: true });

    await ctx.answerCallbackQuery({ text: "Генерирую..." });
    const statusMsg = await ctx.editMessageText(`⏳ Генерирую Excel для...\nпериода: ${dateStart} — ${dateEnd}`);

    try {
      const buffer = await generateExcelFile(userId, dateStart, dateEnd);
      
      if (buffer && buffer.length > 0) {
        // ПРЯМАЯ ОТПРАВКА БЕЗ ИСПОЛЬЗОВАНИЯ InputFile ИЗ GRAMMY
        await sendFileDirectly(
          ctx.chat!.id,
          buffer,
          `Report_${dateStart}_${dateEnd}.xlsx`,
          `✅ Отчет за период **${dateStart} — ${dateEnd}** готов!`
        );
        
        if (typeof statusMsg !== "boolean") {
          await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
        }
      } else {
        await ctx.editMessageText("🤷‍♂️ За этот период данных нет.");
      }
    } catch (err) {
      console.error("[REPORT_ERROR]", err);
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      await ctx.reply(`❌ Ошибка генерации: ${msg}`);
    } finally {
      await deleteSession(userId);
    }
  });
}

export async function enterReportFlow(ctx: _Context) {
  if (!ctx.from) return;
  const now = new Date();
  await setSession(ctx.from.id, { step: "wait_report_start" });
  await ctx.reply("📅 Выбери **дату начала** периода:", {
    reply_markup: createCalendar(now.getFullYear(), now.getMonth(), "rep_start")
  });
}

export async function handleReportDates(ctx: _Context) {
  await ctx.reply("Пожалуйста, используйте календарь выше 👆 для выбора даты.");
}