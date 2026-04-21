import { openUrl } from "@tauri-apps/plugin-opener"

export async function openExternalUrl(url: string): Promise<void> {
  try {
    await openUrl(url)
    return
  } catch (error) {
    if (typeof window !== "undefined") {
      const opened = window.open(url, "_blank", "noopener,noreferrer")
      if (opened !== null && typeof opened !== "undefined") {
        return
      }
    }
    throw error
  }
}
