'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useIsPresent, useReducedMotion } from 'motion/react'

/** Reveal once as content enters the viewport, without hiding server-rendered content. */
export function SectionReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!element || preference.matches || !('IntersectionObserver' in window)) return
    if (element.getBoundingClientRect().top < window.innerHeight - 24) return

    element.dataset.reveal = 'pending'
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        element.dataset.reveal = 'visible'
        observer.disconnect()
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' })
    observer.observe(element)

    const reveal = () => {
      element.dataset.reveal = 'visible'
      observer.disconnect()
    }
    preference.addEventListener('change', reveal)
    return () => {
      observer.disconnect()
      preference.removeEventListener('change', reveal)
      delete element.dataset.reveal
    }
  }, [])

  return (
    <div ref={ref} className="section-reveal" onFocusCapture={() => {
      if (ref.current) ref.current.dataset.reveal = 'visible'
    }}>{children}</div>
  )
}

/** Keep the outgoing section in place briefly, but remove it from keyboard navigation. */
export function SectionTransition({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()
  const isPresent = useIsPresent()

  return (
    <motion.div
      className="section-transition"
      inert={!isPresent}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={{
        initial: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 14 },
        enter: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -8, transition: { duration: reducedMotion ? 0 : 0.14 } },
      }}
    >{children}</motion.div>
  )
}
