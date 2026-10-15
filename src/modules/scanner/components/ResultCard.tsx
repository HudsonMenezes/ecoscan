import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { strings } from '@/config/strings';
import type { ScanResult } from '@/shared/contracts';
import { CATEGORIES } from '../model/categories';
import { CategoryIcon } from './CategoryIcon';
import { LocalGuidance } from './LocalGuidance';

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
    : `${strings.scanner.bin(info.conamaColor)} · ${info.destination}`;

  return (
    <article className="result-card" aria-labelledby="result-title">
      <header
        className="result-card__category"
        style={{ backgroundColor: info.color, color: info.textColor }}
        data-category={info.id}
      >
        <CategoryIcon icon={info.icon} size={48} />
        <div>
          <p className="result-card__label">{info.label}</p>
          <p className="result-card__destination">{destination}</p>
        </div>
      </header>

      <h2 id="result-title" ref={titleRef} tabIndex={-1} className="result-card__item">
        {result.itemName}
      </h2>

      <section className="result-card__section">
        <h3>{strings.scanner.howTo}</h3>
        <p>{result.disposal}</p>
      </section>

      <LocalGuidance category={result.category} />

      <section className="result-card__section result-card__why">
        <h3>{info.whyTitle}</h3>
        <p>{result.categoryReason}</p>
      </section>

      <section className="result-card__section result-card__consequence">
        <h3>{strings.scanner.consequence}</h3>
        <p>{result.consequence}</p>
      </section>

      <section className="result-card__section result-card__benefit">
        <h3>{strings.scanner.benefit}</h3>
        <p>{result.benefit}</p>
      </section>

      <div className="result-card__actions">
        <Link to="/descartar" className="action-button action-button--blue">
          {strings.scanner.discard}
        </Link>
        <button
          type="button"
          className="action-button action-button--secondary"
          onClick={onScanAgain}
        >
          {strings.scanner.scanAgain}
        </button>
      </div>
    </article>
  );
}
