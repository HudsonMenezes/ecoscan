import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { strings } from '@/config/strings';
import { useScreen } from '@/shared/lib/screen';
import { AlertIcon } from '@/shared/ui/icons';
import { useDisposal } from '../hooks/useDisposal';
import { Celebration } from './Celebration';
import { describeDiscardScreen, errorAction, errorMessage } from './describeDiscardScreen';
import { QrReader } from './QrReader';

// /descartar?ponto=<id>: o link do QR, lido pela câmera nativa ou pelo leitor do app.
// Sem ?ponto: o leitor do app, que navega para o link quando lê um QR do EcoScan.
export function DiscardScreen() {
  const [params] = useSearchParams();
  const pointId = params.get('ponto');
  // `key`: cada abertura do link (cada navegação) é uma decisão nova, porque o
  // useDisposal decide uma vez só. Repetir a URL cai em "já foi contado".
  const { key } = useLocation();
  return <Disposal key={key} pointId={pointId} />;
}

function Disposal({ pointId }: { pointId: string | null }) {
  const state = useDisposal(pointId);
  const navigate = useNavigate();
  const nav = useMemo(
    () => ({
      scan: () => void navigate('/escanear'),
      readQr: () => void navigate('/descartar'),
      wallet: () => void navigate('/carteira'),
    }),
    [navigate],
  );
  useScreen(describeDiscardScreen(state, nav));

  return (
    <div className="discard-screen">
      <h1 className="screen-title">{strings.discard.title}</h1>

      {state.status === 'reader' && (
        <QrReader onPoint={(id) => void navigate(`/descartar?ponto=${encodeURIComponent(id)}`)} />
      )}

      {state.status === 'error' && <DisposalError state={state} nav={nav} />}

      {state.status === 'success' && (
        <Celebration
          entry={state.entry}
          leveledUp={state.leveledUp}
          wallet={state.wallet}
          onScanAnother={nav.scan}
        />
      )}
    </div>
  );
}

function DisposalError({
  state,
  nav,
}: {
  state: Parameters<typeof errorMessage>[0];
  nav: Parameters<typeof errorAction>[1];
}) {
  const action = errorAction(state, nav);
  return (
    <div className="discard-error">
      <AlertIcon size={64} />
      <p role="alert">{errorMessage(state)}</p>
      <button type="button" className="action-button action-button--green" onClick={action.run}>
        {action.label}
      </button>
    </div>
  );
}
