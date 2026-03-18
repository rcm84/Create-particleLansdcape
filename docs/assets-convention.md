# Assets Convention

Use the `assets/` directory for project-owned media that should travel with the starter kit.

## Recommended structure

```text
assets/
  heightmaps/    # Source heightmaps used by terrain scenes
  textures/      # Optional supplemental textures, masks, or gradients
  screenshots/   # Marketing captures, docs images, or handoff references
```

## Guidance

- Keep production-ready public files in `public/` when they must be served directly by Vite.
- Keep source-of-truth design assets in `assets/` so the starter kit remains organized.
- Store generated or temporary terrain outputs in `public/` only when they are used by demos or examples.
