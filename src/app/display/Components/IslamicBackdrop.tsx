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

        <g className="islamic-small-arches">
          {SMALL_ARCHES.map(x => (
            <path key={x} d={smallHorseshoeArchPath(x)} />
          ))}
        </g>
      </svg>
    </div>
  );
}
