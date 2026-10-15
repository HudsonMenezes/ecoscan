import { strings } from '@/config/strings';
import type { Category } from '@/shared/contracts';
import { LOCALE, getLocalGuidance } from '../model/localGuidance';

// "dd/mm/aaaa" sem passar por Date, para não depender do fuso do aparelho.
const formatDate = (iso: string) => iso.split('-').reverse().join('/');

// Bloco "Em Duque de Caxias": só aparece quando a categoria tem fonte oficial verificada.
export function LocalGuidance({ category }: { category: Category }) {
  const guidance = getLocalGuidance(category);
  if (!guidance) return null;

  return (
    <section className="result-card__section result-card__local" data-testid="local-guidance">
      <h3>{strings.scanner.localTitle(LOCALE.city)}</h3>
      <p>{guidance.text}</p>
      {guidance.link && (
        <p>
          <a href={guidance.link.url} target="_blank" rel="noopener noreferrer">
            {guidance.link.label}
          </a>
        </p>
      )}
      <p className="result-card__sources">
        {strings.scanner.sources}{' '}
        {guidance.sources.map((source, i) => (
          <span key={source.url}>
            {i > 0 && '; '}
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.label}
            </a>{' '}
            ({strings.scanner.verifiedAt(formatDate(source.verifiedAt))})
          </span>
        ))}
      </p>
    </section>
  );
}
