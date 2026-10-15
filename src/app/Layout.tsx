import { Link, Outlet, useLocation } from 'react-router';
import { strings } from '@/config/strings';
import { ScreenProvider } from '@/shared/lib/screen';
import { LeafIcon } from '@/shared/ui/icons';
import { BottomNav } from './BottomNav';
import { DesktopHint } from './DesktopHint';

// Telas que ocupam a tela inteira, com a própria barra de ações (o scanner, na U1c).
const FULL_SCREEN: string[] = [];

export function Layout() {
  const fullScreen = FULL_SCREEN.includes(useLocation().pathname);

  return (
    <ScreenProvider>
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
              <span>{strings.appName}</span>
            </Link>
          </header>
        )}
        <DesktopHint />
        <main className="layout__main">
          <Outlet />
        </main>
        {!fullScreen && <BottomNav />}
      </div>
    </ScreenProvider>
  );
}
