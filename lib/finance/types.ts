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


export type RecurringBill = {
  id: string
  title: string
  amount: number
  categoryId: string
  /** روز سررسید در ماه (۱ تا ۳۱) */
  dueDay: number
  note: string
  active: boolean
  /** آخرین دوره‌ای (به شکل YYYY-MM) که این قبض پرداخت‌شده ثبت شده */
  lastPaidPeriod?: string
  /** تعداد کل اقساط؛ فقط برای وام/اقساط با تعداد مشخص پر می‌شود */
  totalInstallments?: number
  /** تعداد اقساطی که تاکنون پرداخت شده */
  paidInstallments?: number
  createdAt: string
  updatedAt: string
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

export const legacyIconMap: Record<string, string> = {
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

export type Screen = "home" | "transactions" | "analytics" | "categories" | "settings" | "investments" | "investmentCategories";

export type ChartPoint = { label: string; income: number; expense: number };

