import { useEffect, useRef, useState } from 'react';
import { strings } from '@/config/strings';
import { useCurrentScreen } from '@/shared/lib/screen';
import { LeafIcon, PlayIcon } from '@/shared/ui/icons';
import { hasSeenWelcome, markWelcomeSeen } from '../model/welcome';
import { useVoiceMode } from '../model/voiceSettings';
import { useSpeech } from '../tts/useSpeech';

const { welcome } = strings;

// Primeira visita: um botão grande só. O toque libera o áudio (os navegadores
// bloqueiam som antes de um toque), fala a apresentação e liga o Modo voz.
export function WelcomeGate() {
  const [open, setOpen] = useState(() => !hasSeenWelcome());
  const { speech } = useCurrentScreen();
  const { speak } = useSpeech();
  const [, setVoiceMode] = useVoiceMode();
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) startRef.current?.focus();
  }, [open]);

  if (!open) return null;

  // Tudo dentro do toque: o iOS só libera o áudio no gesto do usuário.
  const start = () => {
    markWelcomeSeen();
    setVoiceMode(true);
    setOpen(false);
    void speak(speech ? `${welcome.speech} ${speech}` : welcome.speech);
  };

  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome__body">
        <span className="welcome__mark" aria-hidden="true">
          <LeafIcon size={48} />
        </span>
        <h1 id="welcome-title" className="welcome__title">
          {welcome.title}
        </h1>
        <p className="welcome__text">{welcome.text}</p>
        <button
          ref={startRef}
          type="button"
          className="action-button action-button--accent welcome__start"
          onClick={start}
        >
          <PlayIcon size={32} />
          <span>{welcome.start}</span>
        </button>
      </div>
      <p className="welcome__privacy">{strings.privacy.voice}</p>
    </div>
  );
}
