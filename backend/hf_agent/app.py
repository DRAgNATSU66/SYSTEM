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
logger = logging.getLogger("cipher-agent")

app = FastAPI(title="SYSTEM OS — CIPHER AI Backend")

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
PRIMARY_MODEL  = "qwen/qwen3-32b:free"
FALLBACK_MODEL = "google/gemma-3-27b-it:free"
DAILY_LIMIT    = 20

supabase_client: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
)

SYSTEM_PROMPT = """You are CIPHER, the AI core of SYSTEM OS — a gamified life-tracking OS.
The user's current state: {user_context}
Rules: be direct, motivational, brutally honest. Max 200 words unless asked for a detailed plan.
Never fabricate numbers — only reference data from the user context above.
If asked about features not in the context, say you don't have that data right now."""


def build_system_prompt(user_context: dict) -> str:
    return SYSTEM_PROMPT.format(user_context=json.dumps(user_context, separators=(",", ":")))


async def check_and_increment_rate_limit(user_id: str) -> bool:
    """Returns True if allowed, False if rate limit exceeded."""
    if not supabase_client:
        return True  # No Supabase = dev mode, allow all
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
        return True  # Fail open — don't block users on DB errors


async def verify_user(user_id: str, auth_token: str) -> bool:
    """Lightweight auth check — verify the JWT belongs to this user_id."""
    if not supabase_client or not auth_token:
        return bool(user_id)  # Dev mode
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
    payload = {"model": model, "messages": messages, "stream": True, "max_tokens": 512}

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
            # Fallback to secondary model
            if model == PRIMARY_MODEL:
                async for chunk in stream_openrouter(messages, FALLBACK_MODEL):
                    yield chunk


@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    user_id:      str  = body.get("user_id", "")
    user_context: dict = body.get("user_context", {})
    messages:     list = body.get("messages", [])  # [{ role, content }]
    auth_token:   str  = request.headers.get("X-Auth-Token", "")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    if not await verify_user(user_id, auth_token):
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not await check_and_increment_rate_limit(user_id):
        raise HTTPException(status_code=429, detail=f"Daily limit of {DAILY_LIMIT} requests reached. Resets at midnight.")

    system_message = {"role": "system", "content": build_system_prompt(user_context)}
    full_messages  = [system_message] + messages[-10:]  # Keep last 10 turns for context

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
