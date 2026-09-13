import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft, ArrowUpLeft, BarChart3, BriefcaseBusiness, CarFront,
  ChevronLeft, ChevronRight, Download, Edit3, FileUp, Gamepad2, Gift,
  HeartPulse, Home, House, Laptop, MoreHorizontal, Moon, Package, Plane,
  Plus, ReceiptText, RefreshCw, Search, Settings, ShoppingBag, Trash2,
  TrendingUp, Trophy, Utensils, Wallet, X, Tags, TrendingDown, Repeat,
  Landmark, Gem, Bitcoin, Banknote, ArrowLeftRight, type LucideIcon,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PersianDatePicker } from "@/components/ui/react-multi-date-picker";
import { TransactionType, DigitStyle, SeparatorStyle, ThemeMode, ThemePreset, Transaction, Category, InvestmentCategory, InvestmentUnit, Investment, InvestmentTransactionKind, InvestmentTransaction, StockQuote, StockSyncMeta, MarketKind, MarketQuote, MarketSyncMeta, PortfolioSnapshot, defaultInvestmentCategories, AppSettings, expenseCategories, incomeCategories, db, seedDatabase, toFa, formatNumber, formatMoney, monthNames, jalaliLabel, todayIso, startOfCurrentMonth, isSameDay, groupByDate, exportBackup, importBackup, clearAll, getAll, uid, filterPeriod, formatCompact, dayWord, defaultSettings, Screen, ChartPoint, needsStockSync, exactTime, getStockSyncMeta, syncStockQuotes, searchStockQuotes, getStockQuote, getMarketSyncMeta, syncMarketQuotes, searchMarketQuotes, getMarketQuote, savePortfolioSnapshot, getPortfolioSnapshots } from "@/lib/finance";

import { Header } from "@/components/layout/Header";
import { CategoryIcon, categoryIconMap } from "@/components/common/CategoryIcon";
import { liveCategoryIcons, type LiveMarketKind } from "@/features/investments/utils";

export function InvestmentAssetEditor({
  open,
  investment,
  investmentCategories,
  settings,
  onClose,
  onSaved,
  onCreated,
}: {
  open: boolean;
  investment?: Investment;
  investmentCategories: InvestmentCategory[];
  settings: AppSettings;
  onClose: () => void;
  onSaved: () => void;
  onCreated?: (investment: Investment) => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<Investment["unit"]>("piece");
  const [currentPrice, setCurrentPrice] = useState("");
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [stockResults, setStockResults] = useState<StockQuote[]>([]);
  const [marketResults, setMarketResults] = useState<MarketQuote[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<MarketQuote | null>(
    null,
  );

  const selectedCategory = investmentCategories.find(
    (c) => c.id === categoryId,
  );
  const liveKind = selectedCategory?.icon as LiveMarketKind | undefined;
  const isLive = !!liveKind && liveCategoryIcons.includes(liveKind);
  const isStockLive = liveKind === "stock";
  const isMarketLive = isLive && !isStockLive;

  useEffect(() => {
    setCategoryId(investment?.categoryId ?? investmentCategories[0]?.id ?? "");
    setName(investment?.name ?? "");
    setUnit(investment?.unit ?? "piece");
    setCurrentPrice(investment ? String(investment.currentPrice || "") : "");
    setQuery("");
    setStockResults([]);
    setMarketResults([]);
    setSelectedStock(null);
    setSelectedMarket(null);
    setError("");

    if (investment?.symbolId) {
      if (investment.symbolId.includes(":")) {
        getMarketQuote(investment.symbolId).then((q) => {
          if (q) setSelectedMarket(q);
        });
      } else {
        getStockQuote(investment.symbolId).then((q) => {
          if (q) setSelectedStock(q);
        });
      }
    }
  }, [investment, open, investmentCategories]);

  const changeCategory = (id: string) => {
    setCategoryId(id);
    setError("");
    setQuery("");
    setStockResults([]);
    setMarketResults([]);
    setSelectedStock(null);
    setSelectedMarket(null);
  };

  useEffect(() => {
    if (!isStockLive) return;
    let active = true;
    searchStockQuotes(query).then((r) => {
      if (active) setStockResults(r);
    });
    return () => {
      active = false;
    };
  }, [query, isStockLive]);

  useEffect(() => {
    if (!isMarketLive || !liveKind) return;
    let active = true;
    searchMarketQuotes(liveKind as MarketKind, query).then((r) => {
      if (active) setMarketResults(r);
    });
    return () => {
      active = false;
    };
  }, [query, isMarketLive, liveKind]);

  const save = async () => {
    setError("");
    const now = new Date().toISOString();

    if (!categoryId) {
      setError("دسته‌بندی را انتخاب کنید.");
      return;
    }

    if (isStockLive) {
      if (!selectedStock) {
        setError("یک نماد از لیست بورس انتخاب کنید.");
        return;
      }
      const payload = {
        name: selectedStock.name,
        categoryId,
        unit: "share" as const,
        currentPrice: selectedStock.lastPrice,
        symbolId: selectedStock.isin,
        updatedAt: now,
      };
      if (investment) {
        await db.investments.update(investment.id, payload);
      } else {
        const newInvestment: Investment = {
          id: uid(),
          ...payload,
          createdAt: now,
        };
        await db.investments.add(newInvestment);
        onCreated?.(newInvestment);
      }
      await onSaved();
      onClose();
      return;
    }

    if (isMarketLive) {
      if (!selectedMarket) {
        setError("یک مورد از لیست انتخاب کنید.");
        return;
      }
      const unitForMarket: Investment["unit"] =
        liveKind === "gold"
          ? selectedMarket.symbol.includes("COIN")
            ? "piece"
            : "gram"
          : "unit";

      const payload = {
        name: selectedMarket.name,
        categoryId,
        unit: unitForMarket,
        currentPrice: selectedMarket.price,
        symbolId: selectedMarket.id,
        updatedAt: now,
      };
      if (investment) {
        await db.investments.update(investment.id, payload);
      } else {
        const newInvestment: Investment = {
          id: uid(),
          ...payload,
          createdAt: now,
        };
        await db.investments.add(newInvestment);
        onCreated?.(newInvestment);
      }
      await onSaved();
      onClose();
      return;
    }

    // حالت دستی (بدون اتصال زنده)
    const clean = name.trim();
    const price = Number(currentPrice.replace(/\D/g, ""));

    if (!clean) {
      setError("نام دارایی را وارد کنید.");
      return;
    }
    if (price < 0 || Number.isNaN(price)) {
      setError("قیمت فعلی معتبر نیست.");
      return;
    }

    const payload = {
      name: clean,
      categoryId,
      unit,
      currentPrice: price,
      symbolId: undefined,
      updatedAt: now,
    };
    if (investment) {
      await db.investments.update(investment.id, payload);
    } else {
      const newInvestment: Investment = {
        id: uid(),
        ...payload,
        createdAt: now,
      };
      await db.investments.add(newInvestment);
      onCreated?.(newInvestment);
    }
    await onSaved();
    onClose();
  };

  const unitOptions = [
    { value: "piece", label: "عدد" },
    { value: "gram", label: "گرم" },
    { value: "share", label: "سهم" },
    { value: "unit", label: "واحد" },
  ] as const;

  const canSave = isStockLive
    ? !!selectedStock && !!categoryId
    : isMarketLive
      ? !!selectedMarket && !!categoryId
      : !!name.trim() && !!categoryId;

  const marketPlaceholder =
    liveKind === "gold"
      ? "مثلاً سکه امامی یا طلای 18 عیار"
      : liveKind === "currency"
        ? "مثلاً دلار یا یورو"
        : liveKind === "crypto"
          ? "مثلاً بیت‌کوین یا اتریوم"
          : "";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {investment ? "ویرایش دارایی" : "دارایی جدید"}
          </DialogTitle>
          <DialogDescription>
            مشخصات دارایی را وارد کنید. خرید و فروش در مرحله بعد ثبت می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">دسته‌بندی</label>
            <Select
              value={categoryId}
              onValueChange={changeCategory}
              options={investmentCategories.map((c) => ({
                value: c.id,
                label: c.name,
                icon: categoryIconMap[c.icon] || Package,
              }))}
            />
          </div>

          {(isStockLive || isMarketLive) && (
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {isStockLive ? "جست‌وجوی نماد یا نام شرکت" : "جست‌وجو"}
                </label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      isStockLive ? "مثلاً فولاد یا خودرو" : marketPlaceholder
                    }
                    className="pr-9"
                  />
                </div>
              </div>

              <div className="max-h-52 space-y-1.5 overflow-y-auto">
                {isStockLive &&
                  stockResults.map((r) => (
                    <button
                      key={r.isin}
                      type="button"
                      onClick={() => setSelectedStock(r)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                        selectedStock?.isin === r.isin &&
                          "border-primary bg-primary/10 ring-2 ring-primary/20",
                      )}
                    >
                      <span className="min-w-0 truncate text-start flex gap-1 items-center text-sm">
                        <span className="font-semibold">{r.symbol}</span>
                        <span className="ms-1.5 text-xs text-muted-foreground">
                          {r.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium">
                        {r.lastPrice.toLocaleString("en-US")}
                      </span>
                    </button>
                  ))}

                {isMarketLive &&
                  marketResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedMarket(r)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                        selectedMarket?.id === r.id &&
                          "border-primary bg-primary/10 ring-2 ring-primary/20",
                      )}
                    >
                      <span className="min-w-0 truncate text-start flex gap-1 items-center text-sm">
                        {r.name}
                      </span>
                      <span className="shrink-0 text-xs font-medium">
                        {r.price.toLocaleString("en-US")} {r.unit}
                      </span>
                    </button>
                  ))}

                {isStockLive && query.trim() && !stockResults.length && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">
                    نمادی با این نام پیدا نشد. اگر تازه اپ را باز کرده‌اید،
                    منتظر بمانید تا لیست قیمت‌ها دریافت شود.
                  </p>
                )}
                {isMarketLive && !marketResults.length && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">
                    موردی پیدا نشد. اگر تازه اپ را باز کرده‌اید، منتظر بمانید تا
                    قیمت‌ها دریافت شود.
                  </p>
                )}
              </div>

              {isStockLive && selectedStock && (
                <div className="rounded-xl bg-primary/[0.06] p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{selectedStock.name}</span>
                    <span className="font-bold">
                      {selectedStock.lastPrice.toLocaleString("en-US")}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    قیمت این دارایی به‌صورت خودکار هر روز به‌روز می‌شود.
                  </p>
                </div>
              )}
              {isMarketLive && selectedMarket && (
                <div className="rounded-xl bg-primary/[0.06] p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{selectedMarket.name}</span>
                    <span className="font-bold">
                      {selectedMarket.price.toLocaleString("en-US")}{" "}
                      {selectedMarket.unit}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    قیمت این دارایی به‌صورت خودکار به‌روز می‌شود.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isLive && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  نام دارایی
                </label>
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً صندوق طلای الف"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">واحد</label>
                <Select
                  value={unit}
                  onValueChange={(value) =>
                    setUnit(value as Investment["unit"])
                  }
                  options={unitOptions.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  قیمت فعلی هر واحد ({settings.currency})
                </label>
                <Input
                  inputMode="numeric"
                  value={
                    currentPrice
                      ? Number(currentPrice.replace(/\D/g, "")).toLocaleString(
                          "en-US",
                        )
                      : ""
                  }
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="مثلاً ۲۵۰۰۰۰۰۰۰"
                  className="h-14 text-xl font-bold"
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="h-11 w-full rounded-xl"
            onClick={save}
            disabled={!canSave}
          >
            {investment ? "ذخیره تغییرات" : "افزودن دارایی"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}