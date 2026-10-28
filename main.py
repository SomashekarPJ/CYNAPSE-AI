"""
main.py — CYNAPSE AI Backend
Cyber Neural Adaptive Protection System Engine

FastAPI application wiring all routers, WebSocket broadcaster,
health check, CORS middleware, and database initialization.
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from websocket_manager import manager
from routers.visual_clone import router as visual_clone_router
from routers.chatbot import router as chatbot_router
from routers.pre_transfer import router as pre_transfer_router

load_dotenv()
os.makedirs("screenshots", exist_ok=True)



# ---------------------------------------------------------------------------
# Lifespan: init DB on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup / shutdown logic."""
    await init_db()
    os.makedirs("screenshots", exist_ok=True)
    print("✅ CYNAPSE AI — Database initialised, server ready.")
    yield
    print("🛑 CYNAPSE AI — Shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CYNAPSE AI",
    description="Cyber Neural Adaptive Protection System Engine — Backend & AI Core",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the React frontend from Teammate 1
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving for screenshots
# ---------------------------------------------------------------------------
app.mount("/screenshots", StaticFiles(directory="screenshots"), name="screenshots")

# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------
app.include_router(visual_clone_router)
app.include_router(chatbot_router)
app.include_router(pre_transfer_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0"}


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "message": "CYNAPSE AI running",
        "endpoints": [
            "POST /analyze/visual-clone",
            "POST /analyze/chatbot",
            "POST /analyze/pre-transfer",
            "WS   /ws/threats",
            "GET  /health",
        ],
    }


# ---------------------------------------------------------------------------
# WebSocket endpoint — /ws/threats
# ---------------------------------------------------------------------------
@app.websocket("/ws/threats")
async def websocket_threats(websocket: WebSocket):
    """WebSocket endpoint for real-time threat event broadcasting."""
    await manager.connect(websocket)
    try:
        # Keep connection alive; incoming messages are ignored
        while True:
            data = await websocket.receive_text()
            # Echo back a heartbeat
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)