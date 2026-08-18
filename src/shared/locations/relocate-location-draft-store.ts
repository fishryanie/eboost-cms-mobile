import { create } from 'zustand';

export type RelocateLocationDraft = {
  latitude?: string;
  longitude?: string;
  resourceId?: number;
  resourceType?: 'location' | 'station';
};

type RelocateLocationDraftState = {
  clearDraft: () => void;
  draft: RelocateLocationDraft;
  setCoordinates: (
    resourceType: NonNullable<RelocateLocationDraft['resourceType']>,
    resourceId: number,
    coordinates: Pick<RelocateLocationDraft, 'latitude' | 'longitude'>,
  ) => void;
};

export const useRelocateLocationDraftStore = create<RelocateLocationDraftState>(set => ({
  clearDraft: () => set({ draft: {} }),
  draft: {},
  setCoordinates: (resourceType, resourceId, coordinates) =>
    set(state => ({
      draft: {
        ...(state.draft.resourceId === resourceId && state.draft.resourceType === resourceType ? state.draft : {}),
        ...coordinates,
        resourceId,
        resourceType,
      },
    })),
}));
