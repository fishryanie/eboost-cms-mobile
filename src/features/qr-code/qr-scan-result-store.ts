import { create } from 'zustand';

import type { QrDecodeResult } from './types';

type QrScanResultState = {
  clearResult: () => void;
  result: QrDecodeResult | null;
  setResult: (result: QrDecodeResult) => void;
};

export const useQrScanResultStore = create<QrScanResultState>(set => ({
  clearResult: () => set({ result: null }),
  result: null,
  setResult: result => set({ result }),
}));
