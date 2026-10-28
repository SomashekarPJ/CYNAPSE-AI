import React, { useState } from 'react';
import { Wallet, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { analyzePreTransfer } from '../../utils/api';

type InputType = 'upi' | 'phone' | 'account';

interface Result {
  risk_score: number;
  verdict: string;
  risk_factors: string[];
  recipient: string;
}

const SCAN_STEPS = [
  'Checking scam registry databases...',
  'Analysing VPA / identifier pattern...',
  'Cross-referencing fraud reports...',
  'Calculating risk score...',
];

function formatINR(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return '₹' + num.toLocaleString('en-IN');
}

function RiskCard({ score, verdict, factors }: { score: number; verdict: string; factors: string[] }) {
  const color = score < 30 ? '#2ECC71' : score < 70 ? '#F39C12' : '#E74C3C';
  const bg = score < 30 ? 'rgba(46,204,113,0.08)' : score < 70 ? 'rgba(243,156,18,0.08)' : 'rgba(231,76,60,0.08)';
  const label = score < 30 ? 'LOW RISK' : score < 70 ? 'MEDIUM RISK' : 'CRITICAL RISK';

  return (
    <div className="p-5 rounded-2xl border" style={{ background: bg, borderColor: color + '44' }}>
      <div className="flex items-center gap-6 mb-5">
        <div className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2" style={{ borderColor: color, background: color + '15' }}>
          <div className="font-display text-4xl font-bold" style={{ color }}>{score}</div>
          <div className="text-xs font-mono mt-1" style={{ color }}>/ 100</div>
        </div>
        <div>
          <div className="font-display text-xl font-bold" style={{ color }}>{label}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Risk score based on registry, pattern, and historical fraud data
          </div>
          <div className="h-2 w-48 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-mono mb-3" style={{ color: 'var(--color-text-muted)' }}>RISK FACTORS IDENTIFIED</div>
        <div className="space-y-2">
          {factors.map((factor, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color }} />
              <span style={{ color: 'var(--color-text-primary)' }}>{factor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoNoGoBanner({ verdict, score }: { verdict: string; score: number }) {
  const safe = score < 30;
  return (
    <div
      className="flex items-center justify-between p-5 rounded-2xl border"
      style={{
        background: safe ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
        borderColor: safe ? 'rgba(46,204,113,0.4)' : 'rgba(231,76,60,0.4)',
      }}
    >
      <div className="flex items-center gap-3">
        {safe ? <CheckCircle size={24} style={{ color: 'var(--color-safe)' }} /> : <XCircle size={24} style={{ color: 'var(--color-danger)' }} />}
        <div>
          <div className="font-display font-bold text-lg" style={{ color: safe ? 'var(--color-safe)' : 'var(--color-danger)' }}>
            {safe ? 'Safe to Proceed' : 'Do Not Transfer'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {safe ? 'No significant fraud indicators found for this recipient.' : 'High-risk recipient detected. Do not send money to this identifier.'}
          </div>
        </div>
      </div>
      <button
        className="px-5 py-2.5 rounded-xl font-semibold text-sm"
        style={{
          background: safe ? 'var(--color-safe)' : 'var(--color-danger)',
          color: 'white',
        }}
      >
        {safe ? '✓ Proceed' : '✕ Block Transfer'}
      </button>
    </div>
  );
}

export default function PreTransferShield() {
  const [activeTab, setActiveTab] = useState<InputType>('upi');
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const tabs: { id: InputType; label: string; placeholder: string }[] = [
    { id: 'upi', label: 'UPI ID', placeholder: 'username@upi or name@bank' },
    { id: 'phone', label: 'Phone Number', placeholder: '9876543210' },
    { id: 'account', label: 'Bank Account', placeholder: 'Account number' },
  ];

  const handleScan = async () => {
    if (!identifier.trim()) return;
    setIsScanning(true);
    setResult(null);
    setScanStep(0);

    // Animate steps
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 500));
      setScanStep(i + 1);
    }

    const data = await analyzePreTransfer(activeTab, identifier, amount);
    setResult(data);
    setIsScanning(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl border card-hover" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 mb-2">
          <Wallet size={20} style={{ color: 'var(--color-brand)' }} />
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            Pre-Transfer Shield — Risk Predictor
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Enter the recipient's UPI ID, phone, or bank account before sending money. CYNAPSE cross-checks it against fraud registries and returns a risk verdict in real-time.
        </p>
      </div>

      {/* Input form */}
      <div className="p-5 rounded-2xl border" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'var(--color-surface)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIdentifier(''); setResult(null); }}
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--color-brand)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-mono mb-2" style={{ color: 'var(--color-text-muted)' }}>
              {tabs.find(t => t.id === activeTab)?.label.toUpperCase()}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder={tabs.find(t => t.id === activeTab)?.placeholder}
              className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
              style={{
                background: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-mono mb-2" style={{ color: 'var(--color-text-muted)' }}>
              AMOUNT (OPTIONAL)
            </label>
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(formatINR(e.target.value))}
              placeholder="₹0"
              className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
              style={{
                background: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={isScanning || !identifier.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all"
          style={{
            background: isScanning || !identifier.trim() ? 'rgba(26,86,219,0.4)' : 'var(--color-brand)',
            color: 'white',
            cursor: isScanning || !identifier.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          <Shield size={16} className={isScanning ? 'animate-spin-slow' : ''} />
          {isScanning ? 'Shield Scanning...' : 'Scan Recipient'}
        </button>
      </div>

      {/* Scanning state */}
      {isScanning && (
        <div className="p-6 rounded-2xl border" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
              <div className="absolute inset-2 flex items-center justify-center">
                <Shield size={16} style={{ color: 'var(--color-brand)' }} />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Shield scanning recipient</div>
              <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-brand)' }}>{SCAN_STEPS[Math.min(scanStep, SCAN_STEPS.length - 1)]}</div>
            </div>
          </div>
          <div className="space-y-2">
            {SCAN_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: i < scanStep ? 'var(--color-safe)' : i === scanStep ? 'var(--color-brand)' : 'var(--color-border)' }}>
                  {i < scanStep && <CheckCircle size={10} className="text-white" />}
                </div>
                <span className="text-xs font-mono" style={{ color: i <= scanStep ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isScanning && (
        <div className="space-y-4">
          <RiskCard score={result.risk_score} verdict={result.verdict} factors={result.risk_factors} />
          <GoNoGoBanner verdict={result.verdict} score={result.risk_score} />
        </div>
      )}
    </div>
  );
}
