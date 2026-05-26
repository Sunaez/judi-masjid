import {
  EID_AL_ADHA_GREETING_END_MS,
  EID_AL_ADHA_GREETING_START_MS,
  EID_AL_ADHA_NOTICE_END_MS,
  EID_AL_ADHA_NOTICE_START_MS,
  isEidAlAdhaGreetingActive,
  isEidAlAdhaPrayerNoticeActive,
} from '../eidPrayerNotice'

describe('Eid al-Adha prayer notice visibility', () => {
  it('is active from 26 May 2026 until before 9am on 27 May 2026', () => {
    expect(isEidAlAdhaPrayerNoticeActive(EID_AL_ADHA_NOTICE_START_MS)).toBe(true)
    expect(isEidAlAdhaPrayerNoticeActive(Date.parse('2026-05-26T12:00:00+01:00'))).toBe(true)
    expect(isEidAlAdhaPrayerNoticeActive(Date.parse('2026-05-27T08:59:59+01:00'))).toBe(true)
  })

  it('is inactive before the start and from 9am on 27 May 2026', () => {
    expect(isEidAlAdhaPrayerNoticeActive(EID_AL_ADHA_NOTICE_START_MS - 1)).toBe(false)
    expect(isEidAlAdhaPrayerNoticeActive(EID_AL_ADHA_NOTICE_END_MS)).toBe(false)
  })
})

describe('Eid al-Adha greeting visibility', () => {
  it('is active from the evening before Eid through 29 May 2026', () => {
    expect(isEidAlAdhaGreetingActive(EID_AL_ADHA_GREETING_START_MS)).toBe(true)
    expect(isEidAlAdhaGreetingActive(Date.parse('2026-05-27T09:00:00+01:00'))).toBe(true)
    expect(isEidAlAdhaGreetingActive(Date.parse('2026-05-29T23:59:59+01:00'))).toBe(true)
  })

  it('is inactive before the greeting window and from 30 May 2026', () => {
    expect(isEidAlAdhaGreetingActive(EID_AL_ADHA_GREETING_START_MS - 1)).toBe(false)
    expect(isEidAlAdhaGreetingActive(EID_AL_ADHA_GREETING_END_MS)).toBe(false)
  })
})
