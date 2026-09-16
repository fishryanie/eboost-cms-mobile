import { apiRequest } from 'utils/api/client';
import { getDeviceId } from 'utils/device/device-id';
import { getNotificationDeviceToken } from 'utils/notifications/device-token';

export type AdminLoginResponse = {
  message?: string;
  refresh_token?: string;
  refreshToken?: string;
  statusCode?: number;
  token?: string;
};

export async function loginAdmin(values: { password: string; username: string }) {
  const [deviceId, deviceToken] = await Promise.all([getDeviceId(), getNotificationDeviceToken()]);

  return apiRequest<AdminLoginResponse>('api/admin/login', {
    data: values,
    headers: {
      ...(deviceId ? { 'device-id': deviceId } : {}),
      ...(deviceToken ? { 'X-Device-Token': deviceToken } : {}),
    },
    method: 'POST',
    skipAuth: true,
  });
}

export async function logoutAdmin() {
  const deviceId = await getDeviceId();

  return apiRequest<void>('/api/logout', {
    headers: deviceId ? { 'device-id': deviceId } : undefined,
    method: 'GET',
    skipTokenRefresh: true,
  });
}

export function refreshAdminSession(refreshToken: string) {
  return apiRequest<AdminLoginResponse>('api/admin/refresh-token', {
    data: { refreshToken },
    method: 'POST',
    skipAuth: true,
    skipTokenRefresh: true,
  });
}
