// Tela provisória de /escanear (T6): valida câmera e upload no aparelho real,
// mostrando a foto que seria enviada. A ScanScreen do scanner a substitui na T11.
import { useEffect, useState } from 'react';
import { strings } from '@/config/strings';
import { useScreen } from '@/shared/lib/screen';
import { CameraView } from '@/shared/ui/CameraView';

type Photo = { blob: Blob; url: string };

function PhotoPreview({ photo, onReset }: { photo: Photo; onReset: () => void }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  return (
    <figure className="photo-preview">
      <img
        src={photo.url}
        alt={strings.cameraTest.result}
        onLoad={(event) =>
          setSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })
        }
      />
      <figcaption data-testid="photo-info">
        {strings.cameraTest.result}: {size ? `${size.width}×${size.height}` : '…'} ·{' '}
        {Math.round(photo.blob.size / 1024)} KB · {photo.blob.type}
      </figcaption>
      <button type="button" className="action-button action-button--green" onClick={onReset}>
        {strings.cameraTest.again}
      </button>
    </figure>
  );
}

export function CameraTestScreen() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  useScreen({ speech: strings.scan.speech });

  // Libera a URL da foto anterior ao trocar de foto ou sair da tela.
  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  return (
    <div>
      <h1 className="screen-title">{strings.scan.title}</h1>
      {photo ? (
        <PhotoPreview key={photo.url} photo={photo} onReset={() => setPhoto(null)} />
      ) : (
        <CameraView onCapture={(blob) => setPhoto({ blob, url: URL.createObjectURL(blob) })} />
      )}
    </div>
  );
}
