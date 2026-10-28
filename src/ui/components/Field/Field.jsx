// @ts-check
import ColorField from './ColorField';
import RangeField from './RangeField';
import SelectField from './SelectField';
import TextField from './TextField';
import './Field.scss';

const KINDS = { range: RangeField, color: ColorField, select: SelectField };

/**
 * Un champ de saisie : `type` range, color, select, ou un type
 * texte (text, password, tel, email, number, search). Chaque type a son
 * composant ; `onChange` reçoit toujours la valeur, jamais l’événement.
 *
 * @param {{ type?: string, label: string, value: any, onChange: (value: any) => void } & Record<string, any>} props
 */
export default function Field({ type = 'text', ...props }) {
  const Kind = KINDS[type];
  return Kind ? <Kind {...props} /> : <TextField type={type} {...props} />;
}
