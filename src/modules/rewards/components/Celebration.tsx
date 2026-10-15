import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { strings } from '@/config/strings';
import { BoltIcon, CheckIcon, CloseIcon, CoinIcon } from '@/shared/ui/icons';
import type { LedgerEntry } from '../model/ledger';
import type { Level } from '../model/levels';
import { playChime } from './chime';
import { LevelIcon } from './LevelIcon';

const { success } = strings.disposal;

// Confete em CSS puro: posições e atrasos fixos (nada de Math.random no render).
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 6) * 0.12}s`,
  color: ['#b8e04a', '#f2b01e', '#ffffff', '#8ec5ff'][i % 4],
}));

type CelebrationProps = {
  entry: LedgerEntry;
  leveledUp: Level | null;
  onScanAnother: () => void;
};

// Tela verde inteira por cima de tudo (inclusive da barra inferior), como no canvas.
export function Celebration({ entry, leveledUp, onScanAnother }: CelebrationProps) {
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

      <div className="celebration__top">
        <Link to="/" className="round-button round-button--on-dark" aria-label={success.close}>
          <CloseIcon size={24} />
        </Link>
      </div>

      <div className="celebration__body">
        <span className="celebration__check" aria-hidden="true">
          <CheckIcon size={48} />
        </span>
        <div>
          <h2 id="celebration-title" ref={titleRef} tabIndex={-1} className="celebration__title">
            {success.title}
          </h2>
          <p className="celebration__item">{success.item(entry.itemName)}</p>
        </div>

        {/* Os blocos são visuais; a frase escondida é o que o leitor de tela lê. */}
        <p className="visually-hidden">{success.gained(entry.xp, entry.coins)}</p>
        <div className="celebration__gains" aria-hidden="true">
          <div className="celebration__gain">
            <BoltIcon size={26} />
            <span className="celebration__gain-value">+{entry.xp}</span>
            <span>{success.xpLabel}</span>
          </div>
          <div className="celebration__gain celebration__gain--coins">
            <CoinIcon size={26} />
            <span className="celebration__gain-value">+{entry.coins}</span>
            <span>{success.coinsLabel}</span>
          </div>
        </div>

        {leveledUp && (
          <div className="celebration__level-up" role="status">
            <span className="celebration__level-icon" aria-hidden="true">
              <LevelIcon icon={leveledUp.icon} size={28} />
            </span>
            <div>
              <p className="celebration__level-label">{success.newLevel}</p>
              <p className="celebration__level-name">{success.levelUp(leveledUp.name)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="celebration__actions">
        <button
          type="button"
          className="action-button action-button--accent"
          onClick={onScanAnother}
        >
          {strings.disposal.scanAnother}
        </button>
        <Link to="/carteira" className="action-button action-button--ghost">
          {strings.disposal.wallet}
        </Link>
      </div>
    </section>
  );
}
