import { setApiSessionTokenGetter } from 'utils/api/client';

import { sessionStore } from './session-store';

let bootstrapped = false;

export function bootstrapSession() {
  if (bootstrapped) return;
  setApiSessionTokenGetter(() => sessionStore.getToken());
  bootstrapped = true;
}
