# Studio Ordo — Theme & Brand Audit Matrix

> **Date:** 2026-03-16
> **Purpose:** Map every visual mode, combination, and branding implication so the team can decide what to keep, merge, or cut.

---

## 1. System Overview

The theme system has **four independent axes** that combine multiplicatively:

| Axis | Options | Default |
|------|---------|---------|
| **Theme** (visual language) | Fluid · Bauhaus · Swiss · Postmodern · Skeuomorphic | Fluid |
| **Color scheme** | Light · Dark | System preference |
| **Density** | Compact · Normal · Relaxed | Normal |
| **Accessibility preset** | Default · Elderly · Compact · High-contrast · Color-blind (×3) | Default |

Additional fine-grained knobs within Accessibility:

| Setting | Options |
|---------|---------|
| Font size | xs · sm · md · lg · xl |
| Line height | tight · normal · relaxed |
| Letter spacing | tight · normal · relaxed |
| Color-blind mode | none · deuteranopia · protanopia · tritanopia |

**Total raw combinations: 5 themes × 2 schemes × 3 densities × 5 font sizes × 3 line heights × 3 letter spacings × 4 color-blind modes = 5,400**

---

## 2. Theme Profiles

### 2a. Fluid (Default)

| Property | Light | Dark |
|----------|-------|------|
| Font | Geist Sans | Geist Sans |
| Background | `oklch(0.98 0.01 250)` — near-white cool | `oklch(0.14 0.01 250)` — deep navy-black |
| Foreground | `oklch(0.21 0.01 250)` — near-black cool | `oklch(0.98 0.01 250)` — near-white |
| Surface | `oklch(1 0 0)` — pure white | `oklch(0.21 0.01 250)` — dark panel |
| Accent | `oklch(0.21 0.01 250)` — dark | `oklch(0.98 0.01 250)` — light (inverts) |
| Border radius | 1.25rem (large, pill-like) | same |
| Shadows | Layered bloom (5-layer stacked) | Same structure, heavier opacity |
| **Character** | Modern, soft, Apple-like | Matches — coherent pair |

**Brand fit:** ★★★★★ — This IS the brand. Geist Sans, cool blue-gray palette, large radii, layered shadows. Every new component is designed here first.

---

### 2b. Bauhaus

| Property | Light | Dark |
|----------|-------|------|
| Font | Syne | Syne |
| Background | `oklch(0.98 0.01 80)` — warm cream | `oklch(0.15 0 0)` — true black |
| Foreground | `oklch(0.15 0 0)` — true black | `oklch(0.98 0.01 80)` — warm cream |
| Accent | `oklch(0.56 0.19 24)` — Bauhaus red | same |
| Border radius | 10px | same |
| Shadows | Single medium blur | same |
| **Character** | Warm, geometric, editorial | Flat, stark |

**Brand fit:** ★★★☆☆ — Strong character but the warm cream + Syne font diverge significantly from the cool Fluid baseline. The red accent clashes with the neutral Ordo brand. Needs curated component adjustments if kept.

---

### 2c. Swiss Grid

| Property | Light | Dark |
|----------|-------|------|
| Font | Inter | Inter |
| Background | `oklch(1 0 0)` — pure white | `oklch(0 0 0)` — pure black |
| Foreground | `oklch(0 0 0)` — pure black | `oklch(1 0 0)` — pure white |
| Accent | `oklch(0 0 0)` — black | `oklch(1 0 0)` — white (inverts) |
| Border radius | 2px (sharp) | same |
| Shadows | `none` | same |
| **Character** | Stark, typography-first, Müller-Brockmann | Maximum contrast, no decoration |

**Brand fit:** ★★★★☆ — Philosophically aligned (precision, systems). Pure black/white is dramatic. The 2px radius and zero shadows are the opposite of Fluid's soft approach, but it works as an intentional "pro mode." Inter is a safe neutral.

---

### 2d. Postmodern

| Property | Light | Dark |
|----------|-------|------|
| Font | Space Mono | Space Mono |
| Background | `oklch(0.85 0.18 85)` — saturated yellow-green | `oklch(0.25 0.08 85)` — dark olive |
| Foreground | `oklch(0.45 0.3 264)` — vivid purple | `oklch(0.85 0.15 190)` — teal |
| Accent | `oklch(0.7 0.3 328)` — hot pink | `oklch(0.85 0.15 190)` — teal |
| Border radius | `24px 0px 12px 0px` (asymmetric!) | same |
| Shadows | Dual-offset hard shadows (black + accent) | same |
| **Character** | Loud, playful, Memphis-esque | Cyberpunk, neon-on-dark |

**Brand fit:** ★★☆☆☆ — Entertaining but breaks brand coherence. The yellow/purple/pink palette, monospace font, asymmetric corners, and hard shadows are incompatible with "Architecture, retrieval, and execution planning in one thread." Reads as experimental, not authoritative.

---

### 2e. Skeuomorphic

| Property | Light | Dark |
|----------|-------|------|
| Font | System sans-serif (Inter fallback) | same |
| Background | `oklch(0.88 0.02 240)` — blue-gray linen | `oklch(0.18 0.05 250)` — deep blue-black |
| Foreground | `oklch(0.25 0.05 240)` — dark blue-gray | `oklch(0.88 0.02 240)` — light blue-gray |
| Accent | `oklch(0.6 0.18 240)` — steel blue | `oklch(0.65 0.15 240)` — lighter steel blue |
| Border radius | 12px | same |
| Shadows | `inset 0 1px` highlight + outer drop | same |
| **Character** | Tactile, early-macOS, brushed-metal feel | Frosted-glass panels |

**Brand fit:** ★★★☆☆ — The blue-gray palette is close to Fluid but with a nostalgic, textured feel. Could work as a "classic" option. The inset-shadow pattern adds depth. Moderate divergence.

---

## 3. Color Scheme Matrix (Dark × Light)

| Theme | Light → Dark transition quality | Notes |
|-------|--------------------------------|-------|
| **Fluid** | ★★★★★ Seamless | Cool palette inverts cleanly. Accent swaps dark↔light. |
| **Bauhaus** | ★★★★☆ Good | Warm→Stark. Red accent stays, which grounds it. |
| **Swiss** | ★★★★★ Seamless | Pure white↔black. Nothing to get wrong. |
| **Postmodern** | ★★★☆☆ Jarring | Yellow-green → dark olive. Purple → teal. Heavy palette shift. |
| **Skeuomorphic** | ★★★★☆ Good | Linen → deep panel. Blue accent adjusts. Natural. |

---

## 4. Density Matrix

| Density | Container padding | Message gap | Composer | Avatar | Suggestion frame | Best for |
|---------|-------------------|-------------|----------|--------|------------------|----------|
| **Compact** | 1rem | 0.618rem | Tight | ~22px | Narrow | Power users, information-dense |
| **Normal** | 1.618rem | 1rem | Standard | ~26px | Standard | Default, balanced |
| **Relaxed** | 2.618rem | 1.618rem | Spacious | ~32px | Wide | Accessibility, touch interfaces |

**All themes support all densities.** Density tokens are theme-independent (pure spacing). No branding issues here — this axis is safe.

---

## 5. Accessibility Presets Matrix

| Preset | Dark? | Font | Line height | Spacing | Density | Color-blind | Brand impact |
|--------|-------|------|-------------|---------|---------|-------------|-------------|
| **Default** | — | md | normal | normal | normal | none | Baseline |
| **Elderly** | — | xl | relaxed | relaxed | relaxed | none | Low — just bigger/looser |
| **Compact** | — | xs | tight | tight | compact | none | Low — just tighter |
| **High-contrast** | Yes | lg | relaxed | — | — | none | Moderate — forces dark mode |
| **Color-blind (D)** | — | — | — | — | — | deuteranopia | Low — only status colors |
| **Color-blind (P)** | — | — | — | — | — | protanopia | Low — only status colors |
| **Color-blind (T)** | — | — | — | — | — | tritanopia | Low — only status colors |

**Accessibility presets are non-destructive to brand.** They adjust scale/spacing and override only status indicator colors (`--status-success`, `--status-error`). Safe to keep all.

---

## 6. Avatar/Branding Compatibility

The current `ordo-avatar.png` is **white eye on solid black background** (128×128 PNG, 3.9KB).

| Context | Dark mode | Light mode | Issue |
|---------|-----------|------------|-------|
| Navbar brand mark | ✅ Black circle with white eye, high contrast | ✅ Black circle on white bg — reads as intentional branded mark | None — works both modes |
| Chat bubble avatar (24×24) | ✅ Black circle blends into dark surface | ⚠️ Black circle is visible but very high contrast against light bg | May want a lighter variant or rely on the round-full clip to keep it small |
| Chat header (32×32) | ✅ Same as above | ⚠️ Same | Same |
| Hero watermark (SVG) | ✅ 3.5% opacity ghost — barely visible | ✅ Same treatment | None — opacity-based, adapts naturally |

**Recommendation:** The solid-black avatar actually works universally as a "seal" — similar to how a dark logo mark on light background is standard practice. If a softer light-mode treatment is desired, a CSS `filter: invert(1)` in `.dark` context (or two image variants) could be explored later.

---

## 7. Critical Combinations to QA

Of 5,400 total combos, these are the **20 highest-risk** for brand coherence:

| # | Theme | Scheme | Density | Preset | Risk | Why |
|---|-------|--------|---------|--------|------|-----|
| 1 | Postmodern | Light | Normal | Default | 🔴 High | Yellow/purple palette, asymmetric corners, hard shadows — reads like a different product |
| 2 | Postmodern | Dark | Normal | Default | 🔴 High | Olive/teal/pink cyber-palette |
| 3 | Postmodern | Light | Normal | Elderly | 🔴 High | XL font in Space Mono on saturated bg — chaotic |
| 4 | Postmodern | Dark | Compact | Default | 🔴 High | Dense cyberpunk — completely off-brand |
| 5 | Bauhaus | Light | Relaxed | Elderly | 🟡 Medium | XL Syne on warm cream — readable but very different feel |
| 6 | Bauhaus | Light | Normal | Default | 🟡 Medium | Warm cream + red accent vs cool Ordo brand |
| 7 | Bauhaus | Dark | Compact | Default | 🟡 Medium | Dense Syne on black — stark but serviceable |
| 8 | Swiss | Light | Normal | Default | 🟢 Low | Sharp corners, no shadow — different but disciplined |
| 9 | Swiss | Dark | Normal | Default | 🟢 Low | Pure B&W — dramatic, on-brand |
| 10 | Swiss | Light | Compact | Default | 🟢 Low | Compact grid typography — very professional |
| 11 | Skeuomorphic | Light | Normal | Default | 🟡 Medium | Blue-gray linen — nostalgic, slightly off-brand |
| 12 | Skeuomorphic | Dark | Normal | Default | 🟡 Medium | Frosted panels — close to Fluid dark |
| 13 | Fluid | Light | Normal | Default | ✅ Baseline | THE brand reference |
| 14 | Fluid | Dark | Normal | Default | ✅ Baseline | Primary dark mode |
| 15 | Fluid | Light | Compact | Default | ✅ Safe | Brand + denser |
| 16 | Fluid | Dark | Relaxed | Elderly | ✅ Safe | Brand + accessible |
| 17 | Fluid | Light | Normal | High-contrast | ✅ Safe | Forces Fluid dark at larger size |
| 18 | Any | Any | Any | Color-blind (D) | ✅ Safe | Only touches status colors |
| 19 | Any | Any | Any | Color-blind (P) | ✅ Safe | Only touches status colors |
| 20 | Any | Any | Any | Color-blind (T) | ✅ Safe | Only touches status colors |

---

## 8. Recommendations

### Keep as-is (brand-safe)
- **Fluid** (Light + Dark) — primary brand. All density/accessibility combos.
- **Swiss** (Light + Dark) — strong secondary. Philosophically aligned. Minimal risk.
- **All accessibility presets** — these are user-need features, not brand expressions.
- **All density modes** — spacing-only, no brand impact.

### Keep with guardrails
- **Bauhaus** — Consider constraining the accent color to match the Ordo palette (swap red for the dark cool accent). The Syne font and warm cream are the main divergence.
- **Skeuomorphic** — Close enough to Fluid in palette. The inset shadows add nice texture. Consider whether the blue accent should match Fluid's neutral.

### Consider deprecating or demoting
- **Postmodern** — Fun but fundamentally off-brand at every level (palette, font, corners, shadows). If kept, label it as "Experimental" or "Fun mode" in the UI so users understand it's intentionally wild — or limit it to authenticated users as a power-user easter egg.

### Future refinements
- **Avatar light-mode treatment:** The dark avatar mark works as-is on light backgrounds (intentional seal style). If softer blending is desired, consider a CSS `dark:` class swap or generating a second `ordo-avatar-light.png` with dark eye on light/transparent background.
- **Theme count:** 5 themes × 2 color schemes = 10 visual states to maintain. Each new component or design change must be verified in all 10. Consider whether the value of 5 themes justifies the QA cost, or if 3 (Fluid, Swiss, +1) would suffice.

---

## 9. File Reference

| File | Purpose |
|------|---------|
| [src/core/entities/theme.ts](../src/core/entities/theme.ts) | Theme union type |
| [src/components/ThemeProvider.tsx](../src/components/ThemeProvider.tsx) | State management, persistence (4 localStorage keys), DOM application |
| [src/app/globals.css](../src/app/globals.css) L518–L690 | Theme CSS definitions (5 themes × light/dark) |
| [src/app/globals.css](../src/app/globals.css) L7–L150 | Default `:root` tokens, density overrides, hero tokens |
| [src/app/globals.css](../src/app/globals.css) L203–L213 | Default `.dark` overrides |
| [src/lib/shell/shell-commands.ts](../src/lib/shell/shell-commands.ts) L31–L66 | Shell command definitions for theme switching |
| [src/core/use-cases/tools/set-theme.tool.ts](../src/core/use-cases/tools/set-theme.tool.ts) | AI tool: set_theme |
| [src/core/use-cases/tools/adjust-ui.tool.ts](../src/core/use-cases/tools/adjust-ui.tool.ts) | AI tool: adjust_ui (composite) |
| [src/hooks/useUICommands.ts](../src/hooks/useUICommands.ts) | Executes UI commands from AI tool calls |
| [public/ordo-avatar.png](../public/ordo-avatar.png) | Brand avatar (128×128, 3.9KB, white eye on black) |

---

## 10. Combination Count Summary

| Dimension | Count | Cumulative |
|-----------|-------|------------|
| Theme | 5 | 5 |
| × Color scheme | 2 | 10 |
| × Density | 3 | 30 |
| × Font size | 5 | 150 |
| × Line height | 3 | 450 |
| × Letter spacing | 3 | 1,350 |
| × Color-blind mode | 4 | **5,400** |

**Practical QA scope:** Focus on the 10 theme×scheme combos at normal density/default accessibility. That's where brand divergence lives. The remaining 5,390 combos are orthogonal spacing/sizing changes that don't affect brand identity.
