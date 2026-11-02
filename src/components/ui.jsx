import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Check, ChevronDown, Flag, X } from 'lucide-react'
import { PRIORITY_STYLE, STATUS_STYLE } from '../lib/constants'

export const cx = (...a) => a.filter(Boolean).join(' ')

export const inputCls =
  'w-full h-10 px-3 rounded-xl bg-card border border-line text-sm text-ink placeholder:text-muted/70 outline-none transition focus:border-pb focus:ring-4 focus:ring-pb/30 disabled:opacity-60'

const BTN = {
  primary: 'bg-pb text-[#1b2b45] hover:brightness-95 shadow-card',
  secondary: 'bg-card text-ink border border-line hover:bg-soft',
  ghost: 'text-muted hover:bg-soft hover:text-ink',
  danger: 'bg-prSoft text-prInk border border-pr/40 hover:bg-pr/30',
}
export function Btn({ variant = 'secondary', size = 'md', icon: Icon, className, children, ...p }) {
  const sz = size === 'sm' ? 'h-8 px-3 text-xs gap-1.5' : 'h-10 px-4 text-sm gap-2'
  return (
    <button
      type="button"
      {...p}
      className={cx(
        'inline-flex items-center justify-center rounded-xl font-medium whitespace-nowrap transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pb/40',
        BTN[variant],
        sz,
        className,
      )}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  )
}

export function IconBtn({ tone, className, children, ...p }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        'w-8 h-8 grid place-items-center rounded-lg text-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb',
        tone === 'danger' ? 'hover:bg-prSoft hover:text-prInk' : 'hover:bg-soft hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export const Card = ({ className, children, ...p }) => (
  <div {...p} className={cx('bg-card border border-line rounded-2xl shadow-card', className)}>
    {children}
  </div>
)

export function StatusBadge({ status, className }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Wishlist
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        s.badge,
        className,
      )}
    >
      <span className={cx('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {status}
    </span>
  )
}

export function PriorityBadge({ priority, className }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        PRIORITY_STYLE[priority] || PRIORITY_STYLE.Low,
        className,
      )}
    >
      <Flag className="w-3 h-3" />
      {priority}
    </span>
  )
}

export function Avatar({ name, size = 'md' }) {
  const letter = (name || '?').trim()[0]?.toUpperCase() || '?'
  return (
    <span
      className={cx(
        'shrink-0 grid place-items-center rounded-lg bg-pbSoft text-pbInk font-semibold ring-1 ring-inset ring-pb/40',
        size === 'sm' ? 'w-6 h-6 text-[11px]' : size === 'lg' ? 'w-10 h-10 text-sm rounded-xl' : 'w-7 h-7 text-xs',
      )}
    >
      {letter}
    </span>
  )
}

export function MatchBar({ value, className }) {
  const v = Math.max(0, Math.min(10, Number(value) || 0))
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <span className="flex gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cx('w-1.5 h-3.5 rounded-[2px]', i < v ? (v >= 7 ? 'bg-pb' : v >= 4 ? 'bg-pb/60' : 'bg-pr') : 'bg-line')} />
        ))}
      </span>
      <span className="text-xs font-medium tabular-nums text-ink/80">{v}/10</span>
    </span>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative w-10 h-6 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pb/40',
        checked ? 'bg-pb' : 'bg-line',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-4',
        )}
      />
    </button>
  )
}

export function Segmented({ value, onChange, options, size = 'md' }) {
  return (
    <div className="inline-flex p-0.5 rounded-xl bg-soft border border-line">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-[10px] font-medium transition',
            size === 'sm' ? 'px-2.5 h-6 text-xs' : 'px-3 h-8 text-sm',
            value === o.value ? 'bg-card text-ink shadow-card' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted mt-1">{hint}</span>}
    </label>
  )
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <div className="w-12 h-12 rounded-2xl bg-pbSoft text-pbInk grid place-items-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted mt-1 max-w-sm">{text}</p>
      {children && <div className="mt-4 flex gap-2">{children}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-[28px] font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  )
}

/* Floating panel anchored to an element, rendered in a portal so table overflow can't clip it. */
export function Popover({ anchor, onClose, width = 220, children }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: -9999, left: -9999 })

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return
    const r = anchor.getBoundingClientRect()
    const h = ref.current.offsetHeight
    let top = r.bottom + 6
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6)
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8))
    setPos({ top, left })
  }, [anchor, width])

  useEffect(() => {
    const down = (e) => {
      if (ref.current?.contains(e.target) || anchor?.contains(e.target)) return
      onClose()
    }
    const key = (e) => e.key === 'Escape' && onClose()
    const openedAt = Date.now()
    const scroll = (e) => {
      if (ref.current?.contains(e.target)) return
      if (Date.now() - openedAt < 250) return // ignore scroll settling right as it opens
      onClose()
    }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    window.addEventListener('resize', onClose)
    window.addEventListener('scroll', scroll, true)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('scroll', scroll, true)
    }
  }, [anchor, onClose])

  return createPortal(
    <div
      ref={ref}
      style={{ top: pos.top, left: pos.left, width }}
      className="fixed z-[80] rounded-2xl border border-line bg-card shadow-pop p-1.5 animate-fade"
    >
      {children}
    </div>,
    document.body,
  )
}

/* Badge-style dropdown with coloured options (status / priority). */
export function PickerCell({ value, options, onChange, render, width = 220 }) {
  const [anchor, setAnchor] = useState(null)
  return (
    <>
      <button
        type="button"
        onClick={(e) => setAnchor((a) => (a ? null : e.currentTarget))}
        className="group/pick inline-flex items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb"
        aria-haspopup="listbox"
      >
        {render(value)}
        <ChevronDown className="w-3 h-3 text-muted opacity-0 group-hover/pick:opacity-100 transition-opacity -ml-0.5" />
      </button>
      {anchor && (
        <Popover anchor={anchor} onClose={() => setAnchor(null)} width={width}>
          <ul role="listbox">
            {options.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o === value}
                  onClick={() => {
                    onChange(o)
                    setAnchor(null)
                  }}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-soft"
                >
                  {render(o)}
                  {o === value && <Check className="w-4 h-4 text-pbInk" />}
                </button>
              </li>
            ))}
          </ul>
        </Popover>
      )}
    </>
  )
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onCancel])
  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-[2px] animate-fade" onClick={onCancel} />
      <div role="alertdialog" aria-modal="true" className="relative w-full max-w-sm rounded-2xl bg-card border border-line shadow-pop p-6 animate-rise">
        <div className={cx('w-10 h-10 rounded-xl grid place-items-center mb-4', danger ? 'bg-prSoft text-prInk' : 'bg-pbSoft text-pbInk')}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted mt-1.5">{message}</p>
        <div className="flex justify-end gap-2 mt-6">
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function Toasts({ toasts, dismiss }) {
  return createPortal(
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center px-4 w-full max-w-md pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto w-full flex items-center gap-3 rounded-xl bg-navy text-white text-sm pl-4 pr-2 py-2.5 shadow-pop animate-rise"
        >
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-medium text-pb"
              onClick={() => {
                t.action.onClick()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button aria-label="Dismiss" className="p-1 rounded-lg hover:bg-white/15" onClick={() => dismiss(t.id)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
