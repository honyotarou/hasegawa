import '@testing-library/jest-dom';
import { vi } from 'vitest';

(globalThis as any).chrome = {
  storage: {
    local: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
    session: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
  },
  scripting: { executeScript: vi.fn() },
  tabs: { query: vi.fn() },
};
