import { strings } from '@/config/strings';
import { CategoryIcon } from './CategoryIcon';

// Resultado `desconhecido`: em vez de chutar, ensina a tirar uma foto melhor.
export function RetryHint({ onNewPhoto }: { onNewPhoto: () => void }) {
  return (
    <section className="retry-hint" aria-labelledby="retry-title">
      <CategoryIcon icon="unknown" size={56} />
      <h2 id="retry-title">{strings.scanner.retryTitle}</h2>
      <ul>
        {strings.scanner.retryTips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <button type="button" className="action-button action-button--green" onClick={onNewPhoto}>
        {strings.scanner.newPhoto}
      </button>
    </section>
  );
}
