import { invoke } from "@tauri-apps/api/core"
import type { PluginMeta, PluginOutput } from "@/lib/plugin-types"
import { getApiBaseUrl, isWebRuntimeConfigured } from "@/lib/runtime-config"
import { listWebPlugins } from "@/lib/web-plugin-registry"

type UsageSnapshot = {
  providerId: string
  displayName: string
  plan?: string
  lines: PluginOutput["lines"]
  fetchedAt: string
}

function buildPlaceholderOutput(plugin: PluginMeta, text: string): PluginOutput {
  return {
    providerId: plugin.id,
    displayName: plugin.name,
    plan: undefined,
    iconUrl: plugin.iconUrl,
    lines: [{ type: "badge", label: "Status", text }],
  }
}

export async function listAvailablePlugins(): Promise<PluginMeta[]> {
  try {
    return await invoke<PluginMeta[]>("list_plugins")
  } catch (error) {
    if (!isWebRuntimeConfigured()) throw error
    return listWebPlugins()
  }
}

export async function loadWebProbeOutputs(pluginIds?: string[]): Promise<PluginOutput[]> {
  const plugins = await listAvailablePlugins()
  const selectedPlugins = pluginIds
    ? plugins.filter((plugin) => pluginIds.includes(plugin.id))
    : plugins

  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    return selectedPlugins.map((plugin) =>
      buildPlaceholderOutput(plugin, "Set OPENUSAGE_API_BASE_URL")
    )
  }

  const response = await fetch(`${apiBaseUrl}/v1/usage`)
  if (!response.ok) {
    throw new Error(`Failed to fetch usage (${response.status})`)
  }

  const snapshots = (await response.json()) as UsageSnapshot[]
  const snapshotsByProviderId = new Map(
    snapshots.map((snapshot) => [snapshot.providerId, snapshot])
  )

  return selectedPlugins.map((plugin) => {
    const snapshot = snapshotsByProviderId.get(plugin.id)
    if (!snapshot) {
      return buildPlaceholderOutput(plugin, "No cached data yet")
    }

    return {
      providerId: snapshot.providerId,
      displayName: snapshot.displayName,
      plan: snapshot.plan,
      iconUrl: plugin.iconUrl,
      lines: snapshot.lines,
    }
  })
}
