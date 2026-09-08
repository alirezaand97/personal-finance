"use client";

import DatePicker, { type Value } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";
import { cn } from "@/lib/utils";

export function PersianDatePicker({
  value,
  onChange,
  className,
}: {
  /** ISO string, e.g. transaction.date */
  value: string;
  /** Called with a new ISO string (noon local time) */
  onChange: (iso: string) => void;
  className?: string;
}) {
  const dateObject = value ? new DateObject(new Date(value)) : new DateObject();

  return (
    <DatePicker
      calendar={persian}
      locale={persian_fa}
      value={dateObject}
      onChange={(v: Value) => {
        if (!v) return;
        const d = Array.isArray(v) ? v[0] : v;
        if (!d) return;
        const jsDate = (d as DateObject).toDate();
        jsDate.setHours(12, 0, 0, 0);
        onChange(jsDate.toISOString());
      }}
      calendarPosition="bottom-right"
      inputClass={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors",
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className,
      )}
      containerClassName="w-full"
      format="YYYY/MM/DD"
    />
  );
}
