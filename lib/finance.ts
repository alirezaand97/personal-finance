import Dexie, { type Table } from "dexie"

export type TransactionType = "income" | "expense"
export type DigitStyle = "fa" | "en"
export type SeparatorStyle = "persian" | "comma"
export type ThemeMode = "light" | "dark" | "system"
export type ThemePreset = "default" | "green" | "blue"

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  title: string
  categoryId: string
  date: string
  note: string
  createdAt: string
  updatedAt: string
}
export type Category = {
  id: string
  name: string
  type: TransactionType
  /** Stable icon key, not an emoji or display text. */
  icon: string
  /** Optional CSS color used by charts/category UI. */
  color: string
  /** Optional monthly budget cap for expense categories. */
  monthlyBudget?: number
  createdAt: string
}

export type AppSettings = {
  id: "app"
  digitStyle: DigitStyle
  separatorStyle: SeparatorStyle
  currency: string
  mode: ThemeMode
  preset: ThemePreset
}

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
] as const

export const incomeCategories = [
  ["حقوق", "salary"],
  ["فریلنسری", "freelance"],
  ["سرمایه‌گذاری", "investment"],
  ["هدیه", "gift"],
  ["پاداش", "bonus"],
  ["سایر", "other"],
] as const

const legacyIconMap: Record<string, string> = {
  "🍽️": "utensils", "🍴": "restaurant", "🚕": "transport", "🛍️": "shopping",
  "🧾": "bills", "🏠": "housing", "💊": "health", "🎮": "entertainment",
  "✈️": "travel", "💼": "salary", "💻": "freelance", "📈": "investment",
  "🎁": "gift", "🏆": "bonus", "📦": "other",
}

class FinanceDB extends Dexie {
  transactions!: Table<Transaction, string>
  categories!: Table<Category, string>
  settings!: Table<AppSettings, "app">

  constructor() {
    super("hamrah-finance")
    this.version(1).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
    })
  }
}

export const db = new FinanceDB()

async function migrateLegacyCategoryIcons() {
  const categories = await db.categories.toArray()
  const updates = categories
    .filter(c => legacyIconMap[c.icon])
    .map(c => db.categories.update(c.id, { icon: legacyIconMap[c.icon] }))
  if (updates.length) await Promise.all(updates)
}

export async function seedDatabase() {
  if (await db.settings.get("app")) {
    await migrateLegacyCategoryIcons()
    return
  }

  const now = new Date().toISOString()
  const categories: Category[] = [
    ...expenseCategories.map(([name, icon]) => ({
      id: crypto.randomUUID(), name, icon, type: "expense" as const, color: "", createdAt: now,
    })),
    ...incomeCategories.map(([name, icon]) => ({
      id: crypto.randomUUID(), name, icon, type: "income" as const, color: "", createdAt: now,
    })),
  ]

  await db.transaction("rw", db.categories, db.settings, async () => {
    await db.categories.bulkAdd(categories)
    await db.settings.add({
      id: "app",
      digitStyle: "fa",
      separatorStyle: "persian",
      currency: "تومان",
      mode: "system",
      preset: "green",
    })
  })
}

export function toFa(value: string | number, style: DigitStyle = "fa") {
  return style === "en"
    ? String(value)
    : String(value).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
}

export function formatNumber(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle">,
) {
  const raw = Math.round(value).toLocaleString("en-US")
  const separated = settings.separatorStyle === "persian" ? raw.replace(/,/g, "٬") : raw
  return toFa(separated, settings.digitStyle)
}

export function formatMoney(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle" | "currency">,
) {
  return `${formatNumber(value, settings)} ${settings.currency}`
}

export const monthNames = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
]

export function jalaliLabel(iso: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date(iso))
}

export function todayIso() {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

export function startOfCurrentMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isSameDay(a: string, b: Date) {
  return new Date(a).toDateString() === b.toDateString()
}

export function groupByDate(items: Transaction[]) {
  return items.reduce<Record<string, Transaction[]>>((acc, item) => {
    const key = jalaliLabel(item.date)
    ;(acc[key] ??= []).push(item)
    return acc
  }, {})
}

export async function exportBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: await db.transactions.toArray(),
    categories: await db.categories.toArray(),
    settings: await db.settings.get("app"),
  }
  return JSON.stringify(payload, null, 2)
}

export async function importBackup(
  payload: { transactions?: Transaction[]; categories?: Category[]; settings?: AppSettings },
  merge = false,
) {
  await db.transaction("rw", db.transactions, db.categories, db.settings, async () => {
    if (!merge) {
      await db.transactions.clear()
      await db.categories.clear()
    }
    if (payload.transactions?.length) await db.transactions.bulkPut(payload.transactions)
    if (payload.categories?.length) await db.categories.bulkPut(
      payload.categories.map(c => ({ ...c, icon: legacyIconMap[c.icon] ?? c.icon ?? "other" })),
    )
    if (payload.settings) await db.settings.put(payload.settings)
  })
}

export async function clearAll() {
  await db.transaction("rw", db.transactions, db.categories, db.settings, async () => {
    await db.transactions.clear()
    await db.categories.clear()
    await db.settings.clear()
  })
  await seedDatabase()
}

export async function getAll() {
  return {
    transactions: await db.transactions.orderBy("date").reverse().toArray(),
    categories: await db.categories.toArray(),
    settings: (await db.settings.get("app")) as AppSettings,
  }
}

export function uid() {
  return crypto.randomUUID()
}

export function filterPeriod(kind: string) {
  const now = new Date()
  const from = new Date(now)
  if (kind === "month") from.setDate(1)
  else if (kind === "last30") from.setDate(now.getDate() - 30)
  else if (kind === "year") from.setMonth(0, 1)
  else from.setFullYear(2000)
  from.setHours(0, 0, 0, 0)
  return from
}
export function formatCompact(
  value: number,
  settings: Pick<AppSettings, "digitStyle" | "separatorStyle">,
) {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const formatCompactValue = (value: number) => {
    const rounded = Number(value.toFixed(1));

    return toFa(
      String(rounded),
      settings.digitStyle,
    );
  };

  if (absValue >= 1_000_000_000_000) {
    return `${sign}${formatCompactValue(
      absValue / 1_000_000_000_000,
    )} تریلیون`;
  }

  if (absValue >= 1_000_000_000) {
    return `${sign}${formatCompactValue(
      absValue / 1_000_000_000,
    )} میلیارد`;
  }

  if (absValue >= 1_000_000) {
    return `${sign}${formatCompactValue(
      absValue / 1_000_000,
    )} میلیون`;
  }

  if (absValue >= 1_000) {
    return `${sign}${formatCompactValue(
      absValue / 1_000,
    )} هزار`;
  }

  return formatNumber(value, settings);
}

export function dayWord(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (isSameDay(iso, today)) return "امروز"
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(iso, yesterday)) return "دیروز"
  return jalaliLabel(iso)
}

export const defaultSettings: AppSettings = {
  id: "app",
  digitStyle: "fa",
  separatorStyle: "persian",
  currency: "تومان",
  mode: "system",
  preset: "green",
}

export type Screen = "home" | "transactions" | "analytics" | "categories" | "settings"
export type ChartPoint = { label: string; income: number; expense: number }
