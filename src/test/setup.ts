import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// O jsdom não toca vídeo (o `play()` original lança "not implemented"). Os testes ainda podem
// espionar o `play`; isto garante uma Promise mesmo se um efeito atrasado chamar depois do
// `restoreAllMocks` (acontecia com a suíte inteira rodando, no autoStart do CameraView).
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
}

afterEach(() => {
  cleanup();
});
