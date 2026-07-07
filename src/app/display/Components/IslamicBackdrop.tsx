'use client';

import React from 'react';

type IslamicBackdropProps = {
  className?: string;
};

const LARGE_ARCHES = [
  { cx: 280, halfWidth: 260, baseY: 1110, springY: 430, apexY: 84 },
  { cx: 960, halfWidth: 390, baseY: 1110, springY: 390, apexY: 58 },
  { cx: 1640, halfWidth: 260, baseY: 1110, springY: 430, apexY: 84 },
];

const RECESSED_ARCHES = [
  { cx: 82, halfWidth: 172, baseY: 1100, springY: 558, apexY: 300 },
  { cx: 420, halfWidth: 218, baseY: 1100, springY: 510, apexY: 214 },
  { cx: 960, halfWidth: 300, baseY: 1100, springY: 475, apexY: 168 },
  { cx: 1500, halfWidth: 218, baseY: 1100, springY: 510, apexY: 214 },
  { cx: 1838, halfWidth: 172, baseY: 1100, springY: 558, apexY: 300 },
];

const SMALL_ARCHES = [150, 390, 630, 870, 1110, 1350, 1590];

const STAR_POINTS =
  '0,-24 7,-7 24,0 7,7 0,24 -7,7 -24,0 -7,-7';

function pointedArchPath(
  cx: number,
  halfWidth: number,
  baseY: number,
  springY: number,
  apexY: number
) {
  const left = cx - halfWidth;
  const right = cx + halfWidth;
  const innerCurve = halfWidth * 0.36;

  return [
    `M ${left} ${baseY}`,
    `V ${springY}`,
    `C ${left} ${springY - 150} ${cx - innerCurve} ${apexY + 145} ${cx} ${apexY}`,
    `C ${cx + innerCurve} ${apexY + 145} ${right} ${springY - 150} ${right} ${springY}`,
    `V ${baseY}`,
  ].join(' ');
}

function closedPointedArchPath(
  cx: number,
  halfWidth: number,
  baseY: number,
  springY: number,
  apexY: number
) {
  return `${pointedArchPath(cx, halfWidth, baseY, springY, apexY)} Z`;
}

function smallHorseshoeArchPath(x: number) {
  const top = 716;
  const base = 1094;
  const left = x;
  const right = x + 180;
  const cx = x + 90;

  return [
    `M ${left} ${base}`,
    'V 858',
    `C ${left} 760 ${cx - 74} ${top + 38} ${cx} ${top}`,
    `C ${cx + 74} ${top + 38} ${right} 760 ${right} 858`,
    `V ${base}`,
  ].join(' ');
}

export default function IslamicBackdrop({ className = '' }: IslamicBackdropProps) {
  return (
    <div className={`islamic-backdrop ${className}`} aria-hidden="true">
      <svg
        className="islamic-backdrop-svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <radialGradient id="islamic-backdrop-light" cx="50%" cy="16%" r="72%">
            <stop offset="0%" stopColor="#fff7ec" stopOpacity="0.34" />
            <stop offset="44%" stopColor="#fff7ec" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#5a2b24" stopOpacity="0.08" />
          </radialGradient>
          <linearGradient id="islamic-backdrop-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#6f3a2e" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <rect width="1920" height="1080" fill="url(#islamic-backdrop-light)" />
        <rect y="700" width="1920" height="380" fill="url(#islamic-backdrop-floor)" />

        <g opacity="0.08">
          {RECESSED_ARCHES.map(arch => (
            <path
              key={`recessed-${arch.cx}`}
              d={closedPointedArchPath(
                arch.cx,
                arch.halfWidth,
                arch.baseY,
                arch.springY,
                arch.apexY
              )}
              fill="currentColor"
            />
          ))}
        </g>

        <g opacity="0.11">
          {LARGE_ARCHES.map(arch => (
            <path
              key={`shadow-${arch.cx}`}
              d={pointedArchPath(
                arch.cx + 14,
                arch.halfWidth,
                arch.baseY + 6,
                arch.springY + 6,
                arch.apexY + 6
              )}
              fill="none"
              stroke="#5a2b24"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="10"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <g className="islamic-star-field">
          {[
            [165, 126, 0.75],
            [415, 286, 0.55],
            [690, 132, 0.45],
            [1180, 174, 0.55],
            [1435, 326, 0.44],
            [1728, 142, 0.7],
            [1515, 622, 0.38],
            [406, 626, 0.38],
          ].map(([x, y, scale]) => (
            <polygon
              key={`${x}-${y}`}
              points={STAR_POINTS}
              transform={`translate(${x} ${y}) scale(${scale})`}
            />
          ))}
        </g>

        <g className="islamic-arch-fill">
          {LARGE_ARCHES.map(arch => (
            <path
              key={`fill-${arch.cx}`}
              d={closedPointedArchPath(
                arch.cx,
                arch.halfWidth,
                arch.baseY,
                arch.springY,
                arch.apexY
              )}
            />
          ))}
        </g>

        <g className="islamic-arch-lines">
          {LARGE_ARCHES.map(arch => (
            <g key={arch.cx}>
              <path
                d={pointedArchPath(
                  arch.cx,
                  arch.halfWidth,
                  arch.baseY,
                  arch.springY,
                  arch.apexY
                )}
              />
              <path
                d={pointedArchPath(
                  arch.cx,
                  arch.halfWidth - 44,
                  arch.baseY,
                  arch.springY + 42,
                  arch.apexY + 112
                )}
              />
              <path
                d={pointedArchPath(
                  arch.cx,
                  arch.halfWidth - 88,
                  arch.baseY,
                  arch.springY + 82,
                  arch.apexY + 208
                )}
              />
            </g>
          ))}
        </g>

        <g opacity="0.18">
          {LARGE_ARCHES.map(arch => (
            <path
              key={`highlight-${arch.cx}`}
              d={pointedArchPath(
                arch.cx - 9,
                arch.halfWidth - 22,
                arch.baseY,
                arch.springY + 20,
                arch.apexY + 50
              )}
              fill="none"
              stroke="#fff8ef"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <g className="islamic-small-arches">
          {SMALL_ARCHES.map(x => (
            <path key={x} d={smallHorseshoeArchPath(x)} />
          ))}
        </g>

        <g opacity="0.07">
          <path d="M 0 1080 V 610 C 0 535 66 470 130 425 V 1080 Z" fill="#5a2b24" />
          <path d="M 1920 1080 V 610 C 1920 535 1854 470 1790 425 V 1080 Z" fill="#5a2b24" />
        </g>
      </svg>
    </div>
  );
}
