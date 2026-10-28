// @ts-check
import { PUZZLE_LIST } from '../../../puzzles';
import { Button } from '../../components';
import './PuzzlePicker.scss';

export default function PuzzlePicker({ value, onChange }) {
  return (
    <div className="puzzle-picker" role="group" aria-label="Puzzle">
      {PUZZLE_LIST.map((puzzle) => (
        <Button
          key={puzzle.id}
          variant={puzzle.id === value ? 'filled' : 'outlined'}
          onClick={() => onChange(puzzle.id)}
        >
          {puzzle.label}
        </Button>
      ))}
    </div>
  );
}
