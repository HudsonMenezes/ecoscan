// Telas provisórias, carregadas sob demanda. O módulo rewards substitui
// cada uma na fase 3 (o descarte já foi trocado na R3).
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

export function WalletPlaceholder() {
  return <Placeholder {...strings.wallet} />;
}
