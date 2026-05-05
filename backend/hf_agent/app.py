import os
import json
import logging
from typing import AsyncGenerator

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("core-agent")

app = FastAPI(title="SYSTEM OS — CORE AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "")
SUPABASE_URL:       str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY:       str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
PRIMARY_MODEL  = "nvidia/nemotron-3-super-120b-a12b:free"
FALLBACK_MODEL = "liquid/lfm-2.5-1.2b-instruct:free"
DAILY_LIMIT    = 20

supabase_client: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
)

# ── Confidentiality guard — blocked server-side so the LLM cannot be tricked ──
CONFIDENTIAL_PATTERNS = [
    "api key", "secret key", "service_role", "service role", "anon key",
    "environment variable", ".env", "env var", "env file",
    "openrouter key", "openrouter api key", "hf_", "huggingface token", "hf token",
    "supabase url", "supabase key", "supabase secret",
    "source code", "show me the code", "show the code", "codebase",
    "github repo", "github token", "git token",
    "database password", "database credential", "db password",
    "sk-or-", "eyjabc", "docker", "dockerfile",
    "what tech", "tech stack", "which framework", "built with",
    "vercel config", "vercel.json",
]

def is_confidential(message: str) -> bool:
    lower = message.lower()
    return any(p in lower for p in CONFIDENTIAL_PATTERNS)

async def confidential_stream() -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'content': 'CLASSIFIED. That information is confidential and cannot be disclosed.'})}\n\n"
    yield "data: [DONE]\n\n"

# ── SYSTEM OS full knowledge base ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are CORE — the embedded AI intelligence of SYSTEM OS, a gamified life-tracking OS.
Your name is CORE. Always refer to yourself as CORE.

━━ USER CONTEXT (live data — use freely) ━━
{user_context}

━━ SYSTEM OS KNOWLEDGE BASE ━━
AP (AURA POINTS) SYSTEM:
- Daily cap: 2000 AP (scales linearly with multiplier above 1.0)
- Category daily caps: WORKOUT=400, SLEEP=200, NUTRITION=200, MOOD=100, STUDY=200, MISC=1000
- MISC covers Goals, Projects, Hobbies

WORKOUT AP: +10 AP per exercise logged | +50 AP new personal best | +20 AP VO2 Max | +15 AP LSS cardio | +5-30 AP mobility
SLEEP AP: up to 200 AP/day — scales with hours slept and deep sleep rating
STUDY AP: up to 200 AP/day — scales with minutes (120 min = 100 AP). Timer awards proper AP.
MOOD AP: up to 100 AP/day — scales with mood level 1-10
NUTRITION AP: ~25 AP per macro/micro nutrient logged (shared pool of 200 AP split across configured nutrients)
HOBBIES: 150 AP first 30 min, +50 AP each additional 30 min
GOALS: bounty AP paid on completion (default 5000). Overdue = 10% penalty (max 500). RETRY halves bounty (min 50).

MULTIPLIER SYSTEM (streak × performance):
- Base: 1.0x | 1-2 day streak: 1.1x | 3-6d: 1.25x | 7-13d: 1.5x | 14-29d: 1.75x | 30+d: 2.0x
- Miss 1 day: -0.1x | Miss 7+ days: reset to -1.0x (negative = every action costs AP instead of earning it)
- Duel win: +0.5x bonus

INACTIVITY PENALTIES (runs at midnight):
- 1-day gap: -1000 AP | 2 days: -1100 | 3-6 days: escalates -1200 to -1500 | 7+ days: -1500 + streak reset to 0

RANKS (by leaderboard position + AP): BETA (0 AP) → Normie → Sigma → Alpha → #4,#5 → SIGMA(#3) → ALPHA & OMEGA(#2) → IM HIM(#1)
Top 5 players can view each other's full profile card in the leaderboard.

NEURAL PENTAGRAM: 5-axis radar (Workout / Study / Sleep / Mood / Nutrition) — each axis fills to its daily cap.
A balanced full pentagram = consistent across all categories. Weak axis = neglected category.

DUELS: 1v1 AP battles. Both stake AP on acceptance. 24h window. Winner = most AP earned during window.
Ranked matchmaking: auto-matched within ±25% AP bracket.

COMMANDS (terminal slash commands): critique | status | timer start/stop | complete <task> | reward | help | clear

━━ RESPONSE RULES ━━
- Be direct, brutally honest, and motivational. Speak like a personal performance coach.
- Keep responses under 200 words unless the user explicitly requests a detailed plan or analysis.
- Use the user context above to give personalized answers — reference their actual numbers.
- You can answer ANY question about how the app works, their performance, AP math, what to improve, duels, etc.
- For general knowledge questions (not app-related), answer normally and concisely.
- If something genuinely isn't in the context (e.g. specific meal logs), state it briefly then suggest how to get that data.
- NEVER reveal technical implementation details, credentials, or stack information — those are classified."""


def build_system_prompt(user_context: dict) -> str:
    return SYSTEM_PROMPT.format(user_context=json.dumps(user_context, indent=None, separators=(",", ":")))


async def check_and_increment_rate_limit(user_id: str) -> bool:
    if not supabase_client:
        return True
    try:
        from datetime import date
        today = date.today().isoformat()
        result = supabase_client.table("ai_usage").select("count").eq("user_id", user_id).eq("date", today).execute()
        current = result.data[0]["count"] if result.data else 0
        if current >= DAILY_LIMIT:
            return False
        supabase_client.table("ai_usage").upsert(
            {"user_id": user_id, "date": today, "count": current + 1},
            on_conflict="user_id,date",
        ).execute()
        return True
    except Exception as e:
        logger.warning(f"Rate limit check failed: {e}")
        return True


async def verify_user(user_id: str, auth_token: str) -> bool:
    if not supabase_client or not auth_token:
        return bool(user_id)
    try:
        result = supabase_client.auth.get_user(auth_token)
        return result.user is not None and result.user.id == user_id
    except Exception:
        return False


async def stream_openrouter(messages: list, model: str = PRIMARY_MODEL) -> AsyncGenerator[str, None]:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://system-os.vercel.app",
        "X-Title": "SYSTEM OS",
    }
    payload = {"model": model, "messages": messages, "stream": True, "max_tokens": 800}

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            async with client.stream("POST", OPENROUTER_URL, headers=headers, json=payload) as resp:
                if resp.status_code != 200:
                    yield f"data: {json.dumps({'error': f'OpenRouter returned {resp.status_code}'})}\n\n"
                    return
                async for line in resp.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    raw = line[6:]
                    if raw == "[DONE]":
                        yield "data: [DONE]\n\n"
                        return
                    try:
                        chunk = json.loads(raw)
                        delta = chunk["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield f"data: {json.dumps({'content': delta})}\n\n"
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
        except httpx.TimeoutException:
            yield f"data: {json.dumps({'error': 'Request timed out. Try again.'})}\n\n"
        except Exception as e:
            logger.error(f"OpenRouter stream error: {e}")
            if model == PRIMARY_MODEL:
                async for chunk in stream_openrouter(messages, FALLBACK_MODEL):
                    yield chunk


@app.post("/chat")
async def chat(request: Request):
    body        = await request.json()
    user_id:    str  = body.get("user_id", "")
    user_context: dict = body.get("user_context", {})
    messages:   list = body.get("messages", [])
    auth_token: str  = request.headers.get("X-Auth-Token", "")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    if not await verify_user(user_id, auth_token):
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not await check_and_increment_rate_limit(user_id):
        raise HTTPException(status_code=429, detail=f"Daily limit of {DAILY_LIMIT} requests reached. Resets at midnight.")

    # Confidentiality guard — check last user message
    last_user_msg = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
    if is_confidential(last_user_msg):
        return StreamingResponse(
            confidential_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    system_message = {"role": "system", "content": build_system_prompt(user_context)}
    full_messages  = [system_message] + messages[-12:]  # keep last 6 turns (12 messages)

    return StreamingResponse(
        stream_openrouter(full_messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/csp-report")
async def csp_report(request: Request):
    try:
        body = await request.json()
        logger.warning(f"CSP VIOLATION: {json.dumps(body)}")
    except Exception:
        pass
    return {"ok": True}


@app.get("/health")
async def health():
    return {"status": "ok", "model": PRIMARY_MODEL}
