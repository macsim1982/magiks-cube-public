// @ts-check
import { FACE_KEYS, FACE_LABELS, MIRROR_OFFSET, OFFSET_AXES, SURFACE_PARAMS } from '../../../look/look';
import { Field } from '../../components';
import './LookPanel.scss';

function ParamSliders({ id, values, onChange }) {
  return (
    <ul className="look-params">
      {SURFACE_PARAMS.map((param) => (
        <li key={param.key}>
          <Field
            type="range"
            id={`${id}-${param.key}`}
            label={param.label}
            min="0"
            max="1"
            step="0.01"
            value={values[param.key]}
            onChange={(value) => onChange(param.key, value)}
          />
        </li>
      ))}
    </ul>
  );
}

/** Classique ou Mirror ; en Mirror, le décalage des couches sur les trois axes */
function MirrorSettings({ look, onChange }) {
  const setOffset = (index, value) => {
    onChange((current) => {
      const offset = [...(current.offset ?? MIRROR_OFFSET)];
      offset[index] = value;
      return { ...current, offset };
    });
  };
  return (
    <>
      <div className={`look-seg${look.mirror ? ' is-mirror' : ''}`}>
        <span className="look-seg__thumb" aria-hidden="true" />
        <button
          type="button"
          className={!look.mirror ? 'is-active' : undefined}
          onClick={() => onChange((current) => ({ ...current, mirror: false }))}
        >
          Classique
        </button>
        <button
          type="button"
          className={look.mirror ? 'is-active' : undefined}
          onClick={() => onChange((current) => ({ ...current, mirror: true }))}
        >
          Mirror
        </button>
      </div>
      {look.mirror && (
        <ul className="look-params look-offset">
          {OFFSET_AXES.map((axis) => (
            <li key={axis.label}>
              <Field
                type="range"
                id={`offset-${axis.label}`}
                label={axis.label}
                min="-0.9"
                max="0.9"
                step="0.01"
                value={(look.offset ?? MIRROR_OFFSET)[axis.index]}
                onChange={(value) => setOffset(axis.index, value)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Une couleur par face, et celle du plastique */
function ColorFields({ colors, onChange }) {
  return (
    <div className="look-colors">
      {[...FACE_KEYS, 'body'].map((key) => (
        <Field
          key={key}
          type="color"
          className="look-swatch"
          label={FACE_LABELS[key]}
          value={colors[key]}
          onChange={(value) => onChange((current) => ({ ...current, colors: { ...current.colors, [key]: value } }))}
        />
      ))}
    </div>
  );
}

/** Réglages du look : chaque champ change une partie de `look` par `onChange(current => next)`. */
export default function LookPanel({ look, onChange, mirror = true }) {
  const setSurface = (surface, key, value) => {
    onChange((current) => ({
      ...current,
      [surface]: { ...current[surface], [key]: value },
    }));
  };

  return (
    <section className="look" aria-label="Apparence">
      <h2>Apparence</h2>
      {mirror && <MirrorSettings look={look} onChange={onChange} />}
      <ColorFields colors={look.colors} onChange={onChange} />

      <details className="look-group" open>
        <summary>Plastique</summary>
        <ParamSliders id="body" values={look.body} onChange={(key, value) => setSurface('body', key, value)} />
      </details>

      <details className="look-group" open>
        <summary>Stickers</summary>
        <ParamSliders id="sticker" values={look.sticker} onChange={(key, value) => setSurface('sticker', key, value)} />
      </details>
    </section>
  );
}
