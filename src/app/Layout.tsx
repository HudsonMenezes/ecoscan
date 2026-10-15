import { Link, Outlet, useLocation } from 'react-router';
import { strings } from '@/config/strings';
import { VoiceAutoSpeak, VoiceDock, WelcomeGate } from '@/modules/voice';
import { ScreenProvider } from '@/shared/lib/screen';
import { HeaderToolsProvider } from '@/shared/ui/HeaderTools';
import { LeafIcon } from '@/shared/ui/icons';
import { BottomNav } from './BottomNav';
import { DesktopHint } from './DesktopHint';

// O scanner ocupa a tela inteira e tem a própria barra superior e de ações.
const FULL_SCREEN = ['/escanear'];

// Nas barras próprias das telas (scanner, comemoração) cabe só o 🔊.
const COMPACT_VOICE = <VoiceDock compact />;

export function Layout() {
  const fullScreen = FULL_SCREEN.includes(useLocation().pathname);

  return (
    <ScreenProvider>
      <HeaderToolsProvider tools={COMPACT_VOICE}>
        <VoiceAutoSpeak />
        <WelcomeGate />
        <div className={fullScreen ? 'layout layout--full' : 'layout'}>
          {!fullScreen && (
            <header className="layout__header">
              <Link
                to="/"
                className="layout__home"
                aria-label={strings.appName + strings.layout.homeHint}
              >
                <span className="brand-mark" aria-hidden="true">
                  <LeafIcon size={24} />
                </span>
                <span className="layout__wordmark">{strings.appName}</span>
              </Link>
              <VoiceDock />
            </header>
          )}
          {!fullScreen && <DesktopHint />}
          <main className="layout__main">
            <Outlet />
          </main>
          {!fullScreen && <BottomNav />}
        </div>
      </HeaderToolsProvider>
    </ScreenProvider>
  );
}
