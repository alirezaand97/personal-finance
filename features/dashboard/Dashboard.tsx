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
import { MiniCard } from "@/components/transactions/MiniCard";
import { EmptyState } from "@/components/transactions/EmptyState";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { getInvestmentMetrics, investmentCashFlow } from "@/features/investments/utils";
import { persianMonthParts } from "@/lib/date";
import { chartColors } from "@/lib/chart";

export function Dashboard({
  transactions,
  categories,
  investments,
  investmentTransactions,
  settings,
  onAdd,
  onNavigate,
}: {
  transactions: Transaction[];
  categories: Category[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  settings: AppSettings;
  onAdd: () => void;
  onNavigate: (v: any) => void;
}) {
  const current = persianMonthParts(new Date());
  const [month, setMonth] = useState(current.month - 1);
  const [year, setYear] = useState(current.year);

  const setMonthSafe = (index: number) => {
    setMonth(index);
    setYear(current.year);
  };

  const visible = useMemo(
    () =>
      transactions.filter((t) => {
        const p = persianMonthParts(t.date);
        return p.year === year && p.month === month + 1;
      }),
    [transactions, year, month],
  );

  const income = visible
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = visible
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalPortfolioValue = useMemo(
    () =>
      investments.reduce(
        (sum, investment) =>
          sum +
          getInvestmentMetrics(investment, investmentTransactions).currentValue,
        0,
      ),
    [investments, investmentTransactions],
  );

  const balance =
    transactions.reduce(
      (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
      0,
    ) - investmentCashFlow(investmentTransactions);

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const pie = useMemo(() => {
    const grouped = new Map<string, number>();
    visible
      .filter((t) => t.type === "expense")
      .forEach((t) =>
        grouped.set(t.categoryId, (grouped.get(t.categoryId) ?? 0) + t.amount),
      );
    return [...grouped.entries()]
      .map(([categoryId, value], i) => ({
        categoryId,
        name: catMap.get(categoryId)?.name ?? "سایر",
        value,
        fill:
          catMap.get(categoryId)?.color || chartColors[i % chartColors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [visible, catMap]);

  const moveMonth = (direction: number) => {
    const next = month + direction;
    if (next < 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else if (next > 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth(next);
  };

  return (
    <>
      <Header
        title="خانه"
        action={
          <Button
            size="icon"
            variant="ghost"
            aria-label="تنظیمات"
            onClick={() => onNavigate("settings")}
          >
            <Settings />
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <Card className="relative overflow-hidden border-0 bg-primary p-5 text-primary-foreground shadow-[0_20px_50px_-20px] shadow-primary/60">
          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 size-48 rounded-full bg-black/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                  <span>موجودی کل</span>
                </div>

                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatMoney(balance, settings)}
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/10 backdrop-blur-sm">
                <Wallet className="size-5" />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-white/10">
                      <ArrowDownLeft className="size-3.5" />
                    </span>
                    درآمد
                  </div>
                </div>

                <p className="mt-2 text-sm font-semibold tracking-tight">
                  {formatMoney(income, settings)}
                </p>
              </div>

              <div className="rounded-2xl bg-black/10 p-3.5 ring-1 ring-white/5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-black/10">
                      <ArrowUpLeft className="size-3.5" />
                    </span>
                    هزینه
                  </div>
                </div>

                <p className="mt-2 text-sm font-semibold tracking-tight">
                  {formatMoney(expense, settings)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="flex cursor-pointer items-center gap-3 p-4"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("investments")}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TrendingUp className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">سرمایه‌گذاری‌ها</p>
            <p className="mt-0.5 text-sm font-bold">
              {formatMoney(totalPortfolioValue, settings)}
            </p>
          </div>
          <ChevronLeft className="shrink-0 text-muted-foreground" />
        </Card>

        <Card className="p-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="ماه قبل"
              onClick={() => moveMonth(-1)}
            >
              <ChevronRight />
            </Button>
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground">انتخاب ماه</p>
              <p className="mt-0.5 font-bold">
                {monthNames[month]} {year}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="ماه بعد"
              onClick={() => moveMonth(1)}
            >
              <ChevronLeft />
            </Button>
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {monthNames.map((name, index) => (
              <Button
                key={name}
                type="button"
                variant={
                  month === index && year === current.year ? "default" : "ghost"
                }
                size="sm"
                className="min-w-[4.25rem] shrink-0 border-0 text-sm!"
                onClick={() => setMonthSafe(index)}
              >
                {name}
              </Button>
            ))}
          </div>
        </Card>

        {transactions.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MiniCard
                title="هزینه‌های این دوره"
                value={formatMoney(expense, settings)}
                tone="rose"
              />
              <MiniCard
                title="درآمد این دوره"
                value={formatMoney(income, settings)}
                tone="green"
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    هزینه‌ها بر اساس دسته
                  </CardTitle>
                  <CardDescription className="mt-1">
                    نمای کلی این دوره
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate("analytics")}
                >
                  <ChevronLeft />
                </Button>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="h-36 w-36 shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={
                          pie.length
                            ? pie
                            : [
                                {
                                  name: "بدون داده",
                                  value: 1,
                                  fill: "var(--muted)",
                                },
                              ]
                        }
                        innerRadius={42}
                        outerRadius={62}
                        dataKey="value"
                        strokeWidth={3}
                      >
                        {(pie.length
                          ? pie
                          : [{ name: "", value: 1, fill: "var(--muted)" }]
                        ).map((e, i) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Pie>

                      <Tooltip
                        cursor={false}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;

                          const item = payload[0];

                          return (
                            <div className="rounded-sm border border-border/50 bg-background/95 px-3 py-2 shadow-lg backdrop-blur-md">
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: item.payload.fill }}
                                />

                                <span className="text-xs font-medium text-muted-foreground">
                                  {item.name}
                                </span>
                              </div>

                              <p className="mt-1 text-sm font-bold tracking-tight">
                                {formatMoney(Number(item.value), settings)}
                              </p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {pie.slice(0, 4).map((p) => (
                    <div
                      key={p.categoryId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: p.fill }}
                      />
                      <span className="truncate text-muted-foreground">
                        {p.name}
                      </span>
                      <span className="ms-auto text-xs font-medium">
                        {formatCompactSafe(p.value, settings)} تومان
                      </span>
                    </div>
                  ))}
                  {!pie.length && (
                    <p className="text-sm text-muted-foreground">
                      هنوز هزینه‌ای در این ماه ثبت نشده است.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold">آخرین تراکنش‌ها</h2>
                <Button
                  variant="link"
                  className="text-xs border-0"
                  onClick={() => onNavigate("transactions")}
                >
                  مشاهده همه
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {transactions.slice(0, 10).map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={catMap.get(t.categoryId)}
                    settings={settings}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function formatCompactSafe(value: number, settings: AppSettings) {
  return formatCompact(value, settings);
}
