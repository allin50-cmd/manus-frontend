# SME Voice Agent MVP

Lean Python/FastAPI voice-agent service for SME intake. It uses a Pipecat/LiveKit-style event lifecycle without depending on live telephony or LLM providers yet.

## What It Does

- Accepts a transcript from an inbound call/session.
- Classifies intent deterministically.
- Runs a policy gate that never executes irreversible actions directly.
- Writes meaningful lifecycle events to an append-only audit log.
- Uses Postgres in Docker Compose and a JSONL audit file.

## Local Setup

```bash
cp .env.example .env
docker compose up --build
```

The React control surface is available in the main app at `/voice-agent`. Set
`VITE_VOICE_AGENT_URL` in the frontend environment when the service is not
running at `http://localhost:8080`.

Health check:

```bash
curl http://localhost:8080/health
```

Process a transcript:

```bash
curl -s http://localhost:8080/process-transcript \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "demo-session-001",
    "caller": "+442000000000",
    "transcript": "I need a builder for a renovation in South London"
  }'
```

Expected response shape:

```json
{
  "intent": "construction_lead",
  "risk_level": "low",
  "policy_decision": "ALLOW",
  "next_action": "Route construction enquiry to Accuracy Developments Ltd.",
  "audit_event_id": "..."
}
```

## Running Tests

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
pytest
```

## Environment Variables

| Name | Purpose |
| --- | --- |
| `VOICE_AGENT_PORT` | Local exposed service port, default `8080` |
| `DATABASE_URL` | Postgres URL for audit table writes |
| `AUDIT_LOG_PATH` | Append-only JSONL audit log path |
| `VOICE_AGENT_CORS_ORIGINS` | Comma-separated browser origins allowed to call the service |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Future telephony ingress |
| `DEEPGRAM_API_KEY` | Future speech-to-text provider |
| `ELEVENLABS_API_KEY` | Future text-to-speech provider |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Future realtime room transport |
| `PIPECAT_TRANSPORT` | Future Pipecat transport selector |

## Intent Classes

- `construction_lead`
- `legal_or_compliance`
- `urgent_issue`
- `general_enquiry`
- `unknown`

## Policy Decisions

- `ALLOW`
- `MODIFY`
- `DENY`
- `ESCALATE`

Business routing:

- Construction enquiries in London or South London route to Accuracy Developments Ltd.
- AI, design, software, automation, website, and development enquiries route to UltAi / UltraTech AI.
- Urgent legal or compliance matters escalate to a human.
- Irreversible actions such as signing contracts, submitting filings, deleting records, or transferring money are denied and routed for human review.

## Next Integration Points

- Twilio: receive call webhook and create `session_started`.
- Deepgram: stream speech-to-text into `transcript_received`.
- ElevenLabs: generate safe spoken responses after policy evaluation.
- LiveKit: manage realtime call rooms and participant lifecycle.
- Pipecat: orchestrate transport, STT, deterministic intake logic, policy checks, and TTS.
- UltraCore: receive allowed intake tasks and route them into the operating layer.
- FineGuard: provide richer policy checks for compliance-sensitive transcripts.
- VaultLine: receive audit event copies for long-term tamper-evident storage.
