import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createFakeRecognition } from '@/test/fakeRecognition';
import { getRecognitionCtor, useVoiceCommand } from './useVoiceCommand';

function setup() {
  const fake = createFakeRecognition();
  const onResult = vi.fn();
  const onError = vi.fn();
  const hook = renderHook(() => useVoiceCommand({ onResult, onError, Ctor: fake.Ctor }));
  return { fake, onResult, onError, hook };
}

describe('getRecognitionCtor', () => {
  it('usa o SpeechRecognition padrão ou o prefixado (Safari, Chrome)', () => {
    const Standard = class {};
    const Webkit = class {};
    expect(getRecognitionCtor({ SpeechRecognition: Standard })).toBe(Standard);
    expect(getRecognitionCtor({ webkitSpeechRecognition: Webkit })).toBe(Webkit);
  });

  it('sem suporte (Firefox) → null', () => {
    expect(getRecognitionCtor({})).toBeNull();
  });
});

describe('useVoiceCommand', () => {
  it('sem suporte: supported false e listen não faz nada', () => {
    const { result } = renderHook(() =>
      useVoiceCommand({ onResult: vi.fn(), onError: vi.fn(), Ctor: null }),
    );
    expect(result.current.supported).toBe(false);
    act(() => result.current.listen());
    expect(result.current.listening).toBe(false);
  });

  it('escuta uma frase em pt-BR, sem resultados parciais', () => {
    const { fake, hook } = setup();

    act(() => hook.result.current.listen());

    expect(hook.result.current.listening).toBe(true);
    expect(fake.last()).toMatchObject({
      lang: 'pt-BR',
      interimResults: false,
      continuous: false,
      started: true,
    });
    expect(fake.last().maxAlternatives).toBeGreaterThan(1);
  });

  it('entrega as alternativas e para de escutar', () => {
    const { fake, onResult, onError, hook } = setup();
    act(() => hook.result.current.listen());

    act(() => fake.say('escanear', 'escalar'));

    expect(onResult).toHaveBeenCalledWith(['escanear', 'escalar']);
    expect(onError).not.toHaveBeenCalled();
    expect(hook.result.current.listening).toBe(false);
  });

  it.each([
    ['not-allowed', 'not-allowed'],
    ['service-not-allowed', 'not-allowed'],
    ['no-speech', 'no-speech'],
    ['network', 'other'],
  ])('erro %s → %s, avisado uma vez só', (error, expected) => {
    const { fake, onError, hook } = setup();
    act(() => hook.result.current.listen());

    act(() => fake.fail(error));

    expect(onError).toHaveBeenCalledExactlyOnceWith(expected);
    expect(hook.result.current.listening).toBe(false);
  });

  it('terminou sem ouvir nada → no-speech', () => {
    const { fake, onError, hook } = setup();
    act(() => hook.result.current.listen());
    act(() => fake.silence());
    expect(onError).toHaveBeenCalledExactlyOnceWith('no-speech');
  });

  it('cancelar não avisa erro nem resultado', () => {
    const { fake, onResult, onError, hook } = setup();
    act(() => hook.result.current.listen());

    act(() => hook.result.current.cancel());

    expect(fake.last().aborted).toBe(true);
    expect(hook.result.current.listening).toBe(false);
    expect(onResult).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('sair da tela fecha o microfone', () => {
    const { fake, hook } = setup();
    act(() => hook.result.current.listen());
    hook.unmount();
    expect(fake.last().aborted).toBe(true);
  });
});
