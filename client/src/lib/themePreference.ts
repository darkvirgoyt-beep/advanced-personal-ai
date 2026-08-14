export type NovaTheme = "light" | "dark";

export const NOVA_THEME_STORAGE_KEY = "nova-theme";

export function readNovaTheme(storage: Pick<Storage, "getItem">, fallback: NovaTheme = "dark"): NovaTheme {
  const value = storage.getItem(NOVA_THEME_STORAGE_KEY);
  return value === "light" || value === "dark" ? value : fallback;
}

export function nextNovaTheme(theme: NovaTheme): NovaTheme {
  return theme === "dark" ? "light" : "dark";
}

export function persistNovaTheme(storage: Pick<Storage, "setItem">, theme: NovaTheme): void {
  storage.setItem(NOVA_THEME_STORAGE_KEY, theme);
}
