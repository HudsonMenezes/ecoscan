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
      <path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1z" />
      <path d="M4 7l11-3v3" />
      <circle cx="16" cy="13.5" r="1.2" />
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
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
    </IconSvg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </IconSvg>
  );
}

export function ScanIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M3 8V5a2 2 0 0 1 2-2h3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <circle cx="12" cy="12" r="3.5" />
    </IconSvg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M9 6l6 6-6 6" />
    </IconSvg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M15 6l-6 6 6 6" />
    </IconSvg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconSvg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </IconSvg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
      <path d="M5 19l7-7" />
    </IconSvg>
  );
}

export function BulbIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
    </IconSvg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </IconSvg>
  );
}

export function CoinIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 9.5h4a1.75 1.75 0 0 1 0 3.5h-3a1.75 1.75 0 0 0 0 3.5h4" />
    </IconSvg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </IconSvg>
  );
}

export function TaskIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
    </IconSvg>
  );
}

export function QuestionIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" />
      <path d="M12 17h.01" />
    </IconSvg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M12 3l9.5 17H2.5z" />
      <path d="M12 10v4M12 17.5v.01" />
    </IconSvg>
  );
}

export function BinIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 14h10l1-14" />
    </IconSvg>
  );
}

export function SpeakerIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M11 5L6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </IconSvg>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </IconSvg>
  );
}

// Cabeça de perfil falando: o Modo voz (cada tela fala ao abrir).
export function VoiceModeIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M9 21v-3H7a2 2 0 0 1-2-2v-3l-2-1 2-3.5A6.5 6.5 0 0 1 17 9c0 2-1 3.5-2 4.5V21" />
      <path d="M19 8a4 4 0 0 1 0 5" />
      <path d="M21.5 6a7.5 7.5 0 0 1 0 9" />
    </IconSvg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </IconSvg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M7 4.5v15l13-7.5z" />
    </IconSvg>
  );
}
