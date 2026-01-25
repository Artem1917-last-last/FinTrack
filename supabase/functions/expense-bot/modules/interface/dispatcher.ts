import { Bot } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { getSession } from "../accounting/index.ts";

// Импортируем обработчики ТЕКСТА из всех модулей
import { handleWorkflowText } from "../workflow/index.ts";
import { handleCategoryText } from "../categories/index.ts";
import { handleReportText } from "../reports/index.ts";
import { handleUsersText } from "../users/index.ts";

export function setupDispatcher(bot: Bot) {
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = await getSession(userId);
    const step = session?.step;

    if (!step) return; // Если шага нет, диспетчер ничего не делает (пропускает к меню)

    // 1. Модуль записи расходов (Workflow)
    if (step === "wait_amount" || step === "wait_comment") {
      return await handleWorkflowText(ctx);
    }

    // 2. Модуль категорий
    if (step === "wait_category_name") {
      return await handleCategoryText(ctx);
    }

    // 3. Модуль отчетов (Reports) - ввод дат "от" и "до"
    if (step === "wait_report_start" || step === "wait_report_end") {
      return await handleReportText(ctx);
    }

    // 4. Модуль пользователей (Users) - ввод Telegram ID
    if (step === "wait_user_id") {
      return await handleUsersText(ctx);
    }
  });
}