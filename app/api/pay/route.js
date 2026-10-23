import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { amount, customerName } = await req.json();

    const merchantId = process.env.JAZZ_MERCHANT_ID;
    const apiKey = process.env.JAZZ_API_KEY;

    if (!merchantId || !apiKey) {
      return NextResponse.json({ error: "API Credentials Missing" }, { status: 400 });
    }

    // JazzPays Gateway API Endpoint (Apna exact Endpoint URL yahan check karke daalo)
    const res = await fetch("https://jazzpays.com/api/create-order", { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-ID": merchantId,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        api_key: apiKey,
        amount: Number(amount),
        customer_name: customerName,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "Gateway response error: " + errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Gateway connection failed: " + error.message }, { status: 500 });
  }
}
