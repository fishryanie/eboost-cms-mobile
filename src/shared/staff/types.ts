export type StaffRole =
  | 'ROLE_VIEWER'
  | 'ROLE_TECHNICIAN'
  | 'ROLE_CUSTOMER_SERVICE'
  | 'ROLE_MARKETING'
  | 'ROLE_EDITOR'
  | 'ROLE_STAFF'
  | 'ROLE_ADMIN'
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_DEVELOPER';

export type StaffMember = {
  avatarUrl: string | null;
  createdAt: string;
  deletedAt: string | null;
  email: string;
  enabled: boolean;
  id: number;
  iriId?: string;
  name: string;
  roles: StaffRole[];
  updatedAt: string;
  username: string;
};

export type StaffActivityLog = {
  action: string;
  createdAt: string;
  data: string;
  id: number;
  ipAddress: string;
  userAgent: string;
};

export type StaffListFilters = {
  id?: string;
  email?: string;
  enabled?: '0' | '1';
  username?: string;
};

export type StaffCreateInput = {
  email: string;
  enabled: boolean;
  name: string;
  password: string;
  roles: StaffRole[];
  username: string;
};

export type StaffUpdateInput = {
  enabled?: boolean;
  name?: string;
  roles?: StaffRole[];
};
