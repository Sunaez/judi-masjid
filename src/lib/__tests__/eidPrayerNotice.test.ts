import {
  EID_AL_ADHA_NOTICE_END_MS,
  EID_AL_ADHA_NOTICE_START_MS,
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
