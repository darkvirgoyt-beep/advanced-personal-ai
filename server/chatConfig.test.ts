import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildChatContext,
  DEFAULT_NOVA_SYSTEM_PROMPT,
  MAX_CONTEXT_TURNS,
} from "./chatConfig";

describe("Nova chat configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the project-level system prompt before retained conversation turns", () => {
    vi.stubEnv("NOVA_SYSTEM_PROMPT", "Answer as the Nova mission-control assistant.");

    const context = buildChatContext([
      { role: "user", content: "Plan a launch." },
      { role: "assistant", content: "I will outline it." },
    ]);

    expect(context[0]).toEqual({
      role: "system",
      content: "Answer as the Nova mission-control assistant.",
    });
    expect(context.slice(1)).toEqual([
      { role: "user", content: "Plan a launch." },
      { role: "assistant", content: "I will outline it." },
    ]);
  });

  it("keeps the newest bounded multi-turn history with a safe default prompt", () => {
    vi.stubEnv("NOVA_SYSTEM_PROMPT", "");
    const history = Array.from({ length: MAX_CONTEXT_TURNS + 3 }, (_, index) => ({
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: `turn-${index}`,
    }));

    const context = buildChatContext(history);

    expect(context[0].content).toBe(DEFAULT_NOVA_SYSTEM_PROMPT);
    expect(context).toHaveLength(MAX_CONTEXT_TURNS + 1);
    expect(context[1].content).toBe("turn-3");
    expect(context.at(-1)?.content).toBe(`turn-${MAX_CONTEXT_TURNS + 2}`);
  });
});

