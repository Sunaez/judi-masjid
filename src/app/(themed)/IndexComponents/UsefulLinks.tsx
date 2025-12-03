'use client'

import React, { useState, useRef, useLayoutEffect } from 'react'
import { Listbox } from '@headlessui/react'
import { gsap } from 'gsap'
import { FaYoutube, FaFacebook } from 'react-icons/fa'
import { MdMosque, MdHelpOutline, MdOutlineMenuBook, MdArrowDropDown, MdLibraryBooks, MdOndemandVideo } from 'react-icons/md'

interface LinkItem {
  label: string
  url: string
  icon: React.ReactNode
  bgImage?: string
}

interface Category {
  name: string
  icon: React.ReactNode
  links: LinkItem[]
}

// Move categories outside component to avoid recreation on every render
const categories: Category[] = [
  {
    name: 'General Islamic Help',
    icon: <MdMosque className="w-6 h-6 text-[var(--x-text-color)]" />,
    links: [
      {
        label: 'Quran.com',
        url: 'https://quran.com/',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />,
        bgImage: 'https://quran.com/images/background.png'
      },
      {
        label: 'Sunnah.com',
        url: 'https://sunnah.com/',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'Islamestic',
        url: 'https://www.islamestic.com/',
        icon: <MdHelpOutline className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'How to perform Umrah',
        url: 'https://www.nusuk.sa/rituals',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'How to perform Hajj',
        url: 'https://www.islamic-relief.ie/hajj-guide/',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      }
    ]
  },
  {
    name: 'Social Media',
    icon: <MdOndemandVideo className="w-6 h-6 text-[var(--x-text-color)]" />,
    links: [
      {
        label: 'YouTube',
        url: 'https://www.youtube.com/@al-judimasjid5391',
        icon: <FaYoutube className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'Facebook',
        url: 'https://www.facebook.com/people/.../100064632764517/',
        icon: <FaFacebook className="w-5 h-5 text-[var(--x-text-color)]" />
      }
    ]
  },
  {
    name: 'Halal, Haram & Fatta',
    icon: <MdHelpOutline className="w-6 h-6 text-[var(--x-text-color)]" />,
    links: [
      {
        label: 'Islam Q&A',
        url: 'https://islamqa.info/en',
        icon: <MdHelpOutline className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'GMWA Halal Food Guide',
        url: 'https://www.foodguide.org.uk/',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'Halal Monitoring Committee',
        url: 'https://halalhmc.org/',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      }
    ]
  },
  {
    name: 'Media',
    icon: <MdOndemandVideo className="w-6 h-6 text-[var(--x-text-color)]" />,
    links: [
      {
        label: 'UK Muslims',
        url: 'https://www.youtube.com/user/ukmuslims',
        icon: <FaYoutube className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'Green Lane Masjid',
        url: 'https://www.youtube.com/@greenlanemasjid',
        icon: <FaYoutube className="w-5 h-5 text-[var(--x-text-color)]" />
      }
    ]
  },
  {
    name: 'Islamic Books',
    icon: <MdOutlineMenuBook className="w-6 h-6 text-[var(--x-text-color)]" />,
    links: [
      {
        label: 'The Sealed Nectar',
        url: 'https://www.amazon.co.uk/dp/1591440718',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'Stories of the Prophets',
        url: 'https://www.amazon.co.uk/dp/9960892263',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'Tafsir Ibn Kathir',
        url: 'https://www.amazon.co.uk/dp/9960892646',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      },
      {
        label: 'Riyad as-Salihin',
        url: 'https://www.amazon.co.uk/dp/1851684100',
        icon: <MdLibraryBooks className="w-5 h-5 text-[var(--x-text-color)]" />
      }
    ]
  }
]

const UsefulLinks: React.FC = () => {
  // Default to General Islamic Help
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0])
  const contentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)

  useLayoutEffect(() => {
    if (!contentRef.current) return

    // Kill previous animation to avoid race conditions
    if (animationRef.current) {
      animationRef.current.kill()
    }

    // Create new animation
    animationRef.current = gsap.fromTo(
      contentRef.current,
      { autoAlpha: 0, x: 20 },
      { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out' }
    )

    return () => {
      if (animationRef.current) {
        animationRef.current.kill()
        animationRef.current = null
      }
    }
  }, [selectedCategory])

  return (
    <section className="py-8 px-6">
      {/* Mobile */}
      <div className="md:hidden">
        <Listbox value={selectedCategory} onChange={setSelectedCategory}>
          <div>
            <Listbox.Button className="w-full flex justify-between items-center p-4 bg-white dark:bg-[var(--x-background-start)] rounded-lg shadow">
              <div className="flex items-center space-x-2">
                {selectedCategory.icon}
                <span className="font-semibold text-[var(--text-color)] dark:text-[var(--x-text-color)]">{selectedCategory.name}</span>
              </div>
              <MdArrowDropDown className="w-6 h-6 text-[var(--secondary-color)]" />
            </Listbox.Button>
            <Listbox.Options className="mt-2 bg-white dark:bg-[var(--x-background-start)] rounded-lg shadow-lg overflow-hidden">
              {categories.map(cat => (
                <Listbox.Option
                  key={cat.name}
                  value={cat}
                  className={({ active }) =>
                    `cursor-pointer select-none relative p-4 flex items-center space-x-2 ${
                      active ? 'bg-[var(--background-end)] dark:bg-[var(--x-background-end)]' : ''
                    }`
                  }
                >
                  {cat.icon}
                  <span className="text-[var(--text-color)] dark:text-[var(--x-text-color)]">{cat.name}</span>
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
        <div ref={contentRef} className="mt-4 space-y-3">
          {selectedCategory.links.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center space-x-3 p-3 bg-white dark:bg-[var(--x-background-start)] rounded-lg shadow hover:bg-[var(--background-end)] dark:hover:bg-[var(--x-background-end)] transition"
              style={link.bgImage ? { backgroundImage: `url(${link.bgImage})`, backgroundSize: 'cover' } : undefined}
            >
              {link.icon}
              <span className="text-[var(--text-color)] dark:text-[var(--x-text-color)] font-medium">{link.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex">
        <nav className="w-1/4 pr-4">
          <ul className="space-y-2">
            {categories.map(cat => (
              <li key={cat.name}>
                <button
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center p-3 rounded-lg transition ${
                    cat.name === selectedCategory.name
                      ? 'bg-[var(--secondary-color)] text-white'
                      : 'bg-white dark:bg-[var(--x-background-start)] text-[var(--text-color)] dark:text-[var(--x-text-color)] hover:bg-[var(--background-end)] dark:hover:bg-[var(--x-background-end)]'
                  }`}
                >
                  <span className="mr-3">{cat.icon}</span>
                  <span className="font-medium">{cat.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div ref={contentRef} className="w-3/4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {selectedCategory.links.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-4 bg-white dark:bg-[var(--x-background-start)] rounded-xl shadow-md hover:shadow-lg transition"
            >
              <div className="text-[var(--accent-color)] dark:text-[var(--x-accent-color)]">
                {link.icon}
              </div>
              <span className="text-[var(--text-color)] dark:text-[var(--x-text-color)] font-medium">{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default UsefulLinks
