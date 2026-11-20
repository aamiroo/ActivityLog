import { toJalaali, toGregorian } from 'jalaali-js';

const digits = (value: string) => value.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
export function toIsoDate(input: string): string {
  const normalized = digits(input).trim().replace(/[/.]/g, '-');
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) throw new Error('تاریخ را به شکل سال-ماه-روز وارد کن؛ مثال ۱۴۰۵-۰۷-۲۲');
  const [, ys, ms, ds] = match;
  const y = Number(ys), m = Number(ms), d = Number(ds);
  if (y >= 1300 && y <= 1500) {
    const g = toGregorian(y, m, d);
    const check = toJalaali(g.gy, g.gm, g.gd);
    if (check.jy !== y || check.jm !== m || check.jd !== d) throw new Error('تاریخ شمسی معتبر نیست.');
    return `${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) throw new Error('تاریخ معتبر نیست.');
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
export function jalaliDate(iso: string): string {
  if (!iso) return '—';
  const [y,m,d] = iso.slice(0,10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const j = toJalaali(y,m,d);
  return `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`;
}
export function todayJalali(): string {
  const now = new Date(); const j = toJalaali(now.getFullYear(), now.getMonth()+1, now.getDate());
  return `${j.jy}-${String(j.jm).padStart(2,'0')}-${String(j.jd).padStart(2,'0')}`;
}
export function duration(start: string, end: string): string {
  const [sh,sm,ss='0'] = start.split(':'); const [eh,em,es='0'] = end.split(':');
  let seconds = (+eh*3600 + +em*60 + +es) - (+sh*3600 + +sm*60 + +ss);
  if (seconds < 0) seconds += 86400;
  const h = Math.floor(seconds/3600), m = Math.floor(seconds%3600/60);
  return `${h} ساعت و ${m} دقیقه`;
}
export function hoursNumber(start: string, end: string): number {
  const [sh,sm,ss='0'] = start.split(':'); const [eh,em,es='0'] = end.split(':');
  let seconds = (+eh*3600 + +em*60 + +es) - (+sh*3600 + +sm*60 + +ss);
  if (seconds < 0) seconds += 86400;
  return seconds / 3600;
}
