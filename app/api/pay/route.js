import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const body = await req.json();
    const amountVal = body.amount;
    const customerNameVal = body.customerName;

    const merchantId = process.env.JAZZ_MERCHANT_ID;
    const apiKey = process.env.JAZZ_API_KEY;

    if (!merchantId || !apiKey) {
      return NextResponse.json({ error: "Merchant credentials missing" }, { status: 400 });
    }

    const gatewayUrl = "https://jazpayss.org/api/public/v1/payin/create";
    const formattedAmount = Number(amountVal).toFixed(2);
    const orderNo = "ORD" + Date.now();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const host = req.headers.get("host") || "iphonehubpayments.vercel.app";
    const notifyUrl = "https://" + host + "/api/notify";

    const params = {
      amount: formattedAmount,
      customer_name: customerNameVal || "Customer",
      merchant_id: merchantId,
      notify_url: notifyUrl,
      order_no: orderNo,
      timestamp: timestamp
    };

    const str = "amount=" + params.amount + 
                "&customer_name=" + params.customer_name + 
                "&merchant_id=" + params.merchant_id + 
                "&notify_url=" + params.notify_url + 
                "&order_no=" + params.order_no + 
                "&timestamp=" + params.timestamp + 
                "&key=" + apiKey;

    const sign = crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
    params.sign = sign;

    const res = await fetch(gatewayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.code !== 0) {
      console.error("JazPays API Error:", data);
      return NextResponse.json({ error: data?.msg || "Gateway payment creation failed" }, { status: 400 });
    }

    const payUrl = data?.data?.pay_url;
    if (!payUrl) {
      return NextResponse.json({ error: "Pay URL not received from gateway" }, { status: 400 });
    }

    return NextResponse.json({ success: true, payUrl });

  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Gateway connection failed: " + error.message }, { status: 500 });
  }
}
