"use client";
import * as React from "react";
import { AppSettings, Category, Investment, InvestmentCategory, InvestmentTransaction, RecurringBill, defaultSettings, getAll, seedDatabase } from "@/lib/finance";
import { createContext, useContext, useEffect, useState } from "react";
type FinanceContextValue = {
  transactions: any[];
  categories: Category[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  investmentCategories: InvestmentCategory[];
  recurringBills: RecurringBill[];
  settings: AppSettings;
  ready: boolean;
  refresh: () => Promise<void>;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
};
const FinanceContext = createContext<FinanceContextValue | null>(null);
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[]>([]);
   const [investmentCategories, setInvestmentCategories] = useState<InvestmentCategory[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);
  const refresh = async () => {
    const data = await getAll();
    setTransactions(data.transactions);
    setCategories(data.categories);
    setInvestments(data.investments);
    setInvestmentTransactions(data.investmentTransactions);
      setInvestmentCategories(data.investmentCategories);
    setRecurringBills(data.recurringBills);
    setSettings(data.settings ?? defaultSettings);
    setReady(true);
  };
  useEffect(() => {
    seedDatabase().then(refresh);
  }, []);
  useEffect(() => {
    if (!ready) return;
    // برنامه همیشه با تم روشن نمایش داده می‌شود؛ حتی اگر سیستم/مرورگر
    // کاربر روی حالت تیره باشد، به آن توجهی نمی‌کنیم و کلاس dark هرگز
    // اضافه نمی‌شود. فقط رنگ‌بندی (preset) اعمال می‌شود.
    document.documentElement.classList.remove("dark");
    document.documentElement.dataset.theme = settings.preset;
  }, [settings, ready]);
  return <FinanceContext.Provider value={{ transactions, categories, investments, investmentTransactions, investmentCategories, recurringBills, settings, ready, refresh, setSettings }}>{children}</FinanceContext.Provider>;}
export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance must be used inside FinanceProvider");
  return value;
}
