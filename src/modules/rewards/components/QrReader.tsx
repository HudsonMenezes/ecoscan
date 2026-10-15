import { useEffect, useState } from 'react';
import { strings } from '@/config/strings';
import { useCamera, useHasCamera } from '@/shared/lib/camera';
import { useIsDesktop } from '@/shared/lib/useMediaQuery';
import { AlertIcon, QrIcon } from '@/shared/ui/icons';
import { parsePointUrl } from '../qr/parsePointUrl';
import { useQrReader } from '../qr/useQrReader';

const { disposal } = strings;

// Leitor de QR dentro do app. A câmera liga sozinha ao abrir (como no scanner);
// o botão "Ler QR do ponto" fica como reserva.
// QR do EcoScan → onPoint(id); qualquer outro QR → aviso e "Ler outro QR".
export function QrReader({ onPoint }: { onPoint: (pointId: string) => void }) {
  const { state, videoRef, start, stop } = useCamera();
  const [invalid, setInvalid] = useState(false);

  // No computador, só depois de saber que há webcam. Sem guarda por ref: no
  // StrictMode a limpeza do useCamera invalida o primeiro pedido (ver CameraView).
  const isDesktop = useIsDesktop();
  const hasCamera = useHasCamera();
  const shouldAutoStart = isDesktop ? hasCamera === true : true;
  useEffect(() => {
    if (shouldAutoStart) void start();
  }, [shouldAutoStart, start]);

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
      <div className="card discard-error">
        <span className="discard-error__icon" aria-hidden="true">
          <AlertIcon size={40} />
        </span>
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
    <div className="card discard-reader">
      <span className="discard-reader__icon" aria-hidden="true">
        <QrIcon size={56} />
      </span>
      <p>{strings.discard.speech}</p>
      {failed ? (
        <p className="camera__message" role="status">
          {disposal.cameraFailed}
        </p>
      ) : (
        <button
          type="button"
          className="action-button action-button--green"
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
