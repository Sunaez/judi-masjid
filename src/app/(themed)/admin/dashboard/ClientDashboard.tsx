'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowUpRight, CalendarClock, FileSpreadsheet, LayoutList, MessageSquarePlus, Monitor, RefreshCw, Upload } from 'lucide-react'
import NavBar from '../AdminComponents/NavBar'
import AdminDialog from '../AdminComponents/AdminDialog'
import MessageList, { type MessageRecord } from './DashBoardComponents/MessageList'
import Notification from './DashBoardComponents/Notification'

function LoadingPanel() {
  return <div className="admin-loading" role="status">Loading tools...</div>
}

const AddMessage = dynamic(() => import('./DashBoardComponents/AddMessage'), { ssr: false, loading: LoadingPanel })
const AddAnimation = dynamic(() => import('./DashBoardComponents/AddAnimation'), { ssr: false, loading: LoadingPanel })
const SyncPrayerTimes = dynamic(() => import('./DashBoardComponents/SyncPrayerTimes'), { ssr: false, loading: LoadingPanel })
const ManageTimetables = dynamic(() => import('./DashBoardComponents/ManageTimetables'), { ssr: false, loading: LoadingPanel })
const ControlSlideshow = dynamic(() => import('./DashBoardComponents/ControlSlideshow'), { ssr: false, loading: LoadingPanel })
const DonationSettings = dynamic(() => import('./DashBoardComponents/DonationSettings'), { ssr: false, loading: LoadingPanel })

type Modal = 'message' | 'animation' | 'sync' | 'timetables'
const modalTitles: Record<Modal, string> = { message: 'Add message', animation: 'Message animation', sync: 'Sync prayer times', timetables: 'Manage timetables' }
const actions = [
  { modal: 'message' as const, title: 'Add message', detail: 'Share an announcement or reminder', Icon: MessageSquarePlus },
  { modal: 'sync' as const, title: 'Sync prayer times', detail: 'Import the latest spreadsheet times', Icon: RefreshCw },
  { modal: 'timetables' as const, title: 'Manage timetables', detail: 'Upload and choose timetable images', Icon: Upload },
]

export default function ClientDashboard() {
  const [modal, setModal] = useState<Modal | null>(null)
  const [closing, setClosing] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<MessageRecord | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Stable callbacks keep live subscriptions from restarting and replacing draft inputs.
  const onSuccess = useCallback((message: string) => setToast({ type: 'success', message }), [])
  const onError = useCallback((message: string) => setToast({ type: 'error', message }), [])
  const dismissToast = useCallback(() => setToast(null), [])
  const closeModal = useCallback(() => { setModal(null); setClosing(false); setSelectedMessage(null) }, [])
  const openModal = (next: Modal) => { setClosing(false); setModal(next) }

  return (
    <>
      <NavBar />
      <main id="admin-main" tabIndex={-1} className="admin-main">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">Serving our community</p>
            <h1>Admin dashboard</h1>
            <p>Everything you need to keep the masjid informed and connected.</p>
          </div>
          <Link href="/display/" target="_blank" rel="noopener noreferrer" className="aero-button aero-button-secondary">
            <Monitor size={18} aria-hidden="true" /> Preview display <ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </div>
        <section className="admin-quick-section" aria-labelledby="quick-actions-title">
          <div className="admin-section-heading"><h2 id="quick-actions-title">Quick actions</h2><span>Your everyday masjid tools</span></div>
          <div className="admin-quick-actions">
            {actions.map(({ modal: next, title, detail, Icon }) => (
              <button key={next} type="button" className={next === 'message' ? 'admin-action-card admin-action-featured' : 'admin-action-card'} onClick={() => openModal(next)}>
                <span className="admin-action-icon"><Icon size={23} aria-hidden="true" /></span>
                <span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight className="admin-action-arrow" size={19} aria-hidden="true" />
              </button>
            ))}
            <Link href="/admin/dashboard/prayer-times-editor" className="admin-action-card">
              <span className="admin-action-icon"><CalendarClock size={23} aria-hidden="true" /></span>
              <span><strong>Prayer times editor</strong><small>Review and edit individual prayer times</small></span><ArrowUpRight className="admin-action-arrow" size={19} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <div className="admin-settings-grid">
          <ControlSlideshow onSuccess={onSuccess} onError={onError} />
          <DonationSettings onSuccess={onSuccess} onError={onError} />
        </div>
        <section className="admin-messages" aria-labelledby="messages-title">
          <div className="admin-section-heading">
            <div><p className="eyebrow">On the display</p><h2 id="messages-title">Existing messages</h2></div>
            <button type="button" className="aero-button aero-button-secondary" onClick={() => openModal('message')}><MessageSquarePlus size={18} aria-hidden="true" /> Add message</button>
          </div>
          <MessageList onAddAnimation={message => { setSelectedMessage(message); openModal('animation') }} />
        </section>
        <footer className="admin-resources">
          <span>Planning &amp; resources</span>
          <a href="https://docs.google.com/spreadsheets/d/1TqARmQOth6B1BEA8wx-EHGJY-bgEeCtYDHqeYTRmISc/edit?usp=sharing" target="_blank" rel="noopener noreferrer"><FileSpreadsheet size={17} aria-hidden="true" /> Timetable spreadsheet <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          <a href="https://trello.com/b/9jKqsYXt" target="_blank" rel="noopener noreferrer"><LayoutList size={17} aria-hidden="true" /> Trello board <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
        </footer>
      </main>
      {modal && <AdminDialog open onClose={closeModal} title={modalTitles[modal]} busy={closing} wide={modal !== 'sync'}>
        {modal === 'message' && <AddMessage onClose={closeModal} setClosing={setClosing} onSuccess={() => onSuccess('Message added successfully')} onError={onError} />}
        {modal === 'animation' && selectedMessage && <AddAnimation message={selectedMessage} onClose={closeModal} setClosing={setClosing} onSuccess={() => onSuccess('Animation saved successfully')} onError={onError} />}
        {modal === 'sync' && <SyncPrayerTimes onClose={closeModal} setClosing={setClosing} onSuccess={onSuccess} onError={onError} />}
        {modal === 'timetables' && <ManageTimetables onClose={closeModal} setClosing={setClosing} onSuccess={onSuccess} onError={onError} />}
      </AdminDialog>}
      {toast && <Notification type={toast.type} message={toast.message} onDone={dismissToast} />}
    </>
  )
}
