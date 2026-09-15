import type { DigitStyle, StockQuote } from "./types";

import { db } from "./db";
import { toFa } from "./formatting";

/*  بخش قیمت زنده سهام (Stock Quotes)                                     */
/* ---------------------------------------------------------------------- */



/**
 * آیا از ساعت ۸ صبح تا ۸ عصر هستیم و حداقل یک ساعت از آخرین سینک گذشته؟
 * خارج از این بازه (قبل از ۸ یا بعد از ۲۰) سینک لازم نیست.
 */
export function needsStockSync(lastSyncedAt?: string) {
  const now = new Date()
  const hour = now.getHours()
  
  // فقط در ساعات بازار (اختیاری - اگر می‌خوای همیشه آپدیت بشه این شرط رو بردار)
  if (hour < 8 || hour >= 20) return false

  if (!lastSyncedAt) return true
  
  const diffMs = now.getTime() - new Date(lastSyncedAt).getTime()
  return diffMs >= 2 * 60 * 1000   // ← ۵ دقیقه
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


