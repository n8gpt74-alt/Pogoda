# Bundle Optimization Design (Viewport Lazy-Loading)

**Date:** 2026-02-21  
**Project:** Wehtrer weather dashboard  
**Status:** Approved for implementation

## 1) Context and Problem

Current build baseline (`npm run build:github`):

- `dist/assets/index-*.js`: **~499 kB**
- `dist/assets/charts-vendor-*.js`: **~405 kB**
- `dist/assets/Weather3D-*.js`: **~895 kB**
- Vite warning: chunks larger than `chunkSizeWarningLimit=600`

The app already has one good optimization: `SafeWeather3D` lazy-loads `Weather3D`. But the dashboard still imports chart widgets synchronously (`TemperatureChart`, `HumidityChart`, `PrecipitationChart`, `WindChart`), so chart code remains too close to the initial render path.

Goal set during brainstorming:

- Reduce initial JS on first screen.
- Allow deferred loading of heavy sections.
- Keep the current dashboard UX structure.
- Target budget: **`index-*.js` below 350 kB** and no >600 kB warning after chunk tuning.

Constraints agreed:

- Fast wins first.
- No chart-library migration in this phase.
- Heavy widgets should load automatically when entering viewport (not by button click).

## 2) Options Considered

### Option A (Chosen): Viewport-lazy heavy widgets + chunk topology tuning

- Keep current layout and feature set.
- Lazy-load heavy modules (`SafeWeather3D` and chart widgets).
- Gate mounting by viewport via `IntersectionObserver`.
- Tune `manualChunks` so heavy vendors are isolated from main entry.

**Why chosen:** best risk/reward ratio; minimal product behavior change; highest chance to hit bundle target in one cycle.

### Option B: Dashboard modes/sections (Basic vs Analytics)

- Do not mount analytics until explicit mode switch.
- Larger JS reduction possible.

**Not chosen now:** larger UX change; requires product-level decisions and redesign.

### Option C: Two-phase plan including chart library migration

- Phase 1 = Option A.
- Phase 2 = replace Recharts with lighter stack.

**Deferred:** valid long-term path, but too risky for quick iteration.

## 3) Target Architecture

### 3.1 High-level approach

Use two layers of deferral:

1. **Code-splitting layer** (module level)
   - `React.lazy(() => import(...))` for heavy widgets.
2. **Mounting layer** (render lifecycle)
   - `LazyWidgetGate` controls if component mounts at all.
   - Until widget is near viewport, show skeleton placeholder only.

This ensures heavy chunks are not requested before needed.

### 3.2 Component responsibilities

#### `src/components/common/LazyWidgetGate.jsx` (new)

Responsibilities:

- Observe viewport visibility (IntersectionObserver).
- Keep internal `hasEntered` flag.
- Render `fallback` until first entry.
- Render children permanently after first entry (`triggerOnce=true` default).

Behavior:

- `rootMargin` default around `200px` to preload slightly before visibility.
- If `IntersectionObserver` unavailable, degrade to immediate render.

#### `src/components/common/WidgetSkeletonCard.jsx` (new)

Responsibilities:

- Stable placeholder for lazy widgets.
- Preserve target height (prevent layout shift).
- Simple visual loading state.

Inputs:

- `title`, `height`, optional `icon`.

#### `src/components/Dashboard/DashboardHeavyWidgets.jsx` (new)

Responsibilities:

- Compose all heavy widgets in one place:
  - `SafeWeather3D`
  - `TemperatureChart`
  - `HumidityChart`
  - `PrecipitationChart`
  - `WindChart`
- Import them with `React.lazy`.
- Wrap each with `LazyWidgetGate + Suspense + skeleton fallback`.
- Wrap chart zone with section error boundary.

#### `src/components/Dashboard/Dashboard.jsx` (update)

Responsibilities stay mostly unchanged.

Change:

- Replace direct heavy widget usage with `DashboardHeavyWidgets` insertion points.
- Keep visual order and card semantics unchanged.

### 3.3 Build chunking (`vite.config.js`)

Move from static object-style chunk map to function `manualChunks(id)` where practical:

- isolate `three`, `@react-three/fiber`, `@react-three/drei` into `three-vendor`
- isolate `recharts` into `charts-vendor`
- keep React core separate
- avoid accidental merge of heavy modules into entry

## 4) Data Flow and Lifecycle

Weather data flow remains unchanged:

- `useWeather()` fetches once at dashboard level.
- Widgets receive existing prepared props (`data?.hourly`, `data?.current`, etc.).
- No new weather API calls are introduced by lazy loading.

Heavy widget lifecycle:

1. Initial render: only skeleton card in DOM.
2. Section nears viewport: `LazyWidgetGate` flips `hasEntered`.
3. Lazy import starts: chunk request begins.
4. While loading: `Suspense` fallback remains visible.
5. On resolve: actual widget mounts with existing props.

Outcome:

- Better first-load JS profile.
- Same weather-domain contracts.
- Predictable user behavior with progressive rendering.

## 5) Error Handling and Degradation

### Existing protection to preserve

`SafeWeather3D` already has:

- WebGL capability guard.
- Error boundary fallback UI.

This remains mandatory.

### New protection

1. `LazyWidgetGate` fallback safety
   - If observer unsupported/fails, render child immediately.
   - Never allow permanent skeleton dead state.

2. Heavy section error boundary
   - Catch lazy import/render errors in chart-heavy area.
   - Show local fallback with retry action.
   - Keep core dashboard operational.

3. Layout stability
   - Skeletons must reserve fixed card heights.
   - Prevent CLS when content swaps from fallback to loaded widget.

4. Logging
   - Console log namespaced (`[HeavyWidget]` / `[Weather3D]`) for diagnosis.

Accepted trade-off:

- First appearance of heavy sections may be delayed on slow networks. This is intentional and preferable to loading heavy code during first screen render.

## 6) Verification Plan

### Functional checks

- Core dashboard functions unchanged (search, refresh, settings, weather blocks).
- Heavy widgets load only when scrolled into/near viewport.
- 3D fallback appears correctly when WebGL unsupported.
- Forced chunk-load failure shows local fallback without collapsing entire page.

### Build and budget checks

- `npm run lint` passes.
- `npm run build:github` passes.
- `index-*.js` target: **<350 kB**.
- No chunk warning above 600 kB after chunk tuning.
- Dist output confirms separate heavy chunks exist.

### Runtime checks

- DevTools Network: heavy chunks not requested before viewport entry.
- Lighthouse mobile: performance improves over current baseline.
- No major layout jumps when widgets load.

## 7) Scope and Non-goals

In scope (phase 1):

- Viewport lazy-gating for 3D + four chart widgets.
- New shared skeleton/gate components.
- Chunk strategy tuning in Vite config.

Out of scope (phase 1):

- Replacing Recharts.
- Redesigning dashboard information architecture.
- Backend/data model changes.

## 8) Definition of Done

Done when all are true:

1. Heavy widgets are code-split and viewport-gated.
2. Core dashboard behavior remains intact.
3. Build passes with reduced initial entry bundle.
4. Target budget (`index < 350 kB`) and warning cleanup achieved or explicitly measured with documented gap.
5. Degradation paths (observer fail, WebGL fail, import fail) are safe and local.

---

## Ready for implementation

Next step after this design: create an isolated implementation workspace (git worktree), then produce a file-by-file execution plan and apply changes in small verifiable commits.
