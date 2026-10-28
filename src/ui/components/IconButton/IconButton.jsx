// @ts-check
import Button from '../Button';

/**
 * Un bouton rond, une icône seule. Son nom (`label`) est obligatoire : il
 * est lu par les lecteurs d’écran et s’affiche au survol.
 *
 * @param {{ icon: string, label: string, className?: string } & Record<string, any>} props
 */
export default function IconButton({ icon, label, className, ...rest }) {
  return (
    <Button icon={icon} className={['btn-icon', className].filter(Boolean).join(' ')} aria-label={label} title={label} {...rest} />
  );
}
