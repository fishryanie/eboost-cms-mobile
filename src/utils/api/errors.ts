import type { ApiService } from './types';

export class ApiError extends Error {
  raw?: unknown;
  service: ApiService;
  status: number;
  title: string;

  constructor({ message, raw, service, status, title }: { message: string; raw?: unknown; service: ApiService; status: number; title?: string }) {
    super(message);
    this.name = 'ApiError';
    this.raw = raw;
    this.service = service;
    this.status = status;
    this.title = title || 'Request failed';
  }
}

export function getApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;
    if (typeof candidate.message === 'string') return candidate.message;
    if (typeof candidate.error === 'string') return candidate.error;
    if (typeof candidate.detail === 'string') return candidate.detail;
    if (typeof candidate.description === 'string') return candidate.description;
  }
  return fallback;
}
