'use client'

import AdminDialog from '../../../AdminComponents/AdminDialog'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  deleting?: boolean
}

export default function DeleteModal({ isOpen, onClose, onConfirm, deleting = false }: DeleteModalProps) {
  return (
    <AdminDialog open={isOpen} onClose={onClose} title="Delete message?" busy={deleting}
      description="This message and its display conditions will be permanently removed. This cannot be undone.">
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" data-autofocus onClick={onClose} disabled={deleting} className="aero-button aero-button-secondary">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={deleting} className="admin-danger-button">{deleting ? 'Deleting...' : 'Delete message'}</button>
      </div>
    </AdminDialog>
  )
}
