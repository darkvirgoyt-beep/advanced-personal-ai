import { describe, expect, it } from "vitest";
import { buildChatModelOptions, getConfiguredProviderGuidance } from "./chatModelOptions";

describe("buildChatModelOptions", () => {
  it("offers Groq and active keyed custom providers, including Neutron 3 Ultra", () => {
    const options = buildChatModelOptions({
      hasGroqKey: true,
      activeModel: "custom:8",
      models: [
        { id: 8, name: "OpenRouter · NVIDIA Nemotron 3 Ultra", modelName: "nvidia/nemotron-3-ultra-550b-a55b", isActive: "true", hasApiKey: true },
        { id: 9, name: "Needs a key", modelName: "example", isActive: "true", hasApiKey: false },
        { id: 10, name: "Disabled", modelName: "example", isActive: "false", hasApiKey: true },
      ],
    });

    expect(options).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "llama-3.3-70b-versatile", group: "groq", latency: "Fast · 280 tokens/sec", price: "$0.59 in / $0.79 out per 1M" }),
      expect.objectContaining({ value: "custom:8", group: "configured", latency: "Reasoning / variable", price: "$0.50 in / $2.20 out per 1M" }),
    ]));
    expect(options.some(option => option.value === "custom:9")).toBe(false);
    expect(options.some(option => option.value === "custom:10")).toBe(false);
  });

  it("retains an unavailable saved selection so the selector does not hide it", () => {
    const options = buildChatModelOptions({ hasGroqKey: false, models: [], activeModel: "custom:999" });
    expect(options).toEqual([expect.objectContaining({ value: "custom:999", label: "Unavailable saved model · provider information unavailable", group: "unavailable", price: "Unavailable" })]);
  });

  it("shows Kie published estimates and protects custom providers with an honest unknown-cost state", () => {
    const options = buildChatModelOptions({
      hasGroqKey: false,
      activeModel: "custom:2",
      models: [
        { id: 1, name: "Kie AI · Gemini 2.5 Flash", modelName: "gemini-2.5-flash", isActive: "true", hasApiKey: true },
        { id: 2, name: "Private endpoint", modelName: "my-private-model", isActive: "true", hasApiKey: true },
      ],
    });
    expect(options).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "custom:1", latency: "Low-latency / fast", price: "$0.09 in / $0.75 out per 1M", estimate: true }),
      expect.objectContaining({ value: "custom:2", latency: "Provider-dependent latency", price: "Price not published", estimate: false }),
    ]));
  });

  it("explains why a configured provider is hidden until it has a key and is active", () => {
    expect(getConfiguredProviderGuidance([
      { id: 1, name: "OpenRouter · NVIDIA Nemotron 3 Ultra", modelName: "nvidia/nemotron-3-ultra-550b-a55b", isActive: "true", hasApiKey: false },
    ])).toContain("add its API key");

    expect(getConfiguredProviderGuidance([
      { id: 1, name: "OpenRouter · NVIDIA Nemotron 3 Ultra", modelName: "nvidia/nemotron-3-ultra-550b-a55b", isActive: "true", hasApiKey: true },
    ])).toContain("appear in this selector");
  });
});
