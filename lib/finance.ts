import Dexie, { type Table } from "dexie";

export type TransactionType = "income" | "expense";
export type DigitStyle = "fa" | "en";
export type SeparatorStyle = "persian" | "comma";
export type ThemeMode = "light" | "dark" | "system";
export type ThemePreset = "default" | "green" | "blue";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  categoryId: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  monthlyBudget?: number;
  createdAt: string;
};

export type InvestmentCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
};

/** نوع دارایی؛ خود دارایی دیگر خرید/فروش نیست. */
export type InvestmentUnit = "piece" | "gram" | "share" | "unit";

export type Investment = {
  id: string;
  name: string;
  categoryId: string;
  unit: InvestmentUnit;
  /** قیمت فعلی هر واحد برای محاسبه ارزش روز */
  currentPrice: number;
  /** در صورتی که دارایی به یک نماد بورسی زنده وصل باشد (ISIN)، قیمت خودکار به‌روز می‌شود */
  symbolId?: string;
  createdAt: string;
  updatedAt: string;
};


export type InvestmentTransactionKind =
  | "buy"
  | "sell"
  | "dividend"
  | "fee"
  | "initial";

export type InvestmentTransaction = {
  id: string;
  investmentId: string;
  kind: InvestmentTransactionKind;
  /** تعداد/حجم دارایی؛ برای dividend و fee می‌تواند 0 باشد. */
  quantity: number;
  /** قیمت هر واحد؛ برای dividend و fee می‌تواند 0 باشد. */
  unitPrice: number;
  /** مبلغ نهایی تراکنش */
  amount: number;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

/** یک ردیف قیمت نماد بورسی که از API دریافت و کش می‌شود */
export type StockQuote = {
  /** شناسه یکتای نماد (ISIN) */
  isin: string;
  /** نماد کوتاه (l18) */
  symbol: string;
  /** نام کامل (l30) */
  name: string;
  /** آخرین قیمت معامله‌شده (pl) */
  lastPrice: number;
  /** قیمت پایانی (pc) */
  closingPrice: number;
  /** درصد تغییر نسبت به قیمت پایانی دیروز (plp) */
  changePercent: number;
  updatedAt: string;
};

export type StockSyncMeta = {
  id: "stock-sync";
  lastSyncedAt: string;
};

export type MarketKind = "gold" | "currency" | "crypto";

/** یک ردیف قیمت طلا/سکه/ارز/کریپتو که از API گرفته و کش می‌شود */
export type MarketQuote = {
  /** کلید یکتا به شکل `${market}:${symbol}` */
  id: string;
  market: MarketKind;
  symbol: string;
  name: string;
  price: number;
  /** واحد قیمت، مثلا "تومان" یا "دلار" */
  unit: string;
  changePercent: number;
  updatedAt: string;
};

export type MarketSyncMeta = {
  id: "market-sync";
  lastSyncedAt: string;
};
export type PortfolioSnapshot = {
  /** تاریخ میلادی به شکل YYYY-MM-DD؛ هر روز فقط یک رکورد */
  date: string
  totalValue: number
  usdPrice: number
  createdAt: string
}

export const defaultInvestmentCategories = [
  ["سهام", "stock"],
  ["طلا و سکه", "gold"],
  ["ارز", "currency"],
  ["ارز دیجیتال", "crypto"],
  ["صندوق سرمایه‌گذاری", "fund"],
  ["املاک", "realestate"],
  ["سایر", "other"],
] as const;

export type AppSettings = {
  id: "app";
  digitStyle: DigitStyle;
  separatorStyle: SeparatorStyle;
  currency: string;
  mode: ThemeMode;
  preset: ThemePreset;
};

export const expenseCategories = [
  ["خوراک", "utensils"],
  ["رستوران", "restaurant"],
  ["حمل‌ونقل", "transport"],
  ["خرید", "shopping"],
  ["قبوض", "bills"],
  ["مسکن", "housing"],
  ["سلامت", "health"],
  ["تفریح", "entertainment"],
  ["سفر", "travel"],
  ["سایر", "other"],
] as const;

export const incomeCategories = [
  ["حقوق", "salary"],
  ["فریلنسری", "freelance"],
  ["سود سرمایه‌گذاری", "investment"],
  ["هدیه", "gift"],
  ["پاداش", "bonus"],
  ["سایر", "other"],
] as const;

const legacyIconMap: Record<string, string> = {
  "🍽️": "utensils",
  "🍴": "restaurant",
  "🚕": "transport",
  "🛍️": "shopping",
  "🧾": "bills",
  "🏠": "housing",
  "💊": "health",
  "🎮": "entertainment",
  "✈️": "travel",
  "💼": "salary",
  "💻": "freelance",
  "📈": "investment",
  "🎁": "gift",
  "🏆": "bonus",
  "📦": "other",
};

class FinanceDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  settings!: Table<AppSettings, "app">;
  investments!: Table<Investment, string>;
  investmentTransactions!: Table<InvestmentTransaction, string>;
  investmentCategories!: Table<InvestmentCategory, string>;
  stockQuotes!: Table<StockQuote, string>;
  stockSyncMeta!: Table<StockSyncMeta, "stock-sync">;
  marketQuotes!: Table<MarketQuote, string>;
  marketSyncMeta!: Table<MarketSyncMeta, "market-sync">;
  portfolioSnapshots!: Table<PortfolioSnapshot, string>
  
  constructor() {
    super("hamrah-finance");

    this.version(1).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
    });

    this.version(2).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
      investments: "id, type, date, createdAt",
    });

    this.version(3).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
      investments: "id, categoryId, date, createdAt",
      investmentCategories: "id, createdAt",
    });

    this.version(4).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
      investments: "id, categoryId, kind, date, createdAt",
      investmentCategories: "id, createdAt",
    });

    // مدل جدید سرمایه‌گذاری.
    // چون گفتی داده‌های قبلی مهم نیست، سرمایه‌گذاری‌های قدیمی پاک می‌شوند.
    this.version(5)
      .stores({
        transactions: "id, type, date, categoryId, createdAt",
        categories: "id, type",
        settings: "id",
        investments: "id, categoryId, name, createdAt",
        investmentTransactions: "id, investmentId, kind, date, createdAt",
        investmentCategories: "id, createdAt",
      })
      .upgrade(async (tx) => {
        await tx.table("investments").clear();
        await tx.table("investmentTransactions").clear();

        const categoriesTable = tx.table("investmentCategories");
        if ((await categoriesTable.count()) === 0) {
          const now = new Date().toISOString();
          await categoriesTable.bulkAdd(
            defaultInvestmentCategories.map(([name, icon]) => ({
              id: crypto.randomUUID(),
              name,
              icon,
              color: "",
              createdAt: now,
            })),
          );
        }
      });

    // افزودن قابلیت اتصال دارایی به نماد بورسی زنده + کش قیمت‌ها.
    // دارایی‌های قبلی دست‌نخورده باقی می‌مانند (symbolId اختیاری است).
    this.version(6).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
      investments: "id, categoryId, name, symbolId, createdAt",
      investmentTransactions: "id, investmentId, kind, date, createdAt",
      investmentCategories: "id, createdAt",
      stockQuotes: "isin, symbol, name",
      stockSyncMeta: "id",
    });

    this.version(7)
      .stores({
        transactions: "id, type, date, categoryId, createdAt",
        categories: "id, type",
        settings: "id",
        investments: "id, categoryId, name, symbolId, createdAt",
        investmentTransactions: "id, investmentId, kind, date, createdAt",
        investmentCategories: "id, createdAt",
        stockQuotes: "isin, symbol, name",
        stockSyncMeta: "id",
        marketQuotes: "id, market, symbol, name",
        marketSyncMeta: "id",
      })
      .upgrade(async (tx) => {
        await tx.table("investments").clear();
        await tx.table("investmentTransactions").clear();
        await tx.table("investmentCategories").clear();

        const now = new Date().toISOString();
        await tx.table("investmentCategories").bulkAdd(
          defaultInvestmentCategories.map(([name, icon]) => ({
            id: crypto.randomUUID(),
            name,
            icon,
            color: "",
            createdAt: now,
          })),
        );
      });
        this.version(8).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
      investments: "id, categoryId, name, symbolId, createdAt",
      investmentTransactions: "id, investmentId, kind, date, createdAt",
      investmentCategories: "id, createdAt",
      stockQuotes: "isin, symbol, name",
      stockSyncMeta: "id",
      marketQuotes: "id, market, symbol, name",
      marketSyncMeta: "id",
      portfolioSnapshots: "date",
    })
  }
}

export const db = new FinanceDB();

async function migrateLegacyCategoryIcons() {
  const categories = await db.categories.toArray();
  const updates = categories
    .filter((c) => legacyIconMap[c.icon])
    .map((c) => db.categories.update(c.id, { icon: legacyIconMap[c.icon] }));
  if (updates.length) await Promise.all(updates);
}

export async function seedDatabase() {
  if (await db.settings.get("app")) {
    await migrateLegacyCategoryIcons();

    if ((await db.investmentCategories.count()) === 0) {
      const now = new Date().toISOString();
      await db.investmentCategories.bulkAdd(
        defaultInvestmentCategories.map(([name, icon]) => ({
          id: crypto.randomUUID(),
          name,
          icon,
          color: "",
          createdAt: now,
        })),
      );
    }
    return;
  }

  const now = new Date().toISOString();
  const categories: Category[] = [
    ...expenseCategories.map(([name, icon]) => ({
      id: crypto.randomUUID(),
      name,
      icon,
      type: "expense" as const,
      color: "",
      createdAt: now,
    })),
    ...incomeCategories.map(([name, icon]) => ({
      id: crypto.randomUUID(),
      name,
      icon,
      type: "income" as const,
      color: "",
      createdAt: now,
    })),
  ];

  const investmentCategories: InvestmentCategory[] =
    defaultInvestmentCategories.map(([name, icon]) => ({
      id: crypto.randomUUID(),
      name,
      icon,
      color: "",
      createdAt: now,
    }));

  await db.transaction(
    "rw",
    db.categories,
    db.settings,
    db.investmentCategories,
    async () => {
      await db.categories.bulkAdd(categories);
      await db.investmentCategories.bulkAdd(investmentCategories);
      await db.settings.add({
        id: "app",
        digitStyle: "fa",
        separatorStyle: "persian",
        currency: "تومان",
        mode: "system",
        preset: "green",
      });
    },
  );
}

export function toFa(value: string | number, style: DigitStyle = "fa") {
  return style === "en"
    ? String(value)
    : String(value).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function formatNumber(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle">,
) {
  const raw = Math.round(value).toLocaleString("en-US");
  const separated =
    settings.separatorStyle === "persian" ? raw.replace(/,/g, "٬") : raw;
  return toFa(separated, settings.digitStyle);
}

export function formatMoney(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle" | "currency">,
) {
  return `${formatNumber(value, settings)} ${settings.currency}`;
}

export const monthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function jalaliLabel(iso: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function todayIso() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function startOfCurrentMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: string, b: Date) {
  return new Date(a).toDateString() === b.toDateString();
}

export function groupByDate(items: Transaction[]) {
  return items.reduce<Record<string, Transaction[]>>((acc, item) => {
    const key = jalaliLabel(item.date);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

export async function exportBackup() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    transactions: await db.transactions.toArray(),
    categories: await db.categories.toArray(),
    settings: await db.settings.get("app"),
    investments: await db.investments.toArray(),
    investmentTransactions: await db.investmentTransactions.toArray(),
    investmentCategories: await db.investmentCategories.toArray(),
  };
  return JSON.stringify(payload, null, 2);
}

export async function importBackup(
  payload: {
    transactions?: Transaction[];
    categories?: Category[];
    settings?: AppSettings;
    investments?: Investment[];
    investmentTransactions?: InvestmentTransaction[];
    investmentCategories?: InvestmentCategory[];
  },
  merge = false,
) {
  // await db.transaction(
  //   db.transactions,
  //   db.categories,
  //   db.settings,
  //   db.investments,
  //   db.investmentTransactions,
  //   db.investmentCategories,
  //   async () => {
  //     if (!merge) {
  //       await db.transactions.clear()
  //       await db.categories.clear()
  //       await db.investments.clear()
  //       await db.investmentTransactions.clear()
  //       await db.investmentCategories.clear()
  //     }
  //     if (payload.transactions?.length)
  //       await db.transactions.bulkPut(payload.transactions)
  //     if (payload.categories?.length)
  //       await db.categories.bulkPut(
  //         payload.categories.map(c => ({
  //           ...c,
  //           icon: legacyIconMap[c.icon] ?? c.icon ?? "other",
  //         })),
  //       )
  //     if (payload.investments?.length)
  //       await db.investments.bulkPut(payload.investments)
  //     if (payload.investmentTransactions?.length)
  //       await db.investmentTransactions.bulkPut(payload.investmentTransactions)
  //     if (payload.investmentCategories?.length)
  //       await db.investmentCategories.bulkPut(payload.investmentCategories)
  //     if (payload.settings)
  //       await db.settings.put(payload.settings)
  //   },
  // )
}

export async function clearAll() {
  // await db.transaction(
  //   "rw",
  //   db.transactions,
  //   db.categories,
  //   db.settings,
  //   db.investments,
  //   db.investmentTransactions,
  //   db.investmentCategories,
  //   async () => {
  //     await db.transactions.clear()
  //     await db.categories.clear()
  //     await db.settings.clear()
  //     await db.investments.clear()
  //     await db.investmentTransactions.clear()
  //     await db.investmentCategories.clear()
  //   },
  // )
  await seedDatabase();
}

export async function getAll() {
  return {
    transactions: await db.transactions.orderBy("date").reverse().toArray(),
    categories: await db.categories.toArray(),
    settings: (await db.settings.get("app")) as AppSettings,
    investments: await db.investments.orderBy("createdAt").reverse().toArray(),
    investmentTransactions: await db.investmentTransactions
      .orderBy("date")
      .reverse()
      .toArray(),
    investmentCategories: await db.investmentCategories.toArray(),
  };
}

export function uid() {
  return crypto.randomUUID();
}

export function filterPeriod(kind: string) {
  const now = new Date();
  const from = new Date(now);
  if (kind === "month") from.setDate(1);
  else if (kind === "last30") from.setDate(now.getDate() - 30);
  else if (kind === "year") from.setMonth(0, 1);
  else from.setFullYear(2000);
  from.setHours(0, 0, 0, 0);
  return from;
}

export function formatCompact(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle">,
) {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const formatCompactValue = (value: number) => {
    const rounded = Number(value.toFixed(1));
    return toFa(String(rounded), settings.digitStyle);
  };

  if (absValue >= 1_000_000_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000_000_000)} تریلیون`;

  if (absValue >= 1_000_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000_000)} میلیارد`;

  if (absValue >= 1_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000)} میلیون`;

  if (absValue >= 1_000)
    return `${sign}${formatCompactValue(absValue / 1_000)} هزار`;

  return formatNumber(value, settings);
}

export function dayWord(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (isSameDay(iso, today)) return "امروز";
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(iso, yesterday)) return "دیروز";
  return jalaliLabel(iso);
}

export const defaultSettings: AppSettings = {
  id: "app",
  digitStyle: "fa",
  separatorStyle: "persian",
  currency: "تومان",
  mode: "system",
  preset: "green",
};

export type Screen =
  | "home"
  | "transactions"
  | "analytics"
  | "categories"
  | "settings";

export type ChartPoint = {
  label: string;
  income: number;
  expense: number;
};

/* ---------------------------------------------------------------------- */
/*  بخش قیمت زنده سهام (Stock Quotes)                                     */
/* ---------------------------------------------------------------------- */



/**
 * آیا از ساعت ۸ صبح تا ۸ عصر هستیم و حداقل یک ساعت از آخرین سینک گذشته؟
 * خارج از این بازه (قبل از ۸ یا بعد از ۲۰) سینک لازم نیست.
 */
export function needsStockSync(lastSyncedAt?: string) {
  const now = new Date()
  const hour = now.getHours()
  if (hour < 8 || hour >= 20) return false

  if (!lastSyncedAt) return true
  const diffMs = now.getTime() - new Date(lastSyncedAt).getTime()
  return diffMs >= 60 * 60 * 1000
}

export function exactTime(iso: string, style: DigitStyle = "fa") {
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))
  return toFa(time, style)
}

export async function getStockSyncMeta() {
  return db.stockSyncMeta.get("stock-sync");
}

/**
 * لیست تمام نمادها را از route داخلی /api/stocks می‌گیرد، در دیتابیس
 * محلی کش می‌کند، و قیمت هر دارایی متصل به یک نماد (symbolId) را
 * به‌صورت خودکار به‌روز می‌کند.
 *
 * توجه: شکل دقیق پاسخ API را حتماً قبل از استفاده تست کنید. اگر پاسخ به‌جای
 * آرایه‌ی مستقیم، داخل یک فیلد مثل `data` یا `symbols` بود، خط
 * `const raw: any[] = await res.json()` را متناسب با آن تغییر دهید.
 */
export async function syncStockQuotes() {
  const res = await fetch("/api/stocks");
  if (!res.ok) throw new Error("دریافت قیمت‌ها ناموفق بود");

  const raw: any[] = await res.json();
  const now = new Date().toISOString();

    // قیمت سهام از TSETMC به ریال می‌آید؛ برای هماهنگی با بقیه اپ (تومان) بر ۱۰ تقسیم می‌شود
  const quotes: StockQuote[] = raw
    .filter((d) => d && d.isin)
    .map((d) => ({
      isin: String(d.isin),
      symbol: d.l18 ?? "",
      name: d.l30 ?? d.l18 ?? "",
      lastPrice: Math.round((Number(d.pl) || 0) / 10),
      closingPrice: Math.round((Number(d.pc) || 0) / 10),
      changePercent: Number(d.plp) || 0,
      updatedAt: now,
    }))

  await db.transaction(
    "rw",
    db.stockQuotes,
    db.stockSyncMeta,
    db.investments,
    async () => {
      await db.stockQuotes.clear();
      if (quotes.length) await db.stockQuotes.bulkPut(quotes);
      await db.stockSyncMeta.put({ id: "stock-sync", lastSyncedAt: now });

      const quoteMap = new Map(quotes.map((q) => [q.isin, q]));
      const investments = await db.investments.toArray();
      const updates = investments
        .filter((inv) => inv.symbolId && quoteMap.has(inv.symbolId))
        .map((inv) =>
          db.investments.update(inv.id, {
            currentPrice: quoteMap.get(inv.symbolId!)!.lastPrice,
            updatedAt: now,
          }),
        );
      await Promise.all(updates);
    },
  );

  return quotes.length;
}

/** جست‌وجوی نماد در کش محلی بر اساس نام یا نماد کوتاه */
export async function searchStockQuotes(query: string, limit = 8) {
  const q = query.trim();
  if (!q) return [];
  const all = await db.stockQuotes.toArray();
  return all
    .filter((s) => s.symbol.includes(q) || s.name.includes(q))
    .slice(0, limit);
}

export async function getStockQuote(isin: string) {
  return db.stockQuotes.get(isin);
}


/* ---------------------------------------------------------------------- */
/*  بخش قیمت زنده طلا / سکه / ارز / کریپتو                                */
/* ---------------------------------------------------------------------- */

export async function getMarketSyncMeta() {
  return db.marketSyncMeta.get("market-sync")
}

/**
 * از /api/market قیمت طلا/سکه، ارز و کریپتو را می‌گیرد، کش می‌کند و
 * دارایی‌های متصل (symbolId با فرمت `${market}:${symbol}`) را به‌روز می‌کند.
 *
 * قیمت کریپتو در API بر حسب دلار است؛ برای هماهنگی با بقیه اپ (تومان)
 * با نرخ دلار (از همان پاسخ) به تومان تبدیل می‌شود. اگر نرخ دلار پیدا
 * نشود، همان قیمت دلاری خام ذخیره می‌شود.
 */
export async function syncMarketQuotes() {
  const res = await fetch("/api/market")
  if (!res.ok) throw new Error("دریافت قیمت‌ها ناموفق بود")

  const raw: {
    gold?: any[]
    currency?: any[]
    cryptocurrency?: any[]
  } = await res.json()

  const now = new Date().toISOString()
  const quotes: MarketQuote[] = []

  const usdRate =
    raw.currency?.find((d) => d.symbol === "USD")?.price ??
    raw.currency?.find((d) => d.symbol === "USDT_IRT")?.price

  ;(raw.gold ?? []).forEach((d) => {
    if (!d?.symbol) return
    quotes.push({
      id: `gold:${d.symbol}`,
      market: "gold",
      symbol: d.symbol,
      name: d.name ?? d.name_en ?? d.symbol,
      price: Number(d.price) || 0,
      unit: d.unit ?? "تومان",
      changePercent: Number(d.change_percent) || 0,
      updatedAt: now,
    })
  })

  ;(raw.currency ?? []).forEach((d) => {
    if (!d?.symbol) return
    quotes.push({
      id: `currency:${d.symbol}`,
      market: "currency",
      symbol: d.symbol,
      name: d.name ?? d.name_en ?? d.symbol,
      price: Number(d.price) || 0,
      unit: d.unit ?? "تومان",
      changePercent: Number(d.change_percent) || 0,
      updatedAt: now,
    })
  })

  ;(raw.cryptocurrency ?? []).forEach((d) => {
    if (!d?.symbol) return
    const rawPrice = Number(d.price) || 0
    const converted = usdRate ? Math.round(rawPrice * usdRate) : rawPrice
    quotes.push({
      id: `crypto:${d.symbol}`,
      market: "crypto",
      symbol: d.symbol,
      name: d.name ?? d.name_en ?? d.symbol,
      price: converted,
      unit: usdRate ? "تومان" : (d.unit ?? "دلار"),
      changePercent: Number(d.change_percent) || 0,
      updatedAt: now,
    })
  })

  await db.transaction(
    "rw",
    db.marketQuotes,
    db.marketSyncMeta,
    db.investments,
    async () => {
      await db.marketQuotes.clear()
      if (quotes.length) await db.marketQuotes.bulkPut(quotes)
      await db.marketSyncMeta.put({ id: "market-sync", lastSyncedAt: now })

      const quoteMap = new Map(quotes.map((q) => [q.id, q]))
      const investments = await db.investments.toArray()
      const updates = investments
        .filter((inv) => inv.symbolId && quoteMap.has(inv.symbolId))
        .map((inv) =>
          db.investments.update(inv.id, {
            currentPrice: quoteMap.get(inv.symbolId!)!.price,
            updatedAt: now,
          }),
        )
      await Promise.all(updates)
    },
  )

  return quotes.length
}

/** جست‌وجوی نماد در کش محلی طلا/ارز/کریپتو بر اساس نام یا نماد */
export async function searchMarketQuotes(
  market: MarketKind,
  query: string,
  limit = 8,
) {
  const q = query.trim()
  const all = await db.marketQuotes.where("market").equals(market).toArray()
  const filtered = q
    ? all.filter((s) => s.symbol.includes(q) || s.name.includes(q))
    : all
  return filtered.slice(0, limit)
}

export async function getMarketQuote(id: string) {
  return db.marketQuotes.get(id)
}

/* ---------------------------------------------------------------------- */
/*  بخش تاریخچه‌ی ارزش سبد (برای نمودار روند و مقایسه با دلار)             */
/* ---------------------------------------------------------------------- */

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * ارزش کل سبد و قیمت دلار را برای امروز ذخیره می‌کند. هر روز فقط یک
 * رکورد دارد؛ اگر امروز قبلاً ذخیره شده باشد، با آخرین مقدار بازنویسی می‌شود.
 */
export async function savePortfolioSnapshot(totalValue: number, usdPrice: number) {
  if (!usdPrice) return
  await db.portfolioSnapshots.put({
    date: todayKey(),
    totalValue,
    usdPrice,
    createdAt: new Date().toISOString(),
  })
}

/** آخرین N روز از تاریخچه‌ی ارزش سبد را به ترتیب صعودی تاریخ برمی‌گرداند */
export async function getPortfolioSnapshots(days = 30) {
  const all = await db.portfolioSnapshots.orderBy("date").toArray()
  return all.slice(-days)
}
