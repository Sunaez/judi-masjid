'use client'

import type { ReactNode } from 'react'
import { FaFacebook, FaYoutube } from 'react-icons/fa'
import { HiArrowTopRightOnSquare } from 'react-icons/hi2'
import {
  MdHelpOutline,
  MdLibraryBooks,
  MdMosque,
  MdOndemandVideo,
  MdOutlineMenuBook,
} from 'react-icons/md'

interface LinkItem {
  label: string
  url: string
  icon: ReactNode
  bgImage: string
  bgColor?: string
  bgSize?: 'cover' | 'contain'
  bgPosition?: string
  hint: string
}

interface Category {
  name: string
  description: string
  icon: ReactNode
  links: LinkItem[]
}

const unsplashImage = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=72`

const LINK_IMAGES = {
  quran:
    'https://cdn.sanity.io/images/oqhb6e7h/production/26935255a1c7f49bd6e596c57ab495fb160f00fd-1810x1008.png',
  sunnah: 'https://sunnah.com/images/hadith_icon2_huge.png',
  islamestic:
    'https://www.islamestic.com/wp-content/uploads/2024/03/islamestic_lets_explore_islam1-1024x671.webp',
  umrah:
    'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
  hajj:
    'https://www.islamic-relief.org.uk/wp-content/uploads/2022/11/haidan-IAwnp88Fz8Y-unsplash.jpg',
  alJudi: '/Icons/favicon.png',
  islamQa: 'https://islamqa.info/assets/icons/social_share_image.png',
  foodGuide: 'https://www.foodguide.org.uk/assets/images/logo.png',
  hmc: 'https://halalhmc.org/wp-content/themes/hmc/assets/img/logo.png',
  ukMuslims: 'https://i2.ytimg.com/vi/E_1r33iW-dY/hqdefault.jpg',
  greenLane:
    'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/3f/6a/9f/3f6a9f91-4f9c-3a20-9fcc-6fb089cb5286/AppIcon-0-0-1x_U007emarketing-0-11-0-0-85-220.png/512x512bb.jpg',
  sealedNectar: 'https://covers.openlibrary.org/b/isbn/1591440718-L.jpg',
  storiesOfTheProphets: 'https://covers.openlibrary.org/b/isbn/9960892263-L.jpg',
  tafsirIbnKathir: 'https://covers.openlibrary.org/b/isbn/1591440203-L.jpg',
  riyadAsSalihin: 'https://covers.openlibrary.org/b/isbn/1597843334-L.jpg',
  pattern: unsplashImage('photo-1755913250771-12580691c997'),
}

const categories: Category[] = [
  {
    name: 'General Islamic Help',
    description: 'Quran, Sunnah and practical worship guidance',
    icon: <MdMosque className="h-6 w-6 text-current" />,
    links: [
      {
        label: 'Quran.com',
        url: 'https://quran.com/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.quran,
        bgPosition: 'center',
        hint: 'Read and listen online',
      },
      {
        label: 'Sunnah.com',
        url: 'https://sunnah.com/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.sunnah,
        bgColor: '#8b1f24',
        bgSize: 'contain',
        hint: 'Hadith collection',
      },
      {
        label: 'Islamestic',
        url: 'https://www.islamestic.com/',
        icon: <MdHelpOutline className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.islamestic,
        hint: 'Islamic learning',
      },
      {
        label: 'How to perform Umrah',
        url: 'https://www.nusuk.sa/rituals',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.umrah,
        hint: 'Step-by-step rituals',
      },
      {
        label: 'How to perform Hajj',
        url: 'https://www.islamic-relief.ie/hajj-guide/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.hajj,
        hint: 'Pilgrimage guide',
      },
    ],
  },
  {
    name: 'Social Media',
    description: 'Follow the masjid and community channels',
    icon: <MdOndemandVideo className="h-6 w-6 text-current" />,
    links: [
      {
        label: 'YouTube',
        url: 'https://www.youtube.com/@al-judimasjid5391',
        icon: <FaYoutube className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.alJudi,
        bgColor: '#ffffff',
        bgSize: 'contain',
        hint: 'Videos and reminders',
      },
      {
        label: 'Facebook',
        url: 'https://www.facebook.com/judimasjid/',
        icon: <FaFacebook className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.alJudi,
        bgColor: '#ffffff',
        bgSize: 'contain',
        hint: 'Community updates',
      },
    ],
  },
  {
    name: 'Halal, Haram & Fatwa',
    description: 'Food guides, answers and halal monitoring',
    icon: <MdHelpOutline className="h-6 w-6 text-current" />,
    links: [
      {
        label: 'Islam Q&A',
        url: 'https://islamqa.info/en',
        icon: <MdHelpOutline className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.islamQa,
        bgColor: '#f2f8f2',
        bgSize: 'contain',
        hint: 'Questions and answers',
      },
      {
        label: 'GMWA Halal Food Guide',
        url: 'https://www.foodguide.org.uk/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.foodGuide,
        bgColor: '#ffffff',
        bgSize: 'contain',
        hint: 'UK halal food guide',
      },
      {
        label: 'Halal Monitoring Committee',
        url: 'https://halalhmc.org/',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.hmc,
        bgColor: '#ffffff',
        bgSize: 'contain',
        hint: 'Halal certification',
      },
    ],
  },
  {
    name: 'Media',
    description: 'Lectures and Islamic media channels',
    icon: <MdOndemandVideo className="h-6 w-6 text-current" />,
    links: [
      {
        label: 'UK Muslims',
        url: 'https://www.youtube.com/user/ukmuslims',
        icon: <FaYoutube className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.ukMuslims,
        hint: 'Islamic videos',
      },
      {
        label: 'Green Lane Masjid',
        url: 'https://www.youtube.com/@greenlanemasjid',
        icon: <FaYoutube className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.greenLane,
        bgColor: '#08083f',
        bgSize: 'contain',
        hint: 'Khutbahs and lessons',
      },
    ],
  },
  {
    name: 'Islamic Books',
    description: 'Recommended reading for home study',
    icon: <MdOutlineMenuBook className="h-6 w-6 text-current" />,
    links: [
      {
        label: 'The Sealed Nectar',
        url: 'https://www.amazon.co.uk/dp/1591440718',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.sealedNectar,
        bgColor: '#15202b',
        bgSize: 'contain',
        hint: 'Seerah biography',
      },
      {
        label: 'Stories of the Prophets',
        url: 'https://www.amazon.co.uk/dp/9960892263',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.storiesOfTheProphets,
        bgColor: '#15202b',
        bgSize: 'contain',
        hint: 'Prophet stories',
      },
      {
        label: 'Tafsir Ibn Kathir',
        url: 'https://www.amazon.co.uk/dp/1591440203',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.tafsirIbnKathir,
        bgColor: '#15202b',
        bgSize: 'contain',
        hint: 'Quran explanation',
      },
      {
        label: 'Riyad as-Salihin',
        url: 'https://www.amazon.co.uk/dp/1597843334',
        icon: <MdLibraryBooks className="h-5 w-5 text-current" />,
        bgImage: LINK_IMAGES.riyadAsSalihin,
        bgColor: '#15202b',
        bgSize: 'contain',
        hint: 'Hadith collection',
      },
    ],
  },
]

export default function UsefulLinks() {
  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-lg">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Community resources
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--accent-color)] md:text-3xl">
              Islamic resources, media and local links
            </h2>
          </div>
          <p className="text-base leading-7 text-[var(--text-color)]">
            A cleaner collection of the links already used on the site, grouped for quicker scanning.
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        {categories.map(category => (
          <section
            key={category.name}
            className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--accent-color)] text-[var(--background-end)]">
                {category.icon}
              </span>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-color)]">
                  {category.name}
                </h3>
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  {category.description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {category.links.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex min-h-40 overflow-hidden rounded-lg border border-[var(--secondary-color)] bg-[var(--background-start)] p-4 text-white shadow-md outline-none transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
                >
                  <span
                    className="absolute inset-0 bg-center bg-no-repeat transition duration-700 group-hover:scale-105"
                    style={{
                      backgroundColor: link.bgColor,
                      backgroundImage: `url(${link.bgImage})`,
                      backgroundPosition: link.bgPosition ?? 'center',
                      backgroundSize: link.bgSize ?? 'cover',
                    }}
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.18),rgba(21,49,71,0.20)_42%,rgba(0,0,0,0.78))]" />
                  <span className="relative z-10 flex w-full flex-col justify-between gap-8">
                    <span className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/20 text-white backdrop-blur-sm transition group-hover:bg-white group-hover:text-[var(--static-light-accent-color)]">
                        {link.icon}
                      </span>
                      <HiArrowTopRightOnSquare className="h-5 w-5 text-white/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                    </span>
                    <span>
                      <span className="block text-xl font-semibold leading-tight">
                        {link.label}
                      </span>
                      <span className="mt-1 block text-sm text-white/75">{link.hint}</span>
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
