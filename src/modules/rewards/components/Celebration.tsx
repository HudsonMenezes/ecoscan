import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { strings } from '@/config/strings';
import type { LedgerEntry, Wallet } from '../model/ledger';
import type { Level } from '../model/levels';
import { playChime } from './chime';
import { LevelIcon } from './LevelIcon';

const { success } = strings.disposal;

// Confete em CSS puro: posições e atrasos fixos (nada de Math.random no render).
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 6) * 0.12}s`,
  color: ['#1f5fae', '#c62828', '#f2b01e', '#1b7f3b', '#ef6c00'][i % 5],
}));

type CelebrationProps = {
  entry: LedgerEntry;
  leveledUp: Level | null;
  wallet: Wallet;
  onScanAnother: () => void;
};

export function Celebration({ entry, leveledUp, wallet, onScanAnother }: CelebrationProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    playChime();
  }, []);

  return (
    <section className="celebration" aria-labelledby="celebration-title">
      <div className="celebration__confetti" aria-hidden="true">
        {CONFETTI.map((piece, i) => (
          <span
            key={i}
            style={{ left: piece.left, animationDelay: piece.delay, background: piece.color }}
          />
        ))}
      </div>

      <h2 id="celebration-title" ref={titleRef} tabIndex={-1} className="celebration__title">
        {success.title}
      </h2>
      <p>{success.item(entry.itemName)}</p>

      <p className="celebration__gain">
        <span className="celebration__coin" aria-hidden="true">
          🪙
        </span>
        {success.gained(entry.xp, entry.coins)}
      </p>

      {leveledUp && (
        <p className="celebration__level-up" role="status">
          <LevelIcon icon={leveledUp.icon} size={28} /> {success.levelUp(leveledUp.name)}
        </p>
      )}

      <p className="celebration__wallet">
        <LevelIcon icon={wallet.level.icon} size={22} />{' '}
        {success.summary(wallet.level.name, wallet.xp, wallet.coins)}
      </p>

      <div className="result-card__actions">
        <button
          type="button"
          className="action-button action-button--green"
          onClick={onScanAnother}
        >
          {strings.disposal.scanAnother}
        </button>
        <Link to="/carteira" className="action-button action-button--secondary">
          {strings.disposal.wallet}
        </Link>
      </div>
    </section>
  );
}
