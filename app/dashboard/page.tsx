"use client";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { useFinance } from "@/components/providers/FinanceProvider";

export default function DashboardRoute() {
  const router = useRouter();
  const f = useFinance();
  return <Dashboard {...f} onAdd={f.openAddTransaction} onNavigate={(screen: string) => {
    const routes: Record<string, string> = { home: "/dashboard", transactions: "/transactions", analytics: "/analytics", categories: "/categories", investments: "/investments", investmentCategories: "/investments/categories", settings: "/settings" };
    router.push(routes[screen] ?? "/dashboard");
  }} />;
}
