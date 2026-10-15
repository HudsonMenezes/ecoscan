import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { strings } from '@/config/strings';
import { useScreen } from '@/shared/lib/screen';
import { BulbIcon, ChevronRightIcon, QrIcon, ScanIcon, WalletIcon } from '@/shared/ui/icons';
import { tipOfTheDay } from './tipOfTheDay';

const { home } = strings;

// Sob demanda: importar o rewards direto traria o módulo inteiro para o pacote inicial.
const PlayerSummary = lazy(async () => ({
  default: (await import('@/modules/rewards')).PlayerSummary,
}));

export function HomeScreen({ now = new Date() }: { now?: Date }) {
  useScreen({ speech: home.speech });
  const { actions } = home;

  return (
    <div className="home">
      <div>
        <p className="home__greeting">{home.greeting(now.getHours())}</p>
        <h1 className="home__title">{home.title}</h1>
      </div>

      <Suspense fallback={<div className="player-summary player-summary--loading" />}>
        <PlayerSummary />
      </Suspense>

      <nav className="home__actions" aria-label={home.actionsLabel}>
        <Link to="/escanear" className="home-action home-action--primary">
          <span className="home-action__icon" aria-hidden="true">
            <ScanIcon size={34} />
          </span>
          <span className="home-action__text">
            <span className="home-action__label">{actions.scan}</span>
            <span className="home-action__hint">{actions.scanHint}</span>
          </span>
          <ChevronRightIcon size={24} />
        </Link>
        <div className="home__grid">
          <Link to="/descartar" className="home-action">
            <span className="home-action__icon home-action__icon--blue" aria-hidden="true">
              <QrIcon size={24} />
            </span>
            <span className="home-action__label">{actions.discard}</span>
            <span className="home-action__hint">{actions.discardHint}</span>
          </Link>
          <Link to="/carteira" className="home-action">
            <span className="home-action__icon home-action__icon--amber" aria-hidden="true">
              <WalletIcon size={24} />
            </span>
            <span className="home-action__label">{actions.wallet}</span>
            <span className="home-action__hint">{actions.walletHint}</span>
          </Link>
        </div>
      </nav>

      <aside className="home-tip" aria-labelledby="home-tip-title">
        <BulbIcon size={24} />
        <div>
          <h2 id="home-tip-title" className="home-tip__title">
            {home.tipTitle}
          </h2>
          <p>{tipOfTheDay(now)}</p>
        </div>
      </aside>

      <Link to="/sobre" className="home__about">
        {strings.about.link}
      </Link>
    </div>
  );
}
