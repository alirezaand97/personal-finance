import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

const UPSTREAM_URL =
  "https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data/latest-toman.json"

// نسخه‌ی کلید عوض شد تا کش قدیمی (با ساختار قبلی) سرو نشود
const CACHE_KEY = "market:quotes:v2"
const LOCK_KEY = "lock:market:quotes:v2"

const FRESH_TTL = 60 * 5          // ۵ دقیقه (منبع هر ۳۰ دقیقه آپدیت می‌شود)
const MAX_STALE_TTL = 60 * 60 * 6 // ۶ ساعت
const LOCK_TTL = 15

type Quote = {
  symbol: string
  name: string
  price: number
  unit: string
  change_percent: number
}

type Normalized = {
  updated_at: string | null
  gold: Quote[]
  currency: Quote[]
  crypto: Quote[]
}

type CachePayload = { data: Normalized; updatedAt: number }

function toQuote(d: any, usdRate?: number): Quote | null {
  if (!d?.symbol || !(Number(d.price) > 0)) return null
  let price = Number(d.price)
  let unit = "تومان"
  if (d.currency === "USD") {
    if (usdRate) price = Math.round(price * usdRate)
    else unit = "دلار"
  }
  return {
    symbol: d.symbol,
    name: d.name_fa || d.name_en || d.symbol,
    price,
    unit,
    change_percent: Number(d.change_pct) || 0,
  }
}

const isUsable = (d: any) =>
  d && d.stale !== true && !d.quality?.includes("ohlc_inconsistent")

function normalize(json: any): Normalized {
  const cats = json?.data?.categories
  if (!cats) throw new Error("Unexpected upstream format")

  const usdRate: number | undefined = cats.currency?.find(
    (d: any) => d.symbol === "USD_IRR_FREE",
  )?.price

  const pick = (items: any[] = [], usd?: number) =>
    items.filter(isUsable).map((d) => toQuote(d, usd)).filter(Boolean) as Quote[]

  return {
    updated_at: json?.data?.generated_at ?? null,
    // طلا + سکه + فلزات گران‌بها (انس طلا/نقره/...)
    gold: [
      ...pick(cats.gold),
      ...pick(cats.coin),
      ...pick(cats.precious_metal),
    ],
    // جفت‌ارزهای DIFF_* نرخ بین‌المللی هستند، نه تومان بازار آزاد
    currency: pick(
      (cats.currency ?? []).filter((d: any) => !d.symbol.startsWith("DIFF_")),
    ),
    // قیمت‌های دلاری با نرخ دلار آزاد به تومان تبدیل می‌شوند
    crypto: pick(cats.crypto, usdRate),
  }
}

async function fetchUpstream(): Promise<Normalized> {
  const res = await fetch(UPSTREAM_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Upstream error: ${res.status}`)
  const data = normalize(await res.json())
  const payload: CachePayload = { data, updatedAt: Date.now() }
  await redis.set(CACHE_KEY, payload, { ex: MAX_STALE_TTL })
  return data
}

export async function GET() {
  try {
    const now = Date.now()
    const cached = await redis.get<CachePayload>(CACHE_KEY)

    if (cached) {
      const age = (now - cached.updatedAt) / 1000

      if (age < FRESH_TTL) return NextResponse.json(cached.data)

      // قدیمی ولی قابل استفاده → سعی در آپدیت، در هر حالت داده‌ی فعلی برگردد
      const gotLock = await redis.set(LOCK_KEY, "1", { nx: true, ex: LOCK_TTL })
      if (gotLock) {
        try {
          return NextResponse.json(await fetchUpstream())
        } catch (err) {
          console.error("[Market] refresh failed:", err)
        } finally {
          await redis.del(LOCK_KEY)
        }
      }
      return NextResponse.json(cached.data)
    }

    // هیچ کشی نیست
    const gotLock = await redis.set(LOCK_KEY, "1", { nx: true, ex: LOCK_TTL })
    if (gotLock) {
      try {
        return NextResponse.json(await fetchUpstream())
      } finally {
        await redis.del(LOCK_KEY)
      }
    }

    await new Promise((r) => setTimeout(r, 700))
    const retry = await redis.get<CachePayload>(CACHE_KEY)
    if (retry) return NextResponse.json(retry.data)

    return NextResponse.json(
      { error: "در حال بارگذاری قیمت‌ها، لطفاً چند ثانیه دیگر تلاش کنید" },
      { status: 503 },
    )
  } catch (error) {
    console.error("[Market] خطای کلی:", error)
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 })
  }
}
