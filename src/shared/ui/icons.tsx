// Ícones em SVG inline (sem biblioteca). Herdam a cor do texto via currentColor
// e são decorativos: quem os usa fornece o rótulo acessível.
type IconProps = { size?: number };

export function IconSvg({ size = 40, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </IconSvg>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 18h3v3h-3z" />
    </IconSvg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3" />
      <path d="M21 12h-4a2 2 0 0 0 0 4h4" />
    </IconSvg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-9 9" />
    </IconSvg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </IconSvg>
  );
}
