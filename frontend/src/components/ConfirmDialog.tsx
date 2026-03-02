import { createPortal } from 'react-dom'

interface Props {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] px-4"
      onClick={onCancel}
    >
      <div
        className="backdrop-blur-2xl bg-white/[0.17] border border-white/[0.23] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white/95 mb-1">{title}</h2>
        {description && <p className="text-sm text-white/50 mb-6">{description}</p>}
        {!description && <div className="mb-6" />}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-white/55 hover:text-white/85 rounded-xl hover:bg-white/[0.19] transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-medium text-white rounded-2xl border transition-all ${
              danger
                ? 'bg-red-500/70 hover:bg-red-500/90 border-red-400/30 shadow-[0_4px_16px_rgba(239,68,68,0.25)]'
                : 'bg-indigo-500/80 hover:bg-indigo-500/95 border-indigo-400/30 shadow-[0_4px_16px_rgba(99,102,241,0.3)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
