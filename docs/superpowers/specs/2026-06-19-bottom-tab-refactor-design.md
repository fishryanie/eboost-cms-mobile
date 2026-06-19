# Bottom Tab Refactor Design

## Goal

Make the custom bottom tab substantially easier to understand and edit by removing unnecessary files, abstractions, types, and wrappers. Preserve the current rendered UI, animations, gestures, popup actions, navigation behavior, safe-area handling, and accessibility behavior.

## Scope

The refactor covers:

- `src/components/animated-tab-bar/`
- `src/components/app-tabs.tsx`
- `src/components/tab-icon.tsx` only where simplification does not affect its other consumers

The Technical, Operation, and Marketing screen implementations are out of scope. Existing uncommitted work outside the files above must remain untouched.

## Target Structure

Keep at most four implementation files:

1. `src/components/app-tabs.tsx` owns the three Expo Router tab declarations and their route metadata.
2. `src/components/animated-tab-bar/index.tsx` owns tab rendering, measurements, transition state, and Reanimated motion.
3. `src/components/animated-tab-bar/popup.tsx` owns popup action construction and popup content rendering.
4. `src/components/tab-icon.tsx` remains the shared icon mapping because it is also consumed outside the bottom tab.

Delete the current `components/`, `hooks/`, `motion.ts`, `styles.ts`, and `types.ts` files after their necessary behavior has been folded into the target files. Do not retain re-export files, compatibility wrappers, or one-use abstractions.

## Simplification Rules

- Inline types that are used only once; retain named types only when they clarify a public boundary or non-trivial state.
- Replace pass-through components and hooks with direct code when this reduces indirection without duplicating behavior.
- Co-locate animation constants with the animation code that uses them.
- Use `ThemedView` and `ThemedText` for themed primitives and express their separate styles as component props, following the project instructions.
- Keep React Native, Reanimated, GlassView, safe-area, and Expo Router behavior unchanged.
- Prefer inferred types and small local helpers over broad exported interfaces.

## Behavior Contract

The refactored tab bar must preserve:

- The Technical, Operation, and Marketing tabs, their order, labels, icons, and routes.
- The active/inactive tab appearance and morph animation.
- Opening the active tab's popup and closing it via the backdrop, navigation, or action selection.
- Popup contents and destinations for every route.
- Card size, panel direction, toolbar measurement, safe-area spacing, glass styling, and divider motion.
- Platform-specific inactive-screen behavior.
- Existing accessibility labels and roles.

## Verification

Before refactoring, capture the current route metadata and popup-action behavior in focused characterization tests where the existing project tooling permits. During implementation, use small red/green refactor steps.

After refactoring:

- Run the focused tests.
- Run `npm run typecheck`.
- Run `npm run lint` for the affected codebase.
- Inspect the final diff to confirm that unrelated working-tree changes were not modified.
- Launch the app and verify all three tabs, repeated active-tab presses, every popup action, backdrop close, animation direction, and bottom safe-area spacing.

## Success Criteria

- No observable UI or behavior change.
- At most four bottom-tab implementation files remain.
- All redundant bottom-tab files and dead exports are deleted.
- Total code and indirection are materially lower than the current 1,086 lines across 19 files.
- The resulting flow can be followed from `app-tabs.tsx` into one tab-bar implementation file and one popup file.
