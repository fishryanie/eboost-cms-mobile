# Mobile CMS Actions Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first native mobile CMS slice: app foundation, session/API/query plumbing, native operations shell, location list/detail actions, and charger action workflow services.

**Architecture:** Keep routes thin in `src/app`, put behavior in `src/features/*`, and share API/session/query/UI primitives through `src/shared/*`. UI must be React Native mobile-first with bottom sheets and local Reacticx-style primitives, while behavior mirrors the web CMS workflows.

**Tech Stack:** Expo SDK 56, Expo Router, React Native, TanStack Query, `fetch`, `expo-secure-store`, `@gorhom/bottom-sheet`, Reacticx-owned UI primitives, `node:test`/`tsc` for service tests.

---

### Task 1: Dependencies and Test Harness

**Files:**
- Modify: `package.json`
- Create: `tsconfig.tests.json`
- Create: `src/test/node-shim.d.ts`

- [ ] Install native/data dependencies with Expo-compatible versions:

```bash
npx expo install expo-secure-store expo-haptics expo-file-system expo-sharing react-native-svg @shopify/react-native-skia @react-native-async-storage/async-storage
npm install @tanstack/react-query @gorhom/bottom-sheet
npm install --save-dev tsx
```

- [ ] Add scripts:

```json
{
  "test:services": "tsx --test src/**/*.test.ts",
  "typecheck": "tsc --noEmit"
}
```

- [ ] Create `tsconfig.tests.json` only if test compilation needs a separate config. Prefer the app `tsconfig.json`.

### Task 2: Shared API Client

**Files:**
- Create: `src/shared/api/types.ts`
- Create: `src/shared/api/config.ts`
- Create: `src/shared/api/errors.ts`
- Create: `src/shared/api/client.ts`
- Create: `src/shared/api/client.test.ts`

- [ ] Write failing tests for service base URL selection, auth headers, merge-patch content type, query params, and normalized errors.
- [ ] Implement `createApiClient({ getToken, fetchImpl, baseUrls })`.
- [ ] Export `apiRequest`, `setApiSessionTokenGetter`, and `setApiBaseUrls`.

### Task 3: Session and Providers

**Files:**
- Create: `src/shared/session/session-store.ts`
- Create: `src/shared/session/session-store.test.ts`
- Create: `src/shared/query/query-provider.tsx`
- Modify: `src/app/_layout.tsx`

- [ ] Write failing tests for in-memory session fallback behavior.
- [ ] Implement secure-store-backed session helpers.
- [ ] Wrap the app with `GestureHandlerRootView`, `BottomSheetModalProvider`, and `QueryProvider`.

### Task 4: Reacticx-Owned UI Primitives

**Files:**
- Create: `component.config.json`
- Create: `src/shared/ui/button.tsx`
- Create: `src/shared/ui/status-chip.tsx`
- Create: `src/shared/ui/screen.tsx`
- Create: `src/shared/ui/action-sheet.tsx`
- Create: `src/shared/ui/empty-state.tsx`
- Create: `src/shared/ui/index.ts`

- [ ] Add local primitives inspired by Reacticx's copy-into-project model.
- [ ] Use `@gorhom/bottom-sheet` for the action sheet primitive.
- [ ] Keep styles native, compact, and operational.

### Task 5: Location Services and Workflows

**Files:**
- Create: `src/features/locations/types.ts`
- Create: `src/features/locations/location-service.ts`
- Create: `src/features/locations/location-actions.ts`
- Create: `src/features/locations/location-actions.test.ts`
- Create: `src/features/locations/hooks.ts`

- [ ] Write failing tests for visibility guard rules and recursive update request sequence.
- [ ] Implement list/detail service calls.
- [ ] Implement `getLocationVisibilityAction`, `runRecursiveLocationVisibility`, and `restoreLocation`.
- [ ] Add React Query hooks for list/detail/mutations.

### Task 6: Charger Workflow Services

**Files:**
- Create: `src/features/chargers/types.ts`
- Create: `src/features/chargers/charger-service.ts`
- Create: `src/features/chargers/charger-workflows.ts`
- Create: `src/features/chargers/charger-workflows.test.ts`

- [ ] Write failing tests for charger type/identifier helpers, vendor uninstall suffix behavior, MQTT payloads, and replace meter payload sequencing.
- [ ] Implement MQTT requests.
- [ ] Implement workflow helper functions and request orchestration for replace meter and uninstall/reinstall foundations.

### Task 7: Native Operations UI

**Files:**
- Modify: `src/components/app-tabs.tsx`
- Replace: `src/app/index.tsx`
- Replace: `src/app/explore.tsx`
- Create: `src/app/location/[id].tsx`
- Create: `src/features/locations/components/location-card.tsx`
- Create: `src/features/locations/components/location-actions-sheet.tsx`
- Create: `src/features/chargers/components/charger-card.tsx`

- [ ] Replace Expo template screens with Operations and Account/Settings.
- [ ] Implement location list with search, refresh, loading, empty, and error states.
- [ ] Implement location detail with native cards and action sheet.
- [ ] Add charger cards/actions as native UI skeletons wired to service methods where available.

### Task 8: Verification

**Files:**
- Existing project files only.

- [ ] Run `npm run test:services`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npx -y react-doctor@latest . --verbose --diff`.
- [ ] Start Expo with `npm start` and smoke test the native shell.

## Self-Review

This plan covers the approved phase 1 foundation and first module slice. It intentionally does not promise full parity for every future CMS module in one commit. There are no `TBD` placeholders; later modules are out of scope until Locations and Chargers establish the native pattern.
