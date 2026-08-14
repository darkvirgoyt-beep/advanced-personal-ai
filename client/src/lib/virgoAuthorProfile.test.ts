import { describe, expect, it } from "vitest";
import { VIRGO_AUTHOR_PROFILE } from "./virgoAuthorProfile";

describe("VirgoYT author profile", () => {
  it("identifies the creator without inventing social links or unapproved personal details", () => {
    expect(VIRGO_AUTHOR_PROFILE.name).toBe("VirgoYT");
    expect(VIRGO_AUTHOR_PROFILE.attribution).toContain("NovaAI");
    expect(VIRGO_AUTHOR_PROFILE.officialLinksStatus).toMatch(/when approved/i);
    expect(VIRGO_AUTHOR_PROFILE.principles).toHaveLength(3);
  });
});
