import { Link, Outlet, useLocation } from 'react-router';
import { strings } from '@/config/strings';
import { ScreenProvider } from '@/shared/lib/screen';
import { HomeIcon } from '@/shared/ui/icons';

export function Layout() {
  const isHome = useLocation().pathname === '/';

  return (
    <ScreenProvider>
      <div className="layout">
        {!isHome && (
          <header className="layout__header">
            <Link to="/" className="layout__home" aria-label={strings.layout.home}>
              <HomeIcon size={28} />
              <span>{strings.appName}</span>
            </Link>
          </header>
        )}
        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </ScreenProvider>
  );
}
