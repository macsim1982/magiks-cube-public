// @ts-check
/**
 * Une liste de choix : `options` = [{ value, label }] ; `onChange` reçoit la valeur.
 *
 * @param {{ id?: string, label: string, value: string, options: { value: string, label: string }[], onChange: (value: string) => void, className?: string } & Record<string, any>} props
 */
export default function SelectField({ id, label, value, options, onChange, className, ...rest }) {
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>{label}</label>
      <select className="field__input" id={id} value={value} onChange={(event) => onChange(event.target.value)} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
