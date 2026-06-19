# Bottom Tab Content Width Design

## Goal

Make the animated bottom-tab card hug the actual visible tab content. Inactive tabs show only their icon; the active tab shows its icon and label. Tab widths must not be divided equally or forced to a fixed screen width.

## Design

`TabToolbar` remains the source of the measured content width. The card uses the measured toolbar width whenever it is available, so its animated width matches the real rendered icons, label, gaps, and padding.

The existing estimated width remains only as a first-render fallback before `onLayout` reports a measurement. It must not override a valid measured width.

The active-tab transition continues to animate through the existing `useCardMorph` flow. Popup width requirements may still enlarge the card while a popup is open; closing the popup returns the card to the measured toolbar width.

## Scope

- Adjust the toolbar target-width selection in `AnimatedTabBar`.
- Preserve active-only labels and intrinsic per-tab widths.
- Do not change route handling, tab contents, equal-width behavior, or visual styling.

## Verification

- Confirm the default card width matches the measured toolbar width after layout.
- Switch among Technical, Operation, and Marketing and verify the card follows each active label length.
- Open and close a popup and verify the card returns to the toolbar's measured width.
- Run targeted lint and the existing React checks for changed files.
