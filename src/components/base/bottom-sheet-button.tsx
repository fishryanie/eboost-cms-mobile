import { BottomSheetFooter, type BottomSheetFooterProps } from '@gorhom/bottom-sheet';

import { BottomButtonContainer, BottomButtonContent, type BottomButtonProps } from './bottom-button-shared';

export type BottomSheetButtonProps = BottomButtonProps & {
  bottomInset?: number;
  footerProps: BottomSheetFooterProps;
};

export function BottomSheetButton({ backgroundColor, borderTopRadius, bottomInset = 0, footerProps, paddingBottom, ...contentProps }: BottomSheetButtonProps) {
  return (
    <BottomSheetFooter {...footerProps} bottomInset={bottomInset}>
      <BottomButtonContainer backgroundColor={backgroundColor} borderTopRadius={borderTopRadius} paddingBottom={paddingBottom}>
        <BottomButtonContent {...contentProps} />
      </BottomButtonContainer>
    </BottomSheetFooter>
  );
}
