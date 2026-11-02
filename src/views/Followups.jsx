import { Bell, BellRing, Check, Clock, Pencil } from 'lucide-react'
import { Avatar, Btn, Card, EmptyState, PageHeader, StatusBadge, cx } from '../components/ui'
import { addDays, daysSince, followUpGroups, formatDate, relative, todayISO } from '../lib/utils'
import { HeaderActions, SectionTitle } from './shared'

function Row({ a, actions, tone, suggestion }) {
  const days = daysSince(a)
  const base = todayISO()
  return (
    <Card className={cx('p-4 flex flex-col sm:flex-row sm:items-center gap-3', tone === 'red' && 'border-pr/50 bg-prSoft/40')}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar name={a.company} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{a.company || 'Untitled company'}</h3>
            <StatusBadge status={a.status} />
          </div>
          <p className="text-sm text-muted truncate">
            {a.role}
            {days != null && ` · applied ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:justify-end">
        {!suggestion && a.followUpDate && (
          <span
            className={cx(
              'inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium ring-1 ring-inset',
              tone === 'red' ? 'bg-prSoft text-prInk ring-pr/60' : 'bg-pbSoft text-pbInk ring-pb/50',
            )}
          >
            <Bell className="w-3 h-3" />
            {formatDate(a.followUpDate)} · {relative(a.followUpDate).toLowerCase()}
          </span>
        )}
        {suggestion ? (
          <>
            <Btn size="sm" icon={Bell} onClick={() => actions.update(a.id, { followUpDate: addDays(base, 2) })}>
              Remind me in 2 days
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => actions.update(a.id, { followUpDate: addDays(base, 7) })}>
              Next week
            </Btn>
          </>
        ) : (
          <>
            <Btn
              size="sm"
              variant="primary"
              icon={Check}
              onClick={() => {
                actions.update(a.id, { followUpDate: '' })
                actions.toast(`Follow-up with ${a.company || 'company'} marked done`)
              }}
            >
              Done
            </Btn>
            <Btn size="sm" icon={Clock} onClick={() => actions.update(a.id, { followUpDate: addDays(a.followUpDate < base ? base : a.followUpDate, 3) })}>
              +3 days
            </Btn>
            <Btn size="sm" onClick={() => actions.update(a.id, { followUpDate: addDays(a.followUpDate < base ? base : a.followUpDate, 7) })}>
              +1 week
            </Btn>
          </>
        )}
        <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => actions.openEdit(a.id)} aria-label="Edit">
          <span className="sr-only sm:not-sr-only">Edit</span>
        </Btn>
      </div>
    </Card>
  )
}

export default function Followups({ apps, actions, settings }) {
  const g = followUpGroups(apps)
  const total = g.overdue.length + g.today.length + g.week.length + g.later.length
  const sections = [
    { key: 'overdue', title: 'Overdue', tone: 'red', items: g.overdue },
    { key: 'today', title: 'Due today', items: g.today },
    { key: 'week', title: 'Next 7 days', items: g.week },
    { key: 'later', title: 'Later', items: g.later },
  ]

  return (
    <>
      <PageHeader
        title="Follow-ups"
        subtitle={total ? `${total} reminder${total === 1 ? '' : 's'} scheduled${g.overdue.length ? ` · ${g.overdue.length} overdue` : ''}` : 'Never let an application go cold.'}
      >
        <HeaderActions settings={settings} actions={actions} />
      </PageHeader>

      {total === 0 && g.suggestions.length === 0 ? (
        <Card>
          <EmptyState icon={BellRing} title="No follow-ups scheduled" text="Set a follow-up date on any active application and it will appear here, grouped by urgency.">
            <Btn variant="primary" onClick={() => actions.openAdd()}>
              Add application
            </Btn>
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-8">
          {sections.map(
            (s) =>
              s.items.length > 0 && (
                <section key={s.key}>
                  <SectionTitle count={s.items.length} tone={s.tone}>
                    {s.title}
                  </SectionTitle>
                  <div className="space-y-3">
                    {s.items.map((a) => (
                      <Row key={a.id} a={a} actions={actions} tone={s.tone} />
                    ))}
                  </div>
                </section>
              ),
          )}
          {g.suggestions.length > 0 && (
            <section>
              <SectionTitle count={g.suggestions.length}>Worth a nudge</SectionTitle>
              <p className="text-xs text-muted -mt-2 mb-3">Applied a week or more ago with no follow-up planned.</p>
              <div className="space-y-3">
                {g.suggestions.map((a) => (
                  <Row key={a.id} a={a} actions={actions} suggestion />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
