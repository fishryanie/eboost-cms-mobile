import { refreshAdminSession } from 'utils/auth/auth-service';
import { setApiSessionRefreshHandler, setApiSessionRefreshTokenGetter, setApiSessionTokenGetter } from 'utils/api/client';

import { sessionStore } from './session-store';

let bootstrapped = false;

export function bootstrapSession() {
  if (bootstrapped) return;
  setApiSessionTokenGetter(() => sessionStore.getToken());
  setApiSessionRefreshTokenGetter(() => sessionStore.getRefreshToken());
  setApiSessionRefreshHandler(async refreshToken => {
    const response = await refreshAdminSession(refreshToken);

    if (!response.token) {
      return null;
    }

    await sessionStore.setTokens({
      refreshToken: response.refreshToken || response.refresh_token || refreshToken,
      token: response.token,
    });

    return response.token;
  });
  bootstrapped = true;
}
