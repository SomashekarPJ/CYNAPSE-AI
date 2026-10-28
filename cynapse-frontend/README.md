# ⚡ CYNAPSE AI — Frontend

**Cyber Neural Adaptive Protection System Engine**  
Nexora 2026 · AIEMS Bengaluru · 12-Hour Sprint  
Branch: `feat/frontend-ui-teammate1`

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start dev server
npm start
```

App runs at **http://localhost:3000**

---

## 📁 Project Structure

```
cynapse-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── features/
│   │   │   ├── CloneDetector.tsx     ← Feature A
│   │   │   ├── BotDetector.tsx       ← Feature B
│   │   │   └── PreTransferShield.tsx ← Feature C
│   │   ├── layout/
│   │   │   └── Layout.tsx            ← Sidebar + Header
│   │   └── ui/
│   │       └── LiveThreatTicker.tsx  ← WebSocket feed
│   ├── pages/
│   │   └── Dashboard.tsx             ← Main overview
│   ├── utils/
│   │   └── api.ts                    ← Axios + mock fallbacks
│   ├── styles/
│   │   └── globals.css               ← Design tokens + animations
│   ├── App.tsx
│   └── index.tsx
├── tailwind.config.js
├── tsconfig.json
├── .env.example
└── package.json
```

---

## 🎨 Design Tokens

| Token | Hex | Use |
|---|---|---|
| `--color-brand` | `#1A56DB` | Primary buttons, active nav |
| `--color-danger` | `#E74C3C` | Critical risk, Do Not Transfer |
| `--color-warning` | `#F39C12` | High risk, caution |
| `--color-safe` | `#2ECC71` | Safe verdicts |
| `--color-surface` | `#0F0F1A` | Main background |
| `--color-panel` | `#1A1A2E` | Card background |

---

## 🔌 API Endpoints (connect to Teammate 2)

| Feature | Method | Endpoint | Payload |
|---|---|---|---|
| Clone Detector | POST | `/analyze/visual-clone` | `{ url }` |
| Bot Detector | POST | `/analyze/chatbot` | `{ conversation }` |
| Pre-Transfer | POST | `/analyze/pre-transfer` | `{ type, value, amount }` |
| Live Feed | WS | `ws://localhost:8000/ws/threats` | — |

> If the backend is not running, the app automatically uses **mock data** so the UI demo always works.

---

## 📦 Dependencies

```bash
npm install tailwindcss postcss autoprefixer
npm install recharts lucide-react framer-motion
npm install axios socket.io-client
npx tailwindcss init -p
```

---

## 🌿 Git Workflow

```bash
# Your branch — push here every 1.5 hours
git checkout feat/frontend-ui-teammate1

# Commit format
git commit -m "feat(frontend): add phishing clone detector UI component"
git commit -m "feat(frontend): wire feature-B bot detector to /analyze/chat endpoint"
git commit -m "fix(frontend): resolve score gauge animation on Safari"
git commit -m "chore(frontend): install recharts and configure tailwind dark mode"

# Push checkpoints
# Hour 02 → dashboard shell
# Hour 04 → Feature A complete
# Hour 06 → all 3 features
# Hour 08 → wired + working
# Hour 10 → raise Pull Request to main
```

---

## ✅ Demo Checklist (Hour 11)

- [ ] Feature A: URL input accepts pasted link and sends request
- [ ] Feature A: Side-by-side screenshots render without layout break
- [ ] Feature A: Similarity badge colour changes per score range
- [ ] Feature B: Conversation paste box accepts 500+ char input
- [ ] Feature B: Radial gauge animates from 0 to bot_probability
- [ ] Feature B: Evidence cards display for at least 3 signals
- [ ] Feature C: All 3 input tabs (UPI/Phone/Account) switch correctly
- [ ] Feature C: INR amount field formats as ₹1,23,456 style
- [ ] Feature C: 'Do Not Transfer' red banner fires for risk_score > 70
- [ ] Live threat feed ticker scrolls at dashboard top in real time
- [ ] No console errors in Chrome DevTools during full demo run-through

---

## 🚢 Deploy to Vercel

```bash
npm run build
# Or connect GitHub repo to Vercel for auto-deploy
```

Set env var in Vercel: `REACT_APP_API_URL=https://your-backend.railway.app`
