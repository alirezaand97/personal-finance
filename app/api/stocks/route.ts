import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const key = "BzVjULCeXyGJSV2YmbnwSbJXN94bt6aQ"

  if (!key) {
    return NextResponse.json(
      { error: "کلید API تنظیم نشده (BRSAPI_KEY را در .env.local قرار دهید)" },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(
      `https://api.brsapi.ir/Tsetmc/AllSymbols.php?key=${key}&type=1`,
      { cache: "no-store" },
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: "خطا در دریافت از سرور بورس" },
        { status: 502 },
      )
    }

    const data = await res.json()

    // نکته: اگر پاسخ واقعی API به‌جای آرایه مستقیم، داخل یک فیلد مثل
    // data.symbols یا data.data باشد، همین‌جا استخراجش کنید، مثلا:
    // return NextResponse.json(data.symbols ?? data)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "خطا در ارتباط با سرور بورس" },
      { status: 500 },
    )
  }
}