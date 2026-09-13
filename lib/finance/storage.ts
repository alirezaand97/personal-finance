import { db, seedDatabase } from "./db";
import type { Transaction, Category, AppSettings, Investment, InvestmentTransaction, InvestmentCategory } from "./types";

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

