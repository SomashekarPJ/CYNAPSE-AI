"""
routers/chatbot.py — Feature B: AI Chatbot Impersonation Detector

Pipeline:
  1. Split conversation into turns, label [THEM] vs [YOU]
  2. Extract [THEM] turns for analysis
  3. Groq LLM analysis — detect AI-generated response patterns
  4. Pattern matching — templated phrases, response-length variance, formality
  5. Combine signals into weighted bot_probability score
  6. Return top evidence signals with plain-English explanations
"""

import hashlib
import os
import re
import statistics
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from scoring import get_verdict, clamp_score
from database import store_threat
from cache import cache_get, cache_set
from websocket_manager import manager

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

router = APIRouter(prefix="/analyze", tags=["Chatbot Detection"])

# ---------------------------------------------------------------------------
# Known bot-like templated phrases
# ---------------------------------------------------------------------------
BOT_PHRASES = [
    "i understand your concern",
    "thank you for reaching out",
    "i'm here to help",
    "is there anything else",
    "i apologize for the inconvenience",
    "let me assist you",
    "as an ai",
    "i don't have personal",
    "as a language model",
    "i cannot provide",
    "please provide me with",
    "i'd be happy to help",
    "how can i assist you",
    "certainly! ",
    "absolutely! ",
    "great question!",
    "that's a great question",
    "i hope this helps",
    "feel free to ask",
    "don't hesitate to",
    "it's important to note",
    "please note that",
    "in summary,",
    "to summarize,",
    "here are some",
    "here's what you can do",
    "i recommend",
    "based on my knowledge",
]

FORMAL_MARKERS = [
    "furthermore", "moreover", "nevertheless", "consequently",
    "subsequently", "pertaining to", "in regard to", "henceforth",
    "notwithstanding", "aforementioned", "herein", "thereof",
    "whereby", "pursuant to", "in accordance with",
]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ChatbotRequest(BaseModel):
    conversation: str


class EvidenceItem(BaseModel):
    signal: str
    explanation: str


class ChatbotResponse(BaseModel):
    bot_probability: int
    verdict: str
    evidence: list[EvidenceItem]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def split_turns(conversation: str) -> list[dict]:
    """Split a conversation into labelled turns.
    Supports formats like:
      [THEM]: message...    or   THEM: message...
      [YOU]:  message...    or   YOU:  message...
    Falls back to alternating lines if no labels found.
    """
    lines = [l.strip() for l in conversation.strip().split("\n") if l.strip()]

    # Try labelled format
    labelled = []
    pattern = re.compile(
        r"^\[?(THEM|YOU|AGENT|BOT|USER|ME|HUMAN|ASSISTANT)\]?\s*:\s*(.+)$",
        re.IGNORECASE,
    )
    for line in lines:
        m = pattern.match(line)
        if m:
            role_raw = m.group(1).upper()
            text = m.group(2).strip()
            role = "THEM" if role_raw in ("THEM", "AGENT", "BOT", "ASSISTANT") else "YOU"
            labelled.append({"role": role, "text": text})

    if labelled:
        return labelled

    # Fallback: alternate lines (odd = THEM, even = YOU)
    return [
        {"role": "THEM" if i % 2 == 0 else "YOU", "text": line}
        for i, line in enumerate(lines)
    ]


def analyze_patterns(them_turns: list[str]) -> list[dict]:
    """Run rule-based pattern analysis on [THEM] responses.
    Returns a list of {"signal": ..., "score": 0-1, "explanation": ...}.
    """
    signals = []

    if not them_turns:
        return signals

    # 1. Templated phrase detection
    template_hits = 0
    for turn in them_turns:
        lower = turn.lower()
        for phrase in BOT_PHRASES:
            if phrase in lower:
                template_hits += 1
                break
    template_ratio = template_hits / len(them_turns)
    if template_ratio > 0.3:
        signals.append({
            "signal": "Templated Phrases",
            "score": min(1.0, template_ratio),
            "explanation": f"{int(template_ratio*100)}% of responses use common AI assistant phrases like 'I understand your concern' or 'Is there anything else I can help with?'",
        })

    # 2. Response length consistency (bots tend to produce very uniform lengths)
    lengths = [len(t.split()) for t in them_turns]
    if len(lengths) >= 3:
        cv = statistics.stdev(lengths) / max(statistics.mean(lengths), 1)
        if cv < 0.25:
            signals.append({
                "signal": "Uniform Response Length",
                "score": max(0, 1.0 - cv * 4),
                "explanation": f"Response lengths are suspiciously consistent (coefficient of variation = {cv:.2f}). Humans vary more naturally.",
            })

    # 3. Formality score
    total_words = sum(len(t.split()) for t in them_turns)
    formal_count = sum(
        1 for t in them_turns for marker in FORMAL_MARKERS if marker in t.lower()
    )
    if total_words > 0:
        formality = formal_count / (total_words / 100)  # per 100 words
        if formality > 1.5:
            signals.append({
                "signal": "Excessive Formality",
                "score": min(1.0, formality / 5),
                "explanation": f"High density of formal/academic words ({formal_count} instances). AI models tend to be overly formal.",
            })

    # 4. Exclamation / enthusiasm patterns
    enthusiastic = sum(1 for t in them_turns if t.strip().endswith("!"))
    enth_ratio = enthusiastic / len(them_turns) if them_turns else 0
    if enth_ratio > 0.5:
        signals.append({
            "signal": "Excessive Enthusiasm",
            "score": min(1.0, enth_ratio),
            "explanation": f"{int(enth_ratio*100)}% of responses end with exclamation marks — a common AI pattern.",
        })

    # 5. Lack of personal anecdotes / contextual memory
    personal_words = ["i remember", "last time", "yesterday", "my experience",
                      "i personally", "in my life", "when i was"]
    has_personal = any(pw in t.lower() for t in them_turns for pw in personal_words)
    if not has_personal and len(them_turns) >= 4:
        signals.append({
            "signal": "No Personal Context",
            "score": 0.6,
            "explanation": "Across multiple turns, the responder never references personal experiences or past interactions — typical of AI responses.",
        })

    # 6. Perfect grammar (no typos, contractions, slang)
    slang = ["lol", "haha", "nah", "gonna", "wanna", "idk", "tbh",
             "btw", "omg", "brb", "smh", "lmao", "rn", "ngl"]
    has_slang = any(s in t.lower().split() for t in them_turns for s in slang)
    if not has_slang and len(them_turns) >= 3:
        signals.append({
            "signal": "No Casual Language",
            "score": 0.5,
            "explanation": "Responses contain zero slang, abbreviations, or casual language — unusually polished for a human conversation.",
        })

    # 7. Numbered/bulleted list usage
    list_turns = sum(1 for t in them_turns if re.search(r"(^|\n)\s*[\d•\-\*]\s*[\.:\)]", t))
    if list_turns / len(them_turns) > 0.3:
        signals.append({
            "signal": "Frequent Structured Lists",
            "score": 0.7,
            "explanation": f"{list_turns} of {len(them_turns)} responses use numbered or bulleted lists — a hallmark of AI-generated content.",
        })

    return signals


def groq_bot_analysis(them_text: str) -> dict:
    """Ask Groq to evaluate whether the text looks AI-generated.
    Returns {"score": 0-100, "signals": [...]}.
    """
    if not GROQ_AVAILABLE:
        return {"score": 0, "signals": []}

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key or api_key == "your_groq_key_here":
        return {"score": 0, "signals": ["Groq API key not configured"]}

    try:
        client = Groq(api_key=api_key)
        prompt = f"""You are a linguistic forensics expert specialising in detecting AI-generated text.

Analyse the following conversation responses (from the party we suspect may be a chatbot) and determine the probability they are AI-generated.

RESPONSES TO ANALYSE:
\"\"\"
{them_text[:3000]}
\"\"\"

Return your analysis as JSON with exactly these fields:
- "score": integer 0-100 (0 = definitely human, 100 = definitely AI/bot)
- "signals": list of up to 5 short strings, each describing a specific bot-like pattern you found

Look for: unnaturally consistent tone, absence of typos, templated openings/closings,
over-hedging, excessive politeness, lack of genuine emotion or personal anecdotes,
structured list outputs, and perfect grammar throughout.

Return ONLY valid JSON, no markdown."""

        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500,
        )
        import json
        text = resp.choices[0].message.content.strip()
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*$", "", text)
        return json.loads(text)
    except Exception as e:
        return {"score": 0, "signals": [f"Groq analysis error: {str(e)}"]}


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------
@router.post("/chatbot", response_model=ChatbotResponse)
async def analyze_chatbot(req: ChatbotRequest):
    """Analyse a conversation transcript for AI chatbot impersonation."""

    conversation = req.conversation.strip()
    if not conversation:
        return ChatbotResponse(
            bot_probability=0,
            verdict="SAFE",
            evidence=[EvidenceItem(signal="Empty input", explanation="No conversation text provided.")],
        )

    # --- Cache check ---
    cache_key = f"cb:{hashlib.sha256(conversation.encode()).hexdigest()}"
    cached = cache_get(cache_key)
    if cached:
        return ChatbotResponse(**cached)

    # --- Split and extract [THEM] turns ---
    turns = split_turns(conversation)
    them_turns = [t["text"] for t in turns if t["role"] == "THEM"]

    if not them_turns:
        # If we can't identify roles, analyse all turns
        them_turns = [t["text"] for t in turns]

    them_text = "\n---\n".join(them_turns)

    # --- Layer 1: Groq LLM analysis ---
    groq_result = groq_bot_analysis(them_text)
    groq_score = groq_result.get("score", 0)
    groq_signals = groq_result.get("signals", [])

    # --- Layer 2: Rule-based pattern matching ---
    pattern_signals = analyze_patterns(them_turns)
    pattern_score = 0
    if pattern_signals:
        pattern_score = int(
            (sum(s["score"] for s in pattern_signals) / len(pattern_signals)) * 100
        )

    # --- Combine: 50% Groq + 50% Pattern ---
    if groq_score > 0 and pattern_score > 0:
        final_score = clamp_score(groq_score * 0.5 + pattern_score * 0.5)
    elif groq_score > 0:
        final_score = clamp_score(groq_score)
    else:
        final_score = clamp_score(pattern_score)

    verdict = get_verdict(final_score)

    # --- Build evidence list (top 5) ---
    evidence: list[EvidenceItem] = []
    for sig in pattern_signals[:3]:
        evidence.append(EvidenceItem(signal=sig["signal"], explanation=sig["explanation"]))
    for sig_text in groq_signals[:2]:
        evidence.append(EvidenceItem(signal="AI Analysis", explanation=str(sig_text)))

    if not evidence:
        evidence.append(EvidenceItem(
            signal="No strong signals",
            explanation="Analysis did not detect clear bot-like patterns in the conversation.",
        ))

    # --- Store in DB ---
    input_hash = hashlib.sha256(conversation.encode()).hexdigest()
    await store_threat(
        feature="chatbot",
        input_hash=input_hash,
        verdict=verdict,
        risk_score=final_score,
        evidence={"signals": [e.dict() for e in evidence]},
    )

    # --- Broadcast via WebSocket ---
    await manager.broadcast({
        "type": "chatbot",
        "verdict": verdict,
        "risk_score": final_score,
        "scam_type": "ai_impersonation",
        "timestamp": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
    })

    result = {
        "bot_probability": final_score,
        "verdict": verdict,
        "evidence": [e.dict() for e in evidence],
    }
    cache_set(cache_key, result)
    return ChatbotResponse(**result)
