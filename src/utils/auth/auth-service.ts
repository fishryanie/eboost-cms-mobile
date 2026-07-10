import { apiRequest } from 'utils/api/client';

export type AdminLoginResponse = {
  message?: string;
  refresh_token?: string;
  refreshToken?: string;
  statusCode?: number;
  token?: string;
};

export function loginAdmin(values: { password: string; username: string }) {
  return apiRequest<AdminLoginResponse>('api/admin/login', {
    data: values,
    method: 'POST',
    skipAuth: true,
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
