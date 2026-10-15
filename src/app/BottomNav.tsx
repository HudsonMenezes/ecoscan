import { NavLink } from 'react-router';
import { strings } from '@/config/strings';
import { HomeIcon, QrIcon, ScanIcon, WalletIcon } from '@/shared/ui/icons';

const ITEMS = [
  { to: '/', label: strings.nav.home, Icon: HomeIcon },
  { to: '/escanear', label: strings.nav.scan, Icon: ScanIcon },
  { to: '/descartar', label: strings.nav.discard, Icon: QrIcon },
  { to: '/carteira', label: strings.nav.wallet, Icon: WalletIcon },
];

// Barra de navegação inferior, sempre à mão do polegar. O NavLink marca a tela
// atual com aria-current="page".
export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label={strings.nav.label}>
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className="bottom-nav__item">
          <Icon size={24} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
