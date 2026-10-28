"""
scoring.py — Shared risk-scoring utilities for CYNAPSE AI.
All features return a 0-100 risk score mapped to a verdict string.
"""


def get_verdict(score: int) -> str:
    """Map a 0–100 risk score to a verdict string per the CYNAPSE standard."""
    if score <= 20:
        return "SAFE"
    elif score <= 40:
        return "LOW RISK"
    elif score <= 65:
        return "SUSPICIOUS"
    elif score <= 80:
        return "HIGH RISK"
    else:
        return "CRITICAL"


def clamp_score(score: float) -> int:
    """Clamp a float score to 0–100 integer range."""
    return max(0, min(100, int(round(score))))
