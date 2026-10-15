// Telas provisórias, carregadas sob demanda. Os módulos scanner e rewards
// substituem cada uma nas próximas fases.
import { strings } from '@/config/strings';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="placeholder">
      <h1>{title}</h1>
      <p>{strings.placeholder}</p>
    </div>
  );
}

export function ScanPlaceholder() {
  return <Placeholder title={strings.scan.title} />;
}

export function DiscardPlaceholder() {
  return <Placeholder title={strings.discard.title} />;
}

export function WalletPlaceholder() {
  return <Placeholder title={strings.wallet.title} />;
}
