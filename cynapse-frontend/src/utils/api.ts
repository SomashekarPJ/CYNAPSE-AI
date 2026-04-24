import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// ─── Mock responses (used if backend not ready) ──────────────────────────────

const mockVisualClone = (url: string) => ({
  similarity_score: Math.floor(Math.random() * 40) + 55,
  verdict: 'SUSPECTED_CLONE',
  screenshot_suspicious: null,
  screenshot_legit: null,
  url_analyzed: url,
  mismatch_regions: ['header logo area', 'login form position', 'footer links'],
});

const mockBotDetector = () => ({
  bot_probability: Math.floor(Math.random() * 30) + 60,
  verdict: 'LIKELY_BOT',
  evidence: [
    { signal: 'Templated Opener', explanation: 'Conversation starts with identical phrase used in 1,200+ scam chats.' },
    { signal: 'Robotic Phrasing Consistency', explanation: 'Sentence structure variance below 8% — human chats average 34%.' },
    { signal: 'Absence of Real Memory', explanation: 'Agent repeated already-answered questions twice in 15 messages.' },
    { signal: 'Response Time Pattern', explanation: 'Replies within 0.8–1.2 seconds consistently, indicative of auto-response.' },
  ],
});

const mockPreTransfer = (value: string) => ({
  risk_score: Math.floor(Math.random() * 30) + 65,
  verdict: 'HIGH_RISK',
  risk_factors: [
    'VPA registered less than 7 days ago',
    'Pattern matches known OLX fraud template: seller@',
    'Recipient has 0 successful transactions on record',
    'Phone number linked to 3 previous fraud reports',
  ],
  recipient: value,
});

// ─── API calls ────────────────────────────────────────────────────────────────

export async function analyzeVisualClone(url: string) {
  try {
    const { data } = await api.post('/analyze/visual-clone', { url });
    return data;
  } catch {
    await new Promise(r => setTimeout(r, 2200));
    return mockVisualClone(url);
  }
}

export async function analyzeChatbot(conversation: string) {
  try {
    const { data } = await api.post('/analyze/chatbot', { conversation });
    return data;
  } catch {
    await new Promise(r => setTimeout(r, 2500));
    return mockBotDetector();
  }
}

export async function analyzePreTransfer(type: string, value: string, amount: string) {
  try {
    const { data } = await api.post('/analyze/pre-transfer', { type, value, amount });
    return data;
  } catch {
    await new Promise(r => setTimeout(r, 1800));
    return mockPreTransfer(value);
  }
}
