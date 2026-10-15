// Texto lido do QR → pointId. Só aceita URLs do próprio EcoScan na rota /descartar;
// qualquer outra coisa (outro site, texto solto) vira null: "não é um ponto do EcoScan".
// Se o ponto existe ou não, quem decide é o claimDisposal.
export const PRODUCTION_ORIGIN = 'https://ecoscan-v1.vercel.app';

const POINT_ID = /^[a-z0-9-]{1,40}$/;

export function parsePointUrl(
  text: string,
  allowedOrigins: readonly string[] = [window.location.origin, PRODUCTION_ORIGIN],
): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (!allowedOrigins.includes(url.origin)) return null;
  if (url.pathname.replace(/\/$/, '') !== '/descartar') return null;
  const pointId = url.searchParams.get('ponto') ?? '';
  return POINT_ID.test(pointId) ? pointId : null;
}
