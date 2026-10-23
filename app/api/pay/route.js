import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Signature generation according to JazPays Docs
function generateSignature(params, secretKey) {
  const str = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== '' && params[k] !== null && params[k] !== undefined)
    .sort()
    .map((k) => ${k}=${params[k]})
    .join('&') + &key=${secretKey};

  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

export async function POST(req) {
  try {
    const { amount, customerName } = await req.json();

    const merchantId = process.env.JAZZ_MERCHANT_ID;
    const apiKey = process.env.JAZZ_API_KEY;

    if (!merchantId || !apiKey) {
      return NextResponse.json({ error: "Merchant credentials missing in Environment Variables" }, { status: 400 });
    }

    // Exact Base URL from Documentation
    const gatewayUrl = "https://jazpayss.org/api/public/v1/payin"; 

    // Formatting amount to 2 decimal places (e.g., "500.00")
    const formattedAmount = Number(amount).toFixed(2);

    const payload = {
      merchant_id: merchantId,
      amount: formattedAmount,
      customer_name: customerName || "Customer",
    };

    // Calculate Signature using Pay-in API Key
    payload.sign = generateSignature(payload, apiKey);

    console.log("Sending payload to JazPays:", payload);

    const res = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("JazPays API Error:", data);
      return NextResponse.json({ error: data?.message || "Gateway payment creation failed" }, { status: res.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Gateway connection failed: " + error.message }, { status: 500 });
  }
}
