import * as React from "react";

import { AppSettings, RecurringBill, formatMoney } from "@/lib/finance";
import { Bell, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function DueBillsCard({
  bills,
  settings,
  onPay,
}: {
  bills: RecurringBill[];
  settings: AppSettings;
  onPay: (bill: RecurringBill) => void;
}) {
  if (!bills.length) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/10">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-amber-600" />
          <p className="text-sm font-bold">{bills.length} قبض سررسید شده</p>
        </div>
        <Link
          href="/recurring"
          className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          مدیریت
          <ChevronLeft className="size-3.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center gap-3 rounded-xl bg-white p-2.5 dark:bg-background"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{bill.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatMoney(bill.amount, settings)}
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 rounded-lg text-xs!"
              onClick={() => onPay(bill)}
            >
              پرداخت شد
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}