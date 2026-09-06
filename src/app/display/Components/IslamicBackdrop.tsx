import { Moon } from 'lucide-react'

const STARS = [[120, 100], [360, 60], [570, 135], [790, 75], [1090, 110], [1330, 50], [1510, 145], [1810, 90], [90, 290], [1840, 315], [1600, 380], [330, 405]]

function Mosque({ transform, className }: { transform: string; className: string }) {
  return (
    <g transform={transform} className={className}>
      <g transform="translate(-320 -55)" fill="var(--surface)" stroke="var(--accent-color)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M370 222V160H492V222ZM382 160C382 132 413 126 431 100C450 126 481 132 481 160Z" />
        <path d="M431 100V87M431 88C421 88 421 76 427 73C424 82 432 86 438 80C437 85 434 88 431 88Z" />
        <path d="M345 222V120H341L349 108V76L354 67L359 76V108L367 120H363V222Z" />
        <path d="M341 120H367M340 144H368M346 151H362" fill="none" />
        <path d="M409 222V195C409 183 422 180 431 169C440 180 453 183 453 195V222Z" fill="var(--aero-hill-front)" />
        <path d="M383 201V185Q389 173 395 185V201ZM465 201V185Q471 173 477 185V201Z" fill="var(--aero-glow)" />
        <path d="M329 222H508" fill="none" />
      </g>
    </g>
  )
}

/** A quiet mosque landscape leaves the centre clear for display messages. */
export default function IslamicBackdrop({ className = '' }: { className?: string }) {
  return (
    <div className={'islamic-backdrop ' + className} aria-hidden="true">
      <div className="display-sky-day">
        <div className="display-sky-sun" />
        <div className="display-sky-bubble display-sky-bubble-large" />
        <div className="display-sky-bubble display-sky-bubble-small" />
      </div>
      <div className="display-sky-night">
        <Moon className="display-sky-moon" strokeWidth={0.5} />
        <svg className="display-sky-stars" viewBox="0 0 1920 702" preserveAspectRatio="none" focusable="false">
          {STARS.map(([x, y], index) => <circle key={index} cx={x} cy={y} r={index % 3 === 0 ? 2.5 : 1.5} fill="#f6dfb3" opacity={index % 3 === 0 ? 0.7 : 0.4} />)}
        </svg>
      </div>
      <svg className="display-mosque-landscape" viewBox="0 0 1920 320" fill="none" preserveAspectRatio="xMidYMax meet" focusable="false">
        <path d="M0 164C238 116 423 256 720 211C1079 155 1356 229 1581 171C1736 131 1835 144 1920 119V320H0Z" fill="var(--aero-hill)" opacity=".22" />
        <path d="M0 239C251 187 508 299 835 261C1112 229 1420 270 1663 235C1781 218 1860 222 1920 205V320H0Z" fill="var(--aero-hill-front)" opacity=".18" />
        <path d="M0 283C350 227 492 324 865 288S1489 305 1920 253" stroke="var(--highlight)" strokeWidth="2" opacity=".7" />
        <Mosque transform="translate(125 141) scale(.78)" className="display-mosque-far" />
        <Mosque transform="translate(1510 51) scale(1.32)" className="display-mosque-near" />
      </svg>
      <div className="display-scenery-veil" />
    </div>
  )
}
