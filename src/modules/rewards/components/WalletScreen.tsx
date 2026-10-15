import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { strings } from '@/config/strings';
import { CATEGORIES, CategoryIcon } from '@/modules/scanner';
import { useScreen } from '@/shared/lib/screen';
import { getLedger, getWallet, type LedgerEntry } from '../model/ledger';
import { describeWalletScreen, xpToNext } from './describeWalletScreen';
import { LevelIcon } from './LevelIcon';

const { wallet: text } = strings;

// Data curta no fuso do aparelho: "15/10, 14:32".
const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

// Saldo derivado do ledger (nunca um número salvo à parte).
export function WalletScreen() {
  const [ledger] = useState(() => getLedger());
  const wallet = useMemo(() => getWallet(ledger), [ledger]);
  const navigate = useNavigate();
  const scan = useMemo(() => () => void navigate('/escanear'), [navigate]);
  useScreen(describeWalletScreen(wallet, scan));

  const history = [...ledger].reverse(); // mais recente primeiro
  const percent = Math.round(wallet.progress * 100);

  return (
    <div className="wallet-screen">
      <h1 className="screen-title">{text.title}</h1>

      <section className="wallet-level" aria-labelledby="wallet-level-name">
        <span className="wallet-level__icon" aria-hidden="true">
          <LevelIcon icon={wallet.level.icon} size={48} />
        </span>
        <div>
          <p className="wallet-level__number">{text.level(wallet.level.number)}</p>
          <h2 id="wallet-level-name" className="wallet-level__name">
            {wallet.level.name}
          </h2>
        </div>
      </section>

      <div className="wallet-progress">
        <div
          className="wallet-progress__bar"
          role="progressbar"
          aria-label={text.progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <p>
          {wallet.nextLevel ? text.toNext(xpToNext(wallet), wallet.nextLevel.name) : text.maxLevel}
        </p>
      </div>

      <dl className="wallet-totals">
        <div>
          <dt>XP</dt>
          <dd>{wallet.xp}</dd>
        </div>
        <div>
          <dt>
            <span aria-hidden="true">🪙</span> {text.coinsLabel}
          </dt>
          <dd>{wallet.coins}</dd>
        </div>
      </dl>

      <section aria-labelledby="wallet-history">
        <h2 id="wallet-history" className="wallet-history__title">
          {text.historyTitle}
        </h2>
        {history.length === 0 ? (
          <div className="wallet-empty">
            <p>{text.empty}</p>
            <Link to="/escanear" className="action-button action-button--green">
              {text.scan}
            </Link>
          </div>
        ) : (
          <ul className="wallet-history">
            {history.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function HistoryItem({ entry }: { entry: LedgerEntry }) {
  const info = CATEGORIES[entry.category];
  return (
    <li className="wallet-history__item">
      <span
        className="wallet-history__icon"
        style={{ backgroundColor: info.color, color: info.textColor }}
      >
        <CategoryIcon icon={info.icon} size={28} />
      </span>
      <div className="wallet-history__text">
        <p className="wallet-history__name">{entry.itemName}</p>
        <p className="wallet-history__meta">
          {info.label} ·{' '}
          <time dateTime={entry.createdAt}>{dateFormat.format(new Date(entry.createdAt))}</time>
        </p>
        <p className="wallet-history__gain">{text.gain(entry.xp, entry.coins)}</p>
      </div>
    </li>
  );
}
