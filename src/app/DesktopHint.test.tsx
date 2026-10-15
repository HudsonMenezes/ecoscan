import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import { createAppStorage, type KeyValueStore } from '@/shared/lib/storage';
import { mockPointer } from '@/test/mockDevice';
import { DesktopHint } from './DesktopHint';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const store: KeyValueStore = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
  return { storage: createAppStorage(() => store), data };
}

describe('DesktopHint', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('não aparece em aparelhos com toque', () => {
    mockPointer('touch');
    render(<DesktopHint storage={memoryStorage().storage} />);

    expect(screen.queryByText(strings.desktopHint.title)).toBeNull();
  });

  it('no computador mostra o QR que leva ao site', () => {
    mockPointer('desktop');
    render(<DesktopHint storage={memoryStorage().storage} />);

    expect(screen.getByText(strings.desktopHint.title)).toBeInTheDocument();
    expect(screen.getByAltText(strings.desktopHint.qrAlt)).toHaveAttribute('src', '/qr-site.svg');
  });

  it('dispensar esconde o aviso e lembra a escolha', async () => {
    mockPointer('desktop');
    const { storage, data } = memoryStorage();
    const { unmount } = render(<DesktopHint storage={storage} />);

    await userEvent.click(screen.getByRole('button', { name: strings.desktopHint.dismiss }));

    expect(screen.queryByText(strings.desktopHint.title)).toBeNull();
    expect(data.get('ecoscan:desktop-hint-dismissed')).toBe('true');

    unmount();
    render(<DesktopHint storage={storage} />);
    expect(screen.queryByText(strings.desktopHint.title)).toBeNull();
  });

  it('valor inválido no storage não esconde o aviso', () => {
    mockPointer('desktop');
    const { storage } = memoryStorage({ 'ecoscan:desktop-hint-dismissed': '"sim"' });
    render(<DesktopHint storage={storage} />);

    expect(screen.getByText(strings.desktopHint.title)).toBeInTheDocument();
  });
});
