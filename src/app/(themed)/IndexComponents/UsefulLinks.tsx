'use client'

import React, { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const UsefulLinks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    // scope all GSAP calls to this container
    const ctx = gsap.context(() => {
      // select every card by its .card class
      const cards = gsap.utils.toArray<HTMLUListElement>('.card', containerRef.current!)

      cards.forEach(card => {
        // enable 3D transforms on each card
        gsap.set(card, {
          transformStyle: 'preserve-3d',
          transformPerspective: 1000,
          transformOrigin: 'center center',
        })
        // animate rotationX based on scroll
        ScrollTrigger.create({
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: self => {
            const rotX = (0.5 - self.progress) * 20
            gsap.set(card, { rotationX: rotX })
          },
        })
      })
    }, containerRef)

    // cleanup on unmount
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  return (
    <section className="py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div
          ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10"
          style={{ perspective: 1000 }}
        >
          <ul className="card bg-white dark:bg-[var(--background-start)] rounded-2xl shadow-xl p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--accent-color)]">
              Social Media
            </h3>
            <li className="mb-4">
              <a
                href="https://www.youtube.com/@al-judimasjid5391"
                className="hover:text-[var(--yellow)] transition-colors"
              >
                YouTube
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/people/.../100064632764517/"
                className="hover:text-[var(--yellow)] transition-colors"
              >
                Facebook
              </a>
            </li>
          </ul>

          <ul className="card bg-white dark:bg-[var(--background-start)] rounded-2xl shadow-xl p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--accent-color)]">
              General Islamic Help
            </h3>
            <li className="mb-4">
              <a href="https://quran.com/" className="hover:text-[var(--yellow)] transition-colors">
                Quran.com
              </a>
            </li>
            <li className="mb-4">
              <a href="https://sunnah.com/" className="hover:text-[var(--yellow)] transition-colors">
                Sunnah.com
              </a>
            </li>
            <li className="mb-4">
              <a href="https://www.islamestic.com/" className="hover:text-[var(--yellow)] transition-colors">
                Islamestic
              </a>
            </li>
            <li className="mb-4">
              <a href="https://www.nusuk.sa/rituals" className="hover:text-[var(--yellow)] transition-colors">
                How to perform Umrah
              </a>
            </li>
            <li>
              <a href="https://www.islamic-relief.ie/hajj-guide/" className="hover:text-[var(--yellow)] transition-colors">
                How to perform Hajj
              </a>
            </li>
          </ul>

          <ul className="card bg-white dark:bg-[var(--background-start)] rounded-2xl shadow-xl p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--accent-color)]">
              Halal, Haram &amp; Fatwa
            </h3>
            <li className="mb-4">
              <a href="https://islamqa.info/en" className="hover:text-[var(--yellow)] transition-colors">
                Islam Q&amp;A
              </a>
            </li>
            <li className="mb-4">
              <a href="https://www.foodguide.org.uk/" className="hover:text-[var(--yellow)] transition-colors">
                GMWA Halal Food Guide
              </a>
            </li>
            <li>
              <a href="https://halalhmc.org/" className="hover:text-[var(--yellow)] transition-colors">
                Halal Monitoring Committee
              </a>
            </li>
          </ul>

          <ul className="card bg-white dark:bg-[var(--background-start)] rounded-2xl shadow-xl p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--accent-color)]">
              Media
            </h3>
            <li className="mb-4">
              <a href="https://www.youtube.com/user/ukmuslims" className="hover:text-[var(--yellow)] transition-colors">
                UK Muslims
              </a>
            </li>
            <li>
              <a href="https://www.youtube.com/@greenlanemasjid" className="hover:text-[var(--yellow)] transition-colors">
                Green Lane Masjid & Community Centre
              </a>
            </li>
          </ul>

          <ul className="card bg-white dark:bg-[var(--background-start)] rounded-2xl shadow-xl p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-semibold mb-6 text-[var(--accent-color)]">
              Islamic Books
            </h3>
            <li className="mb-4">
              <a href="https://www.amazon.co.uk/dp/1591440718" className="hover:text-[var(--yellow)] transition-colors">
                The Sealed Nectar
              </a> - A comprehensive biography of Prophet Muhammad ﷺ.
            </li>
            <li className="mb-4">
              <a href="https://www.amazon.co.uk/dp/9960892263" className="hover:text-[var(--yellow)] transition-colors">
                Stories of the Prophets
              </a> - Accounts of the prophets mentioned in the Qur’an.
            </li>
            <li className="mb-4">
              <a href="https://www.amazon.co.uk/dp/9960892646" className="hover:text-[var(--yellow)] transition-colors">
                Tafsir Ibn Kathir
              </a> - Classic Qur’anic exegesis.
            </li>
            <li>
              <a href="https://www.amazon.co.uk/dp/1851684100" className="hover:text-[var(--yellow)] transition-colors">
                Riyad as-Salihin
              </a> - A popular collection of hadiths by Imam Nawawi.
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default UsefulLinks
