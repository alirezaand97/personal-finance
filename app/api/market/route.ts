import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

const CACHE_KEY = "market:quotes"
const LOCK_KEY = "lock:market:quotes"

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

    // ---------- لاگ وضعیت کش ----------
    if (cached) {
      const ageSeconds = Math.round((now - cached.updatedAt) / 1000)
      console.log(`[Market] کش پیدا شد | سن داده: ${ageSeconds} ثانیه`)
    } else {
      console.log(`[Market] هیچ کشی وجود ندارد`)
    }

    // اگر داده وجود داشت
    if (cached) {
      const age = (now - cached.updatedAt) / 1000

      // هنوز تازه است
      if (age < FRESH_TTL) {
        console.log(`[Market] ✅ داده تازه است → از کش برگردانده شد`)
        return NextResponse.json(cached.data)
      }

      // قدیمی شده ولی هنوز قابل استفاده است
      if (age < MAX_STALE_TTL) {
        console.log(`[Market] ⚠️ داده قدیمی شده (Stale) → سعی می‌کنم آپدیت کنم`)

        const gotLock = await redis.set(LOCK_KEY, "1", { nx: true, ex: LOCK_TTL })

        if (gotLock) {
          console.log(`[Market] 🔒 قفل گرفته شد → دارم از API خارجی درخواست می‌زنم...`)

          try {
            const res = await fetch(
              `https://Api.BrsApi.ir/Market/Gold_Currency.php?key=${apiKey}`,
              { cache: "no-store" },
            )

            if (res.ok) {
              const data = await res.json()
              const payload: CachePayload = {
                data,
                updatedAt: Date.now(),
              }
              await redis.set(CACHE_KEY, payload, { ex: MAX_STALE_TTL })
              console.log(`[Market] ✅ داده جدید گرفته و در کش ذخیره شد`)
            } else {
              console.log(`[Market] ❌ درخواست به API خارجی ناموفق بود (status: ${res.status})`)
            }
          } catch (err) {
            console.error(`[Market] ❌ خطا در گرفتن داده جدید:`, err)
          } finally {
            await redis.del(LOCK_KEY)
            console.log(`[Market] 🔓 قفل آزاد شد`)
          }
        } else {
          console.log(`[Market] ⏳ قفل گرفته نشد (یکی دیگر در حال آپدیت است) → داده قدیمی برگردانده شد`)
        }

        // در هر صورت داده فعلی را برگردان
        return NextResponse.json(cached.data)
      }
    }

    // هیچ داده‌ای وجود ندارد یا خیلی قدیمی شده
    console.log(`[Market] 🆕 هیچ داده معتبری وجود ندارد → باید از صفر بگیرم`)

    const gotLock = await redis.set(LOCK_KEY, "1", { nx: true, ex: LOCK_TTL })

    if (gotLock) {
      console.log(`[Market] 🔒 قفل گرفته شد → دارم از API خارجی درخواست می‌زنم...`)

      try {
        const res = await fetch(
          `https://Api.BrsApi.ir/Market/Gold_Currency.php?key=${apiKey}`,
          { cache: "no-store" },
        )

        if (!res.ok) {
          throw new Error(`Upstream error: ${res.status}`)
        }

        const data = await res.json()
        const payload: CachePayload = {
          data,
          updatedAt: Date.now(),
        }

        await redis.set(CACHE_KEY, payload, { ex: MAX_STALE_TTL })
        console.log(`[Market] ✅ داده جدید گرفته و در کش ذخیره شد`)

        return NextResponse.json(data)
      } finally {
        await redis.del(LOCK_KEY)
        console.log(`[Market] 🔓 قفل آزاد شد`)
      }
    }

    // قفل گرفته نشد
    console.log(`[Market] ⏳ قفل گرفته نشد → کمی صبر می‌کنم...`)
    await new Promise((r) => setTimeout(r, 700))

    const retry = await redis.get<CachePayload>(CACHE_KEY)
    if (retry) {
      console.log(`[Market] ✅ بعد از صبر، داده پیدا شد → برگردانده شد`)
      return NextResponse.json(retry.data)
    }

    console.log(`[Market] ❌ بعد از صبر هم داده‌ای پیدا نشد`)
    return NextResponse.json(
      { error: "در حال بارگذاری قیمت‌ها، لطفاً چند ثانیه دیگر تلاش کنید" },
      { status: 503 },
    )
  } catch (error) {
    console.error("[Market] خطای کلی:", error)
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 })
  }
}