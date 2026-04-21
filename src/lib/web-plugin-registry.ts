import type { PluginMeta } from "@/lib/plugin-types"

type PluginManifestLine = {
  type: "text" | "progress" | "badge"
  label: string
  scope: "overview" | "detail"
  primaryOrder?: number
}

type PluginManifestLink = {
  label: string
  url: string
}

type PluginManifest = {
  id: string
  name: string
  brandColor?: string
  links?: PluginManifestLink[]
  lines: PluginManifestLine[]
}

const manifestModules = import.meta.glob("../../plugins/*/plugin.json", {
  eager: true,
  import: "default",
}) as Record<string, PluginManifest>

const iconModules = import.meta.glob("../../plugins/*/icon.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

function pathPluginId(path: string): string {
  const match = path.match(/plugins\/([^/]+)\//)
  return match?.[1] ?? ""
}

export function listWebPlugins(): PluginMeta[] {
  const iconsByPluginId = new Map(
    Object.entries(iconModules).map(([path, iconUrl]) => [pathPluginId(path), iconUrl])
  )

  return Object.entries(manifestModules)
    .map(([, manifest]) => {
      const primaryCandidates = manifest.lines
        .filter((line) => line.type === "progress" && typeof line.primaryOrder === "number")
        .sort((a, b) => (a.primaryOrder ?? 0) - (b.primaryOrder ?? 0))
        .map((line) => line.label)

      return {
        id: manifest.id,
        name: manifest.name,
        iconUrl: iconsByPluginId.get(manifest.id) ?? "",
        brandColor: manifest.brandColor,
        lines: manifest.lines.map((line) => ({
          type: line.type,
          label: line.label,
          scope: line.scope,
        })),
        links: manifest.links,
        primaryCandidates,
      } satisfies PluginMeta
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
