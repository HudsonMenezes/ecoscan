import { useState } from 'react';
import { z } from 'zod';
import { strings } from '@/config/strings';
import { appStorage, type AppStorage } from '@/shared/lib/storage';
import { useIsDesktop } from '@/shared/lib/useMediaQuery';

const DISMISSED_KEY = 'ecoscan:desktop-hint-dismissed';

// Banner "Melhor no celular", só em dispositivos sem toque. O QR é um SVG
// estático gerado por `npm run qr:site`.
export function DesktopHint({ storage = appStorage }: { storage?: AppStorage }) {
  const isDesktop = useIsDesktop();
  const [dismissed, setDismissed] = useState(
    () => storage.get(DISMISSED_KEY, z.boolean()) === true,
  );

  if (!isDesktop || dismissed) return null;

  function dismiss() {
    storage.set(DISMISSED_KEY, true);
    setDismissed(true);
  }

  return (
    <aside className="desktop-hint" aria-labelledby="desktop-hint-title">
      <img src="/qr-site.svg" alt={strings.desktopHint.qrAlt} width={96} height={96} />
      <div className="desktop-hint__text">
        <strong id="desktop-hint-title">{strings.desktopHint.title}</strong>
        <p>{strings.desktopHint.text}</p>
      </div>
      <button
        type="button"
        className="desktop-hint__close"
        aria-label={strings.desktopHint.dismiss}
        onClick={dismiss}
      >
        ×
      </button>
    </aside>
  );
}
