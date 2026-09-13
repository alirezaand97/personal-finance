import Dexie, { type Table } from "dexie";
import {
  defaultInvestmentCategories,
  expenseCategories,
  incomeCategories,
  legacyIconMap,
  type AppSettings,
  type Category,
  type Transaction,
  type Investment,
  type InvestmentCategory,
  type InvestmentTransaction,
  type StockQuote,
  type StockSyncMeta,
  type MarketQuote,
  type MarketSyncMeta,
  type PortfolioSnapshot,
} from "./types";

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

