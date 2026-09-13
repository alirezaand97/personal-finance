"use client";
import { InvestmentCategoriesScreen } from "@/features/investments/InvestmentCategoriesScreen";
import { useFinance } from "@/components/providers/FinanceProvider";
export default function InvestmentCategoriesRoute() {
  const f = useFinance();
  return <InvestmentCategoriesScreen investmentCategories={f.investmentCategories} investments={f.investments} onRefresh={f.refresh} />;
}
