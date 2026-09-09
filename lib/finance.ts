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
  icon: string
  color: string
  monthlyBudget?: number
  createdAt: string
}

export type InvestmentCategory = {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
}

/** نوع دارایی؛ خود دارایی دیگر خرید/فروش نیست. */
export type InvestmentUnit = "piece" | "gram" | "share" | "unit"

export type Investment = {
  id: string
  name: string
  categoryId: string
  unit: InvestmentUnit
  /** قیمت فعلی هر واحد برای محاسبه ارزش روز */
  currentPrice: number
  createdAt: string
  updatedAt: string
}

export type InvestmentTransactionKind =
  | "buy"
  | "sell"
  | "dividend"
  | "fee"

export type InvestmentTransaction = {
  id: string
  investmentId: string
  kind: InvestmentTransactionKind
  /** تعداد/حجم دارایی؛ برای dividend و fee می‌تواند 0 باشد. */
  quantity: number
  /** قیمت هر واحد؛ برای dividend و fee می‌تواند 0 باشد. */
  unitPrice: number
  /** مبلغ نهایی تراکنش */
  amount: number
  date: string
  note: string
  createdAt: string
  updatedAt: string
}

export const defaultInvestmentCategories = [
  ["سهام", "stock"],
  ["ارز دیجیتال", "crypto"],
  ["طلا و سکه", "gold"],
  ["صندوق سرمایه‌گذاری", "fund"],
  ["املاک", "realestate"],
  ["سایر", "other"],
] as const

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
  ["سود سرمایه‌گذاری", "investment"],
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
  investments!: Table<Investment, string>
  investmentTransactions!: Table<InvestmentTransaction, string>
  investmentCategories!: Table<InvestmentCategory, string>

  constructor() {
    super("hamrah-finance")

    this.version(1).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
    })

    this.version(2).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
      investments: "id, type, date, createdAt",
    })

    this.version(3).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
      investments: "id, categoryId, date, createdAt",
      investmentCategories: "id, createdAt",
    })

    this.version(4).stores({
      transactions: "id, type, date, categoryId, createdAt",
      categories: "id, type",
      settings: "id",
      investments: "id, categoryId, kind, date, createdAt",
      investmentCategories: "id, createdAt",
    })

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
        await tx.table("investments").clear()
        await tx.table("investmentTransactions").clear()

        const categoriesTable = tx.table("investmentCategories")
        if ((await categoriesTable.count()) === 0) {
          const now = new Date().toISOString()
          await categoriesTable.bulkAdd(
            defaultInvestmentCategories.map(([name, icon]) => ({
              id: crypto.randomUUID(),
              name,
              icon,
              color: "",
              createdAt: now,
            })),
          )
        }
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

    if ((await db.investmentCategories.count()) === 0) {
      const now = new Date().toISOString()
      await db.investmentCategories.bulkAdd(
        defaultInvestmentCategories.map(([name, icon]) => ({
          id: crypto.randomUUID(),
          name,
          icon,
          color: "",
          createdAt: now,
        })),
      )
    }
    return
  }

  const now = new Date().toISOString()
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
  ]

  const investmentCategories: InvestmentCategory[] =
    defaultInvestmentCategories.map(([name, icon]) => ({
      id: crypto.randomUUID(),
      name,
      icon,
      color: "",
      createdAt: now,
    }))

  await db.transaction(
    "rw",
    db.categories,
    db.settings,
    db.investmentCategories,
    async () => {
      await db.categories.bulkAdd(categories)
      await db.investmentCategories.bulkAdd(investmentCategories)
      await db.settings.add({
        id: "app",
        digitStyle: "fa",
        separatorStyle: "persian",
        currency: "تومان",
        mode: "system",
        preset: "green",
      })
    },
  )
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
  const separated =
    settings.separatorStyle === "persian" ? raw.replace(/,/g, "٬") : raw
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
    version: 2,
    exportedAt: new Date().toISOString(),
    transactions: await db.transactions.toArray(),
    categories: await db.categories.toArray(),
    settings: await db.settings.get("app"),
    investments: await db.investments.toArray(),
    investmentTransactions: await db.investmentTransactions.toArray(),
    investmentCategories: await db.investmentCategories.toArray(),
  }
  return JSON.stringify(payload, null, 2)
}

export async function importBackup(
  payload: {
    transactions?: Transaction[]
    categories?: Category[]
    settings?: AppSettings
    investments?: Investment[]
    investmentTransactions?: InvestmentTransaction[]
    investmentCategories?: InvestmentCategory[]
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
  await seedDatabase()
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
  const absValue = Math.abs(value)
  const sign = value < 0 ? "-" : ""

  const formatCompactValue = (value: number) => {
    const rounded = Number(value.toFixed(1))
    return toFa(String(rounded), settings.digitStyle)
  }

  if (absValue >= 1_000_000_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000_000_000)} تریلیون`

  if (absValue >= 1_000_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000_000)} میلیارد`

  if (absValue >= 1_000_000)
    return `${sign}${formatCompactValue(absValue / 1_000_000)} میلیون`

  if (absValue >= 1_000)
    return `${sign}${formatCompactValue(absValue / 1_000)} هزار`

  return formatNumber(value, settings)
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

export type Screen =
  | "home"
  | "transactions"
  | "analytics"
  | "categories"
  | "settings"

export type ChartPoint = {
  label: string
  income: number
  expense: number
}
