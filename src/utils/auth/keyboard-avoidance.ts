type KeyboardAwareScrollInput = {
  cardBottomY: number;
  currentScrollY: number;
  gap: number;
  keyboardTopY: number;
};

export function calculateKeyboardAwareScrollY({ cardBottomY, currentScrollY, gap, keyboardTopY }: KeyboardAwareScrollInput) {
  const overlap = cardBottomY + gap - keyboardTopY;

  return overlap > 0 ? currentScrollY + overlap : currentScrollY;
}
