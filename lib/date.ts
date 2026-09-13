import { monthNames } from "@/lib/finance";

export function persianMonthParts(date: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(date));
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
  };
}

export function monthSequence(count = 6) {
  const now = persianMonthParts(new Date());
  const current = now.year * 12 + now.month - 1;
  return Array.from({ length: count }, (_, i) => {
    const n = current - (count - 1 - i);
    const month = ((n % 12) + 12) % 12;
    return {
      year: Math.floor(n / 12),
      month: month + 1,
      label: monthNames[month],
    };
  });
}

export function persianDayOfMonth(date: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    day: "numeric",
  }).formatToParts(new Date(date));
  return Number(parts.find((p) => p.type === "day")?.value);
}