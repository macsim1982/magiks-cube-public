// @ts-check
import './RubikIcon.scss';

const EMPTY_FACE = Array(9).fill('hidden')

const HEAD_LENGTH = 0.55
const HEAD_WIDTH = 0.38

// Pointe de flèche : un triangle dont le sommet est `tip`, orienté selon `dir`
/** @param {number[]} tip @param {number[]} dir */
const head = ([x, y], [dx, dy]) => {
  const bx = x - dx * HEAD_LENGTH
  const by = y - dy * HEAD_LENGTH
  return `${x},${y} ${bx - dy * HEAD_WIDTH},${by + dx * HEAD_WIDTH} ${bx + dy * HEAD_WIDTH},${by - dx * HEAD_WIDTH}`
}

/** @param {number[]} v @returns {[number, number]} */
const unit = ([x, y]) => {
  const length = Math.hypot(x, y)
  return [x / length, y / length]
}

function LineArrow({ from, to, double }) {
  const dir = unit([to[0] - from[0], to[1] - from[1]])
  const back = [to[0] - dir[0] * 0.45, to[1] - dir[1] * 0.45]
  return (
    <>
      <line x1={from[0]} y1={from[1]} x2={back[0]} y2={back[1]} />
      <polygon points={head(to, dir)} />
      {double && <polygon points={head(back, dir)} />}
    </>
  )
}

// Flèche ronde sur 3/4 de tour, autour du centre de la face
function TurnArrow({ clockwise, double }) {
  const r = 0.9
  const side = clockwise ? 1 : -1
  const start = Math.PI * 0.75
  const end = start + side * Math.PI * 1.5
  const at = (angle) => [1.5 + r * Math.cos(angle), 1.5 + r * Math.sin(angle)]
  const tangent = (angle) => [-Math.sin(angle) * side, Math.cos(angle) * side]
  const [x0, y0] = at(start)
  const stop = end - side * 0.45
  const [x1, y1] = at(stop)
  const before = end - side * 0.75
  return (
    <>
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 1 ${clockwise ? 1 : 0} ${x1} ${y1}`} />
      <polygon points={head(at(end), tangent(end))} />
      {double && <polygon points={head(at(before), tangent(before))} />}
    </>
  )
}

function Arrows({ arrows }) {
  const shapes = arrows.map((arrow, index) => (
    arrow.kind === 'turn'
      ? <TurnArrow key={index} {...arrow} />
      : <LineArrow key={index} {...arrow} />
  ))
  return (
    <svg className="rubik-icon__arrows" viewBox="0 0 3 3">
      {/* Un liseré clair d’abord : la flèche se lit sur toutes les couleurs */}
      <g className="rubik-icon__arrow-halo">{shapes}</g>
      <g className="rubik-icon__arrow">{shapes}</g>
    </svg>
  )
}

const Face = ({ name, stickers, arrows }) => (
  <span className={`rubik-icon__face rubik-icon__face--${name}`}>
    {stickers.map((color, index) => (
      <span
        key={index}
        className={`rubik-icon__sticker rubik-icon__sticker--${color}`}
      />
    ))}
    {arrows?.length > 0 && <Arrows arrows={arrows} />}
  </span>
)

// Des <span>, jamais de <div> : l’icône vit dans un <p>, un <h1> ou un
// bouton. Dans la copie statique d’index.html, un <div> fermerait le <p>
// du nom, et le petit cube sortirait de sa pastille.
/** @param {{ size?: number, faces?: Record<string, string[]>, arrows?: Record<string, object[]>, rotation?: { x: number, y: number, z: number }, gap?: number, radius?: number }} props */
export default function RubikIcon({
  size = 18,
  faces = {},
  arrows = {},
  rotation = {
    x: -30,
    y: -45,
    z: 0,
  },
  gap = 1,
  radius = 0,
}) {
  const {
    U = EMPTY_FACE,
    F = EMPTY_FACE,
    R = EMPTY_FACE,
  } = faces

  const style = /** @type {import('react').CSSProperties} */ ({
    '--rubik-size': `${size}px`,
    '--rubik-gap': `${gap}px`,
    '--rubik-radius': `${radius}px`,
    '--rubik-rotate-x': `${rotation.x}deg`,
    '--rubik-rotate-y': `${rotation.y}deg`,
    '--rubik-rotate-z': `${rotation.z}deg`,
  })

  return (
    <span
      className="rubik-icon"
      style={style}
      aria-hidden="true"
    >
      <span className="rubik-icon__cube">

        <Face
          name="U"
          stickers={U}
          arrows={arrows.U}
        />

        <Face
          name="F"
          stickers={F}
          arrows={arrows.F}
        />

        <Face
          name="R"
          stickers={R}
          arrows={arrows.R}
        />

      </span>
    </span>
  )
}
