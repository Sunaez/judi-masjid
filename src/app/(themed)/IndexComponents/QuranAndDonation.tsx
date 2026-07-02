'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore'

import type { ConditionData, MessageData } from '@/app/display/Components/Rotator/types'
import { db } from '@/lib/firebase'
import DonationOptions from './DonationOptions'

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
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(420px,1fr)]">
        <article
          className="relative overflow-hidden rounded-lg border border-[var(--secondary-color)] p-6 shadow-xl"
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
                Verse of the Day
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
                <div className="h-20 animate-pulse rounded-lg bg-[var(--background-end)]" />
                <div className="h-24 animate-pulse rounded-lg bg-[var(--background-end)]" />
              </div>
            ) : quranOfTheDay ? (
              <>
                <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-sm backdrop-blur-sm">
                  <p
                    className="arabic leading-loose text-[var(--accent-color)]"
                    dir="rtl"
                    style={{ fontSize: '1.9rem' }}
                  >
                    {quranOfTheDay.quran.arabicText}
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5">
                  <p className="text-base leading-8 text-[var(--text-color)] md:text-lg">
                    {quranOfTheDay.quran.englishText}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--secondary-color)] p-6 text-[var(--text-color)]">
                No verse is available today.
              </div>
            )}
          </div>
        </article>

        <DonationOptions />
      </div>
    </section>
  )
}
