# Web interface

OpenUsage now has a small web preparation layer.

## What works

- same React UI build
- plugin list loaded from `plugins/*/plugin.json`
- usage data loaded from HTTP API instead of Tauri IPC when Tauri commands are unavailable
- static deploy via Docker

## Current scope

- read-only web shell
- expects an API compatible with `docs/local-http-api.md`
- desktop-only bits stay desktop-first (`tray`, `global shortcut`, `start on login`, updater)

## Runtime config

The web build reads `window.__OPENUSAGE_CONFIG__.apiBaseUrl`.

In Docker, set:

```bash
OPENUSAGE_API_BASE_URL=https://your-api.example.com
```

If empty, the UI still loads, but provider cards show a setup badge.

## Docker

Build:

```bash
docker build -t openusage-web .
```

Run:

```bash
docker run --rm -p 8080:80 \
  -e OPENUSAGE_API_BASE_URL=https://your-api.example.com \
  openusage-web
```

Then open `http://localhost:8080`.

## Why this shape

Keep upstream sync easy:

- desktop logic stays in place
- web-only work stays in a small set of files
- plugin metadata comes straight from upstream plugin manifests
- web runtime depends on the existing local HTTP API shape
