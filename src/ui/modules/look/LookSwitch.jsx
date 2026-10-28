// @ts-check
import { Button } from '../../components';

export default function LookSwitch({ mirror, disabled, onChange }) {
  return (
    <Button
      variant={mirror ? 'filled' : 'outlined'}
      icon={mirror ? 'mirror' : 'classic'}
      className="look-switch"
      aria-pressed={mirror}
      title={mirror ? 'Mirror' : 'Classique'}
      disabled={disabled}
      onClick={() => onChange(!mirror)}
    >
      {/* Sur téléphone, l’icône seule */}
      <span className="look-switch__label">{mirror ? 'Mirror' : 'Classique'}</span>
    </Button>
  );
}
