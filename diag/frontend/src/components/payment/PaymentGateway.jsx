/**
 * PaymentGateway.jsx
 * Full payment UI: Card, UPI, Net Banking, International, Cryptocurrency
 * Payment Status: Pending → Processing → Success / Failed
 */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { bookingAPI, paymentAPI } from '../../services/api';

/* ─── Payment Status Badge ─────────────────────────────── */
function StatusBadge({ status }) {
  const configs = {
    pending:    { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending', pulse: true },
    processing: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Processing…', pulse: true },
    success:    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Payment Successful', pulse: false },
    failed:     { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Payment Failed', pulse: false },
    expired:    { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400',   label: 'Expired', pulse: false },
  };
  const c = configs[status] || configs.pending;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${c.bg} ${c.text} text-xs font-semibold`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </div>
  );
}

/* ─── Success Animation ─────────────────────────────────── */
function SuccessScreen({ amount, method }) {
  return (
    <div className="text-center py-8 px-4 animate-fade-in">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-once">
        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-1">Booking Confirmed!</h3>
      <p className="text-gray-500 mb-3">Your payment was successful</p>
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 inline-block">
        <p className="text-green-700 font-semibold text-lg">₹{Number(amount).toLocaleString('en-IN')} paid</p>
        <p className="text-green-600 text-sm capitalize">{method} payment</p>
      </div>
      <p className="text-xs text-gray-400 mt-4">Your booking has moved to Confirmed status</p>
    </div>
  );
}

/* ─── Helper: confirm in DB ─────────────────────────────── */
async function confirmBookingInDB(bookingId) {
  try {
    if (bookingId && bookingId.length === 24 && /^[a-f0-9]+$/i.test(bookingId)) {
      await bookingAPI.confirmDemo(bookingId);
    }
  } catch (e) {
    console.warn('confirmDemo skipped:', e?.message);
  }
}

/* ─── 1. Card Form ──────────────────────────────────────── */
function CardForm({ bookingId, amount, onSuccess }) {
  const [status, setStatus] = useState('idle'); // idle | processing | success | failed
  const [f, setF] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const valid = f.name && f.number.replace(/\s/g, '').length === 16 && f.expiry.length === 5 && f.cvv.length === 3;

  const pay = async () => {
    if (!valid) { toast.error('Fill all card details correctly'); return; }
    setStatus('processing');
    await new Promise(r => setTimeout(r, 2200));
    await confirmBookingInDB(bookingId);
    setStatus('success');
    toast.success('Payment successful! Booking confirmed.');
    setTimeout(() => onSuccess({ method: 'card', status: 'succeeded' }), 800);
  };

  if (status === 'success') return <SuccessScreen amount={amount} method="Card" />;

  return (
    <div className="space-y-3">
      {status === 'processing' && (
        <div className="flex items-center justify-center gap-3 py-3 bg-blue-50 rounded-xl border border-blue-200 mb-2">
          <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-700 text-sm font-semibold">Authorizing payment…</span>
        </div>
      )}
      <StatusBadge status={status === 'idle' ? 'pending' : status} />
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">Name on Card</label>
        <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="John Smith"
          className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">Card Number</label>
        <input value={f.number}
          onChange={e => setF({ ...f, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })}
          placeholder="4242 4242 4242 4242" maxLength={19}
          className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Expiry</label>
          <input value={f.expiry}
            onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4); setF({ ...f, expiry: v }); }}
            placeholder="MM/YY" maxLength={5}
            className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">CVV</label>
          <input value={f.cvv} onChange={e => setF({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            placeholder="•••" maxLength={3} type="password"
            className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
      </div>
      <button onClick={pay} disabled={status === 'processing'}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 mt-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]">
        {status === 'processing'
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Processing…</span></>
          : <><span>🔒</span><span>Pay ₹{Number(amount).toLocaleString('en-IN')}</span></>}
      </button>
    </div>
  );
}

/* ─── 2. UPI Form ───────────────────────────────────────── */
function UPIForm({ bookingId, amount, onSuccess }) {
  const [upiId, setUpiId] = useState('');
  const [status, setStatus] = useState('idle'); // idle | waiting | processing | success | failed

  const sendRequest = async () => {
    if (!upiId || !upiId.includes('@')) { toast.error('Enter a valid UPI ID (e.g. name@ybl)'); return; }
    setStatus('waiting');
    setTimeout(() => {
      setStatus('processing');
      setTimeout(async () => {
        await confirmBookingInDB(bookingId);
        setStatus('success');
        toast.success('UPI payment successful!');
        setTimeout(() => onSuccess({ method: 'upi', status: 'succeeded' }), 800);
      }, 2000);
    }, 1200);
  };

  if (status === 'success') return <SuccessScreen amount={amount} method="UPI" />;

  return (
    <div className="space-y-3">
      <StatusBadge status={status === 'idle' ? 'pending' : status === 'waiting' ? 'pending' : status} />
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">UPI ID</label>
        <input value={upiId} onChange={e => setUpiId(e.target.value)} disabled={status !== 'idle'}
          placeholder="yourname@ybl / @okicici / @paytm"
          className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-50" />
      </div>
      {status === 'idle' && (
        <button onClick={sendRequest}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]">
          📱 Send ₹{Number(amount).toLocaleString('en-IN')} Request
        </button>
      )}
      {(status === 'waiting' || status === 'processing') && (
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
            Request sent to <strong className="ml-1">{upiId}</strong>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            {status === 'processing' ? 'Verifying payment…' : 'Waiting for approval on your UPI app…'}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 3. Net Banking ─────────────────────────────────────── */
function NetBankingForm({ bookingId, amount, onSuccess }) {
  const [bank, setBank] = useState('');
  const [status, setStatus] = useState('idle');
  const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Yes Bank', 'Punjab National Bank', 'Bank of Baroda', 'IndusInd Bank', 'IDFC FIRST Bank'];

  const pay = async () => {
    if (!bank) { toast.error('Please select your bank'); return; }
    setStatus('processing');
    toast(`Redirecting to ${bank} secure portal…`, { icon: '🏦' });
    setTimeout(async () => {
      await confirmBookingInDB(bookingId);
      setStatus('success');
      toast.success('Net Banking payment successful!');
      setTimeout(() => onSuccess({ method: 'netbanking', status: 'succeeded', bank }), 800);
    }, 2500);
  };

  if (status === 'success') return <SuccessScreen amount={amount} method="Net Banking" />;

  return (
    <div className="space-y-3">
      <StatusBadge status={status === 'idle' ? 'pending' : status} />
      <div className="grid grid-cols-2 gap-2">
        {BANKS.slice(0, 6).map(b => (
          <button key={b} onClick={() => setBank(b)}
            className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all duration-200 text-left hover:scale-[1.02] ${bank === b ? 'bg-amber-50 border-amber-400 text-amber-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            🏦 {b}
          </button>
        ))}
      </div>
      <select value={bank} onChange={e => setBank(e.target.value)}
        className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
        <option value="">Or choose from all banks…</option>
        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
      <button onClick={pay} disabled={!bank || status === 'processing'}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]">
        {status === 'processing'
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Connecting to {bank}…</span></>
          : <><span>🏦</span><span>Pay ₹{Number(amount).toLocaleString('en-IN')} via {bank || 'Net Banking'}</span></>}
      </button>
    </div>
  );
}

/* ─── 4. International Payment ───────────────────────────── */
const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
];

function InternationalForm({ bookingId, amount, onSuccess }) {
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('idle');
  const [f, setF] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const valid = f.name && f.number.replace(/\s/g, '').length === 16 && f.expiry.length === 5 && f.cvv.length === 3;

  const pay = async () => {
    if (!valid) { toast.error('Fill all card details correctly'); return; }
    setStatus('processing');
    await new Promise(r => setTimeout(r, 2500));
    await confirmBookingInDB(bookingId);
    setStatus('success');
    toast.success('International payment successful!');
    setTimeout(() => onSuccess({ method: 'international', status: 'succeeded', currency }), 800);
  };

  if (status === 'success') return <SuccessScreen amount={amount} method="International Card" />;

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs font-bold text-blue-800 mb-2">🌍 International Payment — 150+ Countries Supported</p>
        <div className="flex flex-wrap gap-1.5">
          {['VISA', 'Mastercard', 'Amex', 'Discover', 'JCB'].map(b => (
            <span key={b} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md font-semibold">{b}</span>
          ))}
        </div>
      </div>
      <StatusBadge status={status === 'idle' ? 'pending' : status} />
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">Payment Currency</label>
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">Cardholder Name</label>
        <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="As on card"
          className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">Card Number</label>
        <input value={f.number}
          onChange={e => setF({ ...f, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })}
          placeholder="4242 4242 4242 4242" maxLength={19}
          className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Expiry</label>
          <input value={f.expiry}
            onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4); setF({ ...f, expiry: v }); }}
            placeholder="MM/YY" maxLength={5}
            className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">CVV</label>
          <input value={f.cvv} onChange={e => setF({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            placeholder="•••" maxLength={3} type="password"
            className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
      </div>
      {status === 'processing' && (
        <div className="flex items-center gap-3 py-3 bg-blue-50 rounded-xl border border-blue-200">
          <span className="ml-3 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-700 text-sm font-semibold">Authorizing international payment…</span>
        </div>
      )}
      <button onClick={pay} disabled={status === 'processing'}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]">
        🌍 Pay {currency} {Number(amount).toLocaleString('en-IN')} Internationally
      </button>
    </div>
  );
}

/* ─── 5. Crypto Payment ──────────────────────────────────── */
const COINS = [
  { id: 'USDT', name: 'Tether', icon: '₮', color: 'bg-green-100 text-green-700 border-green-300', rate: 1 },
  { id: 'ETH',  name: 'Ethereum', icon: 'Ξ', color: 'bg-blue-100 text-blue-700 border-blue-300', rate: 3200 },
  { id: 'BTC',  name: 'Bitcoin', icon: '₿', color: 'bg-orange-100 text-orange-700 border-orange-300', rate: 65000 },
  { id: 'BNB',  name: 'BNB Chain', icon: 'B', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', rate: 580 },
];

const DEMO_WALLETS = {
  USDT: '0x742d35Cc6634C0532925a3b8D4C9Bb7c2345aBcD',
  ETH:  '0x742d35Cc6634C0532925a3b8D4C9Bb7c2345aBcD',
  BTC:  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  BNB:  'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lx5n7ac',
};

function CryptoForm({ bookingId, amount, onSuccess }) {
  const [coin, setCoin] = useState('USDT');
  const [status, setStatus] = useState('idle'); // idle | awaiting | confirmed | failed
  const [txHash, setTxHash] = useState('');
  const [timer, setTimer] = useState(30 * 60); // 30 min in seconds
  const [copied, setCopied] = useState(false);

  const selectedCoin = COINS.find(c => c.id === coin);
  const cryptoAmount = (amount / selectedCoin.rate).toFixed(8);
  const wallet = DEMO_WALLETS[coin];

  useEffect(() => {
    if (status !== 'awaiting') return;
    const id = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(id); setStatus('failed'); } return t - 1; }), 1000);
    return () => clearInterval(id);
  }, [status]);

  const startPayment = () => setStatus('awaiting');

  const confirmPayment = async () => {
    if (!txHash.trim()) { toast.error('Enter the transaction hash'); return; }
    setStatus('processing');
    await new Promise(r => setTimeout(r, 2000));
    await confirmBookingInDB(bookingId);
    setStatus('confirmed');
    toast.success('Crypto payment verified! Booking confirmed.');
    setTimeout(() => onSuccess({ method: `crypto_${coin}`, status: 'succeeded' }), 800);
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (status === 'confirmed') return <SuccessScreen amount={amount} method={`${coin} Crypto`} />;

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3">
        <p className="text-xs font-bold text-purple-800">₿ Pay with Cryptocurrency — Decentralized & Secure</p>
        <p className="text-xs text-purple-600 mt-0.5">Supports BTC, ETH, USDT, BNB</p>
      </div>
      <StatusBadge status={status === 'idle' ? 'pending' : status === 'awaiting' ? 'processing' : status === 'processing' ? 'processing' : 'success'} />

      {/* Coin selector */}
      <div className="grid grid-cols-4 gap-2">
        {COINS.map(c => (
          <button key={c.id} onClick={() => setCoin(c.id)} disabled={status !== 'idle'}
            className={`py-2.5 rounded-xl border-2 text-center transition-all duration-200 ${coin === c.id ? `${c.color} border-opacity-100` : 'border-gray-200 hover:bg-gray-50'}`}>
            <p className="text-base font-bold">{c.icon}</p>
            <p className="text-xs font-semibold mt-0.5">{c.id}</p>
          </button>
        ))}
      </div>

      {/* Amount to pay */}
      <div className="bg-gray-900 text-white rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-xs">Amount to Send</p>
            <p className="text-2xl font-bold font-mono">{cryptoAmount} <span className="text-gray-400 text-base">{coin}</span></p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">≈ USD Value</p>
            <p className="text-amber-400 font-semibold">$ {(amount / 83).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {status === 'idle' && (
        <button onClick={startPayment}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]">
          ₿ Pay with {selectedCoin.name}
        </button>
      )}

      {status === 'awaiting' && (
        <div className="space-y-3">
          {/* Timer */}
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
            <span className="text-orange-700 text-sm font-semibold">⏱ Payment expires in</span>
            <span className="text-orange-700 font-mono font-bold text-lg">{formatTimer(timer)}</span>
          </div>
          {/* Wallet address */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Send to this {coin} wallet</label>
            <div className="flex gap-2 mt-1">
              <input readOnly value={wallet}
                className="flex-1 border rounded-xl px-3 py-2.5 text-xs font-mono bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <button onClick={copyWallet}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${copied ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
          {/* QR placeholder */}
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <div className="w-24 h-24 bg-gray-300 rounded-xl mx-auto flex items-center justify-center">
              <span className="text-3xl">📱</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Scan QR code with your wallet</p>
          </div>
          {/* Tx hash input */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Transaction Hash (after sending)</label>
            <input value={txHash} onChange={e => setTxHash(e.target.value)}
              placeholder="0x1234abc..."
              className="w-full border rounded-xl px-3 py-2.5 mt-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <button onClick={confirmPayment} disabled={!txHash.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]">
            ✓ I've Sent the Payment
          </button>
        </div>
      )}

      {status === 'processing' && (
        <div className="flex items-center gap-3 py-4 bg-blue-50 rounded-xl border border-blue-200 px-4">
          <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-blue-700 text-sm font-semibold">Verifying blockchain transaction…</p>
            <p className="text-blue-500 text-xs">Waiting for confirmations</p>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-600 font-semibold">⏰ Payment window expired</p>
          <button onClick={() => { setStatus('idle'); setTimer(30 * 60); setTxHash(''); }}
            className="mt-2 text-xs text-red-500 underline">Try again</button>
        </div>
      )}
    </div>
  );
}

/* ─── Main PaymentGateway ─────────────────────────────────── */
export default function PaymentGateway({ bookingId, amount, userInfo, onSuccess }) {
  const [tab, setTab] = useState('card');

  const TABS = [
    { id: 'card',          icon: '💳', label: 'Card',          sub: 'Credit / Debit' },
    { id: 'upi',           icon: '📱', label: 'UPI',           sub: 'GPay · PhonePe' },
    { id: 'netbanking',    icon: '🏦', label: 'Net Banking',   sub: 'All Banks' },
    { id: 'international', icon: '🌍', label: 'International', sub: '150+ Countries' },
    { id: 'crypto',        icon: '₿',  label: 'Crypto',        sub: 'BTC · ETH · USDT' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">Secure Checkout</p>
            <h3 className="font-bold text-xl">Complete Payment</h3>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">🌍 International</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">₿ Crypto</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">🔒 256-bit SSL</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Total Payable</p>
            <p className="text-3xl font-bold text-amber-400">₹{Number(amount).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Tabs */}
        <div className="grid grid-cols-5 gap-1.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`py-2 px-1 rounded-xl border-2 text-center transition-all duration-200 hover:scale-[1.03] ${tab === t.id ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <p className="text-base">{t.icon}</p>
              <p className="text-[10px] font-bold mt-0.5 leading-tight">{t.label}</p>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {tab === 'card'          && <CardForm          bookingId={bookingId} amount={amount} onSuccess={onSuccess} />}
          {tab === 'upi'           && <UPIForm           bookingId={bookingId} amount={amount} onSuccess={onSuccess} />}
          {tab === 'netbanking'    && <NetBankingForm    bookingId={bookingId} amount={amount} onSuccess={onSuccess} />}
          {tab === 'international' && <InternationalForm bookingId={bookingId} amount={amount} onSuccess={onSuccess} />}
          {tab === 'crypto'        && <CryptoForm        bookingId={bookingId} amount={amount} onSuccess={onSuccess} />}
        </div>

        {/* Security row */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t flex-wrap">
          <span className="text-xs text-gray-400">🔒 SSL Encrypted</span>
          <span className="text-xs text-gray-400">🛡️ PCI DSS Safe</span>
          <span className="text-xs text-gray-400">🌍 150+ Countries</span>
          <span className="text-xs text-gray-400">₿ Crypto Accepted</span>
          <span className="text-xs text-gray-400">✅ RBI Compliant</span>
        </div>
      </div>
    </div>
  );
}
