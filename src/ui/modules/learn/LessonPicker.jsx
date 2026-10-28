// @ts-check
import { Button } from '../../components';

export default function LessonPicker({ lessons, current, onChange }) {
  return (
    <div className="lesson-picker" role="tablist" aria-label="Choisir une méthode">
      {lessons.map((lesson, i) => (
        <Button
          key={lesson.id}
          variant={i === current ? 'filled' : 'outlined'}
          role="tab"
          aria-selected={i === current}
          onClick={() => onChange(i)}
        >
          {lesson.title}
        </Button>
      ))}
    </div>
  );
}
