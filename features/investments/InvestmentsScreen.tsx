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
import { TickerStrip } from "@/features/investments/components/TickerStrip";
import { PortfolioTrendCard } from "@/features/investments/components/PortfolioTrendCard";
import { getInvestmentMetrics, investmentUnitLabel, formatQuantity, transactionKindLabel, currencyTickerSymbols, goldTickerSymbols } from "@/features/investments/utils";
import { chartColors } from "@/lib/chart";
import { InvestmentAssetEditor } from "@/features/investments/InvestmentAssetEditor";
import { InvestmentTransactionEditor } from "@/features/investments/InvestmentTransactionEditor";

export function InvestmentsScreen({
  investments,
  investmentTransactions,
  investmentCategories,
  settings,
  onRefresh,
  onNavigate,
}: {
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  investmentCategories: InvestmentCategory[];
  settings: AppSettings;
  onRefresh: () => void;
  onNavigate: (v: any) => void;
}) {
  const [assetEditor, setAssetEditor] = useState<{
    investment?: Investment;
  } | null>(null);
  const [transactionEditor, setTransactionEditor] = useState<{
    investment: Investment;
    transaction?: InvestmentTransaction;
    defaultKind?: InvestmentTransactionKind;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);
  const [deleteTransactionTarget, setDeleteTransactionTarget] =
    useState<InvestmentTransaction | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);

    const [currencyGoldQuotes, setCurrencyGoldQuotes] = useState<MarketQuote[]>(
    [],
  );
  const [fundQuotes, setFundQuotes] = useState<StockQuote[]>([]);

  const loadTicker = async () => {
    const ids = [
      ...currencyTickerSymbols.map((t) => `currency:${t.symbol}`),
      ...goldTickerSymbols.map((t) => `gold:${t.symbol}`),
    ];
    const [marketResults, allStocks] = await Promise.all([
      db.marketQuotes.bulkGet(ids),
      db.stockQuotes.toArray(),
    ]);
    setCurrencyGoldQuotes(marketResults.filter((q): q is MarketQuote => !!q));
    setFundQuotes(allStocks.filter((s) => s.name.includes("مفید")));
  };

  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);

  const loadSnapshots = async () => {
    const data = await getPortfolioSnapshots(30);
    setSnapshots(data);
  };
  
  const runSync = async () => {
    setSyncing(true);
    setSyncError("");
    try {
      await Promise.all([syncStockQuotes(), syncMarketQuotes()]);
      const [stockMeta, marketMeta] = await Promise.all([
        getStockSyncMeta(),
        getMarketSyncMeta(),
      ]);
      const latest = [stockMeta?.lastSyncedAt, marketMeta?.lastSyncedAt]
        .filter(Boolean)
        .sort()
        .at(-1);
     setLastSync(latest ?? null);
      await onRefresh();
      await loadTicker();
    } catch (e) {
      setSyncError("دریافت قیمت‌ها ناموفق بود. دوباره تلاش کنید.");
    } finally {
      setSyncing(false);
    }
  };

  const checkAndSync = async () => {
    const [stockMeta, marketMeta] = await Promise.all([
      getStockSyncMeta(),
      getMarketSyncMeta(),
    ]);
    const latest = [stockMeta?.lastSyncedAt, marketMeta?.lastSyncedAt]
      .filter(Boolean)
      .sort()
      .at(-1);
    setLastSync(latest ?? null);
    if (
      needsStockSync(stockMeta?.lastSyncedAt) ||
      needsStockSync(marketMeta?.lastSyncedAt)
    ) {
      await runSync();
    }
  };

   useEffect(() => {
 loadTicker();
    loadSnapshots();
    checkAndSync();
    // هر ۵ دقیقه چک می‌کند که آیا یک ساعت از آخرین سینک گذشته؛
    // خودِ needsStockSync مطمئن می‌شود که فقط بین ۸ تا ۲۰ سینک انجام شود
    const interval = setInterval(checkAndSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const catMap = useMemo(
    () => new Map(investmentCategories.map((c) => [c.id, c])),
    [investmentCategories],
  );

  const metrics = useMemo(
    () =>
      investments.map((investment) => ({
        investment,
        ...getInvestmentMetrics(investment, investmentTransactions),
      })),
    [investments, investmentTransactions],
  );

  const totalValue = metrics.reduce((s, x) => s + x.currentValue, 0);
  const totalInvested = metrics.reduce((s, x) => s + x.netInvested, 0);
  const totalProfit = metrics.reduce((s, x) => s + x.profit, 0);
  const totalProfitPercent =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    useEffect(() => {
    const usd = currencyGoldQuotes.find((q) => q.id === "currency:USD");
    if (!usd || totalValue <= 0) return;
    savePortfolioSnapshot(totalValue, usd.price).then(loadSnapshots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalValue, currencyGoldQuotes]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    metrics.forEach(({ investment, currentValue }) => {
      if (currentValue <= 0) return;
      map.set(
        investment.categoryId,
        (map.get(investment.categoryId) ?? 0) + currentValue,
      );
    });

    return [...map.entries()]
      .map(([categoryId, value], idx) => ({
        categoryId,
        label: catMap.get(categoryId)?.name ?? "سایر",
        value,
        fill:
          catMap.get(categoryId)?.color ||
          chartColors[idx % chartColors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [metrics, catMap]);

  const recentTransactions = useMemo(
    () =>
      [...investmentTransactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8),
    [investmentTransactions],
  );

  const removeAsset = async () => {
    if (!deleteTarget) return;

    await db.transaction(
      "rw",
      db.investments,
      db.investmentTransactions,
      async () => {
        await db.investmentTransactions
          .where("investmentId")
          .equals(deleteTarget.id)
          .delete();
        await db.investments.delete(deleteTarget.id);
      },
    );

    setDeleteTarget(null);
    await onRefresh();
  };

  const removeTransaction = async () => {
    if (!deleteTransactionTarget) return;
    await db.investmentTransactions.delete(deleteTransactionTarget.id);
    setDeleteTransactionTarget(null);
    await onRefresh();
  };

  
  const tickerItems: TickerItem[] = [
    ...currencyTickerSymbols
      .map((t) => {
        const q = currencyGoldQuotes.find(
          (q) => q.id === `currency:${t.symbol}`,
        );
        return (
          q && {
            key: q.id,
            label: t.label,
            price: q.price,
            changePercent: q.changePercent,
          }
        );
      })
      .filter((x): x is TickerItem => !!x),
    ...goldTickerSymbols
      .map((t) => {
        const q = currencyGoldQuotes.find((q) => q.id === `gold:${t.symbol}`);
        return (
          q && {
            key: q.id,
            label: t.label,
            price: q.price,
            changePercent: q.changePercent,
          }
        );
      })
      .filter((x): x is TickerItem => !!x),
    ...fundQuotes.map((f) => ({
      key: f.isin,
      label: f.symbol || f.name,
      price: f.lastPrice,
      changePercent: f.changePercent,
    })),
  ];
  
  return (
    <>
      <Header
        title="سرمایه‌گذاری‌ها"
        action={
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onNavigate("investmentCategories")}
              aria-label="دسته‌بندی‌ها"
            >
              <Tags />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAssetEditor({})}
              aria-label="دارایی جدید"
            >
              <Plus />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-4 pb-28">
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-medium">قیمت‌های زنده</p>{" "}
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {syncing
                ? "در حال دریافت قیمت‌ها..."
                : lastSync
                  ? `آخرین به‌روزرسانی: ${dayWord(lastSync)} ساعت ${exactTime(lastSync, settings.digitStyle)}`
                  : "هنوز به‌روزرسانی نشده"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={runSync}
            disabled={syncing}
            className="shrink-0 px-2"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
          </Button>
        </div>
        {syncError && (
          <p className="-mt-2 text-xs text-destructive">{syncError}</p>
        )}

        <Card className="relative overflow-hidden border-0 bg-primary p-5 text-primary-foreground shadow-[0_20px_50px_-20px] shadow-primary/60">
          <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <p className="text-sm text-primary-foreground/70">ارزش فعلی سبد</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatMoney(totalValue, settings)}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs text-primary-foreground/70">سود / زیان</p>
                <p
                  className={cn(
                    "mt-1 text-sm font-bold",
                    totalProfit < 0 && "text-red-200",
                  )}
                >
                  {totalProfit >= 0 ? "+" : ""}
                  {formatMoney(totalProfit, settings)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs text-primary-foreground/70">بازدهی</p>
                <p className="mt-1 text-sm font-bold">
                  {totalProfitPercent >= 0 ? "+" : ""}
                  {totalProfitPercent.toFixed(1)}٪
                </p>
              </div>
            </div>
          </div>
        </Card>

        {investments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ترکیب سبد</CardTitle>
              <CardDescription>
                ارزش روز دارایی‌ها بر اساس دسته‌بندی
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="h-36 w-36 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      innerRadius={42}
                      outerRadius={62}
                      dataKey="value"
                      nameKey="label"
                      strokeWidth={3}
                    >
                      {byCategory.map((e, i) => (
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
                            <span className="text-xs text-muted-foreground">
                              {item.name}
                            </span>
                            <p className="mt-1 text-sm font-bold">
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
                {byCategory.map((p) => (
                  <div
                    key={p.categoryId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: p.fill }}
                    />
                    <span className="truncate text-muted-foreground">
                      {p.label}
                    </span>
                    <span className="ms-auto text-xs font-medium">
                      {totalValue
                        ? Math.round((p.value / totalValue) * 100)
                        : 0}
                      ٪
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
                <PortfolioTrendCard snapshots={snapshots} settings={settings} />
        <TickerStrip items={tickerItems} settings={settings} />
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">دارایی‌های من</h2>

            <Button
              className="rounded-sm text-xs!"
              variant="outline"
              onClick={() => setAssetEditor({})}
            >
              <Plus data-icon="inline-start" /> افزودن دارایی
            </Button>
          </div>

          {metrics.length === 0 ? (
            <Card className="flex flex-col items-center border-dashed px-6 py-12 text-center shadow-none">
              <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
                <TrendingUp />
              </div>
              <h2 className="font-bold">هنوز دارایی‌ای ثبت نشده</h2>
              <p className="mt-2 max-w-[260px] text-sm leading-6 text-muted-foreground">
                ابتدا دارایی‌هایی مثل طلا، سهام یا ارز دیجیتال را اضافه کنید و
                بعد خرید و فروش آن‌ها را ثبت کنید.
              </p>
              <Button
                className="mt-5 rounded-xl"
                onClick={() => setAssetEditor({})}
              >
                <Plus data-icon="inline-start" />
                افزودن اولین دارایی
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {metrics.map((item) => {
                const {
                  investment,
                  quantity,
                  currentValue,
                  profit,
                  profitPercent,
                } = item;

                const cat = catMap.get(investment.categoryId);

                return (
                  <Card
                    key={investment.id}
                    className="overflow-hidden border-border/70 p-3.5 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {/* Asset icon */}
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CategoryIcon category={cat} className="size-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold flex gap-1">
                              {investment.name}
                              {investment.symbolId && (
                                <span className="ms-1.5 rounded-sm bg-primary/10 px-1.5 align-middle text-[9px] font-normal text-primary flex items-center justify-center">
                                  زنده
                                </span>
                              )}
                            </p>

                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {cat?.name ?? "سایر"} ·{" "}
                              {investmentUnitLabel(investment.unit)}
                            </p>
                          </div>

                          {/* Current value + profit */}
                          <div className="shrink-0 text-left">
                            <p className="text-sm font-bold">
                              {formatMoney(currentValue, settings)}
                            </p>

                            <p
                              className={cn(
                                "mt-0.5 text-[11px] font-medium",
                                profit >= 0 ? "text-primary" : "text-rose-600",
                              )}
                            >
                              {profit >= 0 ? "+" : ""}
                              {formatMoney(profit, settings)} (
                              {profitPercent.toFixed(1)}٪)
                            </p>
                          </div>
                        </div>

                        {/* Quantity + actions */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          {/* Quantity */}
                          <div className="min-w-0">
                            <p className="mt-0.5 text-xs font-semibold">
                              {formatQuantity(quantity)}{" "}
                              <span className="font-normal text-muted-foreground">
                                {investmentUnitLabel(investment.unit)}
                              </span>
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {/* Buy */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="rounded-md text-primary hover:bg-primary/10 hover:text-primary"
                              onClick={() =>
                                setTransactionEditor({
                                  investment,
                                  defaultKind: "buy",
                                })
                              }
                              aria-label={`خرید ${investment.name}`}
                              title="خرید"
                            >
                              <ArrowDownLeft className="size-4" />
                            </Button>

                            {/* Sell */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              disabled={quantity <= 0}
                              className="rounded-md text-rose-600 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                              onClick={() =>
                                setTransactionEditor({
                                  investment,
                                  defaultKind: "sell",
                                })
                              }
                              aria-label={`فروش ${investment.name}`}
                              title="فروش"
                            >
                              <ArrowUpLeft className="size-4" />
                            </Button>

                            {/* Edit */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="rounded-md"
                              onClick={() => setAssetEditor({ investment })}
                              aria-label="ویرایش دارایی"
                              title="ویرایش"
                            >
                              <Edit3 className="size-4" />
                            </Button>

                            {/* Delete */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                              onClick={() => setDeleteTarget(investment)}
                              aria-label="حذف دارایی"
                              title="حذف"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {recentTransactions.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">آخرین فعالیت‌ها</h2>
              <span className="text-xs text-muted-foreground">
                {investmentTransactions.length} تراکنش
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {recentTransactions.map((transaction) => {
                const investment = investments.find(
                  (i) => i.id === transaction.investmentId,
                );
                if (!investment) return null;

                const isPositive =
                  transaction.kind === "sell" ||
                  transaction.kind === "dividend";

                return (
                  <Card
  key={transaction.id}
  className="p-3"
>
  {/* Top row */}
  <div className="flex items-center gap-3">
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        isPositive
          ? "bg-primary/10 text-primary"
          : "bg-rose-500/10 text-rose-600",
      )}
    >
      {transaction.kind === "buy" ? (
        <ArrowDownLeft className="size-5" />
      ) : transaction.kind === "sell" ? (
        <ArrowUpLeft className="size-5" />
      ) : (
        <TrendingUp className="size-5" />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold leading-5">
        {investment.name}
      </p>
    </div>

    <div className="shrink-0 text-left">
      <p
        className={cn(
          "text-sm font-bold tabular-nums",
          isPositive ? "text-primary" : "text-rose-600",
        )}
      >
        {isPositive ? "+" : "-"}
        {formatMoney(transaction.amount, settings)}
      </p>
    </div>
  </div>

  {/* Bottom row */}
  <div className="mt-2.5 flex items-center gap-2">
    <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
      <span className="shrink-0">
        {transactionKindLabel(transaction.kind)}
      </span>

      <span className="text-muted-foreground/40">•</span>

      <span className="shrink-0">
        {dayWord(transaction.date)}
      </span>

      {(transaction.kind === "buy" ||
        transaction.kind === "sell") && (
        <>
          <span className="text-muted-foreground/40">•</span>

          <span className="truncate">
            {formatQuantity(transaction.quantity)}{" "}
            {investmentUnitLabel(investment.unit)}
          </span>
        </>
      )}
    </div>

    <div className="flex shrink-0 gap-1 items-center">
      <Button
        size="icon-sm"
        variant="ghost"
        className="size-8 text-muted-foreground"
        onClick={() =>
          setTransactionEditor({ investment, transaction })
        }
        aria-label="ویرایش تراکنش"
      >
        <Edit3 className="size-4" />
      </Button>

      <Button
        size="icon-sm"
        variant="ghost"
        className="size-8 text-muted-foreground hover:text-rose-600"
        onClick={() => setDeleteTransactionTarget(transaction)}
        aria-label="حذف تراکنش"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  </div>
</Card>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <InvestmentAssetEditor
        open={!!assetEditor}
        investment={assetEditor?.investment}
        investmentCategories={investmentCategories}
        settings={settings}
        onClose={() => setAssetEditor(null)}
        onSaved={onRefresh}
        onCreated={(newInvestment) => {
          setTransactionEditor({
            investment: newInvestment,
            defaultKind: "buy",
          });
        }}
      />

      {transactionEditor && (
        <InvestmentTransactionEditor
          open
          investment={transactionEditor.investment}
          transaction={transactionEditor.transaction}
          defaultKind={transactionEditor.defaultKind}
          investmentTransactions={investmentTransactions}
          settings={settings}
          onClose={() => setTransactionEditor(null)}
          onSaved={onRefresh}
        />
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف دارایی</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} و تمام تراکنش‌های مربوط به آن حذف می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={removeAsset}
            >
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTransactionTarget}
        onOpenChange={(v) => !v && setDeleteTransactionTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف تراکنش سرمایه‌گذاری</DialogTitle>
            <DialogDescription>
              این تراکنش برای همیشه حذف می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTransactionTarget(null)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={removeTransaction}
            >
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
