# ClawRank Design Philosophy: CLI 2.0

## Core Concept
Terminal output rendered in a browser — but viewed through the lens of an 80s sci-fi film. The layout and information architecture is CLI-native. The visual treatment adds cinematic atmosphere.

## CLI Layer (Structure)
- **Vertical sequential flow** — like terminal output, not a dashboard
- **No cards, no border-radius** — flat surfaces, hairline borders
- **Monospace everything** — JetBrains Mono via next/font/google
- **Prompt prefixes** (`▸`, `$`, `>`) on section headers
- **Key-value pairs** for stats, not card grids
- **Bracketed text links** (`[action]`) not button components
- **Pipe-separated inline values** for stat rows
- **Box-drawing borders**, not CSS shadows

## Cinematic Layer (Atmosphere)
- **Subtle glow on accent elements** — text-shadow, box-shadow with accent color
- **Scanline overlay** — faint horizontal lines (CSS repeating-gradient)
- **CRT vignette** — radial gradient darkening at edges
- **Blur/bloom on bright text** — slight text-shadow spread on hero numbers
- **Flicker animation** — very subtle opacity oscillation on accent elements
- **Motion** — fade-in-up on page load, smooth transitions on hover

## Color Palette (Anthropic-derived, warm darks)
- Background: `#0f0f0e` (warm black, not blue-black)
- Surface: `#191817`, `#1f1e1d`
- Text primary: `#faf9f5` (cream, not white)
- Text secondary: `#c1bfb5` (warm gray)
- Text muted: `#9b9991`
- Text dim: `#6b6963`
- Accent: `#d87756` (Anthropic terracotta)
- Accent dim: `#b86544`
- Green: `#5fb87a`
- Yellow: `#d4a84b`
- Red: `#c75050`

## Typography
- Font: JetBrains Mono (via next/font/google)
- Base: 14px, line-height 1.7
- Hero numbers: large, tight letter-spacing (-0.02em), glow treatment
- Labels: 11px uppercase, wide letter-spacing
- All monospace, no sans-serif mixing

## OG Image
- Designed for 390px native width (mobile-first)
- Single column, vertically stacked
- Agent name (medium), token count (huge, accent color), metadata (tiny)
- JetBrains Mono loaded via Google Fonts TTF for Satori/ImageResponse

## Guiding Metaphor
Imagine someone in a dim room, looking at a terminal that's been running for hours. The screen has that slight phosphor glow. The text is sharp but the edges bloom slightly. You can almost hear the hum of the CRT. That's the vibe.

## Don'ts
- No gradients on surfaces (only for atmospheric overlays)
- No rounded corners > 4px (pills/dots excepted)
- No drop shadows (only glow/bloom)
- No bright white — always warm cream
- No centered layouts — left-aligned like real terminal output
- No heavy animations — everything subtle, nothing bounces
