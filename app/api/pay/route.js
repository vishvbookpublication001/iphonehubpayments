import { NextResponse } from 'next/server';
import crypto from 'crypto';

function generateSignature(params, secretKey) {
  const str = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== '' && params[k] !== null && params[k] !== undefined)
    .sort()
    .map((k) => k + '=' + params[k])
    .join('&') + '&key=' + secretKey;

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

    const gatewayUrl = "[https://jazpayss.org/api/public/v1/payin/create](https://jazpayss.org/api/public/v1/payin/create)"; 

    const formattedAmount = Number(amount).toFixed(2);
    const orderNo = "ORD" + Date.now();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const host = req.headers.get("host") || "iphonehubpayments.vercel.app";
    const notifyUrl = https://${host}/api/notify;

    const payload = {
      merchant_id: merchantId,
      order_no: orderNo,
      amount: formattedAmount,
      notify_url: notifyUrl,
      timestamp: timestamp,
      customer_name: customerName || "Customer",
    };

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

    if (!res.ok || data?.code !== 0) {
      console.error("JazPays API Error:", data);
      return NextResponse.json({ error: data?.msg || "Gateway payment creation failed" }, { status: 400 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Gateway connection failed: " + error.message }, { status: 500 });
  }
}
