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
