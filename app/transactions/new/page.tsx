"use client";
import { useRouter } from "next/navigation";
import { AddTransaction } from "@/components/transactions/AddTransaction";
import { useFinance } from "@/components/providers/FinanceProvider";
export default function NewTransactionRoute() {
  const router = useRouter(); const f = useFinance();
  return <AddTransaction open transaction={null} categories={f.categories} settings={f.settings} onClose={() => router.back()} onSaved={async () => { await f.refresh(); router.replace("/transactions"); }} />;
}
