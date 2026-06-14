# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# UI QUALITY

For every UI change, pay close attention to screen scale, visual balance, color harmony, spacing, and component size. Product aesthetics are a top priority.

# THEME COMPONENTS

All downloaded or generated code MUST use `ThemedView` instead of `View`, and `ThemedText` instead of `Text`. These components are available in `src` (e.g. `import { ThemedView, ThemedText } from 'components/base'`). All separate styles should be converted into props of the `ThemedView` and `ThemedText` components directly (e.g. `<ThemedView flex={1} backgroundColor="red" />` instead of passing them to the `style` prop or using StyleSheet).
