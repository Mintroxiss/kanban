import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function GlassSelect({ value, onChange, options, placeholder, className = '', disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function handleToggle() {
    if (disabled) return
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen((v) => !v)
  }

  const selected = options.find((o) => o.value === value)
  const label = selected?.label ?? placeholder ?? 'Выберите…'

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className="w-full text-left bg-white/[0.14] border border-white/[0.20] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400/50 transition-all flex items-center justify-between gap-2 disabled:opacity-50"
      >
        <span className={selected ? 'text-white/90' : 'text-white/35'}>{label}</span>
        <span className={`text-white/30 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 300 }}
          className="backdrop-blur-xl bg-white/[0.14] border border-white/[0.22] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1 max-h-52 overflow-y-auto"
        >
          {placeholder && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left text-sm px-3 py-2 transition-colors ${!value ? 'text-indigo-300 font-medium bg-indigo-500/10' : 'text-white/35 hover:bg-white/[0.11] hover:text-white/60'}`}
            >
              {placeholder}
            </button>
          )}
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left text-sm px-3 py-2 transition-colors ${value === o.value ? 'text-indigo-300 font-medium bg-indigo-500/10' : 'text-white/75 hover:bg-white/[0.11] hover:text-white/95'}`}
            >
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
