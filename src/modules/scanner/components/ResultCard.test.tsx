import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import type { ScanResult } from '@/shared/contracts';
import { CATEGORIES } from '../model/categories';
import { ResultCard } from './ResultCard';

const carton: ScanResult = {
  identified: true,
  itemName: 'Caixa de leite longa vida',
  material: 'Papel, plástico e alumínio',
  category: 'papel',
  confidence: 'alta',
  isComposite: true,
  disposal: 'Enxágue, amasse e coloque na coleta seletiva.',
  categoryReason: 'É quase toda de papel; as recicladoras separam o plástico e o alumínio.',
  consequence: 'Ocupa espaço no aterro por muitos anos.',
  benefit: 'Reciclando, o material vira um produto novo e o ambiente fica mais limpo.',
  spokenSummary: 'É uma caixa longa vida. Vai para a coleta seletiva.',
};

function renderCard(result: ScanResult, onScanAgain = vi.fn()) {
  render(
    <MemoryRouter>
      <ResultCard result={result} onScanAgain={onScanAgain} />
    </MemoryRouter>,
  );
  return onScanAgain;
}

describe('ResultCard', () => {
  it('mostra categoria com cor, ícone e lixeira do catálogo, e os textos da IA', () => {
    renderCard(carton);

    const header = screen.getByText(CATEGORIES.papel.label).closest('header')!;
    expect(header).toHaveStyle({ backgroundColor: CATEGORIES.papel.color });
    expect(header.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('Lixeira azul · Coleta seletiva')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: carton.itemName })).toHaveFocus();
    expect(screen.getByText(carton.disposal)).toBeInTheDocument();
    expect(screen.getByText(carton.consequence)).toBeInTheDocument();
  });

  it('explica o destino com um título que se entende sozinho ("Por que na lixeira azul?")', () => {
    renderCard(carton);

    expect(screen.getByRole('heading', { name: 'Por que na lixeira azul?' })).toBeInTheDocument();
    expect(screen.getByText(carton.categoryReason)).toBeInTheDocument();
  });

  it('item simples também explica o porquê (todo resultado ensina)', () => {
    renderCard({ ...carton, isComposite: false });

    expect(screen.getByRole('heading', { name: CATEGORIES.papel.whyTitle })).toBeInTheDocument();
  });

  it('mostra o que acontece se descartar errado e o que se ganha descartando certo', () => {
    renderCard(carton);

    expect(screen.getByRole('heading', { name: strings.scanner.consequence })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: strings.scanner.benefit })).toBeInTheDocument();
    expect(screen.getByText(carton.benefit)).toBeInTheDocument();
  });

  it('item perigoso mostra o destino, não uma lixeira', () => {
    renderCard({ ...carton, category: 'pilhas_baterias', isComposite: false });

    expect(screen.getByText(CATEGORIES.pilhas_baterias.destination)).toBeInTheDocument();
    expect(screen.queryByText(/Lixeira/)).toBeNull();
  });

  it('texto da IA aparece como texto puro, nunca como HTML', () => {
    const { container } = render(
      <MemoryRouter>
        <ResultCard
          result={{ ...carton, disposal: '<img src=x onerror=alert(1)>Coleta seletiva' }}
          onScanAgain={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('<img src=x onerror=alert(1)>Coleta seletiva')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('botões: Descartar leva a /descartar e Escanear outro chama o callback', () => {
    const onScanAgain = renderCard(carton);

    expect(screen.getByRole('link', { name: strings.scanner.discard })).toHaveAttribute(
      'href',
      '/descartar',
    );
    screen.getByRole('button', { name: strings.scanner.scanAgain }).click();
    expect(onScanAgain).toHaveBeenCalledOnce();
  });
});
