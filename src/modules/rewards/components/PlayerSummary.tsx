import { useState } from 'react';
import { Link } from 'react-router';
import { strings } from '@/config/strings';
import { getLedger, getWallet } from '../model/ledger';
import { xpToNext } from './describeWalletScreen';
import { LevelIcon } from './LevelIcon';

const { player } = strings.home;

// Cartão verde do Início: nível, moedas e progresso. Leva para a carteira.
export function PlayerSummary() {
  const [wallet] = useState(() => getWallet(getLedger()));
  const percent = Math.round(wallet.progress * 100);

  return (
    <Link to="/carteira" className="player-summary">
      <span className="player-summary__badge" aria-hidden="true">
        <LevelIcon icon={wallet.level.icon} size={30} />
      </span>
      <span className="player-summary__level">
        <span className="player-summary__number">{player.level(wallet.level.number)}</span>
        <span className="player-summary__name">{wallet.level.name}</span>
      </span>
      <span className="player-summary__coins">
        <span className="player-summary__coins-value">{wallet.coins}</span>
        <span>{player.coins}</span>
      </span>
      <span className="player-summary__progress">
        <span className="progress-bar progress-bar--on-dark" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </span>
        <span className="player-summary__caption">
          {wallet.nextLevel
            ? player.progress(wallet.xp, xpToNext(wallet), wallet.nextLevel.name)
            : player.maxLevel(wallet.xp)}
        </span>
      </span>
    </Link>
  );
}
