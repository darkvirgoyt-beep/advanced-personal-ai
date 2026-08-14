import { describe, expect, it } from "vitest";
import { getGitHubConnectionMessage } from "./githubConnection";

describe("GitHub connection interface message", () => {
  it("renders the account linked by a successful OAuth status response", () => {
    const message = getGitHubConnectionMessage({ connected: true, login: "alpha-user" });
    expect(message.title).toBe("Connected to @alpha-user.");
    expect(message.detail).toContain("only to this Nova AI workspace");
  });

  it("explains authorization when no workspace connection exists", () => {
    const message = getGitHubConnectionMessage({ connected: false, login: "" });
    expect(message.title).toBe("Connect your GitHub account.");
    expect(message.detail).toContain("Authorize GitHub");
  });
});
