// API pública do voice. Outros módulos importam só daqui.
export { parseCommand, normalize } from './model/parseCommand';
export type { VoiceIntent } from './model/parseCommand';
export { NAV_PATHS } from './model/commands';
export type { NavTarget } from './model/commands';
