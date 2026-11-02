import { useRef } from 'react'
import {
  AlertCircle,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Trophy,
  Users,
  XCircle,
  X,
} from 'lucide-react'
import { INTERVIEW_STATUSES } from '../lib/constants'
import { computeStats, followUpGroups, formatDate, greeting, longToday, pct, relative, todayISO } from '../lib/utils'
import { ActivityChart, DistributionChart } from '../components/Charts'
import Tracker from '../components/Tracker'
import { Avatar, Btn, Card, PageHeader, StatusBadge, cx } from '../components/ui'
import { HeaderActions } from './shared'

function StatCard({ icon: Icon, label, value, sub, tone, active, onClick }) {
  const tones = {
    neutral: 'bg-soft text-ink/70',
    blue: 'bg-pbSoft text-pbInk',
    blue2: 'bg-pb/30 text-pbInk',
    blue3: 'bg-pb/60 text-[#1b2b45]',
    red: 'bg-prSoft text-prInk',
  }
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'text-left rounded-2xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pb/40',
        active ? 'border-pb ring-2 ring-pb/40' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cx('w-9 h-9 rounded-xl grid place-items-center', tones[tone])}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
      </div>
      <div className="mt-3 text-[28px] leading-none font-semibold tabular-nums">{value}</div>
      <div className="mt-1.5 text-sm font-medium">{label}</div>
      <div className="text-xs text-muted mt-0.5 truncate">{sub}</div>
    </button>
  )
}

export default function Overview({ apps, tf, patchTf, actions, setView, settings, dark }) {
  const trackerRef = useRef(null)
  const s = computeStats(apps)
  const groups = followUpGroups(apps)
  const reminders = [...groups.overdue, ...groups.today, ...groups.week].slice(0, 4)
  const today = todayISO()
  const interviews = apps
    .filter((a) => a.interviewDate && a.interviewDate >= today && !['Rejected', 'Wishlist'].includes(a.status))
    .sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))
    .slice(0, 3)
  const offers = apps.filter((a) => a.status === 'Selected')

  const filterBy = (statuses) => {
    patchTf({ q: '', cols: {}, sort: null, statuses, page: 1 })
    requestAnimationFrame(() => trackerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x))
  const cards = [
    { label: 'Total Applications', value: s.total, sub: `${s.wishlist} in wishlist`, icon: Briefcase, tone: 'neutral', statuses: ['Applied', 'Under Review', 'Assessment', ...INTERVIEW_STATUSES, 'Selected', 'Rejected', 'No Response'] },
    { label: 'Applied', value: s.applied, sub: 'Awaiting a reply', icon: Send, tone: 'blue', statuses: ['Applied'] },
    { label: 'In Progress', value: s.inProgress, sub: 'Review & assessments', icon: Clock, tone: 'blue2', statuses: ['Under Review', 'Assessment'] },
    { label: 'Interviews', value: s.interviews, sub: `${s.upcomingInterviews} upcoming`, icon: Users, tone: 'blue2', statuses: INTERVIEW_STATUSES },
    { label: 'Offers Received', value: s.offers, sub: `${pct(s.successRate)} success rate`, icon: Trophy, tone: 'blue3', statuses: ['Selected'] },
    { label: 'Rejected', value: s.rejected, sub: `${s.noResponse} no response`, icon: XCircle, tone: 'red', statuses: ['Rejected'] },
  ]

  return (
    <>
      <PageHeader title="Your Job Search Dashboard" subtitle={`${greeting()}${settings.name && settings.name !== 'Job Seeker' ? ', ' + settings.name.trim().split(' ')[0] : ''} · ${longToday()}`}>
        <HeaderActions settings={settings} actions={actions} />
      </PageHeader>

      {settings.sample && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-pb/50 bg-pbSoft px-4 py-3 text-sm animate-fade">
          <Sparkles className="w-4 h-4 text-pbInk shrink-0" />
          <span className="flex-1 min-w-[200px] text-pbInk">You're looking at sample data so you can explore. Clear it whenever you're ready to start fresh.</span>
          <Btn size="sm" variant="secondary" onClick={actions.clearAll}>
            Clear sample data
          </Btn>
          <button aria-label="Dismiss" className="p-1 text-pbInk/70 hover:text-pbInk" onClick={actions.dismissSample}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {s.overdue > 0 && (
        <button
          onClick={() => setView('followups')}
          className="mb-4 w-full flex items-center gap-3 rounded-2xl border border-pr/50 bg-prSoft px-4 py-3 text-sm text-prInk text-left hover:brightness-[0.98] transition"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            <b>{s.overdue} follow-up{s.overdue > 1 ? 's are' : ' is'} overdue.</b> A short, polite nudge goes a long way.
          </span>
          <span className="font-medium underline-offset-2 hover:underline">Review</span>
        </button>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} active={same(tf.statuses, c.statuses)} onClick={() => filterBy(same(tf.statuses, c.statuses) ? [] : c.statuses)} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2">
          <ActivityChart apps={apps} dark={dark} />
        </div>
        <DistributionChart apps={apps} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-prInk" /> Follow-up reminders
            </h3>
            <button onClick={() => setView('followups')} className="text-xs text-pbInk hover:underline">
              View all
            </button>
          </div>
          {reminders.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">You're all caught up. 🎉</p>
          ) : (
            <ul className="space-y-1">
              {reminders.map((a) => {
                const over = a.followUpDate < today
                return (
                  <li key={a.id}>
                    <button onClick={() => actions.openEdit(a.id)} className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-soft text-left">
                      <Avatar name={a.company} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate">{a.company}</span>
                        <span className="block text-xs text-muted truncate">{a.role}</span>
                      </span>
                      <span className={cx('text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap', over ? 'bg-prSoft text-prInk' : 'bg-pbSoft text-pbInk')}>
                        {over ? 'Overdue' : relative(a.followUpDate)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-pbInk" /> Upcoming interviews
            </h3>
            <button onClick={() => setView('interviews')} className="text-xs text-pbInk hover:underline">
              View all
            </button>
          </div>
          {interviews.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">No interviews scheduled yet.</p>
          ) : (
            <ul className="space-y-1">
              {interviews.map((a) => (
                <li key={a.id}>
                  <button onClick={() => actions.openEdit(a.id)} className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-soft text-left">
                    <span className="w-10 h-10 rounded-xl bg-pbSoft text-pbInk grid place-items-center leading-none text-center shrink-0">
                      <span>
                        <span className="block text-sm font-semibold">{new Date(a.interviewDate + 'T00:00').getDate()}</span>
                        <span className="block text-[9px] uppercase tracking-wider">{new Date(a.interviewDate + 'T00:00').toLocaleDateString('en-IN', { month: 'short' })}</span>
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{a.company}</span>
                      <span className="block text-xs text-muted truncate">
                        {a.round ? `Round ${a.round} · ` : ''}
                        {relative(a.interviewDate)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-pbInk" /> Offers & success
          </h3>
          <div className="flex items-end gap-3 mb-3">
            <div className="text-[34px] leading-none font-semibold tabular-nums">{pct(s.successRate, s.successRate && s.successRate < 0.1 ? 1 : 0)}</div>
            <div className="text-xs text-muted pb-1">application success rate</div>
          </div>
          <div className="h-2 rounded-full bg-soft overflow-hidden mb-4">
            <div className="h-full rounded-full bg-pb transition-all" style={{ width: `${Math.min(100, s.successRate * 100)}%` }} />
          </div>
          {offers.length === 0 ? (
            <p className="text-sm text-muted">No offers yet — keep going!</p>
          ) : (
            <ul className="space-y-2">
              {offers.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-pbInk shrink-0" />
                  <span className="font-medium truncate">{a.company}</span>
                  <span className="text-xs text-muted truncate ml-auto">{a.salary || a.role}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div ref={trackerRef} className="scroll-mt-4">
        <Tracker apps={apps} tf={tf} patchTf={patchTf} actions={actions} compact />
      </div>
    </>
  )
}
