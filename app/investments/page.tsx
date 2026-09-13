"use client";
import { useRouter } from "next/navigation";
import { InvestmentsScreen } from "@/features/investments/InvestmentsScreen";
import { useFinance } from "@/components/providers/FinanceProvider";
export default function InvestmentsRoute() {
  const f = useFinance();
  const router = useRouter();
  return <InvestmentsScreen investments={f.investments} investmentTransactions={f.investmentTransactions} investmentCategories={f.investmentCategories} settings={f.settings} onRefresh={f.refresh} onNavigate={(screen: string) => screen === "investmentCategories" && router.push("/investments/categories")} />;
}
