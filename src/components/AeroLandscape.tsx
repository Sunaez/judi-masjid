import { Moon } from 'lucide-react'

// Fixed positions keep the server and browser skies identical during hydration.
const stars = [
  [9, 17, 2], [24, 12, 2], [38, 20, 2], [54, 14, 3], [66, 21, 2],
  [78, 13, 3], [90, 19, 2], [96, 32, 2], [84, 30, 3], [72, 35, 2],
  [61, 29, 2], [93, 44, 3], [81, 49, 2], [70, 44, 3], [57, 41, 2],
  [16, 36, 2], [31, 30, 2], [44, 47, 2], [7, 52, 2], [23, 58, 2],
  [52, 61, 2], [65, 55, 2], [89, 60, 2], [96, 67, 3],
]

/** Decorative day and night layers crossfade using the public theme. */
export default function AeroLandscape() {
  return (
    <>
      <div className="aero-stars" aria-hidden="true">
        {stars.map(([left, top, size], index) => (
          <span key={index} className={`aero-star${size === 3 ? ' aero-star-bright' : ''}`} style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }} />
        ))}
      </div>
      <div className="aero-landscape" aria-hidden="true">
        <div className="aero-day-sky">
          <div className="aero-sun" />
          <div className="aero-bubble aero-bubble-one" />
          <div className="aero-bubble aero-bubble-two" />
        </div>
        <div className="aero-night-sky">
          <Moon className="aero-moon" strokeWidth={0.5} />
        </div>
        <svg className="aero-hills" viewBox="0 0 640 280" fill="none" preserveAspectRatio="none">
          <path d="M0 196C110 108 221 235 358 161C475 98 557 131 640 108V280H0Z" fill="var(--aero-hill)" opacity=".65" />
          <path d="M0 232C159 146 285 271 452 193C520 161 583 179 640 160V280H0Z" fill="var(--aero-hill-front)" opacity=".65" />
          <path d="M0 243C179 178 315 291 640 207" stroke="var(--highlight)" strokeWidth="2" />
        </svg>
        <svg className="aero-masjid" viewBox="320 55 200 180" fill="none">
          <g fill="var(--surface)" stroke="var(--accent-color)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M370 222V160H492V222Z" />
            <path d="M382 160C382 132 413 126 431 100C450 126 481 132 481 160Z" />
            <path d="M431 100V87M431 88C421 88 421 76 427 73C424 82 432 86 438 80C437 85 434 88 431 88Z" />
            {/* One closed silhouette keeps the spire, roof and tower connected. */}
            <path d="M345 222V120H341L349 108V76L354 67L359 76V108L367 120H363V222Z" />
            <path d="M341 120H367M340 144H368M346 151H362" fill="none" />
            <path d="M409 222V195C409 183 422 180 431 169C440 180 453 183 453 195V222Z" fill="var(--aero-hill-front)" />
            <path d="M383 201V185Q389 173 395 185V201ZM465 201V185Q471 173 477 185V201Z" fill="var(--aero-glow)" />
            <path d="M329 222H508" fill="none" />
          </g>
        </svg>
      </div>
    </>
  )
}
