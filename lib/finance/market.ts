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

