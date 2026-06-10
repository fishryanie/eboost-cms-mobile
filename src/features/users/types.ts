export type UserLevel = {
  backgroundColor?: string | null;
  id: number;
  image?: {
    url?: string | null;
  } | null;
  name: string;
  nameVn?: string | null;
};

export type UserListItem = {
  activatedMail?: boolean;
  avatar?: {
    path?: string | null;
    url?: string | null;
  } | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  balance: number;
  email?: string | null;
  enabled?: boolean;
  id: number;
  image?: {
    path?: string | null;
    url?: string | null;
  } | null;
  isPhoneVerified?: boolean;
  name?: string | null;
  phoneNumber?: string | null;
  userLevel?: UserLevel | null;
  username?: string | null;
};

export type BalanceHistoryItem = {
  amount: number;
  balanceAction: '+' | '-' | string;
  createdAt: string;
  id: number;
  reason?: string | null;
  wallet: number;
};

export type UserProfile = UserListItem & {
  address?: string | null;
  autoApplyPromotionCode?: boolean;
  autoCharge?: boolean;
  balanceHistory?: BalanceHistoryItem[];
  citizenIdentification?: string | null;
  createdAt?: string | null;
  dateOfBirth?: string | null;
  isCitizenVerified?: boolean;
  isNew?: boolean;
  userIdentifier?: string | null;
  userVehicles?: unknown[];
};
