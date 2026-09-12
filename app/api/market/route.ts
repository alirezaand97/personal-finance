import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const key = "BzVjULCeXyGJSV2YmbnwSbJXN94bt6aQ"

  if (!key) {
    return NextResponse.json(
      { error: "کلید API تنظیم نشده" },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(
      `https://Api.BrsApi.ir/Market/Gold_Currency.php?key=${key}`,
      { cache: "no-store" },
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: "خطا در دریافت اطلاعات بازار" },
        { status: 502 },
      )
    }

    const data = await res.json()

    // نکته: اگر شکل واقعی پاسخ فرق داشت (مثلاً داخل data.data بود)
    // همین‌جا استخراجش کن: return NextResponse.json(data.data ?? data)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "خطا در ارتباط با سرور" },
      { status: 500 },
    )
  }
}