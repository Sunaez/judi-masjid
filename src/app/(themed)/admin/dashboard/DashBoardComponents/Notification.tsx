'use client'

import { useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle2, Trash2, X } from 'lucide-react'

type NotificationProps = {
  type: 'success' | 'error' | 'delete'
  message: string
  duration?: number
  onDone: () => void
}

export default function Notification({ type, message, duration = 5000, onDone }: NotificationProps) {
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])
  useEffect(() => {
    // Errors stay available until dismissed so there is time to read and act on them.
    if (type === 'error') return
    const timer = window.setTimeout(() => onDoneRef.current(), duration)
    return () => window.clearTimeout(timer)
  }, [type, message, duration])

  const Icon = type === 'error' ? AlertCircle : type === 'delete' ? Trash2 : CheckCircle2
  const isPermissionError = type === 'error' && /permission.denied|missing or insufficient permissions/i.test(message)

  return (
    <div className="public-theme admin-toast" data-type={type} role={type === 'error' ? 'alert' : 'status'} aria-atomic="true">
      <Icon size={22} aria-hidden="true" />
      <p>{isPermissionError ? 'This change could not be saved with your current access. Sign in again and retry, or contact the masjid administrator.' : message}</p>
      <button type="button" className="admin-icon-button" onClick={onDone} aria-label="Dismiss notification"><X size={16} aria-hidden="true" /></button>
    </div>
  )
}
