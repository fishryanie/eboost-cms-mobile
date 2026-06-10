# Compact User List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Users list into dense rows matching the supplied CMS reference, with verification and login-provider indicators.

**Architecture:** Add a pure provider-detection helper under the Users feature and keep all row presentation inside `UserCard`. Reuse the supplied user fields and Expo Symbols without changing the API contract.

**Tech Stack:** Expo SDK 56, React Native, expo-symbols, TypeScript, node:test

---

### Task 1: Login Provider Detection

**Files:**
- Create: `src/features/users/user-account.ts`
- Modify: `src/features/users/user-data.test.ts`

- [ ] Add failing tests for `gg_`, `a_`, email username, and ordinary username.
- [ ] Run the focused test and confirm failure.
- [ ] Implement `getUserLoginProvider`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Compact User Row

**Files:**
- Modify: `src/features/users/components/user-card.tsx`
- Modify: `src/app/(tabs)/users.tsx`

- [ ] Replace cards with dense separator-based rows.
- [ ] Render avatar and ID badge on the left.
- [ ] Render name, verified phone, provider and verified email in the center.
- [ ] Render user level and balance on the right.
- [ ] Remove Enabled and Open labels.

### Task 3: Verification

**Files:**
- Existing project files only.

- [ ] Run service tests, typecheck, lint, and React Doctor.
- [ ] Reload the Simulator and visually verify the Users list.

## Self-Review

The plan matches the approved screenshot-driven design and does not change API behavior or profile rendering.
