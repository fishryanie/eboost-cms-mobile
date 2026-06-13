import { useMemo } from 'react';

import { DefaultPopupBody } from '../components/popup-body';
import type { IPopupRenderContext, TPopupRenderer } from '../types';

function usePopupRenderer<T extends TPopupRenderer>(renderPopupBody?: T) {
  return useMemo(
    () =>
      renderPopupBody ??
      ((context: IPopupRenderContext) => (
        <DefaultPopupBody colors={context.colors} onClose={context.onClose} route={context.route} view={context.view} />
      )),
    [renderPopupBody],
  );
}

export { usePopupRenderer };
