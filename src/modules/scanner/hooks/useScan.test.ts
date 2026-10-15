import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ScanResult } from '@/shared/contracts';
import { ScanError } from '../api/scanImage';
import type { LastScan } from '../model/lastScan';
import { useScan } from './useScan';

const result: ScanResult = {
  identified: true,
  itemName: 'Pilha AA',
  material: 'Metal',
  category: 'pilhas_baterias',
  confidence: 'alta',
  isComposite: false,
  disposal: 'Ponto de coleta de pilhas.',
  categoryReason: 'Tem metais pesados.',
  consequence: 'Contamina o solo.',
  spokenSummary: 'É uma pilha.',
};
const lastScan: LastScan = {
  id: '3b241101-e2bb-4255-8caf-4136c566a962',
  category: 'pilhas_baterias',
  itemName: 'Pilha AA',
  scannedAt: '2026-10-15T12:00:00.000Z',
};
const photo = new Blob(['jpeg']);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useScan', () => {
  it('idle → capturing → loading → result, salvando o LastScan', async () => {
    const pending = deferred<ScanResult>();
    const scan = vi.fn(() => pending.promise);
    const save = vi.fn(() => lastScan);
    const { result: hook } = renderHook(() => useScan({ scan, save }));

    expect(hook.current.state).toEqual({ status: 'idle' });
    act(() => hook.current.startCapture());
    expect(hook.current.state).toEqual({ status: 'capturing' });

    let submitting!: Promise<void>;
    act(() => {
      submitting = hook.current.submit(photo);
    });
    expect(hook.current.state).toEqual({ status: 'loading' });

    await act(async () => {
      pending.resolve(result);
      await submitting;
    });
    expect(hook.current.state).toEqual({ status: 'result', result, lastScan });
    expect(save).toHaveBeenCalledWith(result);
  });

  it('erro da API → error com a mensagem amigável', async () => {
    const scan = vi.fn(async () => {
      throw new ScanError('rate_limited');
    });
    const { result: hook } = renderHook(() => useScan({ scan, save: vi.fn() }));

    await act(() => hook.current.submit(photo));

    expect(hook.current.state).toMatchObject({ status: 'error', error: { kind: 'rate_limited' } });
  });

  it('erro inesperado vira "unavailable", nunca uma mensagem técnica', async () => {
    const scan = vi.fn(async () => {
      throw new Error('stack trace técnico');
    });
    const { result: hook } = renderHook(() => useScan({ scan, save: vi.fn() }));

    await act(() => hook.current.submit(photo));

    expect(hook.current.state).toMatchObject({ status: 'error', error: { kind: 'unavailable' } });
  });

  it('retry reenvia a mesma foto', async () => {
    const scan = vi
      .fn()
      .mockRejectedValueOnce(new ScanError('network'))
      .mockResolvedValueOnce(result);
    const { result: hook } = renderHook(() => useScan({ scan, save: () => lastScan }));
    await act(() => hook.current.submit(photo));

    await act(async () => hook.current.retry());

    expect(scan).toHaveBeenCalledTimes(2);
    expect(scan.mock.calls[1]?.[0]).toBe(photo);
    expect(hook.current.state).toMatchObject({ status: 'result' });
  });

  it('retry sem foto anterior volta para a câmera', () => {
    const { result: hook } = renderHook(() => useScan({ scan: vi.fn(), save: vi.fn() }));

    act(() => hook.current.retry());

    expect(hook.current.state).toEqual({ status: 'capturing' });
  });

  it('reset durante o carregamento cancela e ignora a resposta atrasada', async () => {
    const pending = deferred<ScanResult>();
    const scan = vi.fn((_: Blob, { signal }: { signal?: AbortSignal } = {}) => {
      expect(signal).toBeDefined();
      return pending.promise;
    });
    const save = vi.fn();
    const { result: hook } = renderHook(() => useScan({ scan, save }));
    let submitting!: Promise<void>;
    act(() => {
      submitting = hook.current.submit(photo);
    });

    act(() => hook.current.reset());
    await act(async () => {
      pending.resolve(result);
      await submitting;
    });

    expect(hook.current.state).toEqual({ status: 'idle' });
    expect(save).not.toHaveBeenCalled();
    expect(scan.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it('sair da tela cancela o scan em andamento', () => {
    let signal: AbortSignal | undefined;
    const scan = vi.fn((_: Blob, options: { signal?: AbortSignal } = {}) => {
      signal = options.signal;
      return new Promise<ScanResult>(() => {});
    });
    const { result: hook, unmount } = renderHook(() => useScan({ scan, save: vi.fn() }));
    act(() => void hook.current.submit(photo));

    unmount();

    expect(signal?.aborted).toBe(true);
  });
});
