import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { strings } from '@/config/strings';
import type { ScanResult } from '@/shared/contracts';
import {
  BinIcon,
  CheckIcon,
  LeafIcon,
  QuestionIcon,
  TaskIcon,
  WarningIcon,
} from '@/shared/ui/icons';
import { CATEGORIES } from '../model/categories';
import { CategoryIcon } from './CategoryIcon';
import { LocalGuidance } from './LocalGuidance';

const { scanner } = strings;

// Texto da IA sempre como texto puro (nada de HTML).
export function ResultCard({
  result,
  onScanAgain,
}: {
  result: ScanResult;
  onScanAgain: () => void;
}) {
  const info = CATEGORIES[result.category];
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Leitores de tela vão direto para o resultado quando ele aparece.
  useEffect(() => titleRef.current?.focus(), []);

  // Perigosos não vão para lixeira nenhuma: mostra o destino em vez da cor da lixeira.
  const destination = info.hazardous
    ? info.destination
    : `${scanner.bin(info.conamaColor)} · ${info.destination}`;

  return (
    <article className="result-card" aria-labelledby="result-title">
      <header
        className="result-card__category"
        style={{ backgroundColor: info.color, color: info.textColor }}
        data-category={info.id}
      >
        <div className="result-card__tags">
          <span className="result-card__tag">
            <CheckIcon size={16} />
            {scanner.confidence[result.confidence]}
          </span>
          {result.isComposite && (
            <span className="result-card__composite">{scanner.composite}</span>
          )}
        </div>
        <div className="result-card__identity">
          <span className="result-card__icon" style={{ color: info.color }}>
            <CategoryIcon icon={info.icon} size={42} />
          </span>
          <div>
            <p className="result-card__label">{info.label}</p>
            <h2 id="result-title" ref={titleRef} tabIndex={-1} className="result-card__item">
              {result.itemName}
            </h2>
          </div>
        </div>
        <p className="result-card__destination">
          <BinIcon size={22} />
          {destination}
        </p>
      </header>

      <section className="card result-card__section">
        <h3>
          <span className="icon-badge" aria-hidden="true">
            <TaskIcon size={20} />
          </span>
          {scanner.howTo}
        </h3>
        <p>{result.disposal}</p>
      </section>

      <LocalGuidance category={result.category} />

      <section className="card result-card__section result-card__why">
        <h3>
          <span className="icon-badge icon-badge--amber" aria-hidden="true">
            <QuestionIcon size={20} />
          </span>
          {info.whyTitle}
        </h3>
        <p>{result.categoryReason}</p>
      </section>

      <section className="result-card__section result-card__consequence">
        <h3>
          <span className="icon-badge icon-badge--red" aria-hidden="true">
            <WarningIcon size={20} />
          </span>
          {scanner.consequence}
        </h3>
        <p>{result.consequence}</p>
      </section>

      <section className="result-card__section result-card__benefit">
        <h3>
          <span className="icon-badge icon-badge--forest" aria-hidden="true">
            <LeafIcon size={20} />
          </span>
          {scanner.benefit}
        </h3>
        <p>{result.benefit}</p>
      </section>

      {/* Barra fixa embaixo: o próximo passo fica sempre à mão enquanto a pessoa lê. */}
      <div className="result-card__actions result-card__actions--sticky">
        <button
          type="button"
          className="action-button action-button--secondary"
          onClick={onScanAgain}
        >
          {scanner.scanAgain}
        </button>
        <Link to="/descartar" className="action-button action-button--green">
          {scanner.discard}
        </Link>
      </div>
    </article>
  );
}
