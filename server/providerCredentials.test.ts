import { describe, expect, it } from "vitest";

const timeoutMs = 20_000;
const hasProviderCredentials = Boolean(process.env.HUGGINGFACE_API_KEY && process.env.OPENROUTER_API_KEY);

(hasProviderCredentials ? describe : describe.skip)("configured AI provider credentials", () => {
  it("authenticates the Hugging Face token against the account endpoint", async () => {
    const token = process.env.HUGGINGFACE_API_KEY;
    expect(token).toBeTruthy();

    const response = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeoutMs),
    });

    expect(response.ok).toBe(true);
  });

  it("authenticates the OpenRouter token against the model catalog", async () => {
    const token = process.env.OPENROUTER_API_KEY;
    expect(token).toBeTruthy();

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeoutMs),
    });

    expect(response.ok).toBe(true);
  });
});
