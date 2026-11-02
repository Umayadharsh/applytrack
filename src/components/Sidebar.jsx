import { BarChart3, Bell, Bookmark, CalendarClock, LayoutDashboard, Settings, Table2, X } from 'lucide-react'
import { NAV } from '../lib/constants'
import { cx } from './ui'
import { initials } from '../lib/utils'

const ICONS = { LayoutDashboard, Table2, Bookmark, CalendarClock, Bell, BarChart3, Settings }

export function Logo({ size = 36 }) {
  return (
    <span className="grid place-items-center rounded-[11px] bg-pb shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" width={size * 0.72} height={size * 0.72} fill="none" stroke="#26344A" strokeWidth="2.6" strokeLinecap="round">
        <circle cx="16" cy="16" r="7" />
        <circle cx="16" cy="16" r="2.4" fill="#26344A" stroke="none" />
        <path d="M16 4v4M16 24v4M4 16h4M24 16h4" />
      </svg>
    </span>
  )
}

export default function Sidebar({ view, setView, open, setOpen, badges, profile, activeCount }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-navy/30 lg:hidden animate-fade" onClick={() => setOpen(false)} />}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r border-line transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Primary"
      >
        <div className="h-16 px-5 flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="font-semibold text-[17px] tracking-tight">ApplyTrack</div>
            <div className="text-[11px] text-muted">Job search, organised</div>
          </div>
          <button className="ml-auto lg:hidden p-1.5 rounded-lg text-muted hover:bg-soft" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {NAV.map((n) => {
            const Icon = ICONS[n.icon]
            const active = view === n.id
            const badge = badges[n.id]
            return (
              <button
                key={n.id}
                onClick={() => {
                  setView(n.id)
                  setOpen(false)
                }}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'group w-full flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition relative',
                  active ? 'bg-pbSoft text-pbInk' : 'text-muted hover:bg-soft hover:text-ink',
                  n.id === 'settings' && 'mt-3',
                )}
              >
                {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-pb" />}
                <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 1.9} />
                <span className="flex-1 text-left">{n.label}</span>
                {badge?.count > 0 && (
                  <span
                    className={cx(
                      'min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold grid place-items-center tabular-nums',
                      badge.tone === 'red' ? 'bg-pr text-[#5a1d20]' : 'bg-pb/50 text-pbInk',
                    )}
                  >
                    {badge.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-line">
          <button
            onClick={() => {
              setView('settings')
              setOpen(false)
            }}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-soft transition text-left"
          >
            <span className="w-9 h-9 rounded-full bg-pb/40 text-pbInk grid place-items-center text-sm font-semibold ring-2 ring-card">
              {initials(profile.name)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-medium truncate">{profile.name}</span>
              <span className="block text-xs text-muted">{activeCount} active application{activeCount === 1 ? '' : 's'}</span>
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
