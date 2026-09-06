'use client'

import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export default function AdminDialog({ open, onClose, title, description, busy = false, wide = false, children }: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  busy?: boolean
  wide?: boolean
  children: ReactNode
}) {
  return (
    <Dialog open={open} onClose={() => { if (!busy) onClose() }} className="public-theme admin-dialog">
      <div className="admin-dialog-backdrop" aria-hidden="true" />
      <div className="admin-dialog-viewport">
        <DialogPanel className={`admin-dialog-panel${wide ? ' admin-dialog-wide' : ''}`} aria-busy={busy}>
          <div className="admin-dialog-heading">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && <Description>{description}</Description>}
            </div>
            <button type="button" className="admin-icon-button" onClick={onClose} disabled={busy} aria-label={`Close ${title.toLowerCase()}`}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
