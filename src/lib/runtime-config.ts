type OpenUsageRuntimeConfig = {
  apiBaseUrl?: string
}

function normalizeApiBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.replace(/\/+$/, "")
}

export function getApiBaseUrl(): string | null {
  if (typeof window === "undefined") return null
  return normalizeApiBaseUrl(window.__OPENUSAGE_CONFIG__?.apiBaseUrl)
}

export function isWebRuntimeConfigured(): boolean {
  return typeof window !== "undefined" && typeof window.__OPENUSAGE_CONFIG__ !== "undefined"
}

export function getFallbackAppVersion(): string {
  return __APP_VERSION__
}

export type { OpenUsageRuntimeConfig }
