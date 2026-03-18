# Changelog

## Unreleased

### Starter-kit polish
- Restructured the README so the repository reads like a premium downloadable toolkit rather than a raw prototype.
- Added a dedicated `docs/` area with overview, examples, and asset-convention guidance.
- Added an `assets/` convention so teams know where source-of-truth media should live.
- Expanded `package.json` metadata and local demo scripts for a cleaner reusable-toolkit handoff.

### Previous hardening work
- Hardened all public-facing engine classes with centralized defaults, validation, and safer option merging.
- Added idempotent `init()`, `update()`, `resize()`, and `dispose()` lifecycle behavior to `ParticleLandscape`.
- Improved `HeightmapLoader` so it validates dimensions, returns typed arrays consistently, and reports clearer asset-loading failures.
- Made hover, fog, mask, and terrain tiling effects resilient when optional dependencies are missing or disabled.

### Remaining technical risks
- Full portability still depends on teams validating their own deployment targets, GPU limits, and asset budgets.
- Very large heightmaps can still consume significant memory because each sampled pixel becomes a GPU point.
- Infinite tiling reuses cloned `THREE.Points`, so aggressive tile radii can increase draw calls and fill-rate cost.
