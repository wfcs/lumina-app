"use client";
import { create } from "zustand";

interface UIState {
  hideValues: boolean;
  toggleHideValues: () => void;
  mobileNavOpen: boolean;
  setMobileNav: (v: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  hideValues: false,
  toggleHideValues: () => set((s) => ({ hideValues: !s.hideValues })),
  mobileNavOpen: false,
  setMobileNav: (v) => set({ mobileNavOpen: v }),
}));
