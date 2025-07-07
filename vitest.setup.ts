import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

// Extend Vitest's expect with jest-dom matchers
Object.entries(matchers).forEach(([matcherName, matcher]) => {
  if (typeof matcher === 'function') {
    expect.extend({
      [matcherName]: matcher
    });
  }
});

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Run cleanup after each test case
afterEach(() => {
  cleanup();
});
