import { strings } from '@/config/strings';

// Uma dica por dia, sempre a mesma no mesmo dia (sem sortear a cada render).
export function tipOfTheDay(now: Date) {
  const { tips } = strings.home;
  const day = Math.floor(now.getTime() / 86_400_000);
  return tips[day % tips.length]!;
}
