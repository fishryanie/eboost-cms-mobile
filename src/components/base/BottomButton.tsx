import { BottomButtonContainer, BottomButtonContent, type BottomButtonProps } from './bottom-button-shared';

export type { BottomButtonProps } from './bottom-button-shared';

export const BottomButton = ({ backgroundColor, borderTopRadius, paddingBottom, ...contentProps }: BottomButtonProps) => {
  return (
    <BottomButtonContainer absolute backgroundColor={backgroundColor} borderTopRadius={borderTopRadius} paddingBottom={paddingBottom}>
      <BottomButtonContent {...contentProps} />
    </BottomButtonContainer>
  );
};
