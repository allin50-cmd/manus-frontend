'use client';

import { create } from 'zustand';
import type { Company } from '@/types/company';
import type { AlertType } from '@/types/alerts';

interface CompanyStore {
  company: Company | null;
  selectedServices: AlertType[];
  activated: boolean;
  setCompany: (company: Company | null) => void;
  toggleService: (type: AlertType) => void;
  setSelectedServices: (types: AlertType[]) => void;
  setActivated: (val: boolean) => void;
  totalMonthly: () => number;
  reset: () => void;
}

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  company: null,
  selectedServices: [],
  activated: false,

  setCompany: (company) => set({ company }),
  toggleService: (type) =>
    set((state) => ({
      selectedServices: state.selectedServices.includes(type)
        ? state.selectedServices.filter((s) => s !== type)
        : [...state.selectedServices, type],
    })),
  setSelectedServices: (types) => set({ selectedServices: types }),
  setActivated: (val) => set({ activated: val }),
  totalMonthly: () => get().selectedServices.length * 100, // pence
  reset: () => set({ company: null, selectedServices: [], activated: false }),
}));
