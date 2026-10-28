// @ts-check
import './MoveList.scss';

function Token({ children, done, current, label, onClick }) {
  const className = [
    'move-list__token',
    done ? 'is-done' : '',
    current ? 'is-next' : '',
  ].filter(Boolean).join(' ');

  if (!onClick) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-current={current ? 'step' : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        e.currentTarget.blur();
      }}
    >
      {children}
    </button>
  );
}

/** @param {{ tokens: string[], at?: number, onSeek?: (at: number) => void, empty?: string, showStart?: boolean }} props */
export default function MoveList({ tokens, at, onSeek, empty = '—', showStart = false }) {
  if (!tokens?.length) {
    return <span className="move-list move-list--empty">{empty}</span>;
  }

  const here = at != null;

  return (
    <div className="move-list">
      {showStart && (
        <Token
          done={here && at > 0}
          current={here && at === 0}
          label="Revenir au départ"
          onClick={onSeek ? () => onSeek(0) : undefined}
        >
          ⚑ 
        </Token>
      )}
      {tokens.map((token, i) => (
        <Token
          key={`${token}-${i}`}
          done={here && at > i + 1}
          current={here && at === i + 1}
          label={`Aller au coup ${i + 1} : ${token}`}
          onClick={onSeek ? () => onSeek(i + 1) : undefined}
        >
          {token}
        </Token>
      ))}
    </div>
  );
}
