// @ts-check
import { useEffect } from 'react';
import { Button } from '../../components';
import './IntroSkip.scss';

/**
 * Pendant l’intro : une couche qui garde le cube des doigts, et
 * « Passer l’intro », visible tout du long. Échap passe aussi.
 */
export default function IntroSkip({ onSkip }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  return (
    <div className="intro">
      <Button variant="tonal" iconAfter="fastForward" className="intro__skip" onClick={onSkip}>
        Passer l’intro
      </Button>
    </div>
  );
}
