"use client";

import { Dashboard } from "@/features/dashboard/Dashboard";
import { useFinance } from "@/components/providers/FinanceProvider";
import { useRouter } from "next/navigation";

export default function DashboardRoute() {
  const router = useRouter();
  const f = useFinance();
 
  return (
    <Dashboard
      {...f}
      onAdd={() => router.push("/transactions/new")}
      onNavigate={(screen: string) => {
        const routes: Record<string, string> = {
          home: "/dashboard",
          transactions: "/transactions",
          analytics: "/analytics",
          categories: "/categories",
          investments: "/investments",
          investmentCategories: "/investments/categories",
          settings: "/settings",
        };

        router.push(routes[screen] ?? "/dashboard");
      }}
    />
  );
}
