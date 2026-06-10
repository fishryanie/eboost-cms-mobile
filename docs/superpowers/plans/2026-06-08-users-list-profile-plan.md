# Users List And Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an infinite, searchable Users bottom tab and a user profile detail screen backed by the provided APIs.

**Architecture:** Keep API parsing and search detection in focused functions under `src/features/users`, expose list/profile data through TanStack Query hooks, and keep Expo Router screens responsible for rendering and navigation. Reuse the existing API client and operational UI styling.

**Tech Stack:** Expo SDK 56, Expo Router, React Native, TanStack Query, TypeScript, node:test

---

### Task 1: Search Detection And Hydra Pagination

**Files:**
- Create: `src/features/users/user-search.ts`
- Create: `src/features/users/user-pagination.ts`
- Create: `src/features/users/user-data.test.ts`

- [ ] Write tests proving email, local phone, `84` phone, 9-10 digit phone, ID, empty search, Hydra member parsing, and next-page parsing.
- [ ] Run `npx tsx --test src/features/users/user-data.test.ts` and confirm it fails because the modules do not exist.
- [ ] Implement `getUserSearchParams`, `parseUsersPage`, and `getNextUsersPage`.
- [ ] Run `npx tsx --test src/features/users/user-data.test.ts` and confirm all tests pass.

### Task 2: User Types, API Service, And Query Hooks

**Files:**
- Create: `src/features/users/types.ts`
- Create: `src/features/users/user-service.ts`
- Create: `src/features/users/hooks.ts`

- [ ] Define focused list, profile, level, and balance-history types matching the supplied responses.
- [ ] Implement `fetchUsersPage` with `page`, `itemsPerPage`, and detected search params.
- [ ] Implement `fetchUserProfile` using `api/controller/user/profile?userId=<id>`.
- [ ] Add `useInfiniteUsers` and `useUserProfile` hooks with stable query keys.
- [ ] Run the users data tests and TypeScript typecheck.

### Task 3: Users List UI

**Files:**
- Create: `src/features/users/components/user-card.tsx`
- Create: `src/app/(tabs)/users.tsx`
- Delete: `src/app/(tabs)/profile.tsx`

- [ ] Build a compact reusable user card showing identity, contact details, balance, level, and status.
- [ ] Build the Users screen with search input, debounce, infinite `FlatList`, pull-to-refresh, total count, initial error/empty states, and load-more retry.
- [ ] Navigate selected users to `/user/[id]`.
- [ ] Run TypeScript typecheck and lint.

### Task 4: User Profile UI

**Files:**
- Create: `src/app/user/[id].tsx`

- [ ] Fetch the selected profile with `useUserProfile`.
- [ ] Render identity, account state, wallet, level, preferences, and balance-history sections.
- [ ] Add loading, error, retry, and missing-ID states.
- [ ] Run TypeScript typecheck and lint.

### Task 5: Users Tab And Popup

**Files:**
- Modify: `src/components/app-tabs.tsx`
- Modify: `src/components/tab-icon.tsx`
- Modify: `src/motion-tabs/components/popup-body.tsx`

- [ ] Replace the final Profile tab with Users and a users icon.
- [ ] Add a Users popup body containing Adjust Balance, Transfer Funds, Change Email, Reset Password, and Change Tier.
- [ ] Keep popup actions as navigation placeholders without implementing mutation workflows.
- [ ] Run TypeScript typecheck and lint.

### Task 6: Verification

**Files:**
- Existing project files only.

- [ ] Run `npm run test:services`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npx -y react-doctor@latest . --verbose --diff`.
- [ ] Start Expo and smoke-test Users list, search, load more, profile navigation, profile rendering, and popup layout.

## Self-Review

The plan covers every approved requirement, keeps the five mutation workflows explicitly out of scope, and uses the existing API/query/navigation patterns. It contains no placeholders or unresolved contract decisions.
