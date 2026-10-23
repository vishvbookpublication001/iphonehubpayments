import crypto from 'crypto';

function generateSign(params, secretKey) {
  const filteredParams = Object.keys(params)
    .filter((key) => params[key] !== '' && params[key] !== null && key !== 'sign')
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  const queryString = Object.keys(filteredParams)
    .map((key) => key + '=' + filteredParams[key])
    .join('&');

  const stringSignTemp = queryString + '&key=' + secretKey;
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toLowerCase();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, name } = body;

    const merchant_id = process.env.JAZZ_MERCHANT_ID;
    const secret_key = process.env.JAZZ_API_KEY;

    if (!merchant_id || !secret_key) {
      return Response.json({ message: 'JazzPays keys missing in environment variables' }, { status: 400 });
    }

    const payload = {
      merchant_id: merchant_id,
      order_no: 'JAZZ_' + Date.now(),
      amount: parseFloat(amount).toFixed(2),
      redirect_url: 'https://iphonehubpayments.vercel.app/success',
      notify_url: 'https://iphonehubpayments.vercel.app/api/pay',
      customer_name: name || 'Customer',
      timestamp: Math.floor(Date.now() / 1000).toString(),
    };

    payload.sign = generateSign(payload, secret_key);

    const response = await fetch('https://jazpays.org/api/public/v1/payin/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      return Response.json({ message: 'Gateway Response Error: ' + responseText.substring(0, 100) }, { status: 500 });
    }

    const payUrl = result.data?.pay_url || result.data?.payment_url;

    if ((result.code === 0 || result.code === '0') && payUrl) {
      return Response.json({ paymentUrl: payUrl });
    } else {
      return Response.json({ message: result.msg || 'Gateway Error: ' + JSON.stringify(result) }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ message: 'Error: ' + error.message }, { status: 500 });
  }
}