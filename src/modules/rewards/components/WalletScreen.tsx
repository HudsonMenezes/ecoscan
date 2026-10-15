import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { strings } from '@/config/strings';
import { CATEGORIES, CategoryIcon } from '@/modules/scanner';
import { useScreen } from '@/shared/lib/screen';
import { CheckIcon } from '@/shared/ui/icons';
import { getLedger, getWallet, type LedgerEntry } from '../model/ledger';
import { LEVELS, type Level } from '../model/levels';
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

      <section className="wallet-hero" aria-labelledby="wallet-level-name">
        <div className="wallet-hero__level">
          <span className="wallet-hero__badge" aria-hidden="true">
            <LevelIcon icon={wallet.level.icon} size={36} />
          </span>
          <div>
            <p className="wallet-hero__number">
              {text.levelOf(wallet.level.number, LEVELS.length)}
            </p>
            <h2 id="wallet-level-name" className="wallet-hero__name">
              {wallet.level.name}
            </h2>
          </div>
        </div>

        <div className="wallet-hero__progress">
          <div
            className="progress-bar progress-bar--on-dark"
            role="progressbar"
            aria-label={text.progressLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <p>
            {wallet.nextLevel
              ? text.toNext(xpToNext(wallet), wallet.nextLevel.name)
              : text.maxLevel}
          </p>
        </div>

        <dl className="wallet-totals">
          <div>
            <dt>{text.xpTotal}</dt>
            <dd>{wallet.xp}</dd>
          </div>
          <div>
            <dt>{text.coinsLabel}</dt>
            <dd>{wallet.coins}</dd>
          </div>
        </dl>
      </section>

      <section className="card wallet-trail" aria-labelledby="wallet-trail-title">
        <h2 id="wallet-trail-title" className="wallet-section-title">
          {text.trailTitle}
        </h2>
        <ol className="wallet-trail__list">
          {LEVELS.map((level) => (
            <TrailStep key={level.number} level={level} current={wallet.level} />
          ))}
        </ol>
      </section>

      <section aria-labelledby="wallet-history">
        <div className="wallet-history__header">
          <h2 id="wallet-history" className="wallet-section-title">
            {text.historyTitle}
          </h2>
          {history.length > 0 && (
            <span className="wallet-history__count">{text.historyCount(history.length)}</span>
          )}
        </div>
        {history.length === 0 ? (
          <div className="card wallet-empty">
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

// Um passo da trilha: concluído (✓), atual (ícone do nível) ou futuro (número).
function TrailStep({ level, current }: { level: Level; current: Level }) {
  const state =
    level.number < current.number ? 'done' : level.number === current.number ? 'current' : 'next';
  return (
    <li
      className={`wallet-trail__step wallet-trail__step--${state}`}
      aria-current={state === 'current' ? 'step' : undefined}
    >
      <span className="wallet-trail__dot" aria-hidden="true">
        {state === 'done' && <CheckIcon size={18} />}
        {state === 'current' && <LevelIcon icon={level.icon} size={20} />}
        {state === 'next' && level.number}
      </span>
      {/* "Guardião do Planeta" vira "Guardião" para caber; o nome completo está no topo. */}
      <span className="wallet-trail__name">{level.name.split(' ')[0]}</span>
    </li>
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
        <CategoryIcon icon={info.icon} size={26} />
      </span>
      <div className="wallet-history__text">
        <p className="wallet-history__name">{entry.itemName}</p>
        <p className="wallet-history__meta">
          {info.label} ·{' '}
          <time dateTime={entry.createdAt}>{dateFormat.format(new Date(entry.createdAt))}</time>
        </p>
        <span className="chip wallet-history__gain">{text.gain(entry.xp, entry.coins)}</span>
      </div>
    </li>
  );
}
