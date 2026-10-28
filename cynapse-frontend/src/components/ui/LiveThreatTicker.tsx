import React, { useEffect, useState } from 'react';
import { AlertTriangle, Wifi } from 'lucide-react';

interface ThreatEvent {
  id: number;
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  time: string;
}

const MOCK_THREATS: ThreatEvent[] = [
  { id: 1, type: 'CLONE', message: 'Visual clone detected: sbi-online-login.in → 96% match to sbi.co.in', severity: 'critical', time: '14:32' },
  { id: 2, type: 'BOT', message: 'AI bot flagged: WhatsApp agent posing as HDFC customer care', severity: 'high', time: '14:28' },
  { id: 3, type: 'UPI', message: 'High-risk VPA blocked: payment.seller2024@ybl — 3 fraud reports', severity: 'critical', time: '14:21' },
  { id: 4, type: 'CLONE', message: 'Phishing attempt blocked: icicib4nk.com → 88% visual match to icicibank.com', severity: 'high', time: '14:17' },
  { id: 5, type: 'BOT', message: 'Romance scam bot detected in OLX conversation thread', severity: 'medium', time: '14:09' },
  { id: 6, type: 'UPI', message: 'Advance-fee fraud pattern: cashprize.winner@paytm flagged', severity: 'high', time: '14:03' },
];

const severityColor = { critical: '#E74C3C', high: '#F39C12', medium: '#3B82F6' };

export default function LiveThreatTicker() {
  const [threats, setThreats] = useState(MOCK_THREATS);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Try to connect to WebSocket; fall back gracefully
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/threats');
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const threat = JSON.parse(e.data);
        setThreats(prev => [threat, ...prev].slice(0, 20));
      };
      ws.onclose = () => setConnected(false);
      return () => ws.close();
    } catch {
      // Use mock data when backend not available
    }
  }, []);

  const tickerContent = [...threats, ...threats]; // duplicate for seamless loop

  return (
    <div
      className="flex items-center gap-3 rounded-lg overflow-hidden mb-6"
      style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', height: '44px' }}
    >
      {/* Label */}
      <div
        className="flex items-center gap-2 px-4 flex-shrink-0 h-full"
        style={{ background: 'rgba(231,76,60,0.15)', borderRight: '1px solid var(--color-border)' }}
      >
        <AlertTriangle size={14} style={{ color: '#E74C3C' }} />
        <span className="text-xs font-mono font-bold" style={{ color: '#E74C3C' }}>LIVE THREATS</span>
        <Wifi size={12} className={connected ? 'text-green-400' : 'text-gray-500'} />
      </div>

      {/* Scrolling content */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex items-center gap-8 whitespace-nowrap"
          style={{
            animation: 'ticker-scroll 40s linear infinite',
          }}
        >
          {tickerContent.map((threat, i) => (
            <span key={i} className="flex items-center gap-2 text-xs font-mono">
              <span
                className="px-1.5 py-0.5 rounded text-xs font-bold"
                style={{ background: `${severityColor[threat.severity]}22`, color: severityColor[threat.severity] }}
              >
                [{threat.type}]
              </span>
              <span style={{ color: 'var(--color-text-primary)' }}>{threat.message}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{threat.time}</span>
              <span style={{ color: 'var(--color-border)' }}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
