'use client'

type Lantern = {
  left: string
  top: string
  scale: number
  delay: string
  duration: string
}

const LANTERNS: Lantern[] = [
  { left: '6%', top: '-4%', scale: 1, delay: '0s', duration: '5.6s' },
  { left: '18%', top: '8%', scale: 0.72, delay: '0.8s', duration: '6.4s' },
  { left: '34%', top: '-2%', scale: 0.88, delay: '1.5s', duration: '5.9s' },
  { left: '58%', top: '6%', scale: 0.76, delay: '0.3s', duration: '6.2s' },
  { left: '76%', top: '-5%', scale: 1.04, delay: '1.1s', duration: '5.4s' },
  { left: '90%', top: '10%', scale: 0.7, delay: '1.8s', duration: '6.6s' },
]

type EidLanternBackdropProps = {
  className?: string
}

export default function EidLanternBackdrop({ className = '' }: EidLanternBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,238,194,0.18),transparent_45%),linear-gradient(180deg,rgba(23,45,58,0.04),rgba(23,45,58,0.18))]" />

      {LANTERNS.map((lantern, index) => (
        <div
          key={`${lantern.left}-${index}`}
          className="absolute"
          style={{
            left: lantern.left,
            top: lantern.top,
            transform: `scale(${lantern.scale})`,
          }}
        >
          <div
            style={{
              animation: `eid-lantern-float ${lantern.duration} ease-in-out ${lantern.delay} infinite`,
            }}
          >
            <div className="mx-auto h-24 w-[2px] bg-[rgba(246,198,95,0.3)]" />
            <div className="relative h-24 w-14 rounded-t-[20px] rounded-b-[28px] border border-[rgba(214,152,47,0.65)] bg-[linear-gradient(180deg,rgba(255,229,148,0.92),rgba(240,177,58,0.82)_45%,rgba(151,90,23,0.9))] shadow-[0_0_30px_rgba(255,208,102,0.35)]">
              <div className="absolute left-1/2 top-[-10px] h-5 w-5 -translate-x-1/2 rounded-full border border-[rgba(214,152,47,0.7)] bg-[rgba(78,52,18,0.2)]" />
              <div className="absolute inset-x-3 top-3 bottom-4 rounded-t-[10px] rounded-b-[18px] bg-[radial-gradient(circle_at_top,rgba(255,252,225,0.95),rgba(255,216,120,0.45)_50%,rgba(255,216,120,0.08)_75%)]" />
              <div className="absolute inset-y-4 left-2 w-[1px] bg-[rgba(120,67,16,0.4)]" />
              <div className="absolute inset-y-4 right-2 w-[1px] bg-[rgba(120,67,16,0.4)]" />
              <div className="absolute left-1/2 top-4 h-14 w-[1px] -translate-x-1/2 bg-[rgba(120,67,16,0.32)]" />
            </div>
          </div>
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(10,23,32,0.08))]" />

      <style jsx>{`
        @keyframes eid-lantern-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(14px);
          }
        }
      `}</style>
    </div>
  )
}
