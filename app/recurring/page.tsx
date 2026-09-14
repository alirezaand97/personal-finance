"use client";

import { RecurringScreen } from "@/features/recurring/RecurringScreen";
import { useFinance } from "@/components/providers/FinanceProvider";

export default function RecurringRoute() {
  const f = useFinance();
  return (
    <RecurringScreen
      recurringBills={f.recurringBills}
      categories={f.categories}
      settings={f.settings}
      onRefresh={f.refresh}
    />
  );
}