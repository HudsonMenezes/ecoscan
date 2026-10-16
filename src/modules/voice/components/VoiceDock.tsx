import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { strings } from '@/config/strings';
import { useCurrentScreen, type CurrentScreen } from '@/shared/lib/screen';
import { MicIcon, SpeakerIcon, StopIcon, VoiceModeIcon } from '@/shared/ui/icons';
import { NAV_PATHS } from '../model/commands';
import { commandHints, parseAlternatives } from '../model/parseCommand';
import { useVoiceMode } from '../model/voiceSettings';
import {
  getRecognitionCtor,
  RecognitionContext,
  useVoiceCommand,
  type VoiceCommandError,
} from '../stt/useVoiceCommand';
import { useSpeech } from '../tts/useSpeech';

const { voice } = strings;
const { captions } = voice;

const ERROR_SPEECH: Record<VoiceCommandError, string> = {
  'not-allowed': voice.micDenied,
  'no-speech': voice.noSpeech,
  other: voice.micError,
};

// O que o 🎤 faz com a frase ouvida, na tela atual.
function useCommandDispatcher(screen: CurrentScreen, speak: (text: string) => Promise<void>) {
  const navigate = useNavigate();
  return (transcripts: string[]) => {
    const intent = parseAlternatives(transcripts, screen.actions);
    const help = voice.help(commandHints(screen.actions));
    switch (intent.type) {
      case 'nav':
        void navigate(NAV_PATHS[intent.target]);
        return;
      case 'action':
        intent.action.run();
        return;
      case 'repeat':
        void speak(screen.speech);
        return;
      case 'help':
        void speak(help);
        return;
      case 'unknown':
        void speak(voice.notUnderstood(help));
    }
  };
}

// Botões de voz no topo das telas (decisão do Hudson em 2026-10-15: o rodapé é
// da navegação). `compact` (barras próprias, como a do scanner) mostra só 🔊 e 🎤.
// Pode haver dois montados ao mesmo tempo (topo + comemoração); quem fala
// sozinho ao trocar de tela é o VoiceAutoSpeak, montado uma vez só.
export function VoiceDock({ compact = false }: { compact?: boolean }) {
  const screen = useCurrentScreen();
  const { speech } = screen;
  const { speak, stop, speaking, supported } = useSpeech();
  const [voiceMode, setVoiceMode] = useVoiceMode();
  const injected = useContext(RecognitionContext);
  const command = useVoiceCommand({
    onResult: useCommandDispatcher(screen, speak),
    onError: (error) => void speak(ERROR_SPEECH[error]),
    Ctor: injected === undefined ? getRecognitionCtor() : injected,
  });

  if (!supported) return null;

  const listen = () => {
    command.cancel();
    if (speaking) stop();
    else void speak(speech);
  };

  // O microfone não pode ouvir a própria fala do app: para antes de escutar.
  const talk = () => {
    if (command.listening) return command.cancel();
    stop();
    command.listen();
  };

  // Fala direto no toque: o iOS só libera o áudio dentro do gesto do usuário.
  const toggleVoiceMode = () => {
    setVoiceMode(!voiceMode);
    if (voiceMode) stop();
    else void speak(speech);
  };

  return (
    <div
      className={compact ? 'voice-dock voice-dock--compact' : 'voice-dock'}
      role="group"
      aria-label={voice.dockLabel}
    >
      {!compact && (
        <DockItem caption={voiceMode ? captions.modeOn : captions.mode} on={voiceMode}>
          <button
            type="button"
            className="voice-dock__mode"
            aria-pressed={voiceMode}
            aria-label={voice.voiceMode}
            onClick={toggleVoiceMode}
          >
            <VoiceModeIcon size={26} />
          </button>
        </DockItem>
      )}
      <DockItem caption={speaking ? captions.stop : captions.listen} on={speaking}>
        <button
          type="button"
          className={
            speaking ? 'voice-dock__listen voice-dock__listen--active' : 'voice-dock__listen'
          }
          aria-label={speaking ? voice.stop : voice.listen}
          onClick={listen}
        >
          {speaking ? <StopIcon size={28} /> : <SpeakerIcon size={30} />}
        </button>
      </DockItem>
      {command.supported && (
        <DockItem
          caption={command.listening ? captions.listening : captions.command}
          on={command.listening}
        >
          <button
            type="button"
            className={
              command.listening ? 'voice-dock__mic voice-dock__mic--active' : 'voice-dock__mic'
            }
            aria-label={command.listening ? voice.listening : voice.command}
            onClick={talk}
          >
            <MicIcon size={30} />
          </button>
        </DockItem>
      )}
    </div>
  );
}

// Botão com o texto embaixo. O texto é só visual: o nome acessível continua no aria-label do botão.
function DockItem({
  caption,
  on,
  children,
}: {
  caption: string;
  on: boolean;
  children: ReactNode;
}) {
  return (
    <div className="voice-dock__item">
      {children}
      <span
        className={on ? 'voice-dock__caption voice-dock__caption--on' : 'voice-dock__caption'}
        aria-hidden="true"
      >
        {caption}
      </span>
    </div>
  );
}

// Ao trocar de tela (ou de estado da tela), fala o novo texto se o Modo voz
// estiver ligado; senão, para a fala da tela anterior. O ref evita falar duas
// vezes no StrictMode e não reage à troca do Modo voz (o toque já fala).
export function VoiceAutoSpeak() {
  const { speech } = useCurrentScreen();
  const { speak, stop } = useSpeech();
  const [voiceMode] = useVoiceMode();

  const lastSpeech = useRef(speech);
  useEffect(() => {
    if (lastSpeech.current === speech) return;
    lastSpeech.current = speech;
    if (voiceMode && speech) void speak(speech);
    else stop();
  }, [speech, voiceMode, speak, stop]);

  return null;
}
