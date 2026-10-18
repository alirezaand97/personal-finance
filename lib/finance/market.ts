import type { MarketKind, MarketQuote } from "./types";

import { db } from "./db";

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
    updated_at?: string | null
    gold?: any[]
    currency?: any[]
    crypto?: any[]
  } = await res.json()

  const now = new Date().toISOString()
  const quotes: MarketQuote[] = []

  const push = (market: MarketKind, items: any[] = []) => {
    items.forEach((d) => {
      if (!d?.symbol) return
      quotes.push({
        id: `${market}:${d.symbol}`,
        market,
        symbol: d.symbol,
        name: d.name ?? d.symbol,
        price: Number(d.price) || 0,
        unit: d.unit ?? "تومان",
        changePercent: Number(d.change_percent) || 0,
        updatedAt: now,
      })
    })
  }

  push("gold", raw.gold)
  push("currency", raw.currency)
  push("crypto", raw.crypto)

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

