import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { STATUSES, STATUS_STYLE } from '../lib/constants'
import { activitySeries, monthlyStats } from '../lib/utils'
import { Card, Segmented } from './ui'

const C = { blue: '#A9C9F5', blueMid: '#6F9ADB', blueDeep: '#3F6FB5', red: '#F4A6A6' }
const axisColor = '#8A97AB'
const gridColor = (dark) => (dark ? '#26334A' : '#E8EEF7')

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-pop">
      <div className="font-medium text-ink mb-1">{payload[0]?.payload?.fullMonth || payload[0]?.payload?.label || label}</div>
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2 text-muted">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: <b className="text-ink tabular-nums">{p.value}</b>
        </div>
      ))}
    </div>
  )
}

export function ActivityChart({ apps, dark }) {
  const [mode, setMode] = useState('weekly')
  const data = useMemo(() => activitySeries(apps, mode), [apps, mode])
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold">Application activity</h3>
          <p className="text-xs text-muted mt-0.5">
            {total} application{total === 1 ? '' : 's'} in the last {mode === 'weekly' ? '12 weeks' : '30 days'}
          </p>
        </div>
        <Segmented
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'daily', label: 'Daily' },
          ]}
        />
      </div>
      <div className="h-[210px] -ml-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={gridColor(dark)} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={mode === 'weekly' ? 'short' : 'label'}
              tick={{ fontSize: 11, fill: axisColor }}
              axisLine={false}
              tickLine={false}
              interval={mode === 'weekly' ? 1 : 4}
              tickMargin={8}
            />
            <YAxis allowDecimals={false} width={34} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} cursor={{ stroke: C.blue, strokeWidth: 1 }} />
            <Area type="monotone" dataKey="count" name="Applications" stroke={C.blueMid} strokeWidth={2} fill={C.blue} fillOpacity={0.28} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function DistributionChart({ apps }) {
  const data = useMemo(
    () => STATUSES.map((s) => ({ name: s, value: apps.filter((a) => a.status === s).length, fill: STATUS_STYLE[s].hex })).filter((d) => d.value > 0),
    [apps],
  )
  const total = apps.length
  return (
    <Card className="p-5">
      <h3 className="font-semibold">Status distribution</h3>
      <p className="text-xs text-muted mt-0.5 mb-2">Where every application stands</p>
      {total === 0 ? (
        <div className="h-[200px] grid place-items-center text-sm text-muted">No data yet</div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="relative w-[150px] h-[150px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} cornerRadius={4} stroke="none">
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center leading-tight">
                <div className="text-2xl font-semibold tabular-nums">{total}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted">total</div>
              </div>
            </div>
          </div>
          <ul className="flex-1 min-w-0 space-y-1.5">
            {data.map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-[4px] shrink-0" style={{ background: d.fill }} />
                <span className="truncate text-muted">{d.name}</span>
                <span className="ml-auto font-medium tabular-nums">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

export function MonthlyChart({ apps, dark, months = 6 }) {
  const data = useMemo(() => monthlyStats(apps, months), [apps, months])
  return (
    <div className="h-[280px] -ml-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3}>
          <CartesianGrid stroke={gridColor(dark)} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis allowDecimals={false} width={34} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: dark ? '#ffffff08' : '#A9C9F51f' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="Applications" fill={C.blue} radius={[5, 5, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Interviews" fill={C.blueMid} radius={[5, 5, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Offers" fill={C.blueDeep} radius={[5, 5, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Rejected" fill={C.red} radius={[5, 5, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
