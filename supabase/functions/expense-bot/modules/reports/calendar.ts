// modules/reports/calendar.ts
import { InlineKeyboard } from "https://deno.land/x/grammy@v1.21.1/mod.ts";

const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

// --- ВЫБОР ГОДА ---
export function createYearPicker(currentYear: number, prefix: string) {
  const keyboard = new InlineKeyboard();
  // Показываем диапазон лет (например, 3 года назад и 1 вперед)
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    keyboard.text(y === currentYear ? `· ${y} ·` : `${y}`, `rep_view:years:${y}:${prefix}`);
    if ((y - (currentYear - 3) + 1) % 3 === 0) keyboard.row();
  }
  return keyboard.row().text("⬅️ Назад", `rep_view:days:${currentYear}:0:${prefix}`);
}

// --- ВЫБОР МЕСЯЦА ---
export function createMonthPicker(year: number, prefix: string) {
  const keyboard = new InlineKeyboard();
  MONTHS_RU.forEach((name, idx) => {
    keyboard.text(name, `rep_view:days:${year}:${idx}:${prefix}`);
    if ((idx + 1) % 3 === 0) keyboard.row();
  });
  return keyboard.text("📅 Выбрать год", `rep_view:pick_year:${year}:${prefix}`);
}

// --- ОСНОВНОЙ КАЛЕНДАРЬ ---
export function createCalendar(year: number, month: number, prefix: string) {
  const keyboard = new InlineKeyboard();
  const fullMonthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  // Навигация теперь ведет в меню выбора месяца
  keyboard
    .text("⬅️", `rep_nav:${year}:${month - 1}:${prefix}`)
    .text(`${fullMonthNames[month]} ${year}`, `rep_view:pick_month:${year}:${prefix}`) // КЛИК СЮДА ОТКРЫВАЕТ МЕНЮ
    .text("➡️", `rep_nav:${year}:${month + 1}:${prefix}`)
    .row();

  // ... (далее идет тот же код отрисовки дней, что и раньше)
  ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach(d => keyboard.text(d, "ignore"));
  keyboard.row();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = new Date(year, month, 1).getDay() || 7; 
  
  for (let i = 1; i < startingDay; i++) keyboard.text("·", "ignore");
  for (let d = 1; d <= daysInMonth; d++) {
    const day = String(d).padStart(2, "0");
    const m = String(month + 1).padStart(2, "0");
    keyboard.text(`${d}`, `${prefix}:${day}.${m}.${year}`);
    if ((d + startingDay - 1) % 7 === 0) keyboard.row();
  }
  return keyboard;
}