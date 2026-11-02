import { CalendarClock, CheckCircle2, Minus, Pencil, Plus } from 'lucide-react'
import { INTERVIEW_STATUSES, MAX_ROUND } from '../lib/constants'
import { Avatar, Btn, Card, EmptyState, IconBtn, PageHeader, StatusBadge, cx } from '../components/ui'
import { formatDate, parseISO, relative, todayISO } from '../lib/utils'
import { HeaderActions, SectionTitle } from './shared'

function RoundTracker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <IconBtn aria-label="Previous round" disabled={value <= 0} onClick={() => onChange(value - 1)} className="border border-line disabled:opacity-40">
        <Minus className="w-3.5 h-3.5" />
      </IconBtn>
      <div className="flex items-center gap-1" role="img" aria-label={`Round ${value} of ${MAX_ROUND}`}>
        {Array.from({ length: MAX_ROUND }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1 === value ? i : i + 1)}
            aria-label={`Set round ${i + 1}`}
            className={cx('h-2 rounded-full transition-all', i < value ? 'w-6 bg-pb' : 'w-3 bg-line hover:bg-pb/40')}
          />
        ))}
      </div>
      <IconBtn aria-label="Next round" disabled={value >= MAX_ROUND} onClick={() => onChange(value + 1)} className="border border-line disabled:opacity-40">
        <Plus className="w-3.5 h-3.5" />
      </IconBtn>
      <span className="text-xs font-medium text-muted tabular-nums w-14">{value ? `Round ${value}` : 'Not started'}</span>
    </div>
  )
}

function InterviewCard({ a, actions, highlight }) {
  const d = a.interviewDate ? parseISO(a.interviewDate) : null
  return (
    <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-pop transition-shadow">
      <div
        className={cx(
          'w-14 h-14 rounded-2xl grid place-items-center text-center leading-none shrink-0',
          highlight ? 'bg-prSoft text-prInk' : d ? 'bg-pbSoft text-pbInk' : 'bg-soft text-muted',
        )}
      >
        {d ? (
          <span>
            <span className="block text-lg font-semibold">{d.getDate()}</span>
            <span className="block text-[10px] uppercase tracking-wider mt-0.5">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
          </span>
        ) : (
          <CalendarClock className="w-5 h-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Avatar name={a.company} size="sm" />
          <h3 className="font-semibold truncate">{a.company || 'Untitled company'}</h3>
          <StatusBadge status={a.status} />
        </div>
        <p className="text-sm text-muted truncate mt-0.5">
          {a.role}
          {a.interviewDate && ` · ${formatDate(a.interviewDate, true)} (${relative(a.interviewDate).toLowerCase()})`}
        </p>
        {a.notes && <p className="text-xs text-muted mt-1 line-clamp-1">{a.notes}</p>}
      </div>

      <div className="flex flex-col sm:items-end gap-2">
        <RoundTracker value={a.round || 0} onChange={(r) => actions.update(a.id, { round: r })} />
        <div className="flex items-center gap-2">
          {a.status === 'Interview Scheduled' && (
            <Btn size="sm" icon={CheckCircle2} onClick={() => actions.update(a.id, { status: 'Interview Completed' })}>
              Mark completed
            </Btn>
          )}
          <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => actions.openEdit(a.id)}>
            Details
          </Btn>
        </div>
      </div>
    </Card>
  )
}

export default function Interviews({ apps, actions, settings }) {
  const today = todayISO()
  const live = apps.filter((a) => a.status !== 'Wishlist')
  const upcoming = live
    .filter((a) => a.interviewDate >= today && a.status !== 'Rejected')
    .sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))
  const needsUpdate = live.filter((a) => a.status === 'Interview Scheduled' && a.interviewDate && a.interviewDate < today)
  const noDate = live.filter((a) => a.status === 'Interview Scheduled' && !a.interviewDate)
  const shown = new Set([...upcoming, ...needsUpdate, ...noDate].map((a) => a.id))
  const history = live
    .filter((a) => !shown.has(a.id) && (a.round > 0 || a.interviewDate || INTERVIEW_STATUSES.includes(a.status)))
    .sort((a, b) => (b.interviewDate || '').localeCompare(a.interviewDate || ''))

  const none = !upcoming.length && !needsUpdate.length && !noDate.length && !history.length

  return (
    <>
      <PageHeader title="Interviews" subtitle="Track upcoming interviews and how far you've progressed in each process.">
        <HeaderActions settings={settings} actions={actions} />
      </PageHeader>

      {none ? (
        <Card>
          <EmptyState icon={CalendarClock} title="No interviews yet" text="Set an application's status to Interview Scheduled, or add an interview date, and it will show up here.">
            <Btn variant="primary" onClick={() => actions.openAdd()}>
              Add application
            </Btn>
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-8">
          {needsUpdate.length > 0 && (
            <section>
              <SectionTitle count={needsUpdate.length} tone="red">
                Needs an update
              </SectionTitle>
              <p className="text-xs text-muted -mt-2 mb-3">These interview dates have passed but the status is still “Interview Scheduled”.</p>
              <div className="space-y-3">
                {needsUpdate.map((a) => (
                  <InterviewCard key={a.id} a={a} actions={actions} highlight />
                ))}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <SectionTitle count={upcoming.length}>Upcoming</SectionTitle>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <InterviewCard key={a.id} a={a} actions={actions} />
                ))}
              </div>
            </section>
          )}
          {noDate.length > 0 && (
            <section>
              <SectionTitle count={noDate.length}>Scheduled — date not set</SectionTitle>
              <div className="space-y-3">
                {noDate.map((a) => (
                  <InterviewCard key={a.id} a={a} actions={actions} />
                ))}
              </div>
            </section>
          )}
          {history.length > 0 && (
            <section>
              <SectionTitle count={history.length}>Interview history</SectionTitle>
              <div className="space-y-3">
                {history.map((a) => (
                  <InterviewCard key={a.id} a={a} actions={actions} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
