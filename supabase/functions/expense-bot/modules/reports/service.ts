import { supabaseAdmin } from "../shared/supabase.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

// Исправил название функции для импорта в handlers.ts
export async function generateExcelFile(userId: string | number, fromDate: string, toDate: string) {
  // 1. Получаем данные за период (УБРАЛ фильтр .eq("user_id"), так как база общая)
  const { data: expenses, error } = await supabaseAdmin
    .from("expenses")
    .select(`created_at, amount, comment, categories ( name )`)
    .gte("created_at", fromDate)
    .lte("created_at", toDate)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!expenses || expenses.length === 0) return null;

  const workbook = XLSX.utils.book_new();
  const monthlyData: Record<string, any[]> = {};
  let grandTotal = 0;

  // 2. Группируем по месяцам и считаем итоги
  expenses.forEach((exp) => {
    const dateObj = new Date(exp.created_at);
    const monthYear = dateObj.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    const categoryName = (exp.categories as any)?.name || "Без категории";
    const amount = Number(exp.amount);
    grandTotal += amount;

    if (!monthlyData[monthYear]) monthlyData[monthYear] = [];
    monthlyData[monthYear].push({
      rawDate: dateObj.toLocaleDateString("ru-RU"),
      category: categoryName,
      amount: amount
    });
  });

  // 3. Создаем лист "Сводка"
  const summaryData = [
    ["ОТЧЕТ ПО ЗАТРАТАМ (ОБЩИЙ)"],
    ["Период:", `${fromDate} — ${toDate}`],
    [],
    ["ИТОГО ЗА ВЕСЬ ПЕРИОД", grandTotal],
    [],
    ["Детализация по месяцам представлена на следующих вкладках."]
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Сводка");

  // 4. Формируем листы по месяцам
  for (const [monthName, items] of Object.entries(monthlyData)) {
    const sheetRows = [["Дата", "Категория затрат", "Сумма (₸)"]];
    let dailyTotal = 0;
    let currentDate = items[0].rawDate;

    items.forEach((item, index) => {
      if (item.rawDate !== currentDate) {
        sheetRows.push([`Итог за ${currentDate}`, "", dailyTotal]);
        sheetRows.push([]);
        dailyTotal = 0;
        currentDate = item.rawDate;
      }

      sheetRows.push([item.rawDate, item.category, item.amount]);
      dailyTotal += item.amount;

      if (index === items.length - 1) {
        sheetRows.push([`Итог за ${currentDate}`, "", dailyTotal]);
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    worksheet["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }];
    const range = XLSX.utils.decode_range(worksheet["!ref"]!);
    worksheet["!autofilter"] = { ref: `A1:C${range.e.r}` };

    XLSX.utils.book_append_sheet(workbook, worksheet, monthName);
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}