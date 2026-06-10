import { apiRequest } from 'shared/api/client';

export type AdminLoginResponse = {
  token?: string;
  message?: string;
  statusCode?: number;
};

export function loginAdmin(values: { password: string; username: string }) {
  return apiRequest<AdminLoginResponse>('api/admin/login', {
    data: values,
    method: 'POST',
    skipAuth: true,
  });
}
