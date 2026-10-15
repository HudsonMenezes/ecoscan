// API pública do voice. Outros módulos importam só daqui.
export { VoiceAutoSpeak, VoiceDock } from './components/VoiceDock';
export { useSpeech } from './tts/useSpeech';
export type { Speech } from './tts/useSpeech';
export { useVoiceMode } from './model/voiceSettings';
export { parseCommand, normalize } from './model/parseCommand';
export type { VoiceIntent } from './model/parseCommand';
export { NAV_PATHS } from './model/commands';
export type { NavTarget } from './model/commands';
