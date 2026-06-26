import { create } from 'zustand';
import { biometricCredentialStore } from './biometric-credentials';

type AdminProfileState = {
  initials: string;
  name: string;
  role: string;
  loadProfile: () => Promise<void>;
};

export const useAdminProfile = create<AdminProfileState>((set) => ({
  initials: 'PQ',
  name: 'Administrator',
  role: 'CMS Administrator',
  loadProfile: async () => {
    const lastUsername = await biometricCredentialStore.getLastUsername();
    if (lastUsername) {
      const namePart = lastUsername.split('@')[0];
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const initials = namePart.slice(0, 2).toUpperCase();
      set({ name, initials });
    }
  }
}));
