// @ts-check
/**
 * Un champ texte (text, password, tel, email, number, search) ; `onChange` reçoit le texte.
 *
 * @param {{ id?: string, label: string, type?: string, value: string | number, onChange: (value: string) => void, className?: string } & Record<string, any>} props
 */
export default function TextField({ id, label, type = 'text', value, onChange, className, ...rest }) {
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>{label}</label>
      <input className="field__input" id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} {...rest} />
    </div>
  );
}
