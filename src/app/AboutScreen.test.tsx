import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { strings } from '@/config/strings';
import { ScreenProvider, useCurrentScreen } from '@/shared/lib/screen';
import { AboutScreen } from './AboutScreen';

function SpeechSpy() {
  return <output data-testid="speech">{useCurrentScreen().speech}</output>;
}

describe('AboutScreen', () => {
  it('mostra o aviso de privacidade da voz, da foto e dos dados, e fala tudo', () => {
    render(
      <ScreenProvider>
        <AboutScreen />
        <SpeechSpy />
      </ScreenProvider>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: strings.about.title }),
    ).toBeInTheDocument();
    for (const text of [strings.privacy.voice, strings.about.photo, strings.about.data]) {
      expect(screen.getByText(text)).toBeInTheDocument();
      expect(screen.getByTestId('speech')).toHaveTextContent(text);
    }
  });
});
