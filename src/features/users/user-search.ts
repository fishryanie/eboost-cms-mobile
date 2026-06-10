export type UserSearchParams = {
  email?: string;
  id?: string;
  phoneNumber?: string;
};

const numericPattern = /^\d+$/;

export function getUserSearchParams(search: string): UserSearchParams {
  const value = search.trim();
  if (!value) return {};

  if (!numericPattern.test(value)) {
    return { email: value };
  }

  if (value.startsWith('0') || value.startsWith('84') || value.length === 9 || value.length === 10) {
    return { phoneNumber: value };
  }

  return { id: value };
}
