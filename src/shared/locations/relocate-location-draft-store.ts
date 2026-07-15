import { create } from 'zustand';

export type RelocateLocationDraft = {
  latitude?: string;
  locationId?: number;
  longitude?: string;
};

type RelocateLocationDraftState = {
  clearDraft: () => void;
  draft: RelocateLocationDraft;
  setCoordinates: (locationId: number, coordinates: Pick<RelocateLocationDraft, 'latitude' | 'longitude'>) => void;
};

export const useRelocateLocationDraftStore = create<RelocateLocationDraftState>(set => ({
  clearDraft: () => set({ draft: {} }),
  draft: {},
  setCoordinates: (locationId, coordinates) =>
    set(state => ({
      draft: {
        ...(state.draft.locationId === locationId ? state.draft : {}),
        ...coordinates,
        locationId,
      },
    })),
}));
