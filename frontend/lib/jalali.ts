
import {
  addDays,
  format,
  getDay,
  startOfDay,
  subDays,
} from "date-fns";
import {
  format as formatJalali,
  getDate,
  getMonth,
  getYear,
} from "date-fns-jalali";

export const faNumber = (value: string | number) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

export function formatDate(date: Date, pattern = "d MMMM yyyy") {
  return faNumber(formatJalali(date, pattern));
}

export function formatTime(value: string) {
  const [hours = "00", minutes = "00"] = value.split(":");
  return faNumber(`${hours}:${minutes}`);
}

export function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// تقویم از شنبه شروع می‌شود.
export function startOfPersianWeek(date: Date) {
  const day = getDay(date);
  const daysSinceSaturday = (day + 1) % 7;
  return startOfDay(subDays(date, daysSinceSaturday));
}

export function getWeekDays(date: Date) {
  const saturday = startOfPersianWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(saturday, index));
}

export function getWeekRange(date: Date) {
  const days = getWeekDays(date);
  return {
    start: toDateInput(days[0]),
    end: toDateInput(days[6]),
    days,
  };
}

export function formatWeekday(date: Date) {
  const names = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه",
  ];
  return names[getDay(date)];
}

export function getJalaliDay(date: Date) {
  return faNumber(getDate(date));
}

export function getJalaliMonth(date: Date) {
  return faNumber(formatJalali(date, "MMMM"));
}

export function getJalaliYear(date: Date) {
  return faNumber(getYear(date));
}

export function formatFullDate(date: Date) {
  return `${formatWeekday(date)}، ${formatDate(date)}`;
}

export function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let total = eh * 60 + em - (sh * 60 + sm);

  // بازه‌ای که از نیمه‌شب عبور می‌کند.
  if (total < 0) total += 24 * 60;

  return total;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${faNumber(hours)} ساعت و ${faNumber(remainingMinutes)} دقیقه`;
}

export function todayIsoLocal() {
  return toDateInput(new Date());
}
