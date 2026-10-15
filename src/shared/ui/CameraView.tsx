import { useState } from 'react';
import { strings } from '@/config/strings';
import { resizeImageFile, useCamera, useHasCamera } from '@/shared/lib/camera';
import { useIsDesktop } from '@/shared/lib/useMediaQuery';
import { CameraIcon } from './icons';
import { ImageDropZone } from './ImageDropZone';

type CameraViewProps = {
  // Recebe sempre um JPEG ≤ 1024px e sem EXIF, venha da câmera ou do upload.
  onCapture: (photo: Blob) => void;
};

export function CameraView({ onCapture }: CameraViewProps) {
  const { state, videoRef, start, capture } = useCamera();
  const isDesktop = useIsDesktop();
  const hasCamera = useHasCamera();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deliver(produce: () => Promise<Blob>) {
    setBusy(true);
    setError(null);
    try {
      onCapture(await produce());
    } catch {
      setError(strings.camera.invalidImage);
    } finally {
      setBusy(false);
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError(strings.camera.invalidImage);
      return;
    }
    void deliver(() => resizeImageFile(file));
  }

  // No computador sem webcam, nem oferecemos a câmera: só o envio de arquivo.
  // No celular sempre oferecemos, porque alguns navegadores só listam a câmera após a permissão.
  const showCamera = !(isDesktop && hasCamera === false);
  const cameraFailed = state.status === 'denied' || state.status === 'unavailable';
  const fallbackMessage =
    state.status === 'denied'
      ? strings.camera.denied
      : state.status === 'unavailable'
        ? strings.camera.unavailable
        : null;

  const cameraPanel = showCamera && (
    <div className="camera__panel">
      {state.status === 'ready' && (
        <div className="camera__preview">
          <video
            ref={videoRef}
            className={state.mirrored ? 'camera__video camera__video--mirrored' : 'camera__video'}
            autoPlay
            muted
            playsInline
          />
          <button
            type="button"
            className="camera__shutter"
            aria-label={strings.camera.capture}
            disabled={busy}
            onClick={() => void deliver(capture)}
          >
            <CameraIcon size={36} />
          </button>
        </div>
      )}

      {(state.status === 'idle' || state.status === 'requesting') && (
        <button
          type="button"
          className="action-button action-button--green"
          disabled={state.status === 'requesting'}
          onClick={() => void start()}
        >
          <CameraIcon size={32} />
          <span>
            {state.status === 'requesting' ? strings.camera.opening : strings.camera.open}
          </span>
        </button>
      )}

      {fallbackMessage && (
        <p className="camera__message" role="status">
          {fallbackMessage}
        </p>
      )}
    </div>
  );

  const layout = isDesktop ? (showCamera ? 'camera--side-by-side' : 'camera--upload-only') : '';

  return (
    <div className={`camera ${layout}`} aria-busy={busy || state.status === 'requesting'}>
      {cameraPanel}
      <ImageDropZone
        variant={isDesktop ? 'dropzone' : 'button'}
        prominent={!showCamera || cameraFailed}
        disabled={busy}
        onFile={handleFile}
      />
      {busy && <p role="status">{strings.camera.processing}</p>}
      {error && (
        <p className="camera__message camera__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
