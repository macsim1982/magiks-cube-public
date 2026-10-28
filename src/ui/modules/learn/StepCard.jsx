// @ts-check
import { useEffect, useRef, useState } from 'react';
import { hasChallenge } from '../../../learn/challenge';
import { Button, IconButton, MoveList } from '../../components';
import { Icon } from '../../icons';
import ChallengeChip from './ChallengeChip';
import ChallengeGuess from './ChallengeGuess';
import { StepMark } from './learnMarks';
import PlayRow from './PlayRow';
import PracticeCoach from './PracticeCoach';
import StepDone from './StepDone';

/** Coche d’un cas validé. */
function Validated() {
  return (
    <span className="learn__validated" role="img" aria-label="réussi">✓</span>
  );
}

/** Un point par cas : vert une fois réussi, cerclé pour le cas en cours ; une étoile pour le défi */
function CaseDots({ algs, selected, caseDone, onPick, challenge }) {
  return (
    <span className="step-card__dots" role="tablist" aria-label="Les cas de cette étape">
      {algs.map((item, index) => (
        <button
          key={item.label}
          type="button"
          role="tab"
          aria-selected={index === selected && !challenge.on}
          aria-label={`Cas ${index + 1} : ${item.label}${caseDone(index) ? ', réussi' : ''}`}
          title={item.label}
          className={`step-card__dot${index === selected && !challenge.on ? ' is-current' : ''}${caseDone(index) ? ' is-done' : ''}`}
          onClick={() => onPick(index)}
        />
      ))}
      {challenge.can && (
        <button
          type="button"
          role="tab"
          aria-selected={challenge.on}
          aria-label={`Défi${challenge.won ? ', réussi' : ''}`}
          title="Défi"
          className={`step-card__defi${challenge.on ? ' is-current' : ''}${challenge.won ? ' is-done' : ''}`}
          onClick={challenge.onPick}
        >
          <Icon name="star" size={14} />
        </button>
      )}
    </span>
  );
}

/** Le cas : ‹ › vont au cas voisin, puis au défi, puis à l’étape voisine */
function CasePicker({ step, selected, nav, caseDone, onPick, challenge }) {
  const { algs } = step;
  const alg = algs[selected];
  return (
    <div className="step-card__case" data-flip="cases">
      <IconButton icon="chevronLeft" label={nav.prevLabel} disabled={!nav.canPrev} onClick={nav.onPrev} />
      <div className="step-card__case-body">
        {challenge.on ? (
          <span className="step-card__case-name">
            <ChallengeChip />
            <span>Reconnais le cas</span>
          </span>
        ) : (
          <span className="step-card__case-name">
            {alg && <StepMark alg={alg} />}
            <span>{alg?.label ?? step.title}</span>
            {alg && caseDone(selected) && <Validated />}
          </span>
        )}
        {algs.length > 1 && <CaseDots algs={algs} selected={selected} caseDone={caseDone} onPick={onPick} challenge={challenge} />}
      </div>
      <IconButton icon="chevronRight" label={nav.nextLabel} disabled={!nav.canNext} onClick={nav.onNext} />
    </div>
  );
}

/** La formule, toujours sur sa ligne : longue, elle garde la lettre en cours visible */
function Formula({ tokens, at, onSeek }) {
  const row = useRef(null);
  useEffect(() => {
    const el = row.current;
    const next = el?.querySelector('.is-next');
    if (!el || !(next instanceof HTMLElement)) return;
    el.scrollTo({ left: next.offsetLeft - (el.clientWidth - next.offsetWidth) / 2 });
  }, [at, tokens]);
  return (
    <div className="learn__formula" data-flip="formula" ref={row}>
      <MoveList tokens={tokens} at={at} onSeek={onSeek} />
    </div>
  );
}

/** Que dois-je faire ? L’astuce prend sa place, à la même hauteur */
function Goal({ mission, tip, tipOpen, onTip }) {
  return (
    <div className="step-card__goal">
      <p className={tipOpen ? 'is-tip' : undefined} aria-live="polite">{tipOpen ? tip : mission}</p>
      {tip && (
        <Button variant={tipOpen ? 'filled' : 'tonal'} icon="bulb" className="step-card__why" aria-pressed={tipOpen} onClick={onTip}>
          Astuce
        </Button>
      )}
    </div>
  );
}

/** Le bas de la carte, selon le moment : regarder, faire, ou le défi (le deviner, le faire, fêté) */
function StepBody({ card, tip, onTip }) {
  const { step, tokens, playback, run, nav, learn, challenge, stars, touch, mission, onReload } = card;
  if (learn.challenging && challenge.stage === 'guess') {
    return <ChallengeGuess step={step} wrong={challenge.wrong} onGuess={challenge.guess} />;
  }
  if (learn.challenging && challenge.stage === 'won') {
    return <StepDone step={step} stars={stars} nextLabel={nav.nextLabel} onNext={nav.canNext ? nav.onNext : undefined} onAgain={challenge.again} />;
  }
  if (learn.practicing || learn.challenging) {
    return (
      <PracticeCoach
        practice={run.practice}
        token={run.token}
        tokens={tokens}
        touch={touch}
        nextLabel={nav.nextLabel}
        onReplay={run.replay}
        onRead={learn.challenging ? undefined : () => learn.changeMode('read')}
        onNext={nav.canNext ? nav.onNext : undefined}
      />
    );
  }
  return (
    <>
      <Goal mission={mission} tip={tip.text} tipOpen={tip.open} onTip={onTip} />
      <PlayRow tokens={tokens} playback={playback} nav={nav} onReload={onReload} onPractice={() => learn.changeMode('practice')} />
    </>
  );
}

/** Où en est la formule : la démo, À toi, ou toute faite une fois le défi réussi */
function formulaAt({ tokens, playback, run, learn, challenge }) {
  if (learn.challenging && challenge.stage === 'won') return tokens.length;
  return learn.practicing || learn.challenging ? run.practice.at + 1 : playback.frame;
}

/**
 * La carte d’une étape : une carte, un bouton qui avance.
 * - le cas : ‹ son nom et ses points, l’étoile du défi › ;
 * - la formule, sur sa ligne, cachée tant que le défi n’est pas deviné ;
 * - Regarder : la mission (💡 Astuce la remplace par une phrase d’aide),
 *   puis ▶ Montre-moi → ✋ À toi ! ;
 * - À toi : la bulle remplace ces deux lignes, puis « Suivant › » ;
 * - le défi : quel cas ? puis sans flèche, puis l’étape fêtée.
 * Les éléments marqués `data-flip` glissent d’un mode à l’autre.
 */
export default function StepCard(card) {
  const { caseId, step, selected, tokens, playback, nav, learn, challenge, caseDone, tip } = card;
  // L’astuce vaut pour le cas où on l’a ouverte : un autre cas repart sur la mission
  const [tipFor, setTipFor] = useState(null);
  const tipOpen = Boolean(tip) && tipFor === caseId;
  const doing = learn.practicing || (learn.challenging && challenge.stage === 'do');
  const hideFormula = learn.challenging && challenge.stage === 'guess';
  const dots = {
    can: hasChallenge(step),
    on: learn.challenging,
    won: card.stars.challenge,
    onPick: () => learn.changeMode('challenge'),
  };
  return (
    <div className={`learn step-card${doing ? ' learn--practice' : ''}`}>
      <CasePicker step={step} selected={selected} nav={nav} caseDone={caseDone} onPick={learn.pickAlg} challenge={dots} />
      {tokens.length > 0 && !hideFormula && (
        <Formula
          tokens={tokens}
          at={formulaAt(card)}
          onSeek={doing || learn.challenging || playback.playing ? undefined : playback.seek}
        />
      )}
      <StepBody card={card} tip={{ text: tip, open: tipOpen }} onTip={() => setTipFor(tipOpen ? null : caseId)} />
    </div>
  );
}
