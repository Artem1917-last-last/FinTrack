// modules/reports/index.ts

// Добавляем setupReportHandlers в список экспорта
export { 
    enterReportFlow, 
    handleReportDates as handleReportText,
    setupReportHandlers // <--- ВОТ ЭТОГО НЕ ХВАТАЛО
  } from "./handlers.ts";