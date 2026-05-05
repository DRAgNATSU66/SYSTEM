---
title: SYSTEM OS AI Agent
emoji: ⚡
colorFrom: blue
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# SYSTEM OS — CIPHER AI Backend

FastAPI proxy server for the SYSTEM OS AI agent (Command Center).

## What this does

- Proxies chat requests to OpenRouter (Qwen3-32B:free)
- Per-user rate limiting via Supabase `ai_usage` table (20 req/user/day)
- Streams SSE responses back to the browser
- Logs CSP violations at `/csp-report`

## Required Secrets (set in HF Space settings)

| Secret | Description |
|--------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (bypasses RLS for rate limit writes) |

## Endpoints

- `POST /chat` — streaming chat (SSE)
- `POST /csp-report` — CSP violation logging
- `GET /health` — health check
