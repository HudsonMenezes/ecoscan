import { Link } from 'react-router';

type BigActionButtonProps = {
  to: string;
  icon: React.ReactNode;
  label: string; // também é o texto falado pelo módulo voice
  color: 'green' | 'blue' | 'amber';
};

export function BigActionButton({ to, icon, label, color }: BigActionButtonProps) {
  return (
    <Link to={to} className={`big-action big-action--${color}`} aria-label={label}>
      <span className="big-action__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="big-action__label">{label}</span>
    </Link>
  );
}
