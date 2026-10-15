import { useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { strings } from '@/config/strings';
import { useScreen } from '@/shared/lib/screen';
import { CameraView, type CameraControl } from '@/shared/ui/CameraView';
import { ChevronLeftIcon } from '@/shared/ui/icons';
import { useScan } from '../hooks/useScan';
import { describeScanScreen } from './describeScanScreen';
import { ResultCard } from './ResultCard';
import { RetryHint } from './RetryHint';

export function ScanScreen() {
  const { state, startCapture, submit, retry } = useScan();
  const navigate = useNavigate();
  const cameraRef = useRef<CameraControl>(null);
  // Só lê o ref quando é chamado (comando de voz), nunca durante o render.
  const captureByVoice = useCallback(() => cameraRef.current?.capture(), []);
  const goToDiscard = useCallback(() => void navigate('/descartar'), [navigate]);

  useScreen(
    // `captureByVoice` só lê o ref quando o voice o chama, nunca durante o render;
    // a regra não consegue distinguir os dois casos.
    // eslint-disable-next-line react-hooks/refs
    describeScanScreen(state, {
      capture: captureByVoice,
      discard: goToDiscard,
      scanAgain: startCapture,
      retry,
    }),
  );

  // Câmera e análise em tela escura (como no canvas); resultado e erros em tela clara.
  const dark =
    state.status === 'idle' || state.status === 'capturing' || state.status === 'loading';
  const title = state.status === 'result' ? strings.scanner.resultTitle : strings.scan.title;

  return (
    <div className={dark ? 'scan-screen scan-screen--dark' : 'scan-screen'}>
      <header className="scan-screen__bar">
        <Link to="/" className="round-button" aria-label={strings.scanner.back}>
          <ChevronLeftIcon size={24} />
        </Link>
        <h1 className="scan-screen__title">{title}</h1>
        <span className="scan-screen__spacer" aria-hidden="true" />
      </header>

      {(state.status === 'idle' || state.status === 'capturing') && (
        <CameraView controlRef={cameraRef} onCapture={(photo) => void submit(photo)} />
      )}

      {state.status === 'loading' && (
        <div className="scan-loading" role="status">
          <span className="scan-loading__spinner" aria-hidden="true" />
          <p>{strings.scanner.loading}</p>
        </div>
      )}

      {state.status === 'result' &&
        (state.result.category === 'desconhecido' ? (
          <RetryHint onNewPhoto={startCapture} />
        ) : (
          <ResultCard result={state.result} onScanAgain={startCapture} />
        ))}

      {state.status === 'error' && (
        <div className="scan-error">
          <p className="camera__message" role="alert">
            {state.error.message}
          </p>
          <button type="button" className="action-button action-button--green" onClick={retry}>
            {strings.scanner.tryAgain}
          </button>
          <button
            type="button"
            className="action-button action-button--secondary"
            onClick={startCapture}
          >
            {strings.scanner.newPhoto}
          </button>
        </div>
      )}
    </div>
  );
}
