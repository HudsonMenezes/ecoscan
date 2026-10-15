import { strings } from '@/config/strings';
import { useScreen } from '@/shared/lib/screen';
import { BigActionButton } from '@/shared/ui/BigActionButton';
import { CameraIcon, QrIcon, WalletIcon } from '@/shared/ui/icons';

export function HomeScreen() {
  const { title, subtitle, actions, speech } = strings.home;
  useScreen({ speech });

  return (
    <div className="home">
      <h1 className="home__title">{title}</h1>
      <p className="home__subtitle">{subtitle}</p>
      <nav className="home__actions" aria-label={subtitle}>
        <BigActionButton to="/escanear" icon={<CameraIcon />} label={actions.scan} color="green" />
        <BigActionButton to="/descartar" icon={<QrIcon />} label={actions.discard} color="blue" />
        <BigActionButton
          to="/carteira"
          icon={<WalletIcon />}
          label={actions.wallet}
          color="amber"
        />
      </nav>
    </div>
  );
}
