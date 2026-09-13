"use client";
import { useState } from "react";
import { TransactionsScreen } from "@/features/transactions/TransactionsScreen";
import { AddTransaction } from "@/components/transactions/AddTransaction";
import { useFinance } from "@/components/providers/FinanceProvider";
import { Transaction } from "@/lib/finance";

export default function TransactionsRoute() {
  const f = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const openAdd = () => { setEditing(null); setShowAdd(true); };
  const openEdit = (t: Transaction) => { setEditing(t); setShowAdd(true); };
  return (
    <>
      <TransactionsScreen transactions={f.transactions} categories={f.categories} settings={f.settings} onAdd={openAdd} onEdit={openEdit} onRefresh={f.refresh} />
      <AddTransaction open={showAdd} transaction={editing} categories={f.categories} settings={f.settings}
        onClose={() => { setShowAdd(false); setEditing(null); }} onSaved={async () => { await f.refresh(); setShowAdd(false); setEditing(null); }} />
    </>
  );
}
