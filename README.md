# ComplianceCopilot

Self-hosted, open-source multi-agent compliance reviewer. Upload a policy document and get an audit-ready gap report against GDPR and the EU AI Act — powered by any LLM you choose.

<!-- Loom demo: replace this URL with your recording -->
<!-- [![Watch the demo](https://cdn.loom.com/sessions/thumbnails/placeholder.png)](https://loom.com/share/placeholder) -->

---

## Quickstart

```bash
git clone https://github.com/your-org/compliancecopilot
cd compliancecopilot
cp .env.example .env
docker compose up
```

Then open [http://localhost:3000](http://localhost:3000), register with a passkey, and add your LLM key in Settings.

---

## Supported LLM Providers

Powered by [LiteLLM](https://docs.litellm.ai) — works with any provider:

| Provider | Example model |
|---|---|
| OpenAI | `gpt-4o`, `gpt-4o-mini` |
| Anthropic | `claude-sonnet-4-6`, `claude-opus-4-7` |
| Google | `gemini/gemini-pro` |
| Ollama (local) | `ollama/llama3` |
| Groq | `groq/llama3-8b-8192` |
| Mistral | `mistral/mistral-large-latest` |
| Azure OpenAI | `azure/<deployment>` |
| AWS Bedrock | `bedrock/anthropic.claude-3-5-sonnet` |

Your API key is **never stored** — it lives in browser memory only and travels as a request header.

---

## Adding a New Compliance Framework

1. Create a YAML file in `frameworks/`:

```yaml
id: my_framework
name: My Compliance Framework
version: "2024"
jurisdiction: Global
requirements:
  - id: mf-art-1
    article: "Article 1"
    title: Requirement title
    description: What this requirement means.
    checks:
      - Does the policy address X?
      - Is Y documented?
    severity: critical  # critical | high | medium | low
```

2. Restart the API container — no code changes needed.

The framework will appear automatically in the job submission UI.

---

## Architecture

```
Browser (Next.js 14)
  └─ LLM key in Zustand (memory only, never persisted)
  └─ Passkey auth (WebAuthn)

FastAPI (Python 3.12)
  └─ LangGraph pipeline:
       Chunker → Retriever → GapAnalyzer → Evidencer → RiskScorer → ReportWriter
  └─ All agents receive LLMClient injected per-request
  └─ Frameworks loaded from YAML at runtime

Storage (self-hosted, your machine only)
  └─ PostgreSQL + pgvector
  └─ Redis
  └─ MinIO (S3-compatible)
```

---

## How to Contribute

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes and add tests
4. Open a pull request — CI will lint, type-check, and run tests automatically

To contribute a new compliance framework, just add a YAML file in `frameworks/` and open a PR.

---

## License

MIT — free to use, modify, and self-host.
