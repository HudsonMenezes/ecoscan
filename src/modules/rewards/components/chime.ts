// Som curto de comemoração gerado na hora (Web Audio), sem arquivo de áudio no app.
// Se o navegador bloquear (aberto pela câmera nativa, sem toque na tela) ou não tiver
// Web Audio, fica em silêncio: o som é um extra, a tela e a fala já comemoram.
const NOTES_HZ = [523.25, 659.25, 783.99, 1046.5]; // dó, mi, sol, dó (arpejo maior)

export function playChime(): void {
  try {
    const context = new AudioContext();
    const start = context.currentTime;
    NOTES_HZ.forEach((frequency, i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = start + i * 0.12;
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.4);
    });
    setTimeout(() => void context.close(), 1500);
  } catch {
    // Sem Web Audio: segue sem som.
  }
}
