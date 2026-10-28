import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Brain, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyzeChatbot } from '../../utils/api';

interface EvidenceItem {
  signal: string;
  explanation: string;
}

interface Result {
  bot_probability: number;
  verdict: string;
  evidence: EvidenceItem[];
}

function RadialGauge({ probability, animating }: { probability: number; animating: boolean }) {
  const [displayVal, setDisplayVal] = useState(0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const color = probability < 40 ? '#2ECC71' : probability < 70 ? '#F39C12' : '#E74C3C';

  useEffect(() => {
    if (!animating) {
      let start = 0;
      const step = probability / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= probability) { setDisplayVal(probability); clearInterval(timer); }
        else setDisplayVal(Math.floor(start));
      }, 16);
      return () => clearInterval(timer);
    }
  }, [probability, animating]);

  const offset = circumference - (displayVal / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg width="192" height="192" viewBox="0 0 192 192">
        {/* Background circle */}
        <circle cx="96" cy="96" r={radius} fill="none" strokeWidth="12" stroke="var(--color-border)" />
        {/* Progress circle */}
        <circle
          cx="96" cy="96" r={radius}
          fill="none" strokeWidth="12" stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="gauge-ring transition-all duration-100"
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-bold" style={{ color }}>{displayVal}</div>
        <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>BOT PROB %</div>
      </div>
    </div>
  );
}

function VerdictBanner({ verdict }: { verdict: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    HUMAN_DETECTED: { icon: <CheckCircle size={18} />, label: 'HUMAN DETECTED', color: 'var(--color-safe)', bg: 'rgba(46,204,113,0.1)' },
    LIKELY_BOT:     { icon: <AlertTriangle size={18} />, label: 'LIKELY BOT', color: 'var(--color-warning)', bg: 'rgba(243,156,18,0.1)' },
    CONFIRMED_BOT:  { icon: <XCircle size={18} />, label: 'CONFIRMED BOT', color: 'var(--color-danger)', bg: 'rgba(231,76,60,0.1)' },
  };
  const v = map[verdict] || map['LIKELY_BOT'];
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border font-display font-bold text-sm tracking-widest"
      style={{ background: v.bg, borderColor: v.color + '44', color: v.color }}>
      {v.icon} {v.label}
    </div>
  );
}

export default function BotDetector() {
  const [conversation, setConversation] = useState('');
  const [lineCount, setLineCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleConversationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConversation(e.target.value);
    setLineCount(e.target.value.split('\n').length);
  };

  const handleDetect = async () => {
    if (!conversation.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    const data = await analyzeChatbot(conversation);
    setResult(data);
    setIsAnalyzing(false);
  };

  const chartData = result ? [
    { name: 'Human', value: 100 - result.bot_probability, fill: '#2ECC71' },
    { name: 'Bot', value: result.bot_probability, fill: '#E74C3C' },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl border card-hover" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare size={20} style={{ color: 'var(--color-brand)' }} />
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            AI Chatbot Impersonation Detector
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Paste a conversation transcript to detect AI bots posing as humans — bank agents, customer care, or romantic interests.
        </p>
      </div>

      {/* Paste area */}
      <div className="p-5 rounded-2xl border" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-muted)' }}>CONVERSATION TRANSCRIPT</label>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{lineCount} lines · {conversation.length} chars</span>
            <button
              onClick={() => { setConversation(''); setLineCount(0); setResult(null); }}
              className="text-xs px-2 py-1 rounded-md transition-colors"
              style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={conversation}
          onChange={handleConversationChange}
          placeholder={"Paste WhatsApp / Telegram / chat transcript here...\n\nExample:\nAgent: Hello! I am calling from HDFC Bank...\nYou: Who is this?\nAgent: This is regarding your account security..."}
          rows={8}
          className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none resize-none transition-all"
          style={{
            background: 'var(--color-surface)',
            border: '2px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          onClick={handleDetect}
          disabled={isAnalyzing || !conversation.trim()}
          className="mt-3 flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all w-full justify-center"
          style={{
            background: isAnalyzing || !conversation.trim() ? 'rgba(26,86,219,0.4)' : 'var(--color-brand)',
            color: 'white',
            cursor: isAnalyzing || !conversation.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {isAnalyzing ? (
            <>
              <Brain size={16} className="animate-pulse" />
              Analysing linguistic patterns...
            </>
          ) : (
            <>
              <Brain size={16} />
              Detect Bot
            </>
          )}
        </button>
      </div>

      {/* Thinking state */}
      {isAnalyzing && (
        <div className="p-6 rounded-2xl border flex items-center gap-4" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-8 rounded-full" style={{
                background: 'var(--color-brand)',
                animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Linguistic analysis running</div>
            <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Checking phrasing consistency · response time patterns · memory absence signals...
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <div className="space-y-4">
          {/* Gauge + chart */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border flex flex-col items-center justify-center" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
              <div className="text-xs font-mono mb-3" style={{ color: 'var(--color-text-muted)' }}>BOT PROBABILITY</div>
              <RadialGauge probability={result.bot_probability} animating={isAnalyzing} />
            </div>
            <div className="p-5 rounded-2xl border" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
              <div className="text-xs font-mono mb-3" style={{ color: 'var(--color-text-muted)' }}>HUMAN vs BOT CONFIDENCE</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={50} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                    formatter={(v: number) => [`${v}%`]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evidence cards */}
          <div className="p-5 rounded-2xl border" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
            <div className="text-xs font-mono mb-3" style={{ color: 'var(--color-text-muted)' }}>FLAGGED SIGNALS ({result.evidence.length})</div>
            <div className="space-y-3">
              {result.evidence.map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: 'rgba(231,76,60,0.07)', border: '1px solid rgba(231,76,60,0.2)' }}>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold" style={{ background: 'rgba(231,76,60,0.2)', color: 'var(--color-danger)' }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>{item.signal}</div>
                    <div className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{item.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verdict banner */}
          <VerdictBanner verdict={result.verdict} />
        </div>
      )}
    </div>
  );
}
