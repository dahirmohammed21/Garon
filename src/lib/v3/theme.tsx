import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
export type Preferences = {
  theme: "dark" | "light";
  accent: string;
  density: "normal" | "compact";
  confirmations: boolean;
};
const defaults: Preferences = {
  theme: "dark",
  accent: "#78b5c4",
  density: "normal",
  confirmations: true,
};
function load(): Preferences {
  try {
    const value = JSON.parse(
      localStorage.getItem("garon.v3.preferences") || "{}",
    );
    return {
      theme: value.theme === "light" ? "light" : "dark",
      accent: /^#[0-9a-f]{6}$/i.test(value.accent)
        ? value.accent
        : defaults.accent,
      density: value.density === "compact" ? "compact" : "normal",
      confirmations:
        typeof value.confirmations === "boolean" ? value.confirmations : true,
    };
  } catch {
    return defaults;
  }
}
function foreground(hex: string) {
  const colors = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return colors[0] * 0.2126 + colors[1] * 0.7152 + colors[2] * 0.0722 > 0.179
    ? "#111519"
    : "#ffffff";
}
type ThemeValue = {
  preferences: Preferences;
  update: (value: Partial<Preferences>) => void;
  storageError: boolean;
};
const Context = createContext<ThemeValue | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(load);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.density = preferences.density;
    document.documentElement.style.setProperty("--accent", preferences.accent);
    document.documentElement.style.setProperty(
      "--accent-ink",
      foreground(preferences.accent),
    );
    try {
      localStorage.setItem("garon.v3.preferences", JSON.stringify(preferences));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [preferences]);
  return (
    <Context.Provider
      value={{
        preferences,
        update: (value) =>
          setPreferences((current) => ({ ...current, ...value })),
        storageError,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useTheme() {
  const value = useContext(Context);
  if (!value) throw new Error("Temat kunde inte laddas.");
  return value;
}
