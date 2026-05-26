export const EID_AL_ADHA_NOTICE_START_MS = Date.parse('2026-05-26T00:00:00+01:00')
export const EID_AL_ADHA_NOTICE_END_MS = Date.parse('2026-05-27T09:00:00+01:00')

export function isEidAlAdhaPrayerNoticeActive(nowMs = Date.now()) {
  return (
    nowMs >= EID_AL_ADHA_NOTICE_START_MS &&
    nowMs < EID_AL_ADHA_NOTICE_END_MS
  )
}
