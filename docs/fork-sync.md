# Fork sync workflow

Goal: keep this fork close to upstream, re-apply web changes fast.

## Low-diff rule

Keep fork-only work in these paths as much as possible:

- `Dockerfile`
- `.dockerignore`
- `docker/*`
- `.github/workflows/docker-web.yml`
- `public/runtime-config.js`
- `src/lib/runtime-config.ts`
- `src/lib/runtime-client.ts`
- `src/lib/web-plugin-registry.ts`
- small adapter edits in existing UI files
- `docs/web-interface.md`
- `docs/fork-sync.md`

## Update flow

1. fetch upstream
2. merge or rebase upstream main
3. keep upstream plugin changes untouched
4. re-run build + tests
5. verify web shell still reads plugin manifests + HTTP API

## Agent prompt

Use this prompt for a future agent run:

```text
Sync this fork with the latest upstream openusage main branch.

Rules:
- preserve the web shell files and Docker workflow
- keep changes minimal and isolated
- prefer reusing upstream code over re-implementing
- plugin metadata must still come from plugins/*/plugin.json
- web mode must still read usage data from OPENUSAGE_API_BASE_URL using the local HTTP API schema
- after syncing, run build and tests and fix only sync-related breakage
```

## Conflict priority

When upstream changes overlap:

1. keep upstream product behavior
2. re-apply web adapter only where needed
3. avoid touching plugin code unless upstream changed it
