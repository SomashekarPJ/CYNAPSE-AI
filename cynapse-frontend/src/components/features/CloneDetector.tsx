import React, { useState } from 'react';
import { Eye, Search, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { analyzeVisualClone } from '../../utils/api';

type Verdict = 'ORIGINAL' | 'SUSPECTED_CLONE' | 'CONFIRMED_CLONE';

interface Result {
  similarity_score: number;
  verdict: string;
  url_analyzed: string;
  mismatch_regions?: string[];
}

function SimilarityBadge({ score }: { score: number }) {
  const color = score < 40 ? 'var(--color-safe)' : score < 70 ? 'var(--color-warning)' : 'var(--color-danger)';
  const label = score < 40 ? 'LOW RISK' : score < 70 ? 'SUSPICIOUS' : 'HIGH RISK';
  return (
    <div
      className="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 font-mono"
      style={{ borderColor: color, color }}
    >
      <span className="text-3xl font-bold">{score}%</span>
      <span className="text-xs mt-1">{label}</span>
    </div>
  );
}

function VerdictSection({ verdict }: { verdict: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; desc: string }> = {
    ORIGINAL: {
      icon: <CheckCircle size={20} />,
      label: 'ORIGINAL SITE',
      color: 'var(--color-safe)',
      bg: 'rgba(46,204,113,0.1)',
      desc: 'This site does not visually match any known phishing templates. It appears genuine.',
    },
    SUSPECTED_CLONE: {
      icon: <AlertTriangle size={20} />,
      label: 'SUSPECTED CLONE',
      color: 'var(--color-warning)',
      bg: 'rgba(243,156,18,0.1)',
      desc: 'Significant visual similarities detected. Proceed with extreme caution — do not enter credentials.',
    },
    CONFIRMED_CLONE: {
      icon: <XCircle size={20} />,
      label: 'CONFIRMED CLONE',
      color: 'var(--color-danger)',
      bg: 'rgba(231,76,60,0.1)',
      desc: 'This page is a pixel-level replica of a known legitimate site. It is a phishing site. Do NOT proceed.',
    },
  };
  const v = map[verdict] || map['SUSPECTED_CLONE'];
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border" style={{ background: v.bg, borderColor: v.color + '44', color: v.color }}>
      {v.icon}
      <div>
        <div className="font-display font-bold text-sm tracking-widest">{v.label}</div>
        <div className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{v.desc}</div>
      </div>
    </div>
  );
}

export default function CloneDetector() {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [urlError, setUrlError] = useState(false);

  const isValidUrl = (s: string) => {
    try { new URL(s); return true; } catch { return false; }
  };

  const handleScan = async () => {
    if (!isValidUrl(url)) { setUrlError(true); return; }
    setUrlError(false);
    setIsScanning(true);
    setResult(null);
    const data = await analyzeVisualClone(url);
    setResult(data);
    setIsScanning(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="p-5 rounded-2xl border card-hover" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 mb-2">
          <Eye size={20} style={{ color: 'var(--color-brand)' }} />
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            Phishing Site Visual Clone Detector
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Paste any suspicious URL. CYNAPSE compares its visual fingerprint against known legitimate sites using AI — catching clones that bypass URL blacklists.
        </p>
      </div>

      {/* Input section */}
      <div className="p-5 rounded-2xl border" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <label className="block text-xs font-mono font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
          SUSPICIOUS URL
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setUrlError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="https://example-suspicious-site.com"
              className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
              style={{
                background: 'var(--color-surface)',
                border: `2px solid ${urlError ? 'var(--color-danger)' : url && isValidUrl(url) ? 'var(--color-safe)' : 'var(--color-border)'}`,
                color: 'var(--color-text-primary)',
              }}
            />
            {url && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidUrl(url)
                  ? <CheckCircle size={16} style={{ color: 'var(--color-safe)' }} />
                  : <XCircle size={16} style={{ color: 'var(--color-danger)' }} />
                }
              </div>
            )}
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all"
            style={{
              background: isScanning ? 'rgba(26,86,219,0.5)' : 'var(--color-brand)',
              color: 'white',
              cursor: isScanning ? 'not-allowed' : 'pointer',
            }}
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search size={16} />
                Scan for Clone
              </>
            )}
          </button>
        </div>
        {urlError && <p className="text-xs mt-2" style={{ color: 'var(--color-danger)' }}>Please enter a valid URL including https://</p>}
      </div>

      {/* Loading state */}
      {isScanning && (
        <div className="p-8 rounded-2xl border flex flex-col items-center gap-4" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: 'var(--color-brand)' }} />
            <div className="absolute inset-2 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: 'var(--color-warning)', animationDirection: 'reverse', animationDuration: '0.8s' }} />
            <div className="absolute inset-4 flex items-center justify-center">
              <Eye size={16} style={{ color: 'var(--color-brand)' }} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Visual scan in progress</div>
            <div className="text-xs mt-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>Comparing pixel fingerprints against 12,400+ legitimate sites...</div>
          </div>
          <div className="relative w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>

          </div>
        </div>
      )}

      {/* Results */}
      {result && !isScanning && (
        <div className="space-y-4">
          {/* Side-by-side comparison panel */}
          <div className="grid grid-cols-2 gap-4">
            {/* Legitimate site */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-safe)' + '66' }}>
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'rgba(46,204,113,0.1)' }}>
                <CheckCircle size={14} style={{ color: 'var(--color-safe)' }} />
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--color-safe)' }}>LEGITIMATE SITE</span>
              </div>
              <div
                className="h-48 flex items-center justify-center"
                style={{ background: 'var(--color-surface)' }}
              >
                <div className="text-center space-y-2">
                  <ExternalLink size={24} style={{ color: 'var(--color-text-muted)' }} className="mx-auto" />
                  <div className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    Screenshot renders here<br />from backend response
                  </div>
                </div>
              </div>
            </div>

            {/* Suspicious site */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-danger)' + '66' }}>
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'rgba(231,76,60,0.1)' }}>
                <AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--color-danger)' }}>SUSPICIOUS SITE</span>
              </div>
              <div
                className="h-48 flex items-center justify-center relative"
                style={{ background: 'var(--color-surface)' }}
              >
                <div className="absolute inset-0 opacity-20" style={{ background: 'var(--color-danger)' }} />
                <div className="text-center space-y-2 relative z-10">
                  <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} className="mx-auto" />
                  <div className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    Suspicious screenshot<br />with mismatch overlay
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Score + verdict */}
          <div className="p-5 rounded-2xl border flex items-center gap-6" style={{ background: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
            <SimilarityBadge score={result.similarity_score} />
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-text-muted)' }}>VISUAL SIMILARITY SCORE</div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${result.similarity_score}%`,
                      background: result.similarity_score < 40 ? 'var(--color-safe)' : result.similarity_score < 70 ? 'var(--color-warning)' : 'var(--color-danger)',
                    }}
                  />
                </div>
              </div>

              {result.mismatch_regions && result.mismatch_regions.length > 0 && (
                <div>
                  <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-text-muted)' }}>MISMATCH REGIONS DETECTED</div>
                  <div className="flex flex-wrap gap-2">
                    {result.mismatch_regions.map((region, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-md font-mono" style={{ background: 'rgba(231,76,60,0.15)', color: 'var(--color-danger)', border: '1px solid rgba(231,76,60,0.3)' }}>
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verdict */}
          <VerdictSection verdict={result.verdict} />
        </div>
      )}
    </div>
  );
}
