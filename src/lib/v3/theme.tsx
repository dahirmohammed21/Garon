import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
export type Preferences = {
  theme: "dark" | "light";
  accent: string;
  density: "normal" | "compact";
  confirmations: boolean;
};
export const appearanceDefaults: Preferences = {
  theme: "dark",
  accent: "#315099",
  density: "normal",
  confirmations: true,
};
function valid(value: any): value is Preferences {
  return (
    value &&
    ["dark", "light"].includes(value.theme) &&
    /^#[0-9a-f]{6}$/i.test(value.accent) &&
    ["normal", "compact"].includes(value.density) &&
    typeof value.confirmations === "boolean"
  );
}
function load() {
  try {
    const value = JSON.parse(
      localStorage.getItem("garon.v4.preferences") || "null",
    );
    return valid(value) ? value : appearanceDefaults;
  } catch {
    return appearanceDefaults;
  }
}
function foreground(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722 > 0.179
    ? "#111519"
    : "#fff";
}
const Context = createContext<{
  preferences: Preferences;
  update: (value: Partial<Preferences>) => void;
  storageError: boolean;
} | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(load);
  const [storageError, setStorageError] = useState(false);
  const pending = useRef<Preferences | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  async function persist(value: Preferences) {
    try {
      const response = await fetch("/api/v4/ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: value }),
        keepalive: true,
      });
      if (!response.ok) throw new Error();
      if (pending.current === value) pending.current = null;
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/v4/ui")
      .then((r) => r.json())
      .then((value) => {
        if (active && !pending.current && valid(value.preferences))
          setPreferences(value.preferences);
      })
      .catch(() => setStorageError(true));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.density = preferences.density;
    document.documentElement.style.setProperty("--accent", preferences.accent);
    document.documentElement.style.setProperty(
      "--accent-ink",
      foreground(preferences.accent),
    );
    try {
      localStorage.setItem("garon.v4.preferences", JSON.stringify(preferences));
    } catch {
      setStorageError(true);
    }
  }, [preferences]);
  useEffect(() => {
    const flush = () => {
      if (pending.current) void persist(pending.current);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (timer.current) clearTimeout(timer.current);
      flush();
    };
  }, []);
  function update(value: Partial<Preferences>) {
    const next = { ...preferences, ...value };
    setPreferences(next);
    pending.current = next;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(next), 350);
  }
  return (
    <Context.Provider value={{ preferences, update, storageError }}>
      {children}
    </Context.Provider>
  );
}
export function useTheme() {
  const value = useContext(Context);
  if (!value) throw new Error("Temat kunde inte laddas.");
  return value;
}
