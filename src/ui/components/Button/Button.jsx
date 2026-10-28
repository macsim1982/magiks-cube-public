// @ts-check
import { Icon } from '../../icons';
import './Button.scss';

/**
 * Le bouton du design system : `variant`
 * filled (l’action principale), tonal ou outlined ; `icon` avant le texte,
 * `iconAfter` après (« Suivant › ») ; `caption` : l’icône au-dessus d’un
 * petit mot. Le reste (onClick, disabled, aria-*, data-*, ref…) va au
 * <button>.
 *
 * @param {{ variant?: string, icon?: string, iconAfter?: string, caption?: boolean, className?: string, children?: import('react').ReactNode } & Record<string, any>} props
 */
export default function Button({ variant = 'outlined', icon, iconAfter, caption = false, className, children, ...rest }) {
  const classes = ['btn', `btn-${variant}`, caption && 'btn-caption', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
      {iconAfter && <Icon name={iconAfter} />}
    </button>
  );
}
