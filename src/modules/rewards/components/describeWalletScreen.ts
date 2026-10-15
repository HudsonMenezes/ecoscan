// O que a carteira fala (frase da spec) e a ação de voz que ela aceita.
import { strings } from '@/config/strings';
import type { CurrentScreen } from '@/shared/lib/screen';
import type { Wallet } from '../model/ledger';

export const xpToNext = (wallet: Wallet) =>
  wallet.nextLevel ? wallet.nextLevel.minXp - wallet.xp : 0;

export function describeWalletScreen(wallet: Wallet, scan: () => void): CurrentScreen {
  const { wallet: text } = strings;
  const summary = text.summarySpeech(wallet.level.name, wallet.xp, wallet.coins);
  const next = wallet.nextLevel ? text.toNextSpeech(xpToNext(wallet)) : text.maxLevelSpeech;
  return {
    speech: `${summary} ${next}`,
    actions: [{ id: 'scan-again', label: text.scan, run: scan }],
  };
}
