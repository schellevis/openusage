import { useEffect, useState } from "react"
import { getVersion } from "@tauri-apps/api/app"
import { getFallbackAppVersion, isWebRuntimeConfigured } from "@/lib/runtime-config"

export function useAppVersion() {
  const [appVersion, setAppVersion] = useState("...")

  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch((error) => {
        if (isWebRuntimeConfigured()) {
          setAppVersion(getFallbackAppVersion())
        }
        console.error("Failed to get app version:", error)
      })
  }, [])

  return appVersion
}
