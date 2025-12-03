'use client'

import { useState, useEffect } from 'react'
import TimeUntil from '../IndexComponents/TimeUntil'

/**
 * MANUAL TEST PAGE FOR PRAYER TRANSITIONS
 *
 * This page allows you to test that TimeUntil correctly updates after a prayer passes.
 * Navigate to: http://localhost:3000/test-prayer-transition
 *
 * The test will:
 * 1. Create a prayer time 10 seconds in the future
 * 2. Show countdown
 * 3. When prayer time is reached, show "Started"
 * 4. After 2 seconds, switch to next prayer
 */

export default function TestPrayerTransition() {
  const [currentPrayer, setCurrentPrayer] = useState<'Fajr' | 'Dhuhr'>('Fajr')
  const [fajrTime, setFajrTime] = useState<Date | null>(null)
  const [dhuhrTime, setDhuhrTime] = useState<Date | null>(null)
  const [testStatus, setTestStatus] = useState<string>('Initializing...')
  const [now, setNow] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state and initialize time on client only
  useEffect(() => {
    setIsMounted(true)
    setNow(new Date())
  }, [])

  // Update "now" every second to show real-time countdown
  useEffect(() => {
    if (!isMounted) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [isMounted])

  // Initialize test on mount
  useEffect(() => {
    // Set Fajr to 10 seconds from now
    const fajr = new Date(Date.now() + 10000)
    setFajrTime(fajr)

    // Set Dhuhr to 20 seconds from now
    const dhuhr = new Date(Date.now() + 20000)
    setDhuhrTime(dhuhr)

    setTestStatus(`Test started at ${new Date().toLocaleTimeString()}`)

    // After 12 seconds (2 seconds after Fajr passes), switch to Dhuhr
    const switchTimer = setTimeout(() => {
      setCurrentPrayer('Dhuhr')
      setTestStatus(`Switched to Dhuhr at ${new Date().toLocaleTimeString()}`)
    }, 12000)

    return () => clearTimeout(switchTimer)
  }, [])

  const getTimeUntil = (time: Date | null) => {
    if (!time || !now) return 'N/A'
    const diff = time.getTime() - now.getTime()
    if (diff <= 0) return 'PASSED'
    return `${Math.floor(diff / 1000)}s`
  }

  const resetTest = () => {
    const fajr = new Date(Date.now() + 10000)
    setFajrTime(fajr)

    const dhuhr = new Date(Date.now() + 20000)
    setDhuhrTime(dhuhr)

    setCurrentPrayer('Fajr')
    setTestStatus(`Test restarted at ${new Date().toLocaleTimeString()}`)

    setTimeout(() => {
      setCurrentPrayer('Dhuhr')
      setTestStatus(`Switched to Dhuhr at ${new Date().toLocaleTimeString()}`)
    }, 12000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Prayer Transition Test Page
        </h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
          <h2 className="text-2xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>When page loads, Fajr prayer is set to 10 seconds from now</li>
            <li>Watch the countdown decrease to 0</li>
            <li>When Fajr passes, you should see "Started" appear</li>
            <li>After 2 more seconds (12 seconds total), component switches to Dhuhr</li>
            <li>Dhuhr countdown should appear immediately</li>
            <li className="font-bold text-yellow-300">
              ⚠️ If you see "Started" for more than 2 seconds before switching, there's a synchronization issue
            </li>
          </ol>
        </div>

        {/* Test Status */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">
            <span className="font-semibold">Status:</span> {testStatus}
          </p>
          <p className="text-sm text-gray-300">
            <span className="font-semibold">Current Time:</span>{' '}
            <span suppressHydrationWarning>
              {now ? now.toLocaleTimeString() : 'Loading...'}
            </span>
          </p>
        </div>

        {/* Prayer Times Debug Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">Fajr Prayer</h3>
            <p className="text-sm text-gray-300">
              Time: {fajrTime?.toLocaleTimeString() || 'Loading...'}
            </p>
            <p className="text-sm text-gray-300">
              Until: {getTimeUntil(fajrTime)}
            </p>
            <p className={`text-sm font-bold ${currentPrayer === 'Fajr' ? 'text-green-400' : 'text-gray-500'}`}>
              {currentPrayer === 'Fajr' ? '← Currently Showing' : 'Not Active'}
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">Dhuhr Prayer</h3>
            <p className="text-sm text-gray-300">
              Time: {dhuhrTime?.toLocaleTimeString() || 'Loading...'}
            </p>
            <p className="text-sm text-gray-300">
              Until: {getTimeUntil(dhuhrTime)}
            </p>
            <p className={`text-sm font-bold ${currentPrayer === 'Dhuhr' ? 'text-green-400' : 'text-gray-500'}`}>
              {currentPrayer === 'Dhuhr' ? '← Currently Showing' : 'Not Active'}
            </p>
          </div>
        </div>

        {/* TimeUntil Component Under Test */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-6 shadow-2xl">
          <h3 className="text-2xl font-bold mb-4 text-center">Component Under Test:</h3>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            {isMounted && currentPrayer === 'Fajr' && fajrTime && (
              <TimeUntil eventName="Fajr" eventTime={fajrTime} />
            )}
            {isMounted && currentPrayer === 'Dhuhr' && dhuhrTime && (
              <TimeUntil eventName="Dhuhr" eventTime={dhuhrTime} />
            )}
            {!isMounted && <p className="text-center">Loading...</p>}
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-3 text-green-300">✓ Expected Behavior</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• Seconds countdown updates every 1 second</li>
            <li>• At 10s: Shows "Time until Fajr" with countdown</li>
            <li>• At 0s: Shows "Time until Fajr: Started"</li>
            <li>• At 12s: Switches to show "Time until Dhuhr" with ~8s countdown</li>
            <li>• No flicker or "undefined" during transition</li>
          </ul>
        </div>

        {/* Potential Issues */}
        <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-3 text-red-300">✗ Potential Issues to Watch For</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• "Started" showing for more than 2-3 seconds</li>
            <li>• Component not switching to next prayer</li>
            <li>• Countdown freezing or not updating</li>
            <li>• Incorrect prayer name displayed</li>
            <li>• Flash of "undefined" or blank content</li>
          </ul>
        </div>

        {/* Reset Button */}
        <div className="text-center">
          <button
            onClick={resetTest}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
          >
            Reset Test
          </button>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Technical Details</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• TimeUntil updates: Every 1 second</p>
            <p>• PrayerTimeline updates: Every 5 seconds</p>
            <p>• Maximum delay before switching: 5 seconds</p>
            <p>• Parent component controls which prayer to display</p>
          </div>
        </div>
      </div>
    </div>
  )
}
