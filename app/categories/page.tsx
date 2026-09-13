"use client";
import { CategoriesScreen } from "@/features/categories/CategoriesScreen";
import { useFinance } from "@/components/providers/FinanceProvider";
export default function CategoriesRoute() {
  const f = useFinance();
  return <CategoriesScreen categories={f.categories} transactions={f.transactions} onRefresh={f.refresh} />;
}
