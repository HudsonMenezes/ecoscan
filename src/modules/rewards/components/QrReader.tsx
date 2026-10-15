import { useState } from 'react';
import { strings } from '@/config/strings';
import { useCamera } from '@/shared/lib/camera';
import { AlertIcon, QrIcon } from '@/shared/ui/icons';
import { parsePointUrl } from '../qr/parsePointUrl';
import { useQrReader } from '../qr/useQrReader';

const { disposal } = strings;

// Leitor de QR dentro do app. A câmera só abre no toque (como no scanner).
// QR do EcoScan → onPoint(id); qualquer outro QR → aviso e "Ler outro QR".
export function QrReader({ onPoint }: { onPoint: (pointId: string) => void }) {
  const { state, videoRef, start, stop } = useCamera();
  const [invalid, setInvalid] = useState(false);

  useQrReader(videoRef, state.status === 'ready' && !invalid, (text) => {
    const pointId = parsePointUrl(text);
    if (pointId) {
      stop();
      onPoint(pointId);
    } else {
      stop();
      setInvalid(true);
    }
  });

  if (invalid) {
    return (
      <div className="discard-error">
        <AlertIcon size={64} />
        <p role="alert">{disposal.errors.unknown_point}</p>
        <button
          type="button"
          className="action-button action-button--green"
          onClick={() => {
            setInvalid(false);
            void start();
          }}
        >
          {disposal.readAnotherQr}
        </button>
      </div>
    );
  }

  if (state.status === 'ready') {
    return (
      <div className="qr-reader">
        <div className="camera__preview">
          <video
            ref={videoRef}
            className={state.mirrored ? 'camera__video camera__video--mirrored' : 'camera__video'}
            aria-label={disposal.readerVideo}
            autoPlay
            muted
            playsInline
          />
          <div className="qr-reader__frame" aria-hidden="true" />
        </div>
        <p role="status">{disposal.readerAim}</p>
      </div>
    );
  }

  const failed = state.status === 'denied' || state.status === 'unavailable';
  return (
    <div className="discard-reader">
      <QrIcon size={96} />
      <p>{strings.discard.speech}</p>
      {failed ? (
        <p className="camera__message" role="status">
          {disposal.cameraFailed}
        </p>
      ) : (
        <button
          type="button"
          className="action-button action-button--blue"
          disabled={state.status === 'requesting'}
          onClick={() => void start()}
        >
          <QrIcon size={32} />
          <span>
            {state.status === 'requesting' ? strings.camera.opening : disposal.openReader}
          </span>
        </button>
      )}
      <p>{disposal.readerHint}</p>
    </div>
  );
}
