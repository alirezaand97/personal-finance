import type { AppSettings, DigitStyle, Transaction } from "./types";

export function toFa(value: string | number, style: DigitStyle = "fa") {
  return style === "en"
    ? String(value)
    : String(value).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function formatNumber(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle">,
) {
  const raw = Math.round(value).toLocaleString("en-US");
  const separated =
    settings.separatorStyle === "persian" ? raw.replace(/,/g, "٬") : raw;
  return toFa(separated, settings.digitStyle);
}

export function formatMoney(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle" | "currency">,
) {
  return `${formatNumber(value, settings)} ${settings.currency}`;
}

export const monthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function jalaliLabel(iso: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function todayIso() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function startOfCurrentMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: string, b: Date) {
  return new Date(a).toDateString() === b.toDateString();
}

export function groupByDate(items: Transaction[]) {
  return items.reduce<Record<string, Transaction[]>>((acc, item) => {
    const key = jalaliLabel(item.date);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}


/** سال، ماه و روزِ جلالیِ یک تاریخ را برمی‌گرداند */
export function persianDateParts(date: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(date))
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  }
}

/** تعداد روزهای ماهِ جلالیِ حاوی این تاریخ (۲۹، ۳۰ یا ۳۱) */
export function persianMonthLength(date: Date = new Date()) {
  const { day } = persianDateParts(date)
  const startOfMonth = new Date(date)
  startOfMonth.setHours(12, 0, 0, 0)
  startOfMonth.setDate(startOfMonth.getDate() - (day - 1))

  const probeNext = new Date(startOfMonth)
  probeNext.setDate(probeNext.getDate() + 35)
  const nextDay = persianDateParts(probeNext).day
  const startOfNextMonth = new Date(probeNext)
  startOfNextMonth.setHours(12, 0, 0, 0)
  startOfNextMonth.setDate(startOfNextMonth.getDate() - (nextDay - 1))

  const diffMs = startOfNextMonth.getTime() - startOfMonth.getTime()
  return Math.round(diffMs / (24 * 60 * 60 * 1000))
}