import { db } from "./db";

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
