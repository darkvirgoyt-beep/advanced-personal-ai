import { describe, expect, it, vi } from "vitest";
import { NOVA_THEME_STORAGE_KEY, nextNovaTheme, persistNovaTheme, readNovaTheme } from "./themePreference";

describe("NovaAI theme preferences", () => {
  it("uses a stored valid theme and falls back safely when absent or malformed", () => {
    expect(readNovaTheme({ getItem: () => "light" } as Storage)).toBe("light");
    expect(readNovaTheme({ getItem: () => "neon" } as Storage)).toBe("dark");
    expect(readNovaTheme({ getItem: () => null } as Storage, "light")).toBe("light");
  });

  it("toggles and persists the selected theme", () => {
    const setItem = vi.fn();
    const nextTheme = nextNovaTheme("dark");
    persistNovaTheme({ setItem } as Storage, nextTheme);
    expect(nextTheme).toBe("light");
    expect(setItem).toHaveBeenCalledWith(NOVA_THEME_STORAGE_KEY, "light");
  });
});
