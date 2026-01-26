// modules/interface/dispatcher.ts
import { Bot } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { getSession } from "../accounting/index.ts";

// Импортируем обработчики ТЕКСТА
import { handleWorkflowText } from "../workflow/index.ts";
import { handleCategoryText } from "../categories/index.ts";
import { handleReportText } from "../reports/index.ts";
import { handleUsersText } from "../users/index.ts";

export function setupDispatcher(bot: Bot) {
  bot.on("message:text", async (ctx) => {
    // 1. Игнорируем команды (они живут в bot.command в index.ts)
    if (ctx.message.text?.startsWith("/")) return;

    const userId = ctx.from?.id;
    if (!userId) return;

    const session = await getSession(userId);
    const step = session?.step;

    // 2. ГЛАВНОЕ ИЗМЕНЕНИЕ: 
    // Если шага нет (!step), мы не выходим, а сразу пробуем обработать как расход.
    if (!step) {
      console.log(`[Dispatcher] Шаг не найден. Передаю "${ctx.message.text}" в Workflow.`);
      return await handleWorkflowText(ctx);
    }

    // 3. Если шаг ЕСТЬ, распределяем по модулям
    switch (step) {
      case "wait_amount":
      case "wait_comment":
        return await handleWorkflowText(ctx);
      
      case "wait_category_name":
        return await handleCategoryText(ctx);
      
      case "wait_report_start":
      case "wait_report_end":
        return await handleReportText(ctx);
      
      case "wait_user_id":
        return await handleUsersText(ctx);

      default:
        // Если шаг какой-то странный или неизвестный — тоже пробуем записать расход
        return await handleWorkflowText(ctx);
    }
  });
}