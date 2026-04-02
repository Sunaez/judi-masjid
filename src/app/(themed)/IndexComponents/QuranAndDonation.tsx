'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore'
import { HiArrowTopRightOnSquare } from 'react-icons/hi2'
import { IoHeart } from 'react-icons/io5'

import type { ConditionData, MessageData } from '@/app/display/Components/Rotator/types'
import { db } from '@/lib/firebase'

const DONATION_URL =
  'https://pay.sumup.com/b2c/Q7IJZ8CO?utm_campaign=pdf&utm_medium=print&utm_source=qr'
const SUMUP_LOGO_URL = 'https://circuit.sumup.com/icons/v2/sum_up_logo_24.svg'

const londonDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

interface QuranHomepageMessage {
  id: string
  quran: NonNullable<MessageData['quran']>
  conditions: ConditionData[]
}

function isUnconditionalMessage(conditions: ConditionData[]) {
  return conditions.length === 0 || conditions.every(condition => condition.type === 'normal')
}

function getQuranOfTheDay(messages: QuranHomepageMessage[]) {
  if (messages.length === 0) {
    return null
  }

  const londonDayKey = Number(londonDateFormatter.format(new Date()).replaceAll('-', ''))
  return messages[londonDayKey % messages.length]
}

function formatVerseReference(surah: string, startAyah: number, endAyah: number) {
  if (startAyah === endAyah) {
    return `${surah}:${startAyah}`
  }

  return `${surah}:${startAyah}-${endAyah}`
}

export default function QuranAndDonation() {
  const [messages, setMessages] = useState<QuranHomepageMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(
      messagesQuery,
      async snapshot => {
        const quranDocs = snapshot.docs.filter(docSnap => {
          const data = docSnap.data() as MessageData
          return data.sourceType === 'quran' && Boolean(data.quran)
        })

        const loadedMessages = await Promise.all(
          quranDocs.map(async docSnap => {
            const data = docSnap.data() as MessageData
            const conditionsSnapshot = await getDocs(collection(docSnap.ref, 'conditions'))

            return {
              id: docSnap.id,
              quran: data.quran!,
              conditions: conditionsSnapshot.docs.map(
                conditionDoc => conditionDoc.data() as ConditionData
              ),
            }
          })
        )

        setMessages(
          loadedMessages.filter(message => isUnconditionalMessage(message.conditions))
        )
        setLoading(false)
      },
      error => {
        console.error('[homepage] Failed to load Quran messages:', error)
        setMessages([])
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const quranOfTheDay = useMemo(() => getQuranOfTheDay(messages), [messages])
  const verseMeta = quranOfTheDay
    ? formatVerseReference(
        quranOfTheDay.quran.surah,
        quranOfTheDay.quran.startAyah,
        quranOfTheDay.quran.endAyah
      )
    : null

  return (
    <section className="px-6 pb-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <article
          className="relative overflow-hidden rounded-[2rem] border border-[var(--secondary-color)] p-6 shadow-xl"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--background-start) 78%, white), color-mix(in srgb, var(--background-end) 92%, var(--accent-color) 8%))',
          }}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, color-mix(in srgb, var(--yellow) 42%, transparent), transparent 70%)',
            }}
          />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-[var(--accent-color)] bg-[var(--background-end)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-color)]">
                Quran Of The Day
              </span>
              {verseMeta && (
                <span className="rounded-full bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-[var(--x-text-color)]">
                  {verseMeta}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-6 w-40 animate-pulse rounded-full bg-[var(--skeleton-bg)]" />
                <div className="h-20 animate-pulse rounded-3xl bg-[var(--background-end)]" />
                <div className="h-24 animate-pulse rounded-3xl bg-[var(--background-end)]" />
              </div>
            ) : quranOfTheDay ? (
              <>
                <div className="rounded-[1.75rem] border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-sm backdrop-blur-sm">
                  <p
                    className="arabic leading-loose text-[var(--accent-color)]"
                    dir="rtl"
                    style={{ fontSize: '1.9rem' }}
                  >
                    {quranOfTheDay.quran.arabicText}
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-[var(--secondary-color)] bg-[var(--background-end)] p-5">
                  <p className="text-base leading-8 text-[var(--text-color)] md:text-lg">
                    {quranOfTheDay.quran.englishText}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-[var(--secondary-color)] p-6 text-[var(--text-color)]">
                Add a Quran message without active conditions in the admin dashboard and it will
                appear here automatically.
              </div>
            )}
          </div>
        </article>

        <aside className="rounded-[2rem] border border-[var(--secondary-color)] bg-[var(--background-end)] p-6 text-[var(--text-color)] shadow-xl">
          <div className="flex h-full flex-col gap-5">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--background-start)] text-[var(--accent-color)]">
              <IoHeart className="h-6 w-6" />
            </div>

            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-[var(--accent-color)] bg-[var(--background-start)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-color)]">
                Donate
              </span>
              <h2 className="text-3xl font-semibold leading-tight text-[var(--text-color)]">
                Support Al-judi Masjid with SumUp
              </h2>
              <p className="text-sm leading-7 text-[var(--text-color)] md:text-base">
                Open our secure SumUp donation page to support the masjid and its community
                services.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--secondary-color)] bg-[var(--background-start)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Payment Partner
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--text-color)]">
                    Secure checkout by SumUp
                  </p>
                </div>
                <img
                  src={SUMUP_LOGO_URL}
                  alt="SumUp"
                  className="h-8 w-auto rounded-sm bg-white px-2 py-1"
                />
              </div>
            </div>

            <a
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent-color)] px-5 py-4 text-base font-semibold text-[var(--x-text-color)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Open Donation Page
              <HiArrowTopRightOnSquare className="h-5 w-5" />
            </a>
          </div>
        </aside>
      </div>
    </section>
  )
}
