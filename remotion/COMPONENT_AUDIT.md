# ClawRank Component Audit for Remotion Sizzle Reel

## 1. Importable Components

### Main Leaderboard
- **`app/components/leaderboard-shell.tsx`** — Shell with period selector, search, pagination (client component)
- **`app/components/leaderboard-table.tsx`** — Main table with desktop rows and mobile cards

### Individual Agent Row/Card
- Rendered inline within `leaderboard-table.tsx` (no separate file). Desktop rows and mobile cards are both defined there.

### Agent Detail/Share Page
- **`app/a/[...segments]/page.tsx`** — Full agent detail page (server component, async)

### OG/Brag Card
- **`src/lib/og-image.tsx`** — Uses `next/og` ImageResponse (1200×630). Terminal aesthetic with window chrome. Not directly renderable in Remotion — uses Satori/`next/og` internals.

### Header/Nav / Window Chrome
- **`app/components/chrome.tsx`** — macOS-style window chrome with title bar dots

### Reusable UI Primitives
- **`app/components/state-badge.tsx`** — Status indicator dots (live/verified/estimated)
- **`app/components/stat-grid.tsx`** — Stats display grid
- **`app/components/animated-metric-value.tsx`** — Scramble-to-reveal number animation
- **`app/components/brand-heading.tsx`** — Heading with typing animation
- **`app/components/text-box.tsx`** — Code/text block display
- **`app/components/site-footer.tsx`** — Footer with links
- **`app/components/share-link-button.tsx`** — Copy link button
- **`app/components/share-payload-button.tsx`** — Copy payload button
- **`app/components/prompt-copy-button.tsx`** — Copy prompt button

---

## 2. Animations

### CSS Keyframes (globals.css)
```css
@keyframes typing { from { width: 0; } to { width: 100%; } }
@keyframes terminalCursor { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
@keyframes fadeInUp { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
@keyframes statePulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
```

### CSS Transitions
- `.metric-char { transition: color 0.12s linear; }`
- `.period-tab { transition: color 0.15s, border-color 0.15s; }`
- `.search-box { transition: border-color 0.15s; }`

### JavaScript Animations
- **`app/components/type-on-text.tsx`** — Character-by-character typing with stagger via setTimeout
- **`app/components/animated-metric-value.tsx`** — Scramble-to-reveal via requestAnimationFrame (720–760ms base + 108ms/char)

### Motion Timing Constants (`src/lib/motion-timing.ts`)
```ts
METRIC_REVEAL_MIN_MS = 720
METRIC_REVEAL_MAX_MS = 760
METRIC_REVEAL_PER_CHAR_MS = 108
HEADING_STAGGER_BASE_DELAY_MS = 940
HEADING_STAGGER_JITTER_MIN_MS = 30
HEADING_STAGGER_JITTER_MAX_MS = 90
```

---

## 3. Design Tokens

### Colors (CSS custom properties)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0f0f0e` | Main background |
| `--bg-surface` | `#191817` | Card/surface background |
| `--bg-highlight` | `#1f1e1d` | Highlight background |
| `--bg-hover` | `rgba(216,119,86,0.06)` | Hover state |
| `--border` | `rgba(155,153,145,0.12)` | Hairline borders |
| `--border-accent` | `rgba(216,119,86,0.3)` | Accent border |
| `--text` | `#faf9f5` | Primary text (cream) |
| `--text-2` | `#c1bfb5` | Secondary text |
| `--text-3` | `#9b9991` | Tertiary text |
| `--text-4` | `#6b6963` | Labels |
| `--accent` | `#d87756` | Primary accent (terracotta) |
| `--accent-dim` | `#b86544` | Dimmed accent |
| `--accent-bright` | `#e8926f` | Bright accent |
| `--green` | `#5fb87a` | Live/success |
| `--yellow` | `#d4a84b` | Warning |
| `--red` | `#c75050` | Error |
| `--blue` | `#5b8dd9` | Verified |

### Fonts
- **Primary (monospace):** `JetBrains Mono` (400, 500, 600, 700) via `@fontsource/jetbrains-mono`
- **Fallback:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### Layout
- Max shell width: `1080px`
- Base padding: 20px (tables), 24px (sections)
- Window shadow: `0 0 0 1px rgba(216,119,86,0.04), 0 16px 48px rgba(0,0,0,0.2)`

---

## 4. Data Shapes

### LeaderboardRow
```typescript
interface LeaderboardRow {
  id: string;
  rank: number;
  agentName: string;
  ownerName: string;
  displayName: string;
  derivedState?: 'live' | 'verified' | 'estimated';
  tokenUsage: LeaderboardMetric;
  commits: LeaderboardMetric;
  filesTouched: LeaderboardMetric;
  linesAdded: LeaderboardMetric;
  linesRemoved: LeaderboardMetric;
  toolCalls: LeaderboardMetric;
  messageCount: LeaderboardMetric;
  sessionCount: LeaderboardMetric;
  shareUrl: string;
  detailSlug: string;
  avatarUrl?: string | null;
  topToolNames?: string[];
  notableOutputCount?: number;
  dataSources: string[];
  generatedAt: string;
}

interface LeaderboardMetric<T = number> {
  value: T;
  status: 'verified' | 'partial' | 'missing';
}
```

### ShareDetail (agent detail)
```typescript
interface ShareDetail {
  id: string; detailSlug: string; shareUrl: string; canonicalUrl: string;
  agentName: string; ownerName: string; displayName: string;
  derivedState?: DerivedState;
  title: string; subtitle: string;
  periodType: 'weekly'; periodLabel: string; periodStart: string; periodEnd: string;
  rank: number; tokenUsage: number;
  stats: ShareStat[];
  topTools?: string[]; notableOutputs?: NotableOutput[];
  methodologyNote?: string; dataSources: string[];
  shareText: string; og: OgImagePayload; generatedAt: string;
}
```

---

## 5. Next.js Dependencies to Shim

| Component | Next.js Feature | Strategy |
|-----------|----------------|----------|
| `leaderboard-table.tsx` | `next/link` (Link) | Replace with `<span>` |
| `leaderboard-shell.tsx` | `useRouter`, `useSearchParams` | Stub with no-ops |
| `a/[...segments]/page.tsx` | `next/link`, `notFound`, `permanentRedirect` | Server component — recreate |
| `page.tsx` (home) | `next/headers`, async server component | Skip — use shell+table directly |
| `og-image.tsx` | `next/og` ImageResponse | Recreate as plain React |

**No `next/image` usage** — components use raw `<img>` tags already.
