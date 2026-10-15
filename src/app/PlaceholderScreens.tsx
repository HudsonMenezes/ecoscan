// Telas provisórias, carregadas sob demanda. Os módulos scanner e rewards
// substituem cada uma nas próximas fases.
import { strings } from '@/config/strings';
import { useScreen } from '@/shared/lib/screen';

function Placeholder({ title, speech }: { title: string; speech: string }) {
  useScreen({ speech });

  return (
    <div className="placeholder">
      <h1>{title}</h1>
      <p>{strings.placeholder}</p>
    </div>
  );
}

export function ScanPlaceholder() {
  return <Placeholder {...strings.scan} />;
}

export function DiscardPlaceholder() {
  return <Placeholder {...strings.discard} />;
}

export function WalletPlaceholder() {
  return <Placeholder {...strings.wallet} />;
}
