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
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { MiniCard } from "@/components/transactions/MiniCard";
import { monthSequence, persianDayOfMonth, persianMonthParts } from "@/lib/date";

export function Analytics({
  transactions,
  categories,
  settings,
}: {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
}) {
  const current = persianMonthParts(new Date());
  const [dailyMonth, setDailyMonth] = useState(current.month - 1);
  const [dailyYear, setDailyYear] = useState(current.year);

  const moveDailyMonth = (direction: number) => {
    const next = dailyMonth + direction;
    if (next < 0) {
      setDailyMonth(11);
      setDailyYear((y) => y - 1);
    } else if (next > 11) {
      setDailyMonth(0);
      setDailyYear((y) => y + 1);
    } else setDailyMonth(next);
  };

  const dailyPoints = useMemo(() => {
    const monthTx = transactions.filter((t) => {
      const p = persianMonthParts(t.date);
      return p.year === dailyYear && p.month === dailyMonth + 1;
    });

    const map = new Map<number, { income: number; expense: number }>();
    for (let d = 1; d <= 31; d++) map.set(d, { income: 0, expense: 0 });

    let maxDay = 29;
    monthTx.forEach((t) => {
      const day = persianDayOfMonth(t.date);
      maxDay = Math.max(maxDay, day);
      const entry = map.get(day);
      if (!entry) return;
      if (t.type === "income") entry.income += t.amount;
      else entry.expense += t.amount;
    });

    return [...map.entries()]
      .filter(([day]) => day <= maxDay)
      .map(([day, v]) => ({ day: String(day), ...v }));
  }, [transactions, dailyMonth, dailyYear]);
  const comparison = useMemo(() => {
    const prevMonth = dailyMonth - 1 < 0 ? 11 : dailyMonth - 1;
    const prevYear = dailyMonth - 1 < 0 ? dailyYear - 1 : dailyYear;

    const sum = (y: number, m: number, type: TransactionType) =>
      transactions
        .filter((t) => {
          const p = persianMonthParts(t.date);
          return p.year === y && p.month === m + 1 && t.type === type;
        })
        .reduce((s, t) => s + t.amount, 0);

    const curIncome = sum(dailyYear, dailyMonth, "income");
    const curExpense = sum(dailyYear, dailyMonth, "expense");
    const prevIncome = sum(prevYear, prevMonth, "income");
    const prevExpense = sum(prevYear, prevMonth, "expense");

    const pct = (cur: number, prev: number) =>
      prev === 0
        ? cur === 0
          ? 0
          : 100
        : Math.round(((cur - prev) / prev) * 100);

    return {
      curIncome,
      curExpense,
      incomePct: pct(curIncome, prevIncome),
      expensePct: pct(curExpense, prevExpense),
    };
  }, [transactions, dailyMonth, dailyYear]);

  const budgetProgress = useMemo(() => {
    return categories
      .filter(
        (c) => c.type === "expense" && c.monthlyBudget && c.monthlyBudget > 0,
      )
      .map((c) => {
        const spent = transactions
          .filter((t) => {
            const p = persianMonthParts(t.date);
            return (
              t.categoryId === c.id &&
              t.type === "expense" &&
              p.year === dailyYear &&
              p.month === dailyMonth + 1
            );
          })
          .reduce((s, t) => s + t.amount, 0);
        const pct = Math.round((spent / (c.monthlyBudget as number)) * 100);
        return { category: c, spent, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [categories, transactions, dailyMonth, dailyYear]);

  const points = useMemo(
    () =>
      monthSequence(6).map((m) => {
        const ts = transactions.filter((t) => {
          const p = persianMonthParts(t.date);
          return p.year === m.year && p.month === m.month;
        });
        return {
          label: m.label,
          income: ts
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + t.amount, 0),
          expense: ts
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + t.amount, 0),
        };
      }),
    [transactions],
  );

  const totalExp = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const top = useMemo(
    () =>
      categories
        .map((c) => ({
          c,
          v: transactions
            .filter((t) => t.categoryId === c.id && t.type === "expense")
            .reduce((s, t) => s + t.amount, 0),
        }))
        .sort((a, b) => b.v - a.v)[0],
    [categories, transactions],
  );
  const monthsWithData = points.filter((p) => p.income || p.expense).length;
  const averageMonthlyExpense = monthsWithData
    ? Math.round(points.reduce((s, p) => s + p.expense, 0) / monthsWithData)
    : 0;

  return (
    <>
      <Header title="تحلیل و بینش" />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">روند ۶ ماه اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart
                  data={points}
                  barGap={5}
                  margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    opacity={0.18}
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickMargin={8}
                  />

                  <YAxis hide />

                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.25 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;

                      return (
                        <div className="min-w-[150px] rounded-2xl border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-md">
                          <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                            {label}
                          </p>

                          <div className="space-y-2">
                            {payload.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />

                                  <span className="text-xs text-muted-foreground">
                                    {item.name}
                                  </span>
                                </div>

                                <span className="text-xs font-bold">
                                  {formatMoney(Number(item.value), settings)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />

                  <Bar
                    dataKey="income"
                    fill="var(--primary)"
                    radius={[6, 6, 2, 2]}
                    name="درآمد"
                    maxBarSize={22}
                  />

                  <Bar
                    dataKey="expense"
                    fill="#e77a8b"
                    radius={[6, 6, 2, 2]}
                    name="هزینه"
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <MiniCard
            title="کل درآمد"
            value={formatMoney(totalIncome, settings)}
            tone="green"
          />
          <MiniCard
            title="میانگین ماهانه هزینه"
            value={formatMoney(averageMonthlyExpense, settings)}
            tone="rose"
          />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">روند روزانه</CardTitle>
              <CardDescription className="mt-1">
                درآمد و هزینه به تفکیک روزهای ماه
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="ماه قبل"
                onClick={() => moveDailyMonth(-1)}
              >
                <ChevronRight />
              </Button>
              <span className="min-w-[4.5rem] text-center text-xs font-medium">
                {monthNames[dailyMonth]}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="ماه بعد"
                onClick={() => moveDailyMonth(1)}
              >
                <ChevronLeft />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart
                  data={dailyPoints}
                  margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    opacity={0.18}
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    interval={2}
                  />
                  <YAxis yAxisId="income" hide domain={[0, "auto"]} />
                  <YAxis yAxisId="expense" hide domain={[0, "auto"]} />
                  <Tooltip
                    cursor={{ stroke: "var(--muted-foreground)", opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="min-w-[150px] rounded-2xl border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-md">
                          <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                            روز {label}
                          </p>
                          <div className="space-y-2">
                            {payload.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {item.name}
                                  </span>
                                </div>
                                <span className="text-xs font-bold">
                                  {formatMoney(Number(item.value), settings)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    yAxisId="income"
                    type="monotone"
                    dataKey="income"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="درآمد"
                  />
                  <Line
                    yAxisId="expense"
                    type="monotone"
                    dataKey="expense"
                    stroke="#e77a8b"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="هزینه"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {budgetProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">بودجه‌بندی</CardTitle>
              <CardDescription>
                وضعیت هزینه‌ها نسبت به بودجه {monthNames[dailyMonth]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetProgress.map(({ category: c, spent, pct }) => (
                <div key={c.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                      <CategoryIcon category={c} className="size-3.5" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {c.name}
                    </span>
                    <div className="text-end">
                      <p className="text-sm font-semibold">
                        {formatMoney(spent, settings)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        از {formatMoney(c.monthlyBudget ?? 0, settings)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 ms-11 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        pct >= 100
                          ? "bg-rose-600"
                          : pct >= 80
                            ? "bg-amber-500"
                            : "bg-primary/70",
                      )}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  {pct >= 100 && (
                    <p className="mt-1 ms-11 text-[10px] text-rose-600">
                      {pct}٪ از بودجه — {pct - 100}٪ بیشتر از حد تعیین‌شده
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {top?.v > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-bold">یک نکته برای شما</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                دسته «{top.c.name}» با {formatMoney(top.v, settings)} بیشترین
                سهم را از کل هزینه‌ها دارد.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">مقایسه با ماه قبل</CardTitle>
            <CardDescription>
              تغییرات {monthNames[dailyMonth]} نسبت به ماه گذشته
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary/[0.06] p-3">
              <p className="text-xs text-muted-foreground">درآمد</p>
              <p className="mt-1 text-sm font-bold">
                {formatMoney(comparison.curIncome, settings)}
              </p>
              <div
                className={cn(
                  "mt-2 flex items-center gap-1 text-xs font-medium",
                  comparison.incomePct >= 0 ? "text-primary" : "text-rose-600",
                )}
              >
                {comparison.incomePct >= 0 ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                <span>
                  {Math.abs(comparison.incomePct)}٪{" "}
                  {comparison.incomePct >= 0 ? "بیشتر" : "کمتر"}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-rose-500/[0.06] p-3">
              <p className="text-xs text-muted-foreground">هزینه</p>
              <p className="mt-1 text-sm font-bold">
                {formatMoney(comparison.curExpense, settings)}
              </p>
              <div
                className={cn(
                  "mt-2 flex items-center gap-1 text-xs font-medium",
                  comparison.expensePct <= 0 ? "text-primary" : "text-rose-600",
                )}
              >
                {comparison.expensePct <= 0 ? (
                  <TrendingDown className="size-3.5" />
                ) : (
                  <TrendingUp className="size-3.5" />
                )}
                <span>
                  {Math.abs(comparison.expensePct)}٪{" "}
                  {comparison.expensePct <= 0 ? "کمتر" : "بیشتر"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">دسته‌های پرهزینه</CardTitle>
            <CardDescription>
              سهم هر دسته از کل هزینه‌های ثبت‌شده
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories
              .filter((c) => c.type === "expense")
              .map((c) => {
                const value = transactions
                  .filter((t) => t.categoryId === c.id && t.type === "expense")
                  .reduce((s, t) => s + t.amount, 0);

                const pct = totalExp ? (value / totalExp) * 100 : 0;

                return {
                  category: c,
                  value,
                  pct,
                };
              })
              .sort((a, b) => b.value - a.value)
              .map(({ category: c, value, pct }) => (
                <div key={c.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                      <CategoryIcon category={c} className="size-3.5" />
                    </div>

                    <span className="min-w-0 flex-1 truncate text-sm">
                      {c.name}
                    </span>

                    <div className="text-end">
                      <p className="text-sm font-semibold">
                        {formatMoney(value, settings)}
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        {pct.toFixed(0)}٪
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 ms-11 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}