import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

const CACHE_KEY = "stocks:all"
const LOCK_KEY = "lock:stocks:all"

const FRESH_TTL = 60 * 2          // ۱۰ دقیقه
const MAX_STALE_TTL = 60 * 60      // ۱ ساعت
const LOCK_TTL = 15

type CachePayload = {
  data: any
  updatedAt: number
}

export async function GET() {
  const apiKey = process.env.BRSAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "کلید API تنظیم نشده" }, { status: 500 })
  }

  try {
    const now = Date.now()
    const cached = await redis.get<CachePayload>(CACHE_KEY)

    if (cached) {
      const age = (now - cached.updatedAt) / 1000

      // هنوز تازه است
      if (age < FRESH_TTL) {
        return NextResponse.json(cached.data)
      }

      // قدیمی شده ولی هنوز قابل استفاده است
      if (age < MAX_STALE_TTL) {
        const gotLock = await redis.set(LOCK_KEY, "1", { nx: true, ex: LOCK_TTL })

        if (gotLock) {
          try {
            const res = await fetch(
              `https://api.brsapi.ir/Tsetmc/AllSymbols.php?key=${apiKey}&type=1`,
              { cache: "no-store" },
            )

            if (res.ok) {
              const data = await res.json()
              const payload: CachePayload = {
                data,
                updatedAt: Date.now(),
              }
              await redis.set(CACHE_KEY, payload, { ex: MAX_STALE_TTL })
            }
          } catch (err) {
            console.error("Background refresh failed:", err)
          } finally {
            await redis.del(LOCK_KEY)
          }
        }

        return NextResponse.json(cached.data)
      }
    }

    // هیچ داده‌ای وجود ندارد
    const gotLock = await redis.set(LOCK_KEY, "1", { nx: true, ex: LOCK_TTL })

    if (gotLock) {
      try {
        const res = await fetch(
          `https://api.brsapi.ir/Tsetmc/AllSymbols.php?key=${apiKey}&type=1`,
          { cache: "no-store" },
        )

        if (!res.ok) {
          throw new Error("Upstream error")
        }

        const data = await res.json()
        const payload: CachePayload = {
          data,
          updatedAt: Date.now(),
        }

        await redis.set(CACHE_KEY, payload, { ex: MAX_STALE_TTL })
        return NextResponse.json(data)
      } finally {
        await redis.del(LOCK_KEY)
      }
    }

    // صبر کوتاه و تلاش مجدد
    await new Promise((r) => setTimeout(r, 700))
    const retry = await redis.get<CachePayload>(CACHE_KEY)

    if (retry) {
      return NextResponse.json(retry.data)
    }

    return NextResponse.json(
      { error: "در حال بارگذاری قیمت‌ها، لطفاً چند ثانیه دیگر تلاش کنید" },
      { status: 503 },
    )
  } catch (error) {
    console.error("Stocks API error:", error)
    return NextResponse.json({ error: "خطا در ارتباط با سرور بورس" }, { status: 500 })
  }
}