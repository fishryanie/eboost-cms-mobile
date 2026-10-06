export type AccessMethod = 'READ' | 'UPDATE' | 'CREATE' | 'DELETE' | 'APPROVE';

export type PermissionMap = Record<string, string[]>;

export type PermissionNode = {
  children?: PermissionNode[];
  name: string;
  path: string;
};

export type PermissionPreset = {
  accesses: { methods: string[]; screens: string }[];
  name: string;
};

export type AdminAccessRecord = {
  '@id'?: string;
  id?: number | string;
  iriId?: string;
  method?: string | null;
  screen?: string | null;
};

export type PermissionSaveOperation = {
  body?: { admin?: string; method: string; screen?: string };
  id?: string;
  method: 'POST' | 'PATCH' | 'DELETE';
};
