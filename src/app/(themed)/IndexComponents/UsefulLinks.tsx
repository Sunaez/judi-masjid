'use client'

import React, { useState, useRef, useLayoutEffect } from 'react'
import { Listbox } from '@headlessui/react'
import { gsap } from 'gsap'
import { FaYoutube, FaFacebook } from 'react-icons/fa'
import { HiArrowTopRightOnSquare } from 'react-icons/hi2'
import {
  MdMosque,
  MdHelpOutline,
  MdOutlineMenuBook,
  MdArrowDropDown,
  MdLibraryBooks,
  MdOndemandVideo,
} from 'react-icons/md'

interface LinkItem {
  label: string
  url: string
  icon: React.ReactNode
  bgImage: string
  hint: string
}

interface Category {
  name: string
  description: string
  icon: React.ReactNode
  bgImage: string
  links: LinkItem[]
}

const unsplashImage = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=72`

const LINK_IMAGES = {
  quran: unsplashImage('photo-1761406778100-de0254ec6788'),
  architecture: unsplashImage('photo-1758696642918-68bfea092855'),
  pattern: unsplashImage('photo-1755913250771-12580691c997'),
  mosque: unsplashImage('photo-1766585605969-12f15f7b033f'),
}

const categories: Category[] = [
  {
    name: 'General Islamic Help',
    description: 'Quran, Sunnah and practical worship guidance',
    icon: <MdMosque className="h-6 w-6 text-current" />,
    bgImage: LINK_IMAGES.architecture,
    links: [
      {
        label: 'Quran.com',
        url: 'https://quran.com/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.quran,
        hint: 'Read and listen online',
      },
      {
        label: 'Sunnah.com',
        url: 'https://sunnah.com/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.pattern,
        hint: 'Hadith collection',
      },
      {
        label: 'Islamestic',
        url: 'https://www.islamestic.com/',
        icon: <MdHelpOutline className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.architecture,
        hint: 'Islamic learning',
      },
      {
        label: 'How to perform Umrah',
        url: 'https://www.nusuk.sa/rituals',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.mosque,
        hint: 'Step-by-step rituals',
      },
      {
        label: 'How to perform Hajj',
        url: 'https://www.islamic-relief.ie/hajj-guide/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.mosque,
        hint: 'Pilgrimage guide',
      }
    ]
  },
  {
    name: 'Social Media',
    description: 'Follow the masjid and community channels',
    icon: <MdOndemandVideo className="h-6 w-6 text-current" />,
    bgImage: LINK_IMAGES.mosque,
    links: [
      {
        label: 'YouTube',
        url: 'https://www.youtube.com/@al-judimasjid5391',
        icon: <FaYoutube className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.architecture,
        hint: 'Videos and reminders',
      },
      {
        label: 'Facebook',
        url: 'https://www.facebook.com/people/.../100064632764517/',
        icon: <FaFacebook className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.pattern,
        hint: 'Community updates',
      }
    ]
  },
  {
    name: 'Halal, Haram & Fatwa',
    description: 'Food guides, answers and halal monitoring',
    icon: <MdHelpOutline className="h-6 w-6 text-current" />,
    bgImage: LINK_IMAGES.pattern,
    links: [
      {
        label: 'Islam Q&A',
        url: 'https://islamqa.info/en',
        icon: <MdHelpOutline className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.architecture,
        hint: 'Questions and answers',
      },
      {
        label: 'GMWA Halal Food Guide',
        url: 'https://www.foodguide.org.uk/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.pattern,
        hint: 'UK halal food guide',
      },
      {
        label: 'Halal Monitoring Committee',
        url: 'https://halalhmc.org/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.mosque,
        hint: 'Halal certification',
      }
    ]
  },
  {
    name: 'Media',
    description: 'Lectures and Islamic media channels',
    icon: <MdOndemandVideo className="h-6 w-6 text-current" />,
    bgImage: LINK_IMAGES.architecture,
    links: [
      {
        label: 'UK Muslims',
        url: 'https://www.youtube.com/user/ukmuslims',
        icon: <FaYoutube className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.quran,
        hint: 'Islamic videos',
      },
      {
        label: 'Green Lane Masjid',
        url: 'https://www.youtube.com/@greenlanemasjid',
        icon: <FaYoutube className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.mosque,
        hint: 'Khutbahs and lessons',
      }
    ]
  },
  {
    name: 'Islamic Books',
    description: 'Recommended reading for home study',
    icon: <MdOutlineMenuBook className="h-6 w-6 text-current" />,
    bgImage: LINK_IMAGES.quran,
    links: [
      {
        label: 'The Sealed Nectar',
        url: 'https://www.amazon.co.uk/dp/1591440718',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.quran,
        hint: 'Seerah biography',
      },
      {
        label: 'Stories of the Prophets',
        url: 'https://www.amazon.co.uk/dp/9960892263',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.pattern,
        hint: 'Prophet stories',
      },
      {
        label: 'Tafsir Ibn Kathir',
        url: 'https://www.amazon.co.uk/dp/9960892646',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.architecture,
        hint: 'Quran explanation',
      },
      {
        label: 'Riyad as-Salihin',
        url: 'https://www.amazon.co.uk/dp/1851684100',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.mosque,
        hint: 'Hadith collection',
      }
    ]
  }
]

const UsefulLinks: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0])
  const contentRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    if (!backgroundRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        backgroundRef.current,
        { scale: 1.04, xPercent: -1.5, yPercent: -1 },
        {
          scale: 1.1,
          xPercent: 1.5,
          yPercent: 1,
          duration: 18,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }
      )
    })

    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (!contentRef.current) return

    if (animationRef.current) {
      animationRef.current.kill()
    }

    const cards = contentRef.current.querySelectorAll('[data-link-card]')
    animationRef.current = gsap
      .timeline()
      .fromTo(
        contentRef.current,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
      .fromTo(
        cards,
        { autoAlpha: 0, y: 24, scale: 0.98 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          ease: 'power3.out',
          stagger: 0.07,
        },
        '<0.05'
      )

    return () => {
      if (animationRef.current) {
        animationRef.current.kill()
        animationRef.current = null
      }
    }
  }, [selectedCategory])

  return (
    <section className="relative isolate overflow-hidden py-10 text-[var(--static-dark-text-color)]">
      <div
        ref={backgroundRef}
        className="absolute inset-0 -z-20 bg-cover bg-center transition-[background-image] duration-700"
        style={{ backgroundImage: `url(${selectedCategory.bgImage})` }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(21,49,71,0.94),rgba(35,42,47,0.74)_48%,rgba(21,49,71,0.92))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-white/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-white/20" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--static-dark-accent-color)]">
              Useful Websites
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">
              Quick links for the community
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
            Trusted resources grouped by topic, with direct links that open in a new tab.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="md:hidden">
            <Listbox value={selectedCategory} onChange={setSelectedCategory}>
              <div className="relative">
                <Listbox.Button className="flex w-full items-center justify-between rounded-lg border border-white/20 bg-white/10 p-4 text-left text-white shadow-lg backdrop-blur-md transition hover:bg-white/20">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white">
                      {selectedCategory.icon}
                    </span>
                    <span className="font-semibold">{selectedCategory.name}</span>
                  </div>
                  <MdArrowDropDown className="h-6 w-6 text-white/80" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-lg border border-white/20 bg-[var(--static-light-accent-color)] p-2 shadow-2xl">
                  {categories.map(cat => (
                    <Listbox.Option
                      key={cat.name}
                      value={cat}
                      className={({ active, selected }) =>
                        `relative flex cursor-pointer select-none items-center gap-3 rounded-lg p-3 ${
                          active || selected
                            ? 'bg-white text-[var(--static-light-accent-color)]'
                            : 'text-[var(--static-dark-text-color)]'
                        }`
                      }
                    >
                      {cat.icon}
                      <span className="font-medium">{cat.name}</span>
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          <nav className="hidden md:block">
            <ul className="space-y-2">
              {categories.map(cat => {
                const isSelected = cat.name === selectedCategory.name

                return (
                  <li key={cat.name}>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition duration-200 ${
                        isSelected
                          ? 'border-white bg-white text-[var(--static-light-accent-color)] shadow-xl'
                          : 'border-white/20 bg-white/10 text-white/80 backdrop-blur-sm hover:border-white/40 hover:bg-white/20'
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition ${
                          isSelected
                            ? 'bg-[var(--static-light-accent-color)] text-white'
                            : 'bg-white/20 text-white group-hover:bg-white/30'
                        }`}
                      >
                        {cat.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{cat.name}</span>
                        <span
                          className={`mt-0.5 block text-sm leading-5 ${
                            isSelected ? 'text-[var(--text-muted)]' : 'text-white/60'
                          }`}
                        >
                          {cat.description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div ref={contentRef}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[var(--static-light-accent-color)] shadow-lg">
                {selectedCategory.icon}
              </span>
              <div>
                <h3 className="text-2xl font-semibold">{selectedCategory.name}</h3>
                <p className="text-sm leading-6 text-white/70">{selectedCategory.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {selectedCategory.links.map(link => (
                <a
                  key={link.url}
                  data-link-card
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex min-h-[154px] overflow-hidden rounded-lg border border-white/20 bg-white/10 p-4 text-white shadow-lg outline-none transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-[var(--static-dark-accent-color)]"
                >
                  <span
                    className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${link.bgImage})` }}
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.72),rgba(21,49,71,0.42)_48%,rgba(0,0,0,0.74))]" />
                  <span className="relative z-10 flex w-full flex-col justify-between gap-8">
                    <span className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm transition group-hover:bg-white group-hover:text-[var(--static-light-accent-color)]">
                        {link.icon}
                      </span>
                      <HiArrowTopRightOnSquare className="h-5 w-5 text-white/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                    </span>
                    <span>
                      <span className="block text-xl font-semibold leading-tight">
                        {link.label}
                      </span>
                      <span className="mt-1 block text-sm text-white/70">{link.hint}</span>
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default UsefulLinks
