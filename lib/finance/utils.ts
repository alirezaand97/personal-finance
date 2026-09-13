import type { AppSettings } from "./types";
import { toFa, formatNumber, jalaliLabel, isSameDay } from "./formatting";

export function filterPeriod(kind: string) {
  const now = new Date();
  const from = new Date(now);
  if (kind === "month") from.setDate(1);
  else if (kind === "last30") from.setDate(now.getDate() - 30);
  else if (kind === "year") from.setMonth(0, 1);
  else from.setFullYear(2000);
  from.setHours(0, 0, 0, 0);
  return from;
}

export function formatCompact(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle">,
) {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const formatCompactValue = (value: number) => {
    const rounded = Number(value.toFixed(1));
    return toFa(String(rounded), settings.digitStyle);
  };

  if (absValue >= 1_000_000_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000_000_000)} تریلیون`;

  if (absValue >= 1_000_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000_000)} میلیارد`;

  if (absValue >= 1_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000)} میلیون`;

  if (absValue >= 1_000)
    return `${sign}${formatCompactValue(absValue / 1_000)} هزار`;

  return formatNumber(value, settings);
}

export function dayWord(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (isSameDay(iso, today)) return "امروز";
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(iso, yesterday)) return "دیروز";
  return jalaliLabel(iso);
}

export const defaultSettings: AppSettings = {
  id: "app",
  digitStyle: "fa",
  separatorStyle: "persian",
  currency: "تومان",
  mode: "system",
  preset: "green",
};
