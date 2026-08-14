# Kie AI API Integration Notes

Sources checked on 2026-08-14:

- [Getting Started](https://docs.kie.ai/)
- [Market quickstart](https://docs.kie.ai/market/quickstart)
- [Claude Sonnet 4.5 API](https://docs.kie.ai/market/claude/claude-sonnet-4-5)
- [Get task details](https://docs.kie.ai/market/common/get-task-detail)

Kie API keys must remain server-side. Requests use `Authorization: Bearer <API_KEY>` with JSON bodies. Kie's Market includes media-generation models as asynchronous tasks plus chat-model endpoints. The generic Market task flow is `POST https://api.kie.ai/api/v1/jobs/createTask`, followed by `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=<taskId>`; task creation returning HTTP 200 means only that the task was accepted.

The Market documentation lists Gemini 2.5 Flash and Gemini 2.5 Pro as chat models. Kie's Claude documentation describes direct `POST /claude/v1/messages` calls with a `model`, chronological user/assistant `messages`, optional `stream`, and `max_tokens`. Its authentication note calls for an API-key header and Anthropic version header. Model-specific API documentation must be used for endpoints and required inputs; media-generation models cannot be treated as generic chat models.

Implementation choice: retain Nova's existing custom-model support for generic OpenAI-compatible providers, then add Kie as a distinct server-side provider with documented chat-model presets. API keys are stored in the existing provider record and are never returned to the browser. Any later Kie media-generation flow should use the asynchronous task create/status endpoints and model-specific input forms.

## Verification note

The sandbox preview capture on 2026-08-14 loaded only the dark application shell because it did not carry a browser workspace session. Browser-console logs showed no client exception, and the production build plus router-level tests validate the controls and routes. Repository selection and Kie configuration must also be manually exercised from an authenticated Nova workspace after deployment.

## OpenRouter Neutron provider note

Official OpenRouter sources checked on 2026-08-14 identify the requested model as **NVIDIA Nemotron 3 Ultra**, with model identifier `nvidia/nemotron-3-ultra-550b-a55b`. It uses OpenRouter's OpenAI-compatible chat-completions endpoint: `https://openrouter.ai/api/v1/chat/completions`. Nova should expose this as a per-workspace provider preset and use the existing encrypted custom-model key field; the API credential supplied in conversation must not be committed to source code, project notes, or a shared project environment.

Sources:

- https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b
- https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion

## Model indicator metadata

Sources checked on 2026-08-14 for in-chat selector indicators:

- Groq’s supported-model table publishes **560 tokens/second** and **$0.05 input / $0.08 output per million tokens** for `llama-3.1-8b-instant`, plus **280 tokens/second** and **$0.59 input / $0.79 output per million tokens** for `llama-3.3-70b-versatile`: https://console.groq.com/docs/models
- OpenRouter’s NVIDIA Nemotron 3 Ultra comparison listing publishes **$0.50 input / $2.20 output per million tokens** for `nvidia/nemotron-3-ultra-550b-a55b`: https://openrouter.ai/compare/nvidia/nemotron-3-ultra-550b-a55b/nvidia/nemotron-3-super-120b-a12b
- Kie’s Gemini 2.5 Flash and Pro product listings describe Flash as its lower-latency option and Pro as its advanced reasoning option. The price labels are provider-published estimates and should always be presented as per-million-token input/output figures, not a quote or billing guarantee: https://kie.ai/gemini-2.5-flash and https://kie.ai/gemini-2.5-pro

Implementation policy: Nova displays current published rate estimates only where known, clearly labels them as **estimate** or **provider-dependent**, and never invents a token price or latency number for user-defined models. Actual charges, queue time, and end-to-end response time remain provider- and request-dependent.
