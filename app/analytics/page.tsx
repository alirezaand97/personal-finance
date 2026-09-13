"use client";
import { Analytics } from "@/features/analytics/Analytics";
import { useFinance } from "@/components/providers/FinanceProvider";
export default function AnalyticsRoute() {
  const f = useFinance();
  return <Analytics transactions={f.transactions} categories={f.categories} settings={f.settings} />;
}
