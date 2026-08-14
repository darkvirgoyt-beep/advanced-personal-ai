import { describe, expect, it } from "vitest";
import { buildChatModelOptions } from "./chatModelOptions";

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
      expect.objectContaining({ value: "llama-3.3-70b-versatile", group: "groq" }),
      expect.objectContaining({ value: "custom:8", label: "OpenRouter · NVIDIA Nemotron 3 Ultra · nvidia/nemotron-3-ultra-550b-a55b", group: "configured" }),
    ]));
    expect(options.some(option => option.value === "custom:9")).toBe(false);
    expect(options.some(option => option.value === "custom:10")).toBe(false);
  });

  it("retains an unavailable saved selection so the selector does not hide it", () => {
    const options = buildChatModelOptions({ hasGroqKey: false, models: [], activeModel: "custom:999" });
    expect(options).toEqual([{ value: "custom:999", label: "Unavailable saved model", group: "unavailable" }]);
  });
});
