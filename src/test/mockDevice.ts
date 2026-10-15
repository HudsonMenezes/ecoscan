import { vi } from 'vitest';

// Simula o tipo de aparelho: `desktop` responde true para (pointer: fine).
export function mockPointer(kind: 'desktop' | 'touch') {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: kind === 'desktop' && query === '(pointer: fine)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

// Simula as câmeras que o navegador lista (sem pedir permissão).
export function mockVideoInputs(count: number) {
  const enumerateDevices = vi.fn(async () =>
    Array.from({ length: count }, () => ({ kind: 'videoinput' }) as MediaDeviceInfo),
  );
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: { ...navigator.mediaDevices, enumerateDevices },
  });
  return enumerateDevices;
}
