export const defaultNotificationRoute = '/notifications';

export function getNotificationRoute(data?: Record<string, unknown>) {
  const candidates = [data?.linkDirect, data?.link_direct, data?.url];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;

    const route = candidate.trim();
    if (route.startsWith('/') && !route.startsWith('//')) {
      return route;
    }
  }

  return defaultNotificationRoute;
}
