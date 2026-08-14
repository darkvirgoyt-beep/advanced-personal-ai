import { describe, expect, it } from "vitest";
import { EMPTY_LOCAL_MODEL_PERFORMANCE, recommendChatModel, recordLocalModelOutcome } from "./modelRouter";

const options = [
  { value: "llama-3.1-8b-instant", label: "Llama Instant", group: "groq" as const, latency: "Fast", price: "Estimate", priceDetail: "", estimate: true },
  { value: "custom:1", label: "Gemini 2.5 Pro", group: "configured" as const, latency: "Variable", price: "Estimate", priceDetail: "", estimate: true },
  { value: "custom:2", label: "Unavailable saved model", group: "unavailable" as const, latency: "Unavailable", price: "Unavailable", priceDetail: "", estimate: false },
];

describe("NovaAI model router guidance", () => {
  it("recommends available models by mode without selecting unavailable entries", () => {
    expect(recommendChatModel("fast", options).option?.value).toBe("llama-3.1-8b-instant");
    expect(recommendChatModel("research", options).option?.value).toBe("custom:1");
  });

  it("records only model label, outcome counts, and duration in local performance summaries", () => {
    const next = recordLocalModelOutcome(EMPTY_LOCAL_MODEL_PERFORMANCE, { modelLabel: "Gemini 2.5 Pro", durationMs: 381.8, succeeded: true });
    expect(next).toEqual({ attempts: 1, successes: 1, failures: 0, lastDurationMs: 382, lastModelLabel: "Gemini 2.5 Pro" });
    expect(Object.keys(next)).not.toContain("message");
  });
});
