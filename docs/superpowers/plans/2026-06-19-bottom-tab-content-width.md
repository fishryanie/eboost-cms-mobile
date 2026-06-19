# Bottom Tab Content Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the animated bottom-tab card use the real measured toolbar width after layout while retaining an estimated first-render fallback.

**Architecture:** Keep width measurement inside the existing `TabToolbar` → `useDynamicLayout` flow. Select `layout.toolbarW` whenever it is positive; use `estimateToolbarWidth` only before the first measurement, then pass that target into the existing card-morph animation.

**Tech Stack:** Expo Router 56, React Native, React Native Reanimated, TypeScript

---

### Task 1: Prefer measured toolbar width

**Files:**
- Modify: `src/components/animated-tab-bar/index.tsx`
- Test: inline Node regression assertion plus iOS simulator verification

- [ ] **Step 1: Run a failing source regression assertion**

```bash
node -e "const s=require('fs').readFileSync('src/components/animated-tab-bar/index.tsx','utf8'); if (!s.includes('layout.toolbarW > 0 ? layout.toolbarW : estimateToolbarWidth')) throw new Error('measured toolbar width must override the estimate')"
```

Expected: FAIL with `measured toolbar width must override the estimate`.

- [ ] **Step 2: Implement measured-width precedence**

Replace the max-based target with:

```ts
const toolbarTargetW = layout.toolbarW > 0 ? layout.toolbarW : estimateToolbarWidth(items, activeToolbarKey);
```

- [ ] **Step 3: Verify the regression assertion and targeted lint**

```bash
node -e "const s=require('fs').readFileSync('src/components/animated-tab-bar/index.tsx','utf8'); if (!s.includes('layout.toolbarW > 0 ? layout.toolbarW : estimateToolbarWidth')) throw new Error('measured toolbar width must override the estimate')"
npx eslint src/components/animated-tab-bar/index.tsx --no-cache
```

Expected: both commands exit successfully.

- [ ] **Step 4: Verify behavior on iOS**

Start Expo on the booted simulator, switch among Technical, Operation, and Marketing, and confirm inactive tabs remain icon-only while the active tab shows its label and the outer card hugs the measured toolbar content.

- [ ] **Step 5: Review the focused diff**

```bash
git diff --check -- src/components/animated-tab-bar/index.tsx
git diff -- src/components/animated-tab-bar/index.tsx
```

Expected: no whitespace errors and only the target-width selection changes.
