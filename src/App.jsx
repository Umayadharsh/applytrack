import { useCallback, useEffect, useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import { DEFAULT_SETTINGS, INACTIVE_STATUSES, KEYS } from './lib/constants'
import { seedApps } from './lib/seed'
import { useLocalStorage } from './lib/useLocalStorage'
import { applyPatch, blankApp, computeStats, csvToApps, download, addDays, todayISO, toCSV } from './lib/utils'
import Sidebar, { Logo } from './components/Sidebar'
import ApplicationPanel from './components/ApplicationPanel'
import Tracker from './components/Tracker'
import { ConfirmDialog, IconBtn, PageHeader, Toasts } from './components/ui'
import Overview from './views/Overview'
import Wishlist from './views/Wishlist'
import Interviews from './views/Interviews'
import Followups from './views/Followups'
import Analytics from './views/Analytics'
import Settings from './views/Settings'
import { HeaderActions } from './views/shared'

const INITIAL_TF = { q: '', statuses: [], cols: {}, sort: null, page: 1, pageSize: 15 }

export default function App() {
  const [apps, setApps] = useLocalStorage(KEYS.apps, seedApps)
  const [stored, setSettings] = useLocalStorage(KEYS.settings, () => ({ ...DEFAULT_SETTINGS, sample: true }))
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...stored }), [stored])
  const [view, setView] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toasts, setToasts] = useState([])
  const [tf, setTf] = useState(INITIAL_TF)
  const patchTf = useCallback((p) => setTf((s) => ({ ...s, ...p })), [])

  const dark = settings.theme === 'dark'
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  /* ---- toasts ---- */
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (message, action) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t.slice(-2), { id, message, action }])
      setTimeout(() => dismiss(id), action ? 7000 : 3800)
    },
    [dismiss],
  )

  /* ---- data actions ---- */
  const actions = {
    toast,
    toggleTheme: () => setSettings((s) => ({ ...DEFAULT_SETTINGS, ...s, theme: dark ? 'light' : 'dark' })),
    openAdd: (preset) => setPanel({ mode: 'add', preset }),
    openEdit: (id) => setPanel({ mode: 'edit', id }),

    add(data) {
      const a = blankApp(data)
      if (a.status === 'Applied' && !a.followUpDate && settings.followUpDays > 0) a.followUpDate = addDays(a.appliedDate || todayISO(), settings.followUpDays)
      setApps((p) => [a, ...p])
      return a
    },
    update: (id, patch) => setApps((p) => p.map((a) => (a.id === id ? applyPatch(a, patch, settings.followUpDays) : a))),
    bulkUpdate(ids, patch) {
      const set = new Set(ids)
      setApps((p) => p.map((a) => (set.has(a.id) ? applyPatch(a, patch, settings.followUpDays) : a)))
      toast(`Updated ${ids.length} application${ids.length === 1 ? '' : 's'}`)
    },
    remove(ids) {
      const set = new Set(ids)
      const removed = apps.filter((a) => set.has(a.id))
      if (!removed.length) return
      setApps((p) => p.filter((a) => !set.has(a.id)))
      setPanel((p) => (p && set.has(p.id) ? null : p))
      toast(removed.length === 1 ? `Deleted ${removed[0].company || 'row'}` : `Deleted ${removed.length} applications`, {
        label: 'Undo',
        onClick: () => setApps((p) => [...removed, ...p]),
      })
    },
    exportCSV(list, filtered) {
      download(`applytrack-${todayISO()}.csv`, toCSV(list))
      toast(`Exported ${list.length} application${list.length === 1 ? '' : 's'}${filtered ? ' (filtered view)' : ''}`)
    },
    async importCSV(file) {
      try {
        const list = csvToApps(await file.text())
        if (!list.length) return toast('No applications found — check the CSV headers (Company Name, Job Role, Status…)')
        setApps((p) => [...list, ...p])
        toast(`Imported ${list.length} application${list.length === 1 ? '' : 's'}`)
      } catch {
        toast('Could not read that file')
      }
    },
    loadSample() {
      setConfirm({
        title: 'Load sample data?',
        message: 'Sample applications will be added alongside your existing ones.',
        confirmLabel: 'Load sample',
        onConfirm: () => {
          setApps((p) => [...seedApps(), ...p])
          setSettings((s) => ({ ...DEFAULT_SETTINGS, ...s, sample: true }))
          toast('Sample data added')
        },
      })
    },
    clearAll() {
      setConfirm({
        title: 'Delete all applications?',
        message: 'This permanently removes every application stored in this browser. Export a CSV first if you want a backup.',
        confirmLabel: 'Delete everything',
        danger: true,
        onConfirm: () => {
          setApps([])
          setSettings((s) => ({ ...DEFAULT_SETTINGS, ...s, sample: false }))
          setTf(INITIAL_TF)
          toast('All data cleared')
        },
      })
    },
    dismissSample: () => setSettings((s) => ({ ...DEFAULT_SETTINGS, ...s, sample: false })),
  }

  const savePanel = (data, existing) => {
    if (existing) {
      const { id, ...rest } = data
      actions.update(id, rest)
      toast('Changes saved')
    } else {
      const a = actions.add(data)
      toast(`Added ${a.company}`)
    }
    setPanel(null)
  }

  /* ---- sidebar badges ---- */
  const stats = useMemo(() => computeStats(apps), [apps])
  const badges = {
    followups: { count: stats.overdue, tone: 'red' },
    interviews: { count: stats.upcomingInterviews, tone: 'blue' },
    wishlist: { count: stats.wishlist, tone: 'blue' },
  }
  const activeCount = apps.filter((a) => !INACTIVE_STATUSES.includes(a.status)).length

  const common = { apps, actions, settings, dark, tf, patchTf, setView }
  const titles = { applications: 'All Applications' }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Sidebar view={view} setView={setView} open={menuOpen} setOpen={setMenuOpen} badges={badges} profile={settings} activeCount={activeCount} />

      <div className="lg:pl-64 min-h-screen flex flex-col">
        <div className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 bg-card/90 backdrop-blur border-b border-line">
          <IconBtn aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </IconBtn>
          <Logo size={28} />
          <span className="font-semibold">ApplyTrack</span>
        </div>

        <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div key={view} className="animate-rise">
            {view === 'overview' && <Overview {...common} />}
            {view === 'applications' && (
              <>
                <PageHeader title={titles.applications} subtitle="Your full spreadsheet — click any cell to edit, Tab to move across.">
                  <HeaderActions settings={settings} actions={actions} />
                </PageHeader>
                <Tracker apps={apps} tf={tf} patchTf={patchTf} actions={actions} />
              </>
            )}
            {view === 'wishlist' && <Wishlist {...common} />}
            {view === 'interviews' && <Interviews {...common} />}
            {view === 'followups' && <Followups {...common} />}
            {view === 'analytics' && <Analytics {...common} />}
            {view === 'settings' && <Settings apps={apps} settings={settings} setSettings={setSettings} actions={actions} />}
          </div>
        </main>
      </div>

      {panel && (
        <ApplicationPanel
          key={panel.mode + (panel.id || '') + (panel.preset?.status || '')}
          panel={panel}
          apps={apps}
          followUpDays={settings.followUpDays}
          onSave={savePanel}
          onDelete={(a) => actions.remove([a.id])}
          onClose={() => setPanel(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          {...confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            confirm.onConfirm()
            setConfirm(null)
          }}
        />
      )}
      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
