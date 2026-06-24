# Sanzo Wada Color Dictionary

A digital color dictionary based on *A Dictionary of Color Combinations*, drawn
from Sanzo Wada's *Haishoku Soukan*, a six-volume study of color harmony
published in 1933 and 1934.

The site presents 348 compact palettes as both historical artifacts and practical
design tools. Each combination is treated as a small lesson in contrast, balance,
and atmosphere, with the page design kept intentionally quiet so the colors can
lead.

## About

Sanzo Wada (1883-1967) was a Japanese artist, teacher, costume designer, kimono
and fashion designer whose work moved between fine art, theater, film, and
visual research. His palettes are still useful today because they describe color
relationships with unusual clarity and restraint.

This website began after finding the book at the Centro Botin museum in
Santander, Spain. It became a way to make Wada's combinations easy to browse,
copy, and reuse in modern projects, while also experimenting with OKLCH color on
the web.

This is a public repository:
[github.com/marcebollin/sanzo-wada-colors](https://github.com/marcebollin/sanzo-wada-colors)

## Features

- Browse all 348 Sanzo Wada color combinations.
- Switch between palettes with persistent route-aware state.
- Copy palette values for use in design and development work.
- View color data converted for modern web color workflows.
- Read contextual notes about the dictionary and the website.

## Tech Stack

- React 19
- Vite
- TanStack Router
- Tailwind CSS
- Motion
- OKLCH color data

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open the local URL printed by Vite, usually
[http://localhost:5173](http://localhost:5173).

## Useful Commands

```bash
pnpm typecheck
pnpm lint
pnpm test:colors
pnpm build
```

## Data

Palette and color data live in [`src/data`](src/data). The conversion script for
CMYK to OKLCH lives in [`scripts/cmyk-to-oklch.mjs`](scripts/cmyk-to-oklch.mjs).
