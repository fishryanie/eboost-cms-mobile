# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# UI QUALITY

For every UI change, pay close attention to screen scale, visual balance, color harmony, spacing, and component size. Product aesthetics are a top priority.

# THEME COMPONENTS

All downloaded or generated code MUST use `ThemedView` instead of `View`, and `ThemedText` instead of `Text`. These components are available in `src` (e.g. `import { ThemedView, ThemedText } from 'components/base'`). All separate styles should be converted into props of the `ThemedView` and `ThemedText` components directly (e.g. `<ThemedView flex={1} backgroundColor="red" />` instead of passing them to the `style` prop or using StyleSheet).

# BOTTOM SHEET LIFECYCLE

Treat `@gorhom/bottom-sheet` modal lifecycle code as fragile. Follow the established project pattern whenever adding or changing a `BottomSheetModal`:

- Present the modal from an effect only after its required data/ID exists, and defer `ref.current?.present()` with `requestAnimationFrame`. Cancel that frame in the effect cleanup.
- Keep an `isPresentedRef` guard so dismiss and `onDismiss` handling are idempotent.
- A close button must call `ref.current?.dismiss()` only. Do not also call the parent `onClose` callback there; finalize parent state and cleanup from `onDismiss`. Calling both causes duplicate dismiss transitions and can leave the modal stuck in `DISMISSING`.
- When the parent changes `open` to `false` for navigation or another action, let the visibility effect perform the single dismiss transition.
- Test all three cases on a simulator/device: first open, backdrop/close-button dismissal, and reopening the same sheet. After Bottom Sheet lifecycle edits, perform a full Expo reload before the final verification because Fast Refresh can preserve stale native/modal state and produce misleading results.

# SCRATCH FILES & CLEANUP

DO NOT create temporary/scratch files (e.g., `test-*`, `print-*`, `fix-*`, `get-*`, `*.py`) in the project root or inside `src/`. If you need scratch scripts or test files, always use the `<appDataDir>/brain/<conversation-id>/scratch/` directory. If you absolutely must create temporary files in the project for execution context, you MUST clean them up immediately after use.
