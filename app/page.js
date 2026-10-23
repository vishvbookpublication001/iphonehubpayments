'use client';

import { useState } from 'react';

export default function Home() {
  const [amount, setAmount] = useState('500');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, customerName }),
      });

      const data = await res.json();

      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        alert(data.error || "Payment initiation failed");
        setLoading(false);
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '40px', maxWidth: '400px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2>iPhone Hub Payments</h2>
      <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Customer Name:</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Enter Amount (₹):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px', background: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </main>
  );
}
