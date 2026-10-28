// @ts-check
const twoDecimals = (value) => Number(value).toFixed(2);

/**
 * Un curseur : son nom et sa valeur au-dessus, `onChange` reçoit un nombre.
 * `format={null}` : le nom seul.
 *
 * @param {{ id?: string, label: string, value: number, onChange: (value: number) => void, format?: ((value: number) => string) | null } & Record<string, any>} props
 */
export default function RangeField({ id, label, value, onChange, format = twoDecimals, ...rest }) {
  return (
    <>
      <label htmlFor={id}>
        <span>{label}</span>
        {format && <code>{format(value)}</code>}
      </label>
      <input id={id} type="range" value={value} onChange={(event) => onChange(Number(event.target.value))} {...rest} />
    </>
  );
}
