// @ts-check
/**
 * Une pastille de couleur : on la touche pour choisir ; `onChange` reçoit « #rrggbb ».
 *
 * @param {{ label: string, value: string, onChange: (value: string) => void, className?: string }} props
 */
export default function ColorField({ label, value, onChange, className }) {
  return (
    <label className={className} title={label} style={{ background: value }}>
      <span className="sr-only">{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
