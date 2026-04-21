import { LazyStore } from "@tauri-apps/plugin-store";
import type { PluginMeta } from "@/lib/plugin-types";

// Refresh cooldown duration in milliseconds (5 minutes)
export const REFRESH_COOLDOWN_MS = 300_000;

// Spec: persist plugin order + disabled list; new plugins append, default disabled unless in DEFAULT_ENABLED_PLUGINS.
export type PluginSettings = {
  order: string[];
  disabled: string[];
};

export type AutoUpdateIntervalMinutes = 5 | 15 | 30 | 60;

export type ThemeMode = "system" | "light" | "dark";

export type DisplayMode = "used" | "left";

export type ResetTimerDisplayMode = "relative" | "absolute";

export type MenubarIconStyle = "provider" | "bars" | "donut";

export type GlobalShortcut = string | null;

const SETTINGS_STORE_PATH = "settings.json";
const PLUGIN_SETTINGS_KEY = "plugins";
const AUTO_UPDATE_SETTINGS_KEY = "autoUpdateInterval";
const THEME_MODE_KEY = "themeMode";
const DISPLAY_MODE_KEY = "displayMode";
const RESET_TIMER_DISPLAY_MODE_KEY = "resetTimerDisplayMode";
const MENUBAR_ICON_STYLE_KEY = "menubarIconStyle";
const LEGACY_TRAY_ICON_STYLE_KEY = "trayIconStyle";
const LEGACY_TRAY_SHOW_PERCENTAGE_KEY = "trayShowPercentage";
const GLOBAL_SHORTCUT_KEY = "globalShortcut";
const START_ON_LOGIN_KEY = "startOnLogin";
const WEB_SETTINGS_STORAGE_KEY = "openusage.web.settings";

export const DEFAULT_AUTO_UPDATE_INTERVAL: AutoUpdateIntervalMinutes = 15;
export const DEFAULT_THEME_MODE: ThemeMode = "system";
export const DEFAULT_DISPLAY_MODE: DisplayMode = "left";
export const DEFAULT_RESET_TIMER_DISPLAY_MODE: ResetTimerDisplayMode = "relative";
export const DEFAULT_MENUBAR_ICON_STYLE: MenubarIconStyle = "provider";
export const DEFAULT_GLOBAL_SHORTCUT: GlobalShortcut = null;
export const DEFAULT_START_ON_LOGIN = false;

const AUTO_UPDATE_INTERVALS: AutoUpdateIntervalMinutes[] = [5, 15, 30, 60];
const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];
const DISPLAY_MODES: DisplayMode[] = ["used", "left"];
const RESET_TIMER_DISPLAY_MODES: ResetTimerDisplayMode[] = ["relative", "absolute"];
const MENUBAR_ICON_STYLES: MenubarIconStyle[] = ["provider", "donut", "bars"];

export const MENUBAR_ICON_STYLE_OPTIONS: { value: MenubarIconStyle; label: string }[] = [
  { value: "provider", label: "Plugin" },
  { value: "donut", label: "Donut" },
  { value: "bars", label: "Bars" },
];

export const AUTO_UPDATE_OPTIONS: { value: AutoUpdateIntervalMinutes; label: string }[] =
  AUTO_UPDATE_INTERVALS.map((value) => ({
    value,
    label: value === 60 ? "1 hour" : `${value} min`,
  }));

export const THEME_OPTIONS: { value: ThemeMode; label: string }[] =
  THEME_MODES.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }));

export const DISPLAY_MODE_OPTIONS: { value: DisplayMode; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "used", label: "Used" },
];

export const RESET_TIMER_DISPLAY_OPTIONS: { value: ResetTimerDisplayMode; label: string }[] = [
  { value: "relative", label: "Relative" },
  { value: "absolute", label: "Absolute" },
];

const store = new LazyStore(SETTINGS_STORE_PATH);

function canUseWebSettingsFallback(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readWebSettingsState(): Record<string, unknown> {
  if (!canUseWebSettingsFallback()) return {};
  const raw = window.localStorage.getItem(WEB_SETTINGS_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore corrupt web cache and rebuild on next save.
  }

  return {};
}

function writeWebSettingsState(next: Record<string, unknown>): void {
  if (!canUseWebSettingsFallback()) return;
  window.localStorage.setItem(WEB_SETTINGS_STORAGE_KEY, JSON.stringify(next));
}

async function storeGet<T>(key: string): Promise<T | undefined> {
  try {
    return await store.get<T>(key);
  } catch (error) {
    if (!canUseWebSettingsFallback()) throw error;
    return readWebSettingsState()[key] as T | undefined;
  }
}

async function storeSet(key: string, value: unknown): Promise<void> {
  try {
    await store.set(key, value);
  } catch (error) {
    if (!canUseWebSettingsFallback()) throw error;
    const next = readWebSettingsState();
    next[key] = value;
    writeWebSettingsState(next);
  }
}

async function storeSave(): Promise<void> {
  try {
    await store.save();
  } catch (error) {
    if (!canUseWebSettingsFallback()) throw error;
  }
}

async function storeDelete(key: string): Promise<void> {
  const maybeDelete = (store as unknown as LegacyStoreWithDelete).delete;
  try {
    if (typeof maybeDelete === "function") {
      await maybeDelete.call(store, key);
      return;
    }
    await store.set(key, null);
  } catch (error) {
    if (!canUseWebSettingsFallback()) throw error;
    const next = readWebSettingsState();
    delete next[key];
    writeWebSettingsState(next);
  }
}

const DEFAULT_ENABLED_PLUGINS = new Set(["claude", "codex", "cursor"]);

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  order: [],
  disabled: [],
};

export async function loadPluginSettings(): Promise<PluginSettings> {
  const stored = await storeGet<PluginSettings>(PLUGIN_SETTINGS_KEY);
  if (!stored) return { ...DEFAULT_PLUGIN_SETTINGS };
  return {
    order: Array.isArray(stored.order) ? stored.order : [],
    disabled: Array.isArray(stored.disabled) ? stored.disabled : [],
  };
}

export async function savePluginSettings(settings: PluginSettings): Promise<void> {
  await storeSet(PLUGIN_SETTINGS_KEY, settings);
  await storeSave();
}

function isAutoUpdateInterval(value: unknown): value is AutoUpdateIntervalMinutes {
  return (
    typeof value === "number" &&
    AUTO_UPDATE_INTERVALS.includes(value as AutoUpdateIntervalMinutes)
  );
}

export async function loadAutoUpdateInterval(): Promise<AutoUpdateIntervalMinutes> {
  const stored = await storeGet<unknown>(AUTO_UPDATE_SETTINGS_KEY);
  if (isAutoUpdateInterval(stored)) return stored;
  return DEFAULT_AUTO_UPDATE_INTERVAL;
}

export async function saveAutoUpdateInterval(
  interval: AutoUpdateIntervalMinutes
): Promise<void> {
  await storeSet(AUTO_UPDATE_SETTINGS_KEY, interval);
  await storeSave();
}

export function normalizePluginSettings(
  settings: PluginSettings,
  plugins: PluginMeta[]
): PluginSettings {
  const knownIds = plugins.map((plugin) => plugin.id);
  const knownSet = new Set(knownIds);

  const order: string[] = [];
  const seen = new Set<string>();
  for (const id of settings.order) {
    if (!knownSet.has(id) || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }
  const newlyAdded: string[] = [];
  for (const id of knownIds) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
      newlyAdded.push(id);
    }
  }

  const disabled = settings.disabled.filter((id) => knownSet.has(id));
  for (const id of newlyAdded) {
    if (!DEFAULT_ENABLED_PLUGINS.has(id) && !disabled.includes(id)) {
      disabled.push(id);
    }
  }
  return { order, disabled };
}

export function arePluginSettingsEqual(
  a: PluginSettings,
  b: PluginSettings
): boolean {
  if (a.order.length !== b.order.length) return false;
  if (a.disabled.length !== b.disabled.length) return false;
  for (let i = 0; i < a.order.length; i += 1) {
    if (a.order[i] !== b.order[i]) return false;
  }
  for (let i = 0; i < a.disabled.length; i += 1) {
    if (a.disabled[i] !== b.disabled[i]) return false;
  }
  return true;
}

function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && THEME_MODES.includes(value as ThemeMode);
}

export async function loadThemeMode(): Promise<ThemeMode> {
  const stored = await storeGet<unknown>(THEME_MODE_KEY);
  if (isThemeMode(stored)) return stored;
  return DEFAULT_THEME_MODE;
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await storeSet(THEME_MODE_KEY, mode);
  await storeSave();
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return typeof value === "string" && DISPLAY_MODES.includes(value as DisplayMode);
}

export async function loadDisplayMode(): Promise<DisplayMode> {
  const stored = await storeGet<unknown>(DISPLAY_MODE_KEY);
  if (isDisplayMode(stored)) return stored;
  return DEFAULT_DISPLAY_MODE;
}

export async function saveDisplayMode(mode: DisplayMode): Promise<void> {
  await storeSet(DISPLAY_MODE_KEY, mode);
  await storeSave();
}

function isResetTimerDisplayMode(value: unknown): value is ResetTimerDisplayMode {
  return (
    typeof value === "string" &&
    RESET_TIMER_DISPLAY_MODES.includes(value as ResetTimerDisplayMode)
  );
}

export async function loadResetTimerDisplayMode(): Promise<ResetTimerDisplayMode> {
  const stored = await storeGet<unknown>(RESET_TIMER_DISPLAY_MODE_KEY);
  if (isResetTimerDisplayMode(stored)) return stored;
  return DEFAULT_RESET_TIMER_DISPLAY_MODE;
}

export async function saveResetTimerDisplayMode(mode: ResetTimerDisplayMode): Promise<void> {
  await storeSet(RESET_TIMER_DISPLAY_MODE_KEY, mode);
  await storeSave();
}

function isMenubarIconStyle(value: unknown): value is MenubarIconStyle {
  return (
    typeof value === "string" &&
    MENUBAR_ICON_STYLES.includes(value as MenubarIconStyle)
  );
}

export async function loadMenubarIconStyle(): Promise<MenubarIconStyle> {
  const stored = await storeGet<unknown>(MENUBAR_ICON_STYLE_KEY);
  if (isMenubarIconStyle(stored)) return stored;
  return DEFAULT_MENUBAR_ICON_STYLE;
}

export async function saveMenubarIconStyle(style: MenubarIconStyle): Promise<void> {
  await storeSet(MENUBAR_ICON_STYLE_KEY, style);
  await storeSave();
}

type LegacyStoreWithDelete = {
  delete?: (key: string) => Promise<void>;
};

async function deleteStoreKey(key: string): Promise<void> {
  await storeDelete(key);
}

export async function migrateLegacyTraySettings(): Promise<void> {
  const [legacyTrayStyle, legacyShowPercentage, currentMenubarStyle] = await Promise.all([
    storeGet<unknown>(LEGACY_TRAY_ICON_STYLE_KEY),
    storeGet<unknown>(LEGACY_TRAY_SHOW_PERCENTAGE_KEY),
    storeGet<unknown>(MENUBAR_ICON_STYLE_KEY),
  ]);

  const hasLegacyTrayStyle = legacyTrayStyle != null;
  const hasLegacyShowPercentage = legacyShowPercentage != null;
  if (!hasLegacyTrayStyle && !hasLegacyShowPercentage) return;

  if (hasLegacyTrayStyle && currentMenubarStyle == null) {
    if (legacyTrayStyle === "bars") {
      await storeSet(MENUBAR_ICON_STYLE_KEY, "bars");
    } else if (legacyTrayStyle === "circle") {
      await storeSet(MENUBAR_ICON_STYLE_KEY, "donut");
    }
  }

  const removals: Promise<void>[] = [];
  if (hasLegacyTrayStyle) removals.push(deleteStoreKey(LEGACY_TRAY_ICON_STYLE_KEY));
  if (hasLegacyShowPercentage) removals.push(deleteStoreKey(LEGACY_TRAY_SHOW_PERCENTAGE_KEY));
  await Promise.all(removals);
  await storeSave();
}

export function getEnabledPluginIds(settings: PluginSettings): string[] {
  const disabledSet = new Set(settings.disabled);
  return settings.order.filter((id) => !disabledSet.has(id));
}

function isGlobalShortcut(value: unknown): value is GlobalShortcut {
  if (value === null) return true;
  return typeof value === "string";
}

export async function loadGlobalShortcut(): Promise<GlobalShortcut> {
  const stored = await storeGet<unknown>(GLOBAL_SHORTCUT_KEY);
  if (isGlobalShortcut(stored)) return stored;
  return DEFAULT_GLOBAL_SHORTCUT;
}

export async function saveGlobalShortcut(shortcut: GlobalShortcut): Promise<void> {
  await storeSet(GLOBAL_SHORTCUT_KEY, shortcut);
  await storeSave();
}

export async function loadStartOnLogin(): Promise<boolean> {
  const stored = await storeGet<unknown>(START_ON_LOGIN_KEY);
  if (typeof stored === "boolean") return stored;
  return DEFAULT_START_ON_LOGIN;
}

export async function saveStartOnLogin(value: boolean): Promise<void> {
  await storeSet(START_ON_LOGIN_KEY, value);
  await storeSave();
}
