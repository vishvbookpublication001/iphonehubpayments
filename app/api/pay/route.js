import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, customerName } = body;

    const merchantId = process.env.JAZZ_MERCHANT_ID;
    const apiKey = process.env.JAZZ_API_KEY;

    // Check if variables are properly loaded
    if (!merchantId || !apiKey) {
      console.error("Missing Credentials:", { merchantId, apiKey });
      return NextResponse.json(
        { error: "Merchant credentials are missing in Environment Variables" }, 
        { status: 400 }
      );
    }

    // Call JazzPays Gateway API
    const response = await fetch("https://jazzpays.com/api/v1/pay", { // Check your exact JazzPays endpoint URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-merchant-id": merchantId,
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        api_key: apiKey,
        amount: Number(amount),
        customer_name: customerName || "Customer",
        redirect_url: "https://iphonehubpayments.vercel.app"
      }),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("JazzPays API error details:", responseData);
      return NextResponse.json(
        { error: responseData?.message || "Payment Gateway Server Error" }, 
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);

  } catch (err) {
    console.error("Server Catch Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to connect to Payment Gateway" }, 
      { status: 500 }
    );
  }
}
