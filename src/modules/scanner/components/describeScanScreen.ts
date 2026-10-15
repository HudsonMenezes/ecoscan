// O que o módulo voice fala e aceita como comando em cada estado da tela do scanner.
import { strings } from '@/config/strings';
import type { CurrentScreen } from '@/shared/lib/screen';
import type { ScanState } from '../hooks/useScan';

export type ScanScreenHandlers = {
  capture: () => void;
  discard: () => void;
  scanAgain: () => void;
  retry: () => void;
};

export function describeScanScreen(state: ScanState, on: ScanScreenHandlers): CurrentScreen {
  const { scanner } = strings;
  switch (state.status) {
    case 'idle':
    case 'capturing':
      return {
        speech: strings.scan.speech,
        actions: [{ id: 'capture', label: scanner.capture, run: on.capture }],
      };
    case 'loading':
      return { speech: scanner.loadingSpeech, actions: [] };
    case 'error':
      return {
        speech: state.error.message,
        actions: [
          { id: 'retry', label: scanner.tryAgain, run: on.retry },
          { id: 'scan-again', label: scanner.newPhoto, run: on.scanAgain },
        ],
      };
    case 'result': {
      const { result } = state;
      if (result.category === 'desconhecido') {
        return {
          speech: scanner.retrySpeech,
          actions: [{ id: 'scan-again', label: scanner.newPhoto, run: on.scanAgain }],
        };
      }
      return {
        speech: result.isComposite
          ? `${result.spokenSummary} ${result.categoryReason}`
          : result.spokenSummary,
        actions: [
          { id: 'discard', label: scanner.discard, run: on.discard },
          { id: 'scan-again', label: scanner.scanAgain, run: on.scanAgain },
        ],
      };
    }
  }
}
