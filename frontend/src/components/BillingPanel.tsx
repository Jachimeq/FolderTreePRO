"use client";

import { useState } from "react";

export default function BillingPanel() {
  const [plan, setPlan] = useState<'free'|'pro'>('free');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Could not create checkout session');
      }
    } catch (err) {
      console.error(err);
      alert('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-2">Billing & Plans</h3>
      <p className="text-sm text-gray-600 mb-4">Choose a plan that fits your workflow. Upgrading enables team features, priority AI access, and more.</p>

      <div className="flex gap-4 mb-4">
        <label className={`p-4 rounded-lg border w-full cursor-pointer ${plan === 'free' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`} onClick={() => setPlan('free')}>
          <div className="text-lg font-medium">Free</div>
          <div className="text-sm text-gray-600">Basic features, individual use</div>
        </label>

        <label className={`p-4 rounded-lg border w-full cursor-pointer ${plan === 'pro' ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`} onClick={() => setPlan('pro')}>
          <div className="text-lg font-medium">Pro — $9 / month</div>
          <div className="text-sm text-gray-600">Priority AI, team sharing, advanced rules</div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleCheckout} className="btn-primary" disabled={loading}>
          {loading ? 'Redirecting…' : plan === 'pro' ? 'Upgrade to Pro' : 'Current plan: Free'}
        </button>
        <button type="button" onClick={() => alert('Manage payment method coming soon')} className="btn-secondary">Manage payment method</button>
      </div>
    </div>
  );
}
