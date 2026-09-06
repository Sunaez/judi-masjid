'use client'

import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Download, Expand, X } from 'lucide-react'

export default function TimetableDownload({ imageSrc, label, fileName }: {
  imageSrc: string
  label: string
  fileName: string
}) {
  const [showPreview, setShowPreview] = useState(false)
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const previewFailed = failedImage === imageSrc

  return (
    <>
      <button type="button" onClick={() => { setFailedImage(null); setShowPreview(true) }} className="aero-button aero-button-secondary prayer-table-preview"><Expand size={17} aria-hidden="true" /> View timetable</button>
      <Dialog open={showPreview} onClose={setShowPreview} className="public-theme relative z-50">
        <div className="fixed inset-0 bg-[var(--overlay-darkest)]" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="aero-panel flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] p-4">
              <DialogTitle className="font-bold">{label}</DialogTitle>
              <button type="button" onClick={() => setShowPreview(false)} className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-soft)]" aria-label="Close timetable preview"><X size={22} aria-hidden="true" /></button>
            </div>
            <div className="overflow-auto p-2">
              {previewFailed ? (
                <div className="p-6 text-center">
                  <p role="alert" className="mb-4">The timetable could not be loaded. Please try again.</p>
                  <button type="button" onClick={() => setFailedImage(null)} className="aero-button aero-button-secondary">Try again</button>
                </div>
              ) : (
                // Timetables can be uploaded data URLs or bundled monthly images.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc} alt={label} onError={() => setFailedImage(imageSrc)} className="h-auto w-full" />
              )}
            </div>
            {!previewFailed && <div className="border-t border-[var(--border-color)] p-3"><a href={imageSrc} download={fileName} className="aero-button"><Download size={17} aria-hidden="true" /> Download timetable</a></div>}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
