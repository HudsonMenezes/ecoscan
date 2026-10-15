import { useEffect, useRef } from 'react';
import { strings } from '@/config/strings';
import { useCurrentScreen } from '@/shared/lib/screen';
import { SpeakerIcon, StopIcon, VoiceModeIcon } from '@/shared/ui/icons';
import { useVoiceMode } from '../model/voiceSettings';
import { useSpeech } from '../tts/useSpeech';

const { voice } = strings;

// Botões de voz no topo das telas (decisão do Hudson em 2026-10-15: o rodapé é
// da navegação). `compact` (barras próprias, como a do scanner) mostra só o 🔊.
// Pode haver dois montados ao mesmo tempo (topo + comemoração); quem fala
// sozinho ao trocar de tela é o VoiceAutoSpeak, montado uma vez só.
export function VoiceDock({ compact = false }: { compact?: boolean }) {
  const { speech } = useCurrentScreen();
  const { speak, stop, speaking, supported } = useSpeech();
  const [voiceMode, setVoiceMode] = useVoiceMode();

  if (!supported) return null;

  const listen = () => (speaking ? stop() : void speak(speech));

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
        <button
          type="button"
          className="voice-dock__mode"
          aria-pressed={voiceMode}
          aria-label={voice.voiceMode}
          onClick={toggleVoiceMode}
        >
          <VoiceModeIcon size={26} />
        </button>
      )}
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
