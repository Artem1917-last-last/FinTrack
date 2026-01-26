import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";
import { supabaseAdmin } from "../shared/supabase.ts";

interface ExpenseFromDB {
  created_at: string;
  amount: number;
  comment: string | null; 
  categories: { name: string } | null;
}

function parseDateRange(dateStr: string, endOfDay = false): string {
  const [d, m, y] = dateStr.split(".");
  return endOfDay ? `${y}-${m}-${d}T23:59:59.999Z` : `${y}-${m}-${d}T00:00:00.000Z`;
}

export async function generateExcelFile(userId: string | number, fromStr: string, toStr: string): Promise<Uint8Array | null> {
  const fromDate = parseDateRange(fromStr);
  const toDate = parseDateRange(toStr, true);

  const { data, error } = await supabaseAdmin
    .from("expenses")
    /**
     * ПРОФЕССИОНАЛЬНОЕ РЕШЕНИЕ:
     * Мы явно указываем название связи '!fk_expenses_categories'.
     * Это решает ошибку PGRST201, даже если в базе временно остались дубликаты.
     */
    .select(`created_at, amount, comment, categories!fk_expenses_categories ( name )`)
    .eq("user_id", userId.toString())
    .gte("created_at", fromDate)
    .lte("created_at", toDate)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[DB_SELECT_ERROR]", error);
    throw error;
  }
  
  if (data.length === 0) return null;

  const expenses = data as unknown as ExpenseFromDB[];
  const wb = XLSX.utils.book_new();

  // --- СВОДКА ---
  const totalSum = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const summaryData: (string | number)[][] = [
    ["ОТЧЕТ ПО ЗАТРАТАМ (UNUM)"],
    ["Период:", `${fromStr} — ${toStr}`],
    [],
    ["ИТОГО ЗА ПЕРИОД:", totalSum, "₽"]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Сводка");

  // --- ЛИСТЫ ПО МЕСЯЦАМ ---
  const months: Record<string, ExpenseFromDB[]> = {};
  expenses.forEach(e => {
    const d = new Date(e.created_at);
    const mName = d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }).replace(/^./, s => s.toUpperCase());
    if (!months[mName]) months[mName] = [];
    months[mName].push(e);
  });

  for (const [mName, items] of Object.entries(months)) {
    const sheetData: (string | number)[][] = [["Дата", "Категория", "Описание", "Сумма (₽)"]];
    let dailyTotal = 0;
    let lastDate = new Date(items[0].created_at).toLocaleDateString("ru-RU");

    items.forEach((item, idx) => {
      const curDate = new Date(item.created_at).toLocaleDateString("ru-RU");
      
      if (curDate !== lastDate) {
        sheetData.push([`Итог за ${lastDate.substring(0, 5)}`, "", "", dailyTotal], []);
        dailyTotal = 0;
        lastDate = curDate;
      }
      
      sheetData.push([
        curDate, 
        item.categories?.name || "Без категории", 
        item.comment || "-", 
        Number(item.amount)
      ]);
      
      dailyTotal += Number(item.amount);
      
      if (idx === items.length - 1) {
        sheetData.push([`Итог за ${curDate.substring(0, 5)}`, "", "", dailyTotal]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws["!cols"] = [
      { wch: 12 }, // Дата
      { wch: 20 }, // Категория
      { wch: 40 }, // Описание
      { wch: 15 }  // Сумма
    ];

    XLSX.utils.book_append_sheet(wb, ws, mName.substring(0, 31));
  }

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Uint8Array(buf);
}