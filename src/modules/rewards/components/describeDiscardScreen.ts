// O que a tela de descarte mostra/fala em cada estado, e a única ação de cada erro.
import { strings } from '@/config/strings';
import { CATEGORIES } from '@/modules/scanner';
import type { CurrentScreen } from '@/shared/lib/screen';
import type { DisposalState } from '../hooks/useDisposal';

export type DiscardNav = { scan: () => void; readQr: () => void; wallet: () => void };

type ErrorState = Extract<DisposalState, { status: 'error' }>;

export function errorMessage({ reason, lastScan }: ErrorState): string {
  const { errors } = strings.disposal;
  if (reason === 'category_not_accepted') {
    const label = lastScan ? CATEGORIES[lastScan.category].label.toLowerCase() : '';
    return errors.category_not_accepted(label);
  }
  return errors[reason];
}

// Cada erro tem uma ação só: a que resolve o problema.
export function errorAction(state: ErrorState, nav: DiscardNav) {
  const { disposal } = strings;
  switch (state.reason) {
    case 'unknown_point':
      return { id: 'discard', label: disposal.readAnotherQr, run: nav.readQr } as const;
    case 'already_claimed':
      return { id: 'scan-again', label: disposal.scanNext, run: nav.scan } as const;
    case 'category_not_accepted':
      return { id: 'scan-again', label: disposal.scanAnother, run: nav.scan } as const;
    default:
      return { id: 'scan-again', label: disposal.scanItem, run: nav.scan } as const;
  }
}

export function describeDiscardScreen(state: DisposalState, nav: DiscardNav): CurrentScreen {
  switch (state.status) {
    case 'reader':
      return { speech: strings.discard.speech, actions: [] };
    case 'error':
      return { speech: errorMessage(state), actions: [errorAction(state, nav)] };
    case 'success': {
      const { success } = strings.disposal;
      const { itemName, xp, coins } = state.entry;
      const levelUp = state.leveledUp ? ` ${success.levelUp(state.leveledUp.name)}` : '';
      return {
        speech: success.speech(itemName, xp, coins) + levelUp,
        actions: [
          { id: 'scan-again', label: strings.disposal.scanAnother, run: nav.scan },
          { id: 'wallet', label: strings.disposal.wallet, run: nav.wallet },
        ],
      };
    }
  }
}
