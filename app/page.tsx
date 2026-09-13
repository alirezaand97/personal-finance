"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PersianDatePicker } from "@/components/ui/react-multi-date-picker";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  BarChart3,
  BriefcaseBusiness,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  FileUp,
  Gamepad2,
  Gift,
  HeartPulse,
  Home,
  House,
  Laptop,
  MoreHorizontal,
  Moon,
  Package,
  Plane,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Trophy,
  Utensils,
  Wallet,
  X,
  Tags,
  TrendingDown,
  Repeat,
  Landmark,
  Gem,
  Bitcoin,
  Banknote,
  type LucideIcon,
  ArrowLeftRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AppSettings,
  Category,
  db,
  defaultSettings,
  dayWord,
  exportBackup,
  formatCompact,
  formatMoney,
  formatNumber,
  getAll,
  getStockQuote,
  getStockSyncMeta,
  groupByDate,
  importBackup,
  Investment,
  InvestmentCategory,
  InvestmentTransaction,
  InvestmentTransactionKind,
  jalaliLabel,
  monthNames,
  needsStockSync,
  searchStockQuotes,
  seedDatabase,
  StockQuote,
  syncStockQuotes,
  todayIso,
  Transaction,
  TransactionType,
  uid,
  getMarketQuote,
  getMarketSyncMeta,
  MarketKind,
  MarketQuote,
  searchMarketQuotes,
  syncMarketQuotes,
  exactTime,
    PortfolioSnapshot,
  savePortfolioSnapshot,
  getPortfolioSnapshots,
} from "@/lib/finance";
const chartColors = [
  "#20B77A",
  "#6863E8",
  "#F6A21A",
  "#E85B73",
  "#369FC9",
  "#916EDB",
  "#D8753F",
  "#3F9B70",
];

const categoryIconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  restaurant: Utensils,
  transport: CarFront,
  shopping: ShoppingBag,
  bills: ReceiptText,
  housing: House,
  health: HeartPulse,
  entertainment: Gamepad2,
  travel: Plane,
  salary: BriefcaseBusiness,
  freelance: Laptop,
  investment: TrendingUp,
  gift: Gift,
  bonus: Trophy,
  other: Package,
  stock: TrendingUp,
  crypto: Bitcoin,
  gold: Gem,
  fund: Landmark,
  realestate: House,
  currency: Banknote,
};

function CategoryIcon({
  category,
  className,
}: {
  category?: Category | InvestmentCategory;
  className?: string;
}) {
  const key = category?.icon || "other";
  const Icon = categoryIconMap[key] || Package;
  return <Icon aria-hidden="true" className={className} />;
}

function formatCompactSafe(value: number, settings: AppSettings) {
  return formatCompact(value, settings);
}

function persianMonthParts(date: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(date));
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
  };
}

function monthSequence(count = 6) {
  const now = persianMonthParts(new Date());
  const current = now.year * 12 + now.month - 1;
  return Array.from({ length: count }, (_, i) => {
    const n = current - (count - 1 - i);
    const month = ((n % 12) + 12) % 12;
    return {
      year: Math.floor(n / 12),
      month: month + 1,
      label: monthNames[month],
    };
  });
}

function persianDayOfMonth(date: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    day: "numeric",
  }).formatToParts(new Date(date));
  return Number(parts.find((p) => p.type === "day")?.value);
}

function getInvestmentMetrics(
  investment: Investment,
  transactions: InvestmentTransaction[],
) {
  const rows = transactions.filter((t) => t.investmentId === investment.id);
  const buyQty = rows
    .filter((t) => t.kind === "buy")
    .reduce((s, t) => s + t.quantity, 0);
  const sellQty = rows
    .filter((t) => t.kind === "sell")
    .reduce((s, t) => s + t.quantity, 0);
  const quantity = Math.max(0, buyQty - sellQty);

  const buyAmount = rows
    .filter((t) => t.kind === "buy")
    .reduce((s, t) => s + t.amount, 0);
  const sellAmount = rows
    .filter((t) => t.kind === "sell")
    .reduce((s, t) => s + t.amount, 0);
  const fees = rows
    .filter((t) => t.kind === "fee")
    .reduce((s, t) => s + t.amount, 0);
  const dividends = rows
    .filter((t) => t.kind === "dividend")
    .reduce((s, t) => s + t.amount, 0);

  const netInvested = buyAmount - sellAmount + fees;
  const currentValue = quantity * investment.currentPrice;
  const profit = currentValue - netInvested + dividends;
  const profitPercent = netInvested > 0 ? (profit / netInvested) * 100 : 0;

  return {
    rows,
    quantity,
    buyAmount,
    sellAmount,
    fees,
    dividends,
    netInvested,
    currentValue,
    profit,
    profitPercent,
  };
}

function investmentCashFlow(transactions: InvestmentTransaction[]) {
  return transactions.reduce((sum, t) => {
    if (t.kind === "buy" || t.kind === "fee") return sum + t.amount;
    if (t.kind === "sell" || t.kind === "dividend") return sum - t.amount;
    return sum;
  }, 0);
}

function investmentUnitLabel(unit: Investment["unit"]) {
  return {
    piece: "عدد",
    gram: "گرم",
    share: "سهم",
    unit: "واحد",
  }[unit];
}

function formatQuantity(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function transactionKindLabel(kind: InvestmentTransactionKind) {
  return {
    buy: "خرید",
    sell: "فروش",
    dividend: "سود نقدی",
    fee: "کارمزد",
  }[kind];
}


const currencyTickerSymbols = [
  { symbol: "USD", label: "دلار" },
  { symbol: "CAD", label: "دلار کانادا" },
  { symbol: "EUR", label: "یورو" },
];

const goldTickerSymbols = [
  { symbol: "IR_GOLD_18K", label: "طلای ۱۸ عیار" },
  { symbol: "IR_GOLD_24K", label: "طلای ۲۴ عیار" },
  { symbol: "IR_COIN_1G", label: "سکه یک گرمی" },
  { symbol: "IR_COIN_QUARTER", label: "ربع سکه" },
  { symbol: "IR_COIN_HALF", label: "نیم سکه" },
  { symbol: "IR_COIN_EMAMI", label: "سکه امامی" },
  { symbol: "IR_COIN_BAHAR", label: "سکه بهار آزادی" },
];

type TickerItem = {
  key: string;
  label: string;
  price: number;
  changePercent: number;
};

function TickerStrip({
  items,
  settings,
}: {
  items: TickerItem[];
  settings: AppSettings;
}) {
  if (!items.length) return null;
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const up = item.changePercent >= 0;
        return (
          <div
            key={item.key}
            className="flex min-w-[8.5rem] shrink-0 flex-col gap-1.5 rounded-2xl border bg-card px-3 py-2.5"
          >
            <p className="truncate text-xs text-muted-foreground">
              {item.label}
            </p>
            <p className="text-sm font-bold">
              {formatMoney(item.price, settings)}
            </p>
            <div
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium",
                up ? "text-primary" : "text-rose-600",
              )}
            >
              {up ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              <span>{Math.abs(item.changePercent).toFixed(2)}٪</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PortfolioTrendCard({
  snapshots,
  settings,
}: {
  snapshots: PortfolioSnapshot[];
  settings: AppSettings;
}) {
  if (snapshots.length < 2) return null;

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];

  const portfolioGrowth =
    first.totalValue > 0
      ? ((last.totalValue - first.totalValue) / first.totalValue) * 100
      : 0;
  const usdGrowth =
    first.usdPrice > 0
      ? ((last.usdPrice - first.usdPrice) / first.usdPrice) * 100
      : 0;
  const diff = portfolioGrowth - usdGrowth;

  const points = snapshots.map((s) => ({
    date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      month: "short",
      day: "numeric",
    }).format(new Date(s.date)),
    value: s.totalValue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">روند ارزش سبد</CardTitle>
        <CardDescription>
          {snapshots.length} روز اخیر · مقایسه با دلار
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart
              data={points}
              margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                opacity={0.18}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                cursor={{ stroke: "var(--muted-foreground)", opacity: 0.2 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-2xl border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-md">
                      <p className="mb-1 text-[11px] text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-sm font-bold">
                        {formatMoney(Number(payload[0].value), settings)}
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary/[0.06] p-3">
            <p className="text-xs text-muted-foreground">بازدهی سبد شما</p>
            <p
              className={cn(
                "mt-1 text-sm font-bold",
                portfolioGrowth >= 0 ? "text-primary" : "text-rose-600",
              )}
            >
              {portfolioGrowth >= 0 ? "+" : ""}
              {portfolioGrowth.toFixed(1)}٪
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">رشد دلار</p>
            <p
              className={cn(
                "mt-1 text-sm font-bold",
                usdGrowth >= 0 ? "text-primary" : "text-rose-600",
              )}
            >
              {usdGrowth >= 0 ? "+" : ""}
              {usdGrowth.toFixed(1)}٪
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {diff >= 0
            ? `سبد شما ${diff.toFixed(1)}٪ بهتر از دلار عمل کرده است.`
            : `سبد شما ${Math.abs(diff).toFixed(1)}٪ ضعیف‌تر از دلار عمل کرده است.`}
        </p>
      </CardContent>
    </Card>
  );
}


type Screen =
  | "home"
  | "transactions"
  | "analytics"
  | "categories"
  | "settings"
  | "investments"
  | "investmentCategories";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<
    InvestmentTransaction[]
  >([]);
  const [investmentCategories, setInvestmentCategories] = useState<
    InvestmentCategory[]
  >([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
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
    const applyTheme = () => {
      const dark =
        settings.mode === "dark" ||
        (settings.mode === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = settings.preset;
    };
    applyTheme();
    if (settings.mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [settings]);

  if (!ready)
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        در حال آماده‌سازی دفتر مالی...
      </div>
    );

  const openAdd = () => {
    setEditing(null);
    setShowAdd(true);
  };
  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setShowAdd(true);
  };

  const content =
    screen === "home" ? (
      <Dashboard
        transactions={transactions}
        categories={categories}
        investments={investments}
        investmentTransactions={investmentTransactions}
        settings={settings}
        onAdd={openAdd}
        onNavigate={setScreen}
      />
    ) : screen === "transactions" ? (
      <TransactionsScreen
        transactions={transactions}
        categories={categories}
        settings={settings}
        onAdd={openAdd}
        onEdit={openEdit}
        onRefresh={refresh}
      />
    ) : screen === "analytics" ? (
      <Analytics
        transactions={transactions}
        categories={categories}
        settings={settings}
      />
    ) : screen === "categories" ? (
      <CategoriesScreen
        categories={categories}
        transactions={transactions}
        onRefresh={refresh}
      />
    ) : screen === "investments" ? (
      <InvestmentsScreen
        investments={investments}
        investmentTransactions={investmentTransactions}
        investmentCategories={investmentCategories}
        settings={settings}
        onRefresh={refresh}
        onNavigate={setScreen}
      />
    ) : screen === "investmentCategories" ? (
      <InvestmentCategoriesScreen
        investmentCategories={investmentCategories}
        investments={investments}
        onRefresh={refresh}
      />
    ) : (
      <SettingsScreen
        settings={settings}
        onSettings={setSettings}
        onRefresh={refresh}
      />
    );

  return (
    <main className="mx-auto min-h-dvh max-w-[430px] overflow-hidden bg-background shadow-2xl sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] sm:border">
      <div className="min-h-dvh sm:min-h-[calc(100dvh-3rem)]">{content}</div>
      <BottomNav screen={screen} setScreen={setScreen} onAdd={openAdd} />
      <AddTransaction
        open={showAdd}
        transaction={editing}
        categories={categories}
        settings={settings}
        onClose={() => {
          setShowAdd(false);
          setEditing(null);
        }}
        onSaved={refresh}
      />
    </main>
  );
}

function Header({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-5 pb-5 mb-4 pt-[max(1.25rem,env(safe-area-inset-top))] bg-white">
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          دفتر مالی شخصی
        </p>
        <h1 className="mt-1 text-sm font-medium tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  );
}

function Dashboard({
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
function MiniCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "rose" | "green";
}) {
  const isIncome = tone === "green";

  return (
    <Card
      className={cn(
        "border-0 p-4 shadow-xs",
        isIncome
          ? "bg-primary/[0.08] text-primary"
          : "bg-rose-500/[0.08] text-rose-600",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            isIncome ? "bg-primary/10" : "bg-rose-500/10",
          )}
        >
          {isIncome ? (
            <ArrowDownLeft className="size-3.5" />
          ) : (
            <ArrowUpLeft className="size-3.5" />
          )}
        </div>

        <span className="text-xs font-medium text-foreground/60">{title}</span>
      </div>

      <p className="mt-3 text-base font-bold tracking-tight text-foreground">
        {value}
      </p>
    </Card>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="flex flex-col items-center border-dashed px-6 py-12 text-center shadow-none">
      <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
        <Wallet />
      </div>
      <h2 className="font-bold">هنوز تراکنشی ثبت نشده</h2>
      <p className="mt-2 max-w-[250px] text-sm leading-6 text-muted-foreground">
        با ثبت اولین تراکنش، ردیابی هزینه‌ها و درآمدهای خود را شروع کنید.
      </p>
      <Button className="mt-5 rounded-md" onClick={onAdd}>
        <Plus data-icon="inline-start" /> ثبت اولین تراکنش
      </Button>
    </Card>
  );
}

function TransactionRow({
  transaction,
  category,
  settings,
  onEdit,
  onDelete,
  onRepeat,
  revealed,
  onToggle,
}: {
  transaction: Transaction;
  category?: Category;
  settings: AppSettings;
  onEdit?: () => void;
  onDelete?: () => void;
  onRepeat?: () => void;
  revealed?: boolean;
  onToggle?: () => void;
}) {
  const actionable = !!(onEdit || onDelete || onRepeat);
  return (
    <div
      className="group relative flex items-center gap-3 rounded-md shadow bg-card p-3"
      onClick={actionable ? onToggle : undefined}
      role={actionable ? "button" : undefined}
      tabIndex={actionable ? 0 : undefined}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          transaction.type === "income"
            ? "bg-primary/10 text-primary"
            : "bg-rose-500/10 text-rose-600",
        )}
      >
        <CategoryIcon category={category} className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{transaction.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {category?.name ?? "سایر"} · {dayWord(transaction.date)}
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-bold",
          transaction.type === "income" ? "text-primary" : "text-rose-600",
        )}
      >
        {formatMoney(transaction.amount, settings)}
      </p>
      {actionable && (
        <div
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 gap-1 rounded-lg bg-background/95 p-1 shadow-sm",
            revealed ? "flex" : "hidden md:group-hover:flex",
          )}
        >
          {onRepeat && (
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onRepeat();
              }}
              aria-label="تکرار برای امروز"
            >
              <Repeat />
            </Button>
          )}
          {onEdit && (
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="ویرایش"
            >
              <Edit3 />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon-sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="حذف"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function TransactionsScreen({
  transactions,
  categories,
  settings,
  onAdd,
  onEdit,
  onRefresh,
}: {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
  onRefresh: () => void;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | TransactionType>("all");
  const [sort, setSort] = useState("new");
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [repeatTarget, setRepeatTarget] = useState<Transaction | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const map = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const list = useMemo(
    () =>
      transactions
        .filter((t) => {
          const query = q.trim().toLocaleLowerCase("fa-IR");
          return (
            (type === "all" || t.type === type) &&
            (!query ||
              `${t.title} ${map.get(t.categoryId)?.name ?? ""} ${t.note ?? ""}`
                .toLocaleLowerCase("fa-IR")
                .includes(query))
          );
        })
        .sort((a, b) =>
          sort === "new"
            ? b.date.localeCompare(a.date)
            : sort === "old"
              ? a.date.localeCompare(b.date)
              : sort === "high"
                ? b.amount - a.amount
                : a.amount - b.amount,
        ),
    [transactions, q, type, sort, map],
  );

  const grouped = groupByDate(list);
  const deleteTransaction = async () => {
    if (!deleteTarget) return;
    await db.transactions.delete(deleteTarget.id);
    setDeleteTarget(null);
    await onRefresh();
  };

  const repeatTransaction = async () => {
    if (!repeatTarget) return;
    const now = new Date().toISOString();
    await db.transactions.add({
      id: uid(),
      type: repeatTarget.type,
      amount: repeatTarget.amount,
      title: repeatTarget.title,
      categoryId: repeatTarget.categoryId,
      date: todayIso(),
      note: repeatTarget.note,
      createdAt: now,
      updatedAt: now,
    });
    setRepeatTarget(null);
    await onRefresh();
  };

  return (
    <>
      <Header
        title="تراکنش‌ها"
        action={
          <Button size="icon" variant="ghost" onClick={onAdd}>
            <Plus />
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی تراکنش..."
            className="h-11 pr-9"
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          {(
            [
              ["all", "همه"],
              ["income", "درآمد"],
              ["expense", "هزینه"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={type === id ? "default" : "outline"}
              className="rounded-md text-sm!"
              onClick={() => setType(id)}
            >
              {label}
            </Button>
          ))}
          <Select
            value={sort}
            onValueChange={setSort}
            className="ms-auto min-w-32 shrink-0"
            options={[
              { value: "new", label: "جدیدترین" },
              { value: "old", label: "قدیمی‌ترین" },
              { value: "high", label: "بیشترین مبلغ" },
              { value: "low", label: "کمترین مبلغ" },
            ]}
          />
        </div>

        {Object.keys(grouped).length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 text-xs font-semibold text-muted-foreground">
                {date}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={map.get(t.categoryId)}
                    settings={settings}
                    onEdit={() => {
                      setOpenRowId(null);
                      onEdit(t);
                    }}
                    onDelete={() => {
                      setOpenRowId(null);
                      setDeleteTarget(t);
                    }}
                    onRepeat={() => {
                      setOpenRowId(null);
                      setRepeatTarget(t);
                    }}
                    revealed={openRowId === t.id}
                    onToggle={() =>
                      setOpenRowId((cur) => (cur === t.id ? null : t.id))
                    }
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف تراکنش</DialogTitle>
            <DialogDescription>
              این تراکنش برای همیشه حذف می‌شود. این عمل قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted p-3 text-sm">
            {deleteTarget?.title} ·{" "}
            {deleteTarget && formatMoney(deleteTarget.amount, settings)}
          </div>
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
              onClick={deleteTransaction}
            >
              حذف تراکنش
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!repeatTarget}
        onOpenChange={(v) => !v && setRepeatTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تکرار تراکنش برای امروز</DialogTitle>
            <DialogDescription>
              یک تراکنش جدید با همین مشخصات، با تاریخ امروز ثبت می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted p-3 text-sm">
            {repeatTarget?.title} ·{" "}
            {repeatTarget && formatMoney(repeatTarget.amount, settings)}
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRepeatTarget(null)}
            >
              انصراف
            </Button>
            <Button className="flex-1" onClick={repeatTransaction}>
              تکرار برای امروز
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Analytics({
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

function CategoriesScreen({
  categories,
  transactions,
  onRefresh,
}: {
  categories: Category[];
  transactions: Transaction[];
  onRefresh: () => void;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [editor, setEditor] = useState<{ category?: Category } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const filtered = categories.filter((c) => c.type === type);

  const iconOptions = [
    ["utensils", "خوراک", Utensils],
    ["restaurant", "رستوران", Utensils],
    ["transport", "حمل‌ونقل", CarFront],
    ["shopping", "خرید", ShoppingBag],
    ["bills", "قبوض", ReceiptText],
    ["housing", "مسکن", House],
    ["health", "سلامت", HeartPulse],
    ["entertainment", "تفریح", Gamepad2],
    ["travel", "سفر", Plane],
    ["salary", "حقوق", BriefcaseBusiness],
    ["freelance", "فریلنسری", Laptop],
    ["investment", "سرمایه‌گذاری", TrendingUp],
    ["gift", "هدیه", Gift],
    ["bonus", "پاداش", Trophy],
    ["other", "سایر", Package],
  ] as const;

  const remove = async () => {
    if (!deleteTarget) return;
    await db.categories.delete(deleteTarget.id);
    setDeleteTarget(null);
    await onRefresh();
  };

  return (
    <>
      <Header
        title="دسته‌بندی‌ها"
        action={
          <Button size="icon" variant="ghost" onClick={() => setEditor({})}>
            <Plus />
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <div className="flex w-full rounded-xl bg-muted/60 p-1">
          {(
            [
              ["expense", "هزینه‌ها"],
              ["income", "درآمدها"],
            ] as const
          ).map(([id, label]) => {
            const active = type === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={cn(
                  "relative flex h-9 flex-1 items-center justify-center rounded-lg",
                  "text-sm! font-medium! transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map((c) => {
            const count = transactions.filter(
              (t) => t.categoryId === c.id,
            ).length;
            return (
              <Card key={c.id} className="flex items-center gap-3 p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <CategoryIcon category={c} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(count, {
                      digitStyle: "fa",
                      separatorStyle: "persian",
                    })}{" "}
                    تراکنش
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditor({ category: c })}
                  aria-label="ویرایش"
                >
                  <Edit3 />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(c)}
                  aria-label="حذف"
                >
                  <Trash2 />
                </Button>
              </Card>
            );
          })}
          {!filtered.length && <EmptyState onAdd={() => setEditor({})} />}
        </div>
      </div>

      <CategoryEditor
        open={!!editor}
        category={editor?.category}
        type={type}
        iconOptions={iconOptions}
        onClose={() => setEditor(null)}
        onSaved={onRefresh}
      />
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف دسته‌بندی</DialogTitle>
            <DialogDescription>{deleteTarget?.name} حذف شود؟</DialogDescription>
          </DialogHeader>
          {deleteTarget &&
            transactions.some((t) => t.categoryId === deleteTarget.id) && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                این دسته‌بندی تراکنش دارد. با حذف آن، تراکنش‌ها باقی می‌مانند
                اما دسته‌بندی‌شان «سایر» نمایش داده می‌شود.
              </div>
            )}
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              انصراف
            </Button>
            <Button variant="destructive" className="flex-1" onClick={remove}>
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryEditor({
  open,
  category,
  type,
  iconOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  category?: Category;
  type: TransactionType;
  iconOptions: readonly (readonly [string, string, LucideIcon])[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("other");
  const [color, setColor] = useState("");
  const [budget, setBudget] = useState("");
  useEffect(() => {
    setName(category?.name ?? "");
    setIcon(category?.icon || "other");
    setColor(category?.color || "");
    setBudget(category?.monthlyBudget ? String(category.monthlyBudget) : "");
  }, [category, open]);

  const save = async () => {
    const clean = name.trim();
    if (!clean) return;
    const monthlyBudget = budget.trim()
      ? Number(budget.replace(/\D/g, ""))
      : undefined;
    if (category)
      await db.categories.update(category.id, {
        name: clean,
        icon,
        color,
        monthlyBudget,
      });
    else
      await db.categories.add({
        id: uid(),
        name: clean,
        type,
        icon,
        color,
        monthlyBudget,
        createdAt: new Date().toISOString(),
      });
    await onSaved();
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
          </DialogTitle>
          <DialogDescription>
            نام و آیکون دسته‌بندی را انتخاب کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً آموزش"
          />
          <div>
            <p className="mb-2 text-sm font-medium">آیکون</p>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map(([key, label, Icon]) => (
                <button
                  type="button"
                  key={key}
                  title={label}
                  aria-label={label}
                  onClick={() => setIcon(key)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border transition-colors hover:bg-muted",
                    icon === key &&
                      "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                  )}
                >
                  <Icon className="size-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">رنگ اختیاری</p>
            <div className="flex gap-2">
              {[
                "#33a77b",
                "#7b78ed",
                "#f3ae53",
                "#e77a8b",
                "#56a6c8",
                "#9b83cf",
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label="انتخاب رنگ"
                  className={cn(
                    "size-7 rounded-full border-2",
                    color === c && "ring-2 ring-ring ring-offset-2",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {type === "expense" && (
            <div>
              <p className="mb-2 text-sm font-medium">بودجه ماهانه (اختیاری)</p>
              <Input
                inputMode="numeric"
                value={
                  budget
                    ? Number(budget.replace(/\D/g, "")).toLocaleString("en-US")
                    : ""
                }
                onChange={(e) => setBudget(e.target.value)}
                placeholder="مثلاً ۲۰۰۰۰۰۰"
              />
            </div>
          )}
          <Button className="w-full" onClick={save} disabled={!name.trim()}>
            {category ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvestmentsScreen({
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
                    className="flex items-center gap-3 p-3"
                  >
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
                      <p className="truncate text-sm font-semibold">
                        {investment.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {transactionKindLabel(transaction.kind)} ·{" "}
                        {dayWord(transaction.date)}
                      </p>
                    </div>

                    <div className="text-left">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          isPositive ? "text-primary" : "text-rose-600",
                        )}
                      >
                        {isPositive ? "+" : "-"}
                        {formatMoney(transaction.amount, settings)}
                      </p>
                      {(transaction.kind === "buy" ||
                        transaction.kind === "sell") && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatQuantity(transaction.quantity)}{" "}
                          {investmentUnitLabel(investment.unit)}
                        </p>
                      )}
                    </div>

                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        setTransactionEditor({ investment, transaction })
                      }
                      aria-label="ویرایش تراکنش"
                    >
                      <Edit3 />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setDeleteTransactionTarget(transaction)}
                      aria-label="حذف تراکنش"
                    >
                      <Trash2 />
                    </Button>
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

type LiveMarketKind = "stock" | "gold" | "currency" | "crypto";
const liveCategoryIcons: LiveMarketKind[] = [
  "stock",
  "gold",
  "currency",
  "crypto",
];

function InvestmentAssetEditor({
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
function InvestmentTransactionEditor({
  open,
  investment,
  transaction,
  defaultKind,
  investmentTransactions,
  settings,
  onClose,
  onSaved,
}: {
  open: boolean;
  investment: Investment;
  transaction?: InvestmentTransaction;
  defaultKind?: InvestmentTransactionKind;
  investmentTransactions: InvestmentTransaction[];
  settings: AppSettings;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<InvestmentTransactionKind>("buy");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setKind(transaction?.kind ?? defaultKind ?? "buy");
    setQuantity(transaction ? String(transaction.quantity) : "");
    setUnitPrice(
      transaction
        ? String(transaction.unitPrice)
        : investment.currentPrice
          ? String(investment.currentPrice)
          : "",
    );
    setAmount(transaction ? String(transaction.amount) : "");
    setDate(transaction?.date ?? todayIso());
    setNote(transaction?.note ?? "");
    setError("");
  }, [transaction, defaultKind, investment, open]);

  const availableQuantity = useMemo(() => {
    return investmentTransactions
      .filter(
        (t) => t.investmentId === investment.id && t.id !== transaction?.id,
      )
      .reduce((sum, t) => {
        if (t.kind === "buy") return sum + t.quantity;
        if (t.kind === "sell") return sum - t.quantity;
        return sum;
      }, 0);
  }, [investmentTransactions, investment.id, transaction]);

  useEffect(() => {
    if (kind === "buy" || kind === "sell") {
      const q = Number(quantity);
      const p = Number(unitPrice.replace(/\D/g, ""));
      if (q > 0 && p > 0) setAmount(String(Math.round(q * p)));
    }
  }, [quantity, unitPrice, kind]);

  const save = async () => {
    const q = Number(quantity.replace(",", "."));
    const p = Number(unitPrice.replace(/\D/g, ""));
    const value =
      kind === "buy" || kind === "sell"
        ? Math.round(q * p)
        : Number(amount.replace(/\D/g, ""));

    if ((kind === "buy" || kind === "sell") && (!q || q <= 0 || !p || p <= 0)) {
      setError("تعداد و قیمت واحد را وارد کنید.");
      return;
    }

    if ((kind === "dividend" || kind === "fee") && (!value || value <= 0)) {
      setError("مبلغ را وارد کنید.");
      return;
    }

    if (kind === "sell" && q > availableQuantity + 1e-9) {
      setError(
        `موجودی قابل فروش: ${formatQuantity(Math.max(0, availableQuantity))} ${investmentUnitLabel(investment.unit)}`,
      );
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      investmentId: investment.id,
      kind,
      quantity: kind === "buy" || kind === "sell" ? q : 0,
      unitPrice: kind === "buy" || kind === "sell" ? p : 0,
      amount: value,
      date,
      note: note.trim(),
      updatedAt: now,
    };

    if (transaction) {
      await db.investmentTransactions.update(transaction.id, payload);
    } else {
      await db.investmentTransactions.add({
        id: uid(),
        ...payload,
        createdAt: now,
      });
    }

    await onSaved();
    onClose();
  };

  const isTrade = kind === "buy" || kind === "sell";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "ویرایش تراکنش" : `ثبت تراکنش · ${investment.name}`}
          </DialogTitle>
          <DialogDescription>
            موجودی فعلی: {formatQuantity(availableQuantity)}{" "}
            {investmentUnitLabel(investment.unit)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["buy", "خرید"],
                ["sell", "فروش"],
                ["dividend", "سود نقدی"],
                ["fee", "کارمزد"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={cn(
                  "h-10 rounded-xl text-sm font-medium transition-all",
                  kind === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {isTrade ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  تعداد ({investmentUnitLabel(investment.unit)})
                </label>
                <Input
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="مثلاً ۳"
                  className="h-12"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  قیمت هر واحد
                </label>
                <Input
                  inputMode="numeric"
                  value={
                    unitPrice
                      ? Number(unitPrice.replace(/\D/g, "")).toLocaleString(
                          "en-US",
                        )
                      : ""
                  }
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="۰"
                  className="h-12"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium">
                مبلغ ({settings.currency})
              </label>
              <Input
                inputMode="numeric"
                value={
                  amount
                    ? Number(amount.replace(/\D/g, "")).toLocaleString("en-US")
                    : ""
                }
                onChange={(e) => setAmount(e.target.value)}
                placeholder="۰"
                className="h-14 text-2xl font-bold"
              />
            </div>
          )}

          {isTrade && (
            <div className="rounded-xl bg-muted/50 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">مبلغ تراکنش</span>
                <span className="font-bold">
                  {formatMoney(
                    Number(amount.replace(/\D/g, "")) || 0,
                    settings,
                  )}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">تاریخ</label>
            <PersianDatePicker value={date} onChange={setDate} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">یادداشت</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اختیاری"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="h-11 w-full rounded-xl"
            onClick={save}
            disabled={
              isTrade ? !quantity.trim() || !unitPrice.trim() : !amount.trim()
            }
          >
            {transaction ? "ذخیره تغییرات" : "ثبت تراکنش"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvestmentCategoriesScreen({
  investmentCategories,
  investments,
  onRefresh,
}: {
  investmentCategories: InvestmentCategory[];
  investments: Investment[];
  onRefresh: () => void;
}) {
  const [editor, setEditor] = useState<{
    category?: InvestmentCategory;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvestmentCategory | null>(
    null,
  );

  const iconOptions = [
    ["stock", "سهام", TrendingUp],
    ["gold", "طلا و سکه", Gem],
    ["currency", "ارز", Banknote],
    ["crypto", "ارز دیجیتال", Bitcoin],
    ["fund", "صندوق", Landmark],
    ["realestate", "املاک", House],
    ["other", "سایر", Package],
  ] as const;

  const remove = async () => {
    if (!deleteTarget) return;
    await db.investmentCategories.delete(deleteTarget.id);
    setDeleteTarget(null);
    await onRefresh();
  };

  return (
    <>
      <Header
        title="دسته‌بندی سرمایه‌گذاری"
        action={
          <Button size="icon" variant="ghost" onClick={() => setEditor({})}>
            <Plus />
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <div className="flex flex-col gap-2">
          {investmentCategories.map((c) => {
            const count = investments.filter(
              (i) => i.categoryId === c.id,
            ).length;
            return (
              <Card key={c.id} className="flex items-center gap-3 p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <CategoryIcon category={c} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(count, {
                      digitStyle: "fa",
                      separatorStyle: "persian",
                    })}{" "}
                    مورد
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditor({ category: c })}
                  aria-label="ویرایش"
                >
                  <Edit3 />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(c)}
                  aria-label="حذف"
                >
                  <Trash2 />
                </Button>
              </Card>
            );
          })}
          {!investmentCategories.length && (
            <EmptyState onAdd={() => setEditor({})} />
          )}
        </div>
      </div>

      <InvestmentCategoryEditor
        open={!!editor}
        category={editor?.category}
        iconOptions={iconOptions}
        onClose={() => setEditor(null)}
        onSaved={onRefresh}
      />
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف دسته‌بندی</DialogTitle>
            <DialogDescription>{deleteTarget?.name} حذف شود؟</DialogDescription>
          </DialogHeader>
          {deleteTarget &&
            investments.some((i) => i.categoryId === deleteTarget.id) && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                این دسته‌بندی سرمایه‌گذاری دارد. با حذف آن، آن سرمایه‌گذاری‌ها
                بدون دسته‌بندی معتبر باقی می‌مانند.
              </div>
            )}
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              انصراف
            </Button>
            <Button variant="destructive" className="flex-1" onClick={remove}>
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InvestmentCategoryEditor({
  open,
  category,
  iconOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  category?: InvestmentCategory;
  iconOptions: readonly (readonly [string, string, LucideIcon])[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("other");
  const [color, setColor] = useState("");

  useEffect(() => {
    setName(category?.name ?? "");
    setIcon(category?.icon || "other");
    setColor(category?.color || "");
  }, [category, open]);

  const save = async () => {
    const clean = name.trim();
    if (!clean) return;
    if (category)
      await db.investmentCategories.update(category.id, {
        name: clean,
        icon,
        color,
      });
    else
      await db.investmentCategories.add({
        id: uid(),
        name: clean,
        icon,
        color,
        createdAt: new Date().toISOString(),
      });
    await onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "ویرایش دسته‌بندی" : "دسته‌بندی سرمایه‌گذاری جدید"}
          </DialogTitle>
          <DialogDescription>
            نام و آیکون دسته‌بندی را انتخاب کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً صندوق طلا"
          />
          <div>
            <p className="mb-2 text-sm font-medium">آیکون</p>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map(([key, label, Icon]) => (
                <button
                  type="button"
                  key={key}
                  title={label}
                  aria-label={label}
                  onClick={() => setIcon(key)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border transition-colors hover:bg-muted",
                    icon === key &&
                      "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                  )}
                >
                  <Icon className="size-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">رنگ اختیاری</p>
            <div className="flex gap-2">
              {[
                "#33a77b",
                "#7b78ed",
                "#f3ae53",
                "#e77a8b",
                "#56a6c8",
                "#9b83cf",
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label="انتخاب رنگ"
                  className={cn(
                    "size-7 rounded-full border-2",
                    color === c && "ring-2 ring-ring ring-offset-2",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={save} disabled={!name.trim()}>
            {category ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsScreen({
  settings,
  onSettings,
  onRefresh,
}: {
  settings: AppSettings;
  onSettings: (s: AppSettings) => void;
  onRefresh: () => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const update = async (p: Partial<AppSettings>) => {
    const s = { ...settings, ...p };
    await db.settings.put(s);
    onSettings(s);
  };
  const backup = async () => {
    const blob = new Blob([await exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hamrah-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const payload = JSON.parse(await f.text());
      if (
        !payload ||
        typeof payload !== "object" ||
        (!Array.isArray(payload.transactions) &&
          !Array.isArray(payload.categories))
      )
        throw new Error("invalid");
      await importBackup(payload);
      await onRefresh();
    } catch {
      alert("فایل پشتیبان معتبر نیست.");
    }
    e.target.value = "";
  };
  const clear = async () => {
    const { clearAll } = await import("@/lib/finance");
    await clearAll();
    setClearOpen(false);
    await onRefresh();
  };

  return (
    <>
      <Header title="تنظیمات" />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <SettingsSection title="ظاهر برنامه">
          <SettingRow label="حالت نمایش">
            <Select
              value={settings.mode}
              onValueChange={(v) => update({ mode: v as AppSettings["mode"] })}
              options={[
                { value: "system", label: "سیستم", icon: Settings },
                { value: "light", label: "روشن", icon: Wallet },
                { value: "dark", label: "تیره", icon: Moon },
              ]}
              className="w-32"
            />
          </SettingRow>
          <SettingRow label="رنگ برنامه">
            <Select
              value={settings.preset}
              onValueChange={(v) =>
                update({ preset: v as AppSettings["preset"] })
              }
              options={[
                { value: "default", label: "خنثی", icon: Package },
                { value: "green", label: "سبز مالی", icon: TrendingUp },
                { value: "blue", label: "آبی آرام", icon: Plane },
              ]}
              className="w-32"
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="نمایش اعداد">
          <SettingRow label="رقم‌ها">
            <Select
              value={settings.digitStyle}
              onValueChange={(v) =>
                update({ digitStyle: v as AppSettings["digitStyle"] })
              }
              options={[
                { value: "fa", label: "فارسی ۱۲۳", icon: ArrowDownLeft },
                { value: "en", label: "لاتین 123", icon: ArrowUpLeft },
              ]}
              className="w-32"
            />
          </SettingRow>
          <SettingRow label="جداکننده اعداد">
            <Select
              value={settings.separatorStyle}
              onValueChange={(v) =>
                update({ separatorStyle: v as AppSettings["separatorStyle"] })
              }
              options={[
                { value: "persian", label: "۱۲٬۳۴۵", icon: ReceiptText },
                { value: "comma", label: "12,345", icon: ReceiptText },
              ]}
              className="w-32"
            />
          </SettingRow>
          <SettingRow label="واحد پول">
            <Input
              value={settings.currency}
              onChange={(e) => update({ currency: e.target.value })}
              className="h-9 w-24 text-left"
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="پشتیبان‌گیری">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-border/60 bg-white px-4 py-2 h-auto"
              onClick={backup}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Download className="size-4" />
              </span>

              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">دریافت فایل پشتیبان</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  ذخیره اطلاعات در قالب فایل
                </span>
              </span>
            </Button>

            <Button
              variant="outline"
              className=" w-full justify-start rounded-xl border-border/60 bg-white px-4 py-2 h-auto"
              onClick={() => file.current?.click()}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileUp className="size-4" />
              </span>

              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">بازیابی از فایل</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  وارد کردن اطلاعات از فایل پشتیبان
                </span>
              </span>
            </Button>

            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={restore}
            />

            <Button
              variant="outline"
              className=" w-full justify-start rounded-xl border-destructive/20  text-destructive hover:bg-destructive/[0.07] hover:text-destructive px-4 py-2 h-auto bg-rose-50/30"
              onClick={() => setClearOpen(true)}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="size-4" />
              </span>

              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">
                  پاک کردن همه اطلاعات
                </span>
                <span className="text-[11px] font-normal text-destructive/60">
                  حذف دائمی تمام تراکنش‌ها و اطلاعات
                </span>
              </span>
            </Button>
          </div>
        </SettingsSection>
        <p className="text-center text-xs text-muted-foreground">
          همراه مالی · اطلاعات شما فقط روی همین دستگاه ذخیره می‌شود.
        </p>
      </div>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>پاک کردن همه اطلاعات</DialogTitle>
            <DialogDescription>
              تمام تراکنش‌ها و دسته‌بندی‌ها حذف و دسته‌بندی‌های پیش‌فرض دوباره
              ساخته می‌شوند.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setClearOpen(false)}
            >
              انصراف
            </Button>
            <Button variant="destructive" className="flex-1" onClick={clear}>
              پاک کردن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">{children}</CardContent>
    </Card>
  );
}
function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function BottomNav({
  screen,
  setScreen,
  onAdd,
}: {
  screen: string;
  setScreen: (v: any) => void;
  onAdd: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[430px] items-end justify-around  shadow-2xl bg-white px-3 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <NavItem
        active={screen === "home"}
        icon={<Home />}
        label="خانه"
        onClick={() => setScreen("home")}
      />
      <NavItem
        active={screen === "transactions"}
        icon={<ArrowLeftRight />}
        label="تراکنش‌ها"
        onClick={() => setScreen("transactions")}
      />
      <Button
        onClick={onAdd}
        aria-label="ثبت تراکنش"
        size="icon-lg"
        className="-mt-10 w-10 h-10 rounded-full "
      >
        <Plus />
      </Button>
      <NavItem
        active={screen === "analytics"}
        icon={<BarChart3 />}
        label="تحلیل"
        onClick={() => setScreen("analytics")}
      />

      <NavItem
        active={screen === "categories"}
        icon={<Tags />}
        label="دسته‌ها"
        onClick={() => setScreen("categories")}
      />
    </nav>
  );
}
function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto w-[3.25rem] flex-col gap-1 py-1 text-[10px] border-0 hover:bg-transparent",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function AddTransaction({
  open,
  transaction,
  categories,
  settings,
  onClose,
  onSaved,
}: {
  open: boolean;
  transaction: Transaction | null;
  categories: Category[];
  settings: AppSettings;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense",
  );
  const [amount, setAmount] = useState(String(transaction?.amount ?? ""));
  const [title, setTitle] = useState(transaction?.title ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [note, setNote] = useState(transaction?.note ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setType(transaction?.type ?? "expense");
    setAmount(String(transaction?.amount ?? ""));
    setTitle(transaction?.title ?? "");
    setCategoryId(transaction?.categoryId ?? "");
    setDate(transaction?.date ?? todayIso());
    setNote(transaction?.note ?? "");
    setError("");
  }, [transaction, open]);

  const choices = categories.filter((c) => c.type === type);
  useEffect(() => {
    if (!choices.some((c) => c.id === categoryId))
      setCategoryId(choices[0]?.id ?? "");
  }, [type, categories, choices, categoryId]);

  const save = async () => {
    const value = Number(amount.replace(/\D/g, ""));
    if (!value || !title.trim() || !categoryId) {
      setError("لطفاً مبلغ، عنوان و دسته را کامل کنید.");
      return;
    }
    const now = new Date().toISOString();
    const data = {
      type,
      amount: value,
      title: title.trim(),
      categoryId,
      date,
      note: note.trim(),
      updatedAt: now,
      createdAt: transaction?.createdAt ?? now,
    };
    if (transaction) await db.transactions.update(transaction.id, data);
    else await db.transactions.add({ id: uid(), ...data });
    await onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "ویرایش تراکنش" : "ثبت تراکنش"}
          </DialogTitle>
          <DialogDescription>
            مبلغ، عنوان و دسته‌بندی را وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex w-full rounded-xl bg-muted/60 p-1">
            {(
              [
                ["expense", "هزینه"],
                ["income", "درآمد"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={cn(
                  "relative flex h-9 flex-1 items-center justify-center rounded-lg",
                  "text-sm! font-medium! transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  id === type
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              مبلغ ({settings.currency})
            </label>
            <Input
              autoFocus
              inputMode="numeric"
              value={
                amount
                  ? Number(amount.replace(/\D/g, "")).toLocaleString("en-US")
                  : ""
              }
              onChange={(e) => setAmount(e.target.value)}
              placeholder="۰"
              className="h-14 text-2xl font-bold"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">عنوان</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً خرید هفتگی"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">دسته‌بندی</label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              options={choices.map((c) => ({
                value: c.id,
                label: c.name,
                icon: categoryIconMap[c.icon] || Package,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-2 block text-sm font-medium">تاریخ</label>
              <PersianDatePicker value={date} onChange={setDate} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">یادداشت</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="اختیاری"
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="h-11 w-full rounded-xl" onClick={save}>
            {transaction ? "ذخیره تغییرات" : "ذخیره تراکنش"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
