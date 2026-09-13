"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { AppSettings, Category, Investment, InvestmentCategory, InvestmentTransaction, defaultSettings, getAll, seedDatabase } from "@/lib/finance";

type FinanceContextValue = {
  transactions: any[];
  categories: Category[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  investmentCategories: InvestmentCategory[];
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
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    const data = await getAll();
    setTransactions(data.transactions);
    setCategories(data.categories);
    setInvestments(data.investments);
    setInvestmentTransactions(data.investmentTransactions);
    setInvestmentCategories(data.investmentCategories);
    setSettings(data.settings ?? defaultSettings);
    setReady(true);
  };

  useEffect(() => {
    seedDatabase().then(refresh);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const applyTheme = () => {
      const dark = settings.mode === "dark" ||
        (settings.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = settings.preset;
    };
    applyTheme();
    if (settings.mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [settings, ready]);

  return <FinanceContext.Provider value={{ transactions, categories, investments, investmentTransactions, investmentCategories, settings, ready, refresh, setSettings }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance must be used inside FinanceProvider");
  return value;
}
