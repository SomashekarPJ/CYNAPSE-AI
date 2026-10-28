"""
routers/pre_transfer.py — Feature C: Pre-Transfer Shield

Pipeline:
  1. Validate input format (UPI VPA, phone number, or bank account)
  2. Check against scam registry (fraudulent VPAs, suspicious handles)
  3. Score the @handle domain and VPA pattern analysis
  4. Run Groq analysis on the identifier against Indian fraud patterns
  5. Check if amount is a suspicious round number
  6. Combine all signals into a weighted 0–100 risk score
  7. Return risk factors with plain-English explanations
"""

import hashlib
import json
import os
import re
from pathlib import Path

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

router = APIRouter(prefix="/analyze", tags=["Pre-Transfer Shield"])

# ---------------------------------------------------------------------------
# Load scam registry
# ---------------------------------------------------------------------------
REGISTRY_PATH = Path(__file__).resolve().parent.parent / "scam_registry.json"
with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
    SCAM_REGISTRY = json.load(f)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class PreTransferRequest(BaseModel):
    type: str   # 'upi' | 'phone' | 'account'
    value: str
    amount: int


class PreTransferResponse(BaseModel):
    risk_score: int
    verdict: str
    risk_factors: list[str]
    recommendation: str


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------
UPI_REGEX = re.compile(r"^[\w.\-]+@[\w.\-]+$")
PHONE_REGEX = re.compile(r"^[6-9]\d{9}$")
ACCOUNT_REGEX = re.compile(r"^\d{9,18}$")


def validate_input(inp_type: str, value: str) -> tuple[bool, str]:
    """Validate input format. Returns (is_valid, error_message)."""
    if inp_type == "upi":
        if UPI_REGEX.match(value):
            return True, ""
        return False, "Invalid UPI VPA format. Expected format: name@provider"
    elif inp_type == "phone":
        digits = re.sub(r"[^0-9]", "", value)
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        if PHONE_REGEX.match(digits):
            return True, ""
        return False, "Invalid Indian phone number. Expected 10-digit number starting with 6-9."
    elif inp_type == "account":
        digits = re.sub(r"[^0-9]", "", value)
        if ACCOUNT_REGEX.match(digits):
            return True, ""
        return False, "Invalid bank account number. Expected 9-18 digit number."
    else:
        return False, f"Unknown type '{inp_type}'. Use 'upi', 'phone', or 'account'."


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------
def check_scam_registry(inp_type: str, value: str) -> tuple[int, list[str]]:
    """Check the value against the scam registry.
    Returns (score_contribution, risk_factors).
    """
    score = 0
    factors = []

    if inp_type == "upi":
        vpa_lower = value.lower()

        # Direct match
        if vpa_lower in [v.lower() for v in SCAM_REGISTRY.get("fraudulent_vpas", [])]:
            score += 80
            factors.append(f"UPI ID '{value}' found in known fraud database")

        # Suspicious handle match
        for handle in SCAM_REGISTRY.get("suspicious_handles", []):
            if handle.lower() in vpa_lower:
                score += 30
                factors.append(f"UPI handle matches suspicious pattern: {handle}")

        # High-risk keywords in VPA name
        name_part = vpa_lower.split("@")[0] if "@" in vpa_lower else vpa_lower
        for keyword in SCAM_REGISTRY.get("high_risk_keywords", []):
            if keyword in name_part:
                score += 10
                factors.append(f"VPA contains high-risk keyword: '{keyword}'")
                break  # count only once

        # Suspicious patterns (regex)
        for pattern_name, pattern in SCAM_REGISTRY.get("suspicious_patterns", {}).items():
            if re.match(pattern, vpa_lower):
                score += 15
                factors.append(f"VPA matches suspicious pattern: {pattern_name.replace('_', ' ')}")

    elif inp_type == "phone":
        digits = re.sub(r"[^0-9]", "", value)
        if digits.startswith("91"):
            digits = digits[2:]
        for prefix in SCAM_REGISTRY.get("fraudulent_phone_prefixes", []):
            if digits.startswith(prefix):
                score += 40
                factors.append(f"Phone number starts with known fraud prefix: {prefix}xxx")

    return min(score, 100), factors


def score_upi_domain(value: str) -> tuple[int, list[str]]:
    """Score the @handle domain of a UPI VPA."""
    score = 0
    factors = []

    if "@" not in value:
        return 0, []

    domain = value.split("@")[1].lower()

    # Check if it's a legitimate provider
    legit_providers = [p.lstrip("@").lower() for p in SCAM_REGISTRY.get("legitimate_upi_providers", [])]
    if domain not in legit_providers:
        score += 25
        factors.append(f"UPI provider '@{domain}' is not a recognised provider")

    # Suspicious domain patterns
    suspicious_domains = SCAM_REGISTRY.get("suspicious_handle_domains", [])
    if domain in [d.lower() for d in suspicious_domains]:
        # These are actually legitimate but commonly used for scams
        score += 5
        factors.append(f"Provider '@{domain}' is frequently associated with scam VPAs")

    # Domain with hyphens (e.g. @ybl-new)
    if "-" in domain:
        score += 20
        factors.append(f"UPI provider '@{domain}' contains unusual hyphen — possible spoofed handle")

    return score, factors


def check_amount_risk(amount: int) -> tuple[int, list[str]]:
    """Evaluate if the transfer amount raises red flags."""
    score = 0
    factors = []

    if amount >= 5000 and amount % 1000 == 0:
        score += 10
        factors.append(f"Round-number amount ₹{amount:,} — common in advance-fee fraud")

    if amount >= 50000:
        score += 15
        factors.append(f"High-value transfer ₹{amount:,} — exercise extra caution")

    if amount >= 100000:
        score += 10
        factors.append(f"Very high amount ₹{amount:,} — consider verifying recipient identity offline")

    return score, factors


def groq_fraud_analysis(inp_type: str, value: str, amount: int) -> dict:
    """Ask Groq to evaluate the payment identifier against Indian fraud patterns."""
    if not GROQ_AVAILABLE:
        return {"score": 0, "factors": []}

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key or api_key == "your_groq_key_here":
        return {"score": 0, "factors": ["Groq API key not configured"]}

    try:
        client = Groq(api_key=api_key)
        prompt = f"""You are an Indian cybercrime analyst specialising in UPI and digital payment fraud.

Analyse the following payment details and assess the fraud risk:
- Type: {inp_type}
- Identifier: {value}
- Amount: ₹{amount}

Common Indian scam patterns to check for:
1. VPAs mimicking banks, govt agencies, or popular services
2. Random alphanumeric VPAs created in bulk for one-time scams
3. Phone numbers from known telemarketing/spam prefixes
4. Identifiers impersonating customer support or KYC verification
5. Patterns associated with lottery/prize/cashback fraud

Return your analysis as JSON with exactly these fields:
- "score": integer 0-100 (0 = safe, 100 = confirmed fraud)
- "factors": list of up to 3 short risk-factor strings

Return ONLY valid JSON, no markdown."""

        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=400,
        )
        text = resp.choices[0].message.content.strip()
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*$", "", text)
        return json.loads(text)
    except Exception as e:
        return {"score": 0, "factors": [f"Groq analysis error: {str(e)}"]}


def get_recommendation(score: int) -> str:
    """Return a human-readable recommendation based on the risk score."""
    if score <= 20:
        return "This transaction appears safe. Proceed with normal caution."
    elif score <= 40:
        return "Low risk detected. Verify the recipient before proceeding."
    elif score <= 65:
        return "Moderate risk. We recommend verifying the recipient's identity through an independent channel before transferring."
    elif score <= 80:
        return "High risk detected. Do NOT proceed with this transfer without verifying the recipient offline. This identifier shows multiple fraud indicators."
    else:
        return "CRITICAL RISK. This identifier matches known fraud patterns. Do NOT transfer any money. Report this to your bank and cyber crime helpline 1930."


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------
@router.post("/pre-transfer", response_model=PreTransferResponse)
async def analyze_pre_transfer(req: PreTransferRequest):
    """Validate a payment recipient and return a fraud risk score."""

    inp_type = req.type.lower().strip()
    value = req.value.strip()
    amount = req.amount

    # --- Validate input ---
    is_valid, err = validate_input(inp_type, value)
    if not is_valid:
        return PreTransferResponse(
            risk_score=0,
            verdict="SAFE",
            risk_factors=[err],
            recommendation="Please provide a valid identifier to analyse.",
        )

    # --- Cache check ---
    cache_key = f"pt:{hashlib.sha256(f'{inp_type}:{value}:{amount}'.encode()).hexdigest()}"
    cached = cache_get(cache_key)
    if cached:
        return PreTransferResponse(**cached)

    all_factors: list[str] = []
    total_score = 0

    # --- 1. Scam registry check ---
    reg_score, reg_factors = check_scam_registry(inp_type, value)
    total_score += reg_score
    all_factors.extend(reg_factors)

    # --- 2. UPI domain scoring ---
    if inp_type == "upi":
        dom_score, dom_factors = score_upi_domain(value)
        total_score += dom_score
        all_factors.extend(dom_factors)

    # --- 3. Amount risk ---
    amt_score, amt_factors = check_amount_risk(amount)
    total_score += amt_score
    all_factors.extend(amt_factors)

    # --- 4. Groq analysis ---
    groq_result = groq_fraud_analysis(inp_type, value, amount)
    groq_score = groq_result.get("score", 0)
    groq_factors = groq_result.get("factors", [])
    all_factors.extend(groq_factors)

    # --- Combine: 60% rule-based + 40% Groq ---
    if groq_score > 0:
        final_score = clamp_score(total_score * 0.6 + groq_score * 0.4)
    else:
        final_score = clamp_score(total_score)

    verdict = get_verdict(final_score)
    recommendation = get_recommendation(final_score)

    # --- Store in DB ---
    input_hash = hashlib.sha256(f"{inp_type}:{value}".encode()).hexdigest()
    await store_threat(
        feature="pre_transfer",
        input_hash=input_hash,
        verdict=verdict,
        risk_score=final_score,
        evidence={"risk_factors": all_factors},
    )

    # --- Broadcast via WebSocket ---
    await manager.broadcast({
        "type": "pre_transfer",
        "verdict": verdict,
        "risk_score": final_score,
        "scam_type": "payment_fraud",
        "timestamp": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
    })

    result = {
        "risk_score": final_score,
        "verdict": verdict,
        "risk_factors": all_factors[:10],
        "recommendation": recommendation,
    }
    cache_set(cache_key, result)
    return PreTransferResponse(**result)
