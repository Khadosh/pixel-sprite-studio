import "@testing-library/jest-dom";

import { beforeEach, vi } from 'vitest';

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock crypto.randomUUID if missing
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  const mockCrypto = {
    randomUUID: () => Math.random().toString(36).substring(2) + Date.now().toString(36)
  };
  if (typeof crypto === 'undefined') {
    (global as any).crypto = mockCrypto;
  } else {
    (crypto as any).randomUUID = mockCrypto.randomUUID;
  }
}

// Clear storage before each test to prevent bleed-through
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
