import React from 'react';
import { Eye, MessageSquare, Wallet, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const statsData = [
  { label: 'Clone Sites Blocked', value: '1,247', icon: Eye, color: '#1A56DB', delta: '+18 today' },
  { label: 'Bots Detected', value: '893', icon: MessageSquare, color: '#F39C12', delta: '+12 today' },
  { label: 'Transfers Intercepted', value: '456', icon: Wallet, color: '#E74C3C', delta: '+7 today' },
  { label: 'Total Users Protected', value: '3,812', icon: Shield, color: '#2ECC71', delta: '+43 today' },
];

const chartData = [
  { time: '08:00', clones: 12, bots: 8, transfers: 4 },
  { time: '09:00', clones: 19, bots: 14, transfers: 7 },
  { time: '10:00', clones: 15, bots: 11, transfers: 5 },
  { time: '11:00', clones: 27, bots: 20, transfers: 11 },
  { time: '12:00', clones: 32, bots: 18, transfers: 9 },
  { time: '13:00', clones: 24, bots: 22, transfers: 14 },
  { time: '14:00', clones: 38, bots: 29, transfers: 16 },
];

const recentThreats = [
  { type: 'CLONE', desc: 'sbi-secure-login.com → 96% match to sbi.co.in', time: '2 min ago', severity: 'critical' },
  { type: 'BOT', desc: 'WhatsApp bot posing as ICICI Bank agent', time: '5 min ago', severity: 'high' },
  { type: 'UPI', desc: 'cashwinner2024@ybl — advance-fee fraud pattern', time: '9 min ago', severity: 'critical' },
  { type: 'CLONE', desc: 'paytm-kyc-update.in → 83% visual clone', time: '14 min ago', severity: 'high' },
  { type: 'BOT', desc: 'Romance scam AI detected in OLX conversation', time: '21 min ago', severity: 'medium' },
];

const severityColors: Record<string, string> = { critical: '#E74C3C', high: '#F39C12', medium: '#3B82F6' };

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {statsData.map(({ label, value, icon: Icon, color, delta }) => (
          <div key={label} className="p-5 rounded-2xl border card-hover" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '22' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--color-safe)' }}>
                <TrendingUp size={12} />
                {delta}
              </div>
            </div>
            <div className="font-display text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Threat activity chart */}
      <div className="p-5 rounded-2xl border" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Threat Activity — Today</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Attacks blocked per hour across all 3 detection systems</div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: '#1A56DB' }}></span><span style={{ color: 'var(--color-text-muted)' }}>Clone</span></span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: '#F39C12' }}></span><span style={{ color: 'var(--color-text-muted)' }}>Bot</span></span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: '#E74C3C' }}></span><span style={{ color: 'var(--color-text-muted)' }}>UPI</span></span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="cloneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F39C12" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F39C12" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="upiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#E74C3C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: '#7777AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7777AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }} />
            <Area type="monotone" dataKey="clones" stroke="#1A56DB" strokeWidth={2} fill="url(#cloneGrad)" />
            <Area type="monotone" dataKey="bots" stroke="#F39C12" strokeWidth={2} fill="url(#botGrad)" />
            <Area type="monotone" dataKey="transfers" stroke="#E74C3C" strokeWidth={2} fill="url(#upiGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent threats table */}
      <div className="p-5 rounded-2xl border" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
          <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Threats</div>
        </div>
        <div className="space-y-3">
          {recentThreats.map((threat, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                style={{ background: severityColors[threat.severity] + '22', color: severityColors[threat.severity] }}
              >
                {threat.type}
              </span>
              <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{threat.desc}</span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{threat.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
