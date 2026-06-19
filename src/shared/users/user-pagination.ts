export type HydraUsersResponse<T> =
  | T[]
  | {
      'hydra:member'?: T[];
      'hydra:totalItems'?: number;
      'hydra:view'?: {
        'hydra:next'?: string;
      };
    };

export type UsersPage<T> = {
  items: T[];
  nextPage?: number;
  totalItems: number;
};

function parsePageNumber(url?: string) {
  if (!url) return undefined;
  const match = url.match(/[?&]page=(\d+)/);
  return match ? Number(match[1]) : undefined;
}

export function parseUsersPage<T>(response: HydraUsersResponse<T>): UsersPage<T> {
  if (Array.isArray(response)) {
    return {
      items: response,
      totalItems: response.length,
    };
  }

  return {
    items: response['hydra:member'] || [],
    nextPage: parsePageNumber(response['hydra:view']?.['hydra:next']),
    totalItems: response['hydra:totalItems'] || 0,
  };
}

export function getNextUsersPage<T>(lastPage: UsersPage<T>) {
  return lastPage.nextPage;
}
