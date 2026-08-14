import { describe, expect, it } from "vitest";
import { requestsPrivateSecretEntry, resolveComposerSecretAction } from "./privateSecretIntent";

describe("requestsPrivateSecretEntry", () => {
  it("opens a private flow for explicit requests to enter sensitive values", () => {
    expect(requestsPrivateSecretEntry("open a secret box so I can paste my API key")).toBe(true);
    expect(requestsPrivateSecretEntry("I want to save a private token in the vault")).toBe(true);
    expect(requestsPrivateSecretEntry("give me a password box")).toBe(true);
  });

  it("does not intercept ordinary questions about technical credentials", () => {
    expect(requestsPrivateSecretEntry("What is an API key used for?")).toBe(false);
    expect(requestsPrivateSecretEntry("Explain how token authentication works")).toBe(false);
  });

  it("routes an explicit vault request away from outgoing chat content", () => {
    const action = resolveComposerSecretAction("open a private box for my token", false);
    expect(action).toEqual({ kind: "open-private-vault", request: "open a private box for my token" });
    expect(action).not.toHaveProperty("content");
  });

  it("keeps ordinary messages and attachment workflows on the regular chat path", () => {
    expect(resolveComposerSecretAction("Explain API tokens", false)).toEqual({ kind: "send-chat", content: "Explain API tokens" });
    expect(resolveComposerSecretAction("open a secret box", true)).toEqual({ kind: "send-chat", content: "open a secret box" });
  });
});
