import { describe, expect, it } from "vitest";
import { NOVA_API_ENDPOINTS, NOVA_API_PLAYGROUND_EXAMPLE, NOVA_ASSISTANT_CONCEPTS } from "./apiDocsCatalog";

describe("NovaAI API documentation catalog", () => {
  it("documents private workspace contracts without exposing provider secrets", () => {
    expect(NOVA_API_ENDPOINTS).toHaveLength(3);
    expect(NOVA_API_ENDPOINTS.map(endpoint => endpoint.path)).toContain("/api/trpc/chat.send");
    expect(JSON.stringify(NOVA_API_ENDPOINTS)).not.toMatch(/api[_-]?key|bearer/i);
    expect(NOVA_API_PLAYGROUND_EXAMPLE).toContain("client.chat.send.mutate");
    expect(NOVA_ASSISTANT_CONCEPTS).toHaveLength(3);
  });
});
