import { useMemo } from 'react'
import { CheckCircle2, MessageSquareReply, Target, Trophy, Users } from 'lucide-react'
import { MonthlyChart } from '../components/Charts'
import { Avatar, Card, PageHeader, cx } from '../components/ui'
import { SOURCES } from '../lib/constants'
import { computeStats, formatDate, gotResponse, monthlyStats, pct, reachedInterview } from '../lib/utils'
import { HeaderActions } from './shared'

function Kpi({ icon: Icon, label, value, sub, tone = 'blue' }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={cx('w-10 h-10 rounded-xl grid place-items-center', tone === 'blue' ? 'bg-pbSoft text-pbInk' : 'bg-pb/50 text-[#1b2b45]')}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="text-sm text-muted">{label}</div>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted mt-1">{sub}</div>
    </Card>
  )
}

function Funnel({ steps }) {
  const max = Math.max(1, steps[0].value)
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-baseline justify-between text-sm mb-1">
            <span className="font-medium">{s.label}</span>
            <span className="tabular-nums text-muted">
              <b className="text-ink">{s.value}</b>
              {i > 0 && steps[0].value > 0 && <span className="ml-2 text-xs">{pct(s.value / steps[0].value)}</span>}
            </span>
          </div>
          <div className="h-3 rounded-full bg-soft overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(s.value / max) * 100}%`, background: s.color, minWidth: s.value ? 8 : 0 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Analytics({ apps, actions, settings, dark }) {
  const s = computeStats(apps)
  const submitted = apps.filter((a) => a.status !== 'Wishlist')
  const months = useMemo(() => monthlyStats(apps, 6), [apps])
  const avgMatch = submitted.length ? submitted.reduce((t, a) => t + (Number(a.match) || 0), 0) / submitted.length : 0
  const avgOf = (list) => (list.length ? (list.reduce((t, a) => t + (Number(a.match) || 0), 0) / list.length).toFixed(1) : '–')

  const funnel = [
    { label: 'Applied', value: submitted.length, color: '#CFE0F8' },
    { label: 'Heard back', value: submitted.filter(gotResponse).length, color: '#A9C9F5' },
    { label: 'Reached interview', value: submitted.filter(reachedInterview).length, color: '#6F9ADB' },
    { label: 'Offers', value: s.offers, color: '#3F6FB5' },
  ]

  const sources = useMemo(() => {
    const names = [...new Set([...SOURCES, ...submitted.map((a) => a.source)])].filter(Boolean)
    return names
      .map((n) => {
        const list = submitted.filter((a) => a.source === n)
        return {
          name: n,
          apps: list.length,
          interviews: list.filter(reachedInterview).length,
          offers: list.filter((a) => a.status === 'Selected').length,
          rate: list.length ? list.filter((a) => a.status === 'Selected').length / list.length : 0,
        }
      })
      .filter((r) => r.apps > 0)
      .sort((a, b) => b.offers - a.offers || b.interviews - a.interviews || b.apps - a.apps)
  }, [submitted])

  const offers = apps.filter((a) => a.status === 'Selected')
  const hasData = submitted.length > 0

  return (
    <>
      <PageHeader title="Analytics" subtitle="How your job search is performing, and what's working.">
        <HeaderActions settings={settings} actions={actions} />
      </PageHeader>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <Kpi icon={Trophy} label="Success rate" value={pct(s.successRate, 1)} sub={`${s.offers} offer${s.offers === 1 ? '' : 's'} from ${s.total} applications`} tone="strong" />
        <Kpi icon={Users} label="Interview rate" value={pct(s.interviewRate, 1)} sub="Applications that reached an interview" />
        <Kpi icon={MessageSquareReply} label="Response rate" value={pct(s.responseRate, 1)} sub={`${s.noResponse} marked no response`} />
        <Kpi icon={Target} label="Avg. skill match" value={avgMatch ? avgMatch.toFixed(1) + '/10' : '–'} sub={`Offers ${avgOf(offers)} · Rejected ${avgOf(apps.filter((a) => a.status === 'Rejected'))}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 xl:col-span-2">
          <h3 className="font-semibold">Monthly application statistics</h3>
          <p className="text-xs text-muted mt-0.5 mb-3">Grouped by the month you applied · last 6 months</p>
          {hasData ? <MonthlyChart apps={apps} dark={dark} /> : <div className="h-[280px] grid place-items-center text-sm text-muted">Add applications to see monthly trends.</div>}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Conversion funnel</h3>
          <p className="text-xs text-muted mt-0.5 mb-5">From first application to offer</p>
          <Funnel steps={funnel} />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5 overflow-x-auto">
          <h3 className="font-semibold mb-3">Month by month</h3>
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-2 font-medium">Month</th>
                <th className="py-2 font-medium text-right">Applied</th>
                <th className="py-2 font-medium text-right">Interviews</th>
                <th className="py-2 font-medium text-right">Offers</th>
                <th className="py-2 font-medium text-right">Rejected</th>
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((m) => (
                <tr key={m.key} className="border-t border-line">
                  <td className="py-2.5 font-medium">{m.fullMonth}</td>
                  <td className="py-2.5 text-right tabular-nums">{m.Applications}</td>
                  <td className="py-2.5 text-right tabular-nums">{m.Interviews}</td>
                  <td className="py-2.5 text-right tabular-nums text-pbInk font-medium">{m.Offers}</td>
                  <td className="py-2.5 text-right tabular-nums text-prInk">{m.Rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-5 overflow-x-auto">
          <h3 className="font-semibold mb-3">Where applications work best</h3>
          {sources.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">No data yet.</p>
          ) : (
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-2 font-medium">Source</th>
                  <th className="py-2 font-medium text-right">Applied</th>
                  <th className="py-2 font-medium text-right">Interviews</th>
                  <th className="py-2 font-medium text-right">Offers</th>
                  <th className="py-2 font-medium text-right">Success</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((r) => (
                  <tr key={r.name} className="border-t border-line">
                    <td className="py-2.5 font-medium">{r.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.apps}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.interviews}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.offers}</td>
                    <td className="py-2.5 text-right tabular-nums">{pct(r.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card className="p-5 mt-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-pbInk" /> Companies where I received offers
          <span className="text-xs font-medium bg-pb/40 text-pbInk px-2 py-0.5 rounded-full">{offers.length}</span>
        </h3>
        {offers.length === 0 ? (
          <p className="text-sm text-muted">No offers yet. Set an application's status to “Selected” and it will be tracked here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {offers.map((a) => (
              <button
                key={a.id}
                onClick={() => actions.openEdit(a.id)}
                className="flex items-center gap-3 p-4 rounded-2xl border border-pb/50 bg-pbSoft text-left hover:shadow-pop transition"
              >
                <Avatar name={a.company} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold truncate">{a.company}</span>
                  <span className="block text-sm text-muted truncate">{a.role}</span>
                  {a.salary && <span className="block text-sm font-medium text-pbInk mt-0.5">{a.salary}</span>}
                </span>
                {a.interviewDate && <span className="text-[11px] text-muted self-start">{formatDate(a.interviewDate)}</span>}
              </button>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
