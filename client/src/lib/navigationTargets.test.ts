import { describe, expect, it } from "vitest";
import { novaNavigationTargets } from "./navigationTargets";

describe("NovaAI navigation targets", () => {
  it("routes both desktop and mobile Profile controls to Settings", () => {
    expect(novaNavigationTargets.profile).toBe("/settings");
  });
});
