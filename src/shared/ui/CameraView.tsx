import { useState } from 'react';
import { strings } from '@/config/strings';
import { resizeImageFile, useCamera } from '@/shared/lib/camera';
import { CameraIcon, ImageIcon } from './icons';

type CameraViewProps = {
  // Recebe sempre um JPEG ≤ 1024px e sem EXIF, venha da câmera ou do upload.
  onCapture: (photo: Blob) => void;
};

export function CameraView({ onCapture }: CameraViewProps) {
  const { state, videoRef, start, capture } = useCamera();
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

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (file) void deliver(() => resizeImageFile(file));
  }

  const fallbackMessage =
    state.status === 'denied'
      ? strings.camera.denied
      : state.status === 'unavailable'
        ? strings.camera.unavailable
        : null;

  return (
    <div className="camera" aria-busy={busy || state.status === 'requesting'}>
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

      <label
        className={
          fallbackMessage
            ? 'action-button action-button--green'
            : 'action-button action-button--secondary'
        }
      >
        <ImageIcon size={32} />
        <span>{strings.camera.upload}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="visually-hidden"
          disabled={busy}
          onChange={handleFile}
        />
      </label>

      {busy && <p role="status">{strings.camera.processing}</p>}
      {error && (
        <p className="camera__message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
