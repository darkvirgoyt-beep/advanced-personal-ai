import { describe, expect, it } from "vitest";
import { NOVA_AGENT_PROFILES } from "./agentProfiles";

describe("NovaAI specialist agents", () => {
  it("maps each user-visible specialist to a persisted operating mode", () => {
    expect(NOVA_AGENT_PROFILES.map(agent => agent.id)).toEqual(["developer", "research", "creator", "gaming", "system"]);
    expect(NOVA_AGENT_PROFILES.map(agent => agent.mode)).toEqual(["coding", "research", "creative", "gaming", "productivity"]);
  });
});
