'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import gsap from 'gsap'
import TextPlugin from 'gsap/TextPlugin'
import ScrollTrigger from 'gsap/ScrollTrigger'

// Register GSAP plugins
gsap.registerPlugin(TextPlugin, ScrollTrigger)

export default function Footer() {
  const footerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const triggerEl = footerRef.current

      // Address bounce effect when in view
      gsap.from('.footer-address', {
        scrollTrigger: { trigger: triggerEl, start: 'top 80%' },
        duration: 1,
        opacity: 0,
        scale: 0.8,
        ease: 'elastic.out(1, 0.3)',
      })

      // Tagline slide up
      gsap.from('.footer-tagline', {
        scrollTrigger: { trigger: triggerEl, start: 'top 80%' },
        duration: 0.8,
        opacity: 0,
        y: 20,
        ease: 'power2.out',
      })

      // Main heading typewriter effect
      gsap.from('.footer-main-heading', {
        scrollTrigger: { trigger: triggerEl, start: 'top 80%' },
        duration: 1.5,
        text: '',
        ease: 'none',
      })

      // Subheaders fade in
      gsap.from('.footer-subheader', {
        scrollTrigger: { trigger: triggerEl, start: 'top 80%' },
        duration: 0.8,
        opacity: 0,
        y: 10,
        stagger: 0.2,
        ease: 'power3.out',
      })

      // List items slide in
      gsap.from('.footer-list-item', {
        scrollTrigger: { trigger: triggerEl, start: 'top 80%' },
        duration: 0.8,
        opacity: 0,
        x: -30,
        stagger: 0.15,
        ease: 'power3.out',
      })
    }, footerRef)

    return () => ctx.revert()
  }, [])

  return (
    <motion.footer
      ref={footerRef}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-[var(--background-end)] py-8 px-4"
    >
      {/* Address and tagline */}
      <div className="text-center mb-6">
        <p className="footer-address text-base text-[var(--text-color)]">
          298 Dudley Rd, Birmingham B18 4HL
        </p>
        <p className="footer-tagline text-base text-[var(--text-color)] mt-2">
          Feel free to visit us or reach out with any questions.
        </p>
      </div>

      {/* Two-column contact info */}
      <div className="content grid grid-cols-1 md:grid-cols-2 gap-8 text-base text-[var(--text-color)]">
        <h2 className="footer-main-heading col-span-full text-xl font-semibold mb-4">
          Please do not hesitate to call or email us about anything
        </h2>

        <div>
          <h3 className="footer-subheader text-lg font-medium mb-2">
            Phone
          </h3>
          <ul>
            <li className="footer-list-item">
              Sharia inquiries: 07734 155 096
            </li>
          </ul>
        </div>

        <div>
          <h3 className="footer-subheader text-lg font-medium mb-2">
            Email
          </h3>
          <ul>
            <li className="footer-list-item">
              Mosque: judi@muslim.com
            </li>
            <li className="footer-list-item">
              Website/TV screen: alanddazad4@gmail.com
            </li>
          </ul>
        </div>
      </div>
    </motion.footer>
  )
}
