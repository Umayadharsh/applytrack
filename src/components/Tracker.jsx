import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  Maximize2,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  COLUMNS,
  COL_BY_KEY,
  EDIT_ORDER,
  INACTIVE_STATUSES,
  PRIORITIES,
  ROUNDS,
  STATUSES,
  STATUS_STYLE,
} from '../lib/constants'
import { addDays, clamp, daysSince, diffDays, domainOf, formatDate, hrefOf, isOverdue, relative, splitSkills, todayISO } from '../lib/utils'
import { Avatar, Btn, EmptyState, IconBtn, MatchBar, Popover, PickerCell, PriorityBadge, StatusBadge, cx, inputCls } from './ui'

/* ------------------------------------------------------------------ filtering & sorting */
export const isActiveFilter = (f) => (f && typeof f === 'object' ? !!(f.from || f.to) : f != null && f !== '')

function matchesCol(a, col, f) {
  switch (col.type) {
    case 'text':
    case 'link':
    case 'skills':
    case 'notes':
      return String(a[col.key] || '').toLowerCase().includes(String(f).toLowerCase())
    case 'select':
    case 'status':
    case 'priority':
    case 'round':
      return String(a[col.key]) === String(f)
    case 'bool':
      return (f === 'yes') === !!a[col.key]
    case 'match':
      return (a.match || 0) >= Number(f)
    case 'date':
    case 'followup': {
      const v = a[col.key]
      if (!v) return false
      if (f.from && v < f.from) return false
      if (f.to && v > f.to) return false
      return true
    }
    default:
      return true
  }
}

function sortValue(a, col) {
  switch (col.type) {
    case 'status':
      return STATUSES.indexOf(a.status)
    case 'priority':
      return PRIORITIES.indexOf(a.priority)
    case 'derived': {
      const d = daysSince(a)
      return d == null ? '' : d
    }
    case 'match':
    case 'round':
      return Number(a[col.key]) || 0
    case 'bool':
      return a[col.key] ? 1 : 0
    case 'date':
    case 'followup':
      return a[col.key] || ''
    default:
      return String(a[col.key] || '').toLowerCase()
  }
}

function compareBy(sort) {
  const col = COL_BY_KEY[sort.key]
  const mult = sort.dir === 'asc' ? 1 : -1
  return (a, b) => {
    const va = sortValue(a, col)
    const vb = sortValue(b, col)
    if (va === vb) return 0
    if (va === '') return 1 // empties always last
    if (vb === '') return -1
    return (va < vb ? -1 : 1) * mult
  }
}

/* ------------------------------------------------------------------ inline editors */
function InlineInput({ type = 'text', value, onCommit, onCancel, multiline, min, max, placeholder }) {
  const [draft, setDraft] = useState(value ?? '')
  const done = useRef(false)
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.focus()
    if (type === 'text' || multiline) ref.current?.select?.()
  }, [type, multiline])

  const commit = (move) => {
    if (done.current) return
    done.current = true
    onCommit(draft, move)
  }
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !(multiline && e.shiftKey)) {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      done.current = true
      onCancel()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      commit(e.shiftKey ? -1 : 1)
    }
  }
  const common = {
    ref,
    value: draft,
    onChange: (e) => setDraft(e.target.value),
    onBlur: () => commit(),
    onKeyDown,
    placeholder,
    className: cx(
      'w-full rounded-lg bg-card text-sm text-ink outline-none ring-2 ring-pb px-2 shadow-card',
      multiline ? 'py-2 resize-none h-24' : 'h-8',
    ),
  }
  return multiline ? <textarea {...common} /> : <input type={type} min={min} max={max} {...common} />
}

function Dash() {
  return <span className="text-muted/50">—</span>
}

const cellBtn =
  'w-full text-left truncate rounded-md px-1.5 -mx-1.5 h-8 flex items-center hover:bg-pb/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb transition-colors'

function SelectCell({ value, options, onChange, display }) {
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }))
  if (value !== '' && value != null && !opts.some((o) => String(o.value) === String(value))) opts.push({ value, label: String(value) })
  return (
    <label className="relative inline-flex items-center gap-1 max-w-full h-8 rounded-md px-1.5 -mx-1.5 hover:bg-pb/15 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-pb">
      <span className="truncate">{display ?? <Dash />}</span>
      <ChevronDown className="w-3 h-3 text-muted shrink-0" />
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
        aria-label="Change value"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function BoolCell({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={!!value}
      className={cx(
        'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium ring-1 ring-inset transition',
        value ? 'bg-pbSoft text-pbInk ring-pb/50 hover:bg-pb/25' : 'bg-soft text-muted ring-line hover:bg-line/60',
      )}
    >
      {value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {value ? 'Yes' : 'No'}
    </button>
  )
}

function Cell({ app, col, ctx }) {
  const { editing, begin, finish, cancel, update } = ctx
  const isEd = !!editing && editing.id === app.id && editing.key === col.key
  const v = app[col.key]
  const edit = (props) => (
    <InlineInput value={v} onCommit={(val, mv) => finish(app.id, col, val, mv)} onCancel={cancel} {...props} />
  )
  const start = () => begin(app.id, col.key)

  switch (col.type) {
    case 'text': {
      if (isEd) return edit()
      if (col.key === 'company')
        return (
          <button className={cx(cellBtn, 'gap-2.5')} onClick={start} title={v}>
            <Avatar name={v} size="sm" />
            <span className={cx('truncate font-medium', !v && 'text-muted/60 font-normal italic')}>{v || 'Untitled company'}</span>
          </button>
        )
      return (
        <button className={cellBtn} onClick={start} title={v}>
          <span className="truncate">{v || <Dash />}</span>
        </button>
      )
    }
    case 'select':
      return <SelectCell value={v} options={col.options} onChange={(x) => update(app.id, { [col.key]: x })} display={v} />
    case 'round':
      return (
        <SelectCell
          value={v || 0}
          options={ROUNDS}
          onChange={(x) => update(app.id, { round: Number(x) })}
          display={v ? <span className="inline-flex items-center gap-1.5">Round {v}</span> : <Dash />}
        />
      )
    case 'date': {
      if (isEd) return edit({ type: 'date' })
      const upcoming = col.key === 'interviewDate' && v && v >= ctx.today
      return (
        <button className={cx(cellBtn, 'gap-2')} onClick={start}>
          {v ? (
            <>
              <span className="truncate">{formatDate(v)}</span>
              {upcoming && <span className="text-[11px] text-pbInk bg-pbSoft rounded px-1.5 py-0.5">{relative(v)}</span>}
            </>
          ) : (
            <Dash />
          )}
        </button>
      )
    }
    case 'followup': {
      if (isEd) return edit({ type: 'date' })
      const over = isOverdue(app, ctx.today)
      const soon = v && isActiveStatus(app) && !over && diffDays(v, ctx.today) <= 3
      return (
        <button className={cx(cellBtn, 'gap-2')} onClick={start}>
          {v ? (
            over ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-prSoft text-prInk ring-1 ring-inset ring-pr/60 px-2 h-6 text-xs font-medium">
                <Bell className="w-3 h-3" />
                {formatDate(v)} · overdue
              </span>
            ) : soon ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-pbSoft text-pbInk ring-1 ring-inset ring-pb/50 px-2 h-6 text-xs font-medium">
                <Bell className="w-3 h-3" />
                {formatDate(v)} · {relative(v).toLowerCase()}
              </span>
            ) : (
              <span className="truncate">{formatDate(v)}</span>
            )
          ) : (
            <Dash />
          )}
        </button>
      )
    }
    case 'derived': {
      const d = daysSince(app, ctx.today)
      const stale = d != null && d >= 14 && ['Applied', 'Under Review'].includes(app.status)
      return d == null ? (
        <Dash />
      ) : (
        <span className={cx('tabular-nums', stale && 'text-prInk font-medium')} title={stale ? 'No movement for 2+ weeks' : undefined}>
          {d}d
        </span>
      )
    }
    case 'link': {
      if (isEd) return edit({ type: 'url', placeholder: 'https://…' })
      return v ? (
        <span className="group/link flex items-center gap-1 h-8">
          {hrefOf(v) ? (
            <a
              href={hrefOf(v)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-w-0 text-pbInk hover:underline"
              title={v}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{domainOf(v)}</span>
            </a>
          ) : (
            <span className="truncate text-muted" title={v}>{v}</span>
          )}
          <button onClick={start} aria-label="Edit link" className="opacity-0 group-hover/link:opacity-100 p-1 rounded hover:bg-pb/20 text-muted">
            <Pencil className="w-3 h-3" />
          </button>
        </span>
      ) : (
        <button className={cx(cellBtn, 'text-muted/60')} onClick={start}>
          Add link
        </button>
      )
    }
    case 'skills': {
      if (isEd) return edit({ placeholder: 'React, Node.js, SQL' })
      const list = splitSkills(v)
      return (
        <button className={cx(cellBtn, 'gap-1')} onClick={start} title={list.join(', ')}>
          {list.length ? (
            <>
              {list.slice(0, 3).map((s) => (
                <span key={s} className="px-1.5 py-0.5 rounded-md bg-soft text-ink/80 text-xs ring-1 ring-inset ring-line shrink-0 max-w-[90px] truncate">
                  {s}
                </span>
              ))}
              {list.length > 3 && <span className="text-xs text-muted shrink-0">+{list.length - 3}</span>}
            </>
          ) : (
            <Dash />
          )}
        </button>
      )
    }
    case 'match':
      if (isEd) return edit({ type: 'number', min: 1, max: 10 })
      return (
        <button className={cellBtn} onClick={start}>
          <MatchBar value={v} />
        </button>
      )
    case 'status':
      return (
        <PickerCell
          value={v}
          options={STATUSES}
          onChange={(x) => update(app.id, { status: x })}
          render={(s) => <StatusBadge status={s} />}
        />
      )
    case 'priority':
      return (
        <PickerCell
          value={v}
          options={PRIORITIES}
          width={170}
          onChange={(x) => update(app.id, { priority: x })}
          render={(p) => <PriorityBadge priority={p} />}
        />
      )
    case 'bool':
      return <BoolCell value={v} onChange={(x) => update(app.id, { [col.key]: x })} />
    case 'notes': {
      if (isEd)
        return (
          <div className="absolute left-2 top-1.5 z-40 w-[340px]">{edit({ multiline: true, placeholder: 'Write a note…' })}</div>
        )
      return (
        <button className={cellBtn} onClick={start} title={v}>
          <span className="truncate text-ink/80">{v || <Dash />}</span>
        </button>
      )
    }
    default:
      return null
  }
}

const isActiveStatus = (a) => !INACTIVE_STATUSES.includes(a.status)

/* ------------------------------------------------------------------ column header menu */
function ColumnMenu({ col, tf, patchTf, anchor, onClose }) {
  const filter = tf.cols[col.key]
  const setFilter = (v) => patchTf({ cols: { ...tf.cols, [col.key]: v }, page: 1 })
  const sortDir = tf.sort?.key === col.key ? tf.sort.dir : null
  const today = todayISO()

  const selectOptions =
    col.type === 'status' ? STATUSES : col.type === 'priority' ? PRIORITIES : col.type === 'round' ? ROUNDS.slice(1).map((r) => ({ value: r.value, label: r.label })) : col.options

  let control = null
  if (['text', 'link', 'skills', 'notes'].includes(col.type)) {
    control = <input autoFocus className={inputCls} placeholder={`Contains…`} value={filter || ''} onChange={(e) => setFilter(e.target.value)} />
  } else if (['select', 'status', 'priority', 'round'].includes(col.type)) {
    control = (
      <select className={inputCls} value={filter ?? ''} onChange={(e) => setFilter(e.target.value)}>
        <option value="">Any</option>
        {selectOptions.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    )
  } else if (col.type === 'bool') {
    control = (
      <div className="grid grid-cols-3 gap-1">
        {[
          ['', 'Any'],
          ['yes', 'Yes'],
          ['no', 'No'],
        ].map(([v, l]) => (
          <button
            key={l}
            onClick={() => setFilter(v)}
            className={cx('h-8 rounded-lg text-xs font-medium border', (filter ?? '') === v ? 'bg-pbSoft border-pb text-pbInk' : 'border-line text-muted hover:bg-soft')}
          >
            {l}
          </button>
        ))}
      </div>
    )
  } else if (col.type === 'match') {
    control = (
      <label className="block text-xs text-muted">
        Minimum match: <b className="text-ink">{filter || 'any'}</b>
        <input
          type="range"
          min="0"
          max="10"
          value={filter || 0}
          onChange={(e) => setFilter(Number(e.target.value) || '')}
          className="range-pb mt-2"
          style={{ '--fill': `${((filter || 0) / 10) * 100}%` }}
        />
      </label>
    )
  } else if (col.type === 'date' || col.type === 'followup') {
    const f = filter || {}
    control = (
      <div className="space-y-2">
        <label className="block text-xs text-muted">
          From
          <input type="date" className={cx(inputCls, 'mt-1')} value={f.from || ''} onChange={(e) => setFilter({ ...f, from: e.target.value })} />
        </label>
        <label className="block text-xs text-muted">
          To
          <input type="date" className={cx(inputCls, 'mt-1')} value={f.to || ''} onChange={(e) => setFilter({ ...f, to: e.target.value })} />
        </label>
        {col.type === 'followup' && (
          <Btn size="sm" variant="danger" className="w-full" icon={Bell} onClick={() => setFilter({ to: addDays(today, -1) })}>
            Overdue only
          </Btn>
        )}
      </div>
    )
  }

  const sortBtn = (dir, label) => (
    <button
      onClick={() => patchTf({ sort: sortDir === dir ? null : { key: col.key, dir } })}
      className={cx('w-full flex items-center gap-2 px-2 h-8 rounded-lg text-sm hover:bg-soft', sortDir === dir && 'text-pbInk bg-pbSoft')}
    >
      {dir === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
      {label}
      {sortDir === dir && <Check className="w-4 h-4 ml-auto" />}
    </button>
  )

  return (
    <Popover anchor={anchor} onClose={onClose} width={240}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted px-2 pt-1 pb-1.5">{col.label}</div>
      {sortBtn('asc', col.type === 'date' || col.type === 'followup' ? 'Oldest first' : 'Sort ascending')}
      {sortBtn('desc', col.type === 'date' || col.type === 'followup' ? 'Newest first' : 'Sort descending')}
      {control && (
        <>
          <div className="h-px bg-line my-1.5" />
          <div className="px-2 pb-2 pt-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">Filter</div>
            {control}
            {isActiveFilter(filter) && (
              <button className="mt-2 text-xs text-prInk hover:underline" onClick={() => setFilter('')}>
                Clear filter
              </button>
            )}
          </div>
        </>
      )}
    </Popover>
  )
}

/* ------------------------------------------------------------------ main component */
const PAGE_SIZES = [10, 15, 25, 50, 100]

export default function Tracker({ apps, tf, patchTf, actions, compact }) {
  const today = todayISO()
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(() => new Set())
  const [menu, setMenu] = useState(null)
  const fileRef = useRef(null)

  const counts = useMemo(() => {
    const c = {}
    apps.forEach((a) => (c[a.status] = (c[a.status] || 0) + 1))
    return c
  }, [apps])

  const activeCols = Object.entries(tf.cols).filter(([, v]) => isActiveFilter(v))
  const hasFilters = !!tf.q || tf.statuses.length > 0 || activeCols.length > 0

  const rows = useMemo(() => {
    const q = tf.q.trim().toLowerCase()
    const r = apps.filter((a) => {
      if (q && !`${a.company} ${a.role}`.toLowerCase().includes(q)) return false
      if (tf.statuses.length && !tf.statuses.includes(a.status)) return false
      for (const [k, v] of Object.entries(tf.cols)) {
        const col = COL_BY_KEY[k]
        if (col && isActiveFilter(v) && !matchesCol(a, col, v)) return false
      }
      return true
    })
    return tf.sort ? [...r].sort(compareBy(tf.sort)) : r
  }, [apps, tf.q, tf.statuses, tf.cols, tf.sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / tf.pageSize))
  const page = Math.min(tf.page, pageCount)
  const pageRows = rows.slice((page - 1) * tf.pageSize, page * tf.pageSize)
  const allOnPage = pageRows.length > 0 && pageRows.every((a) => selected.has(a.id))

  // Drop selections for rows that no longer exist
  useEffect(() => {
    setSelected((s) => {
      const ids = new Set(apps.map((a) => a.id))
      const next = new Set([...s].filter((id) => ids.has(id)))
      return next.size === s.size ? s : next
    })
  }, [apps])

  const ctx = {
    today,
    editing,
    begin: (id, key) => setEditing({ id, key }),
    cancel: () => setEditing(null),
    update: actions.update,
    finish(id, col, raw, move) {
      let val = raw
      let skip = false
      if (col.type === 'match') {
        const n = parseInt(raw, 10)
        if (isNaN(n)) skip = true
        else val = clamp(n, 1, 10)
      } else if (typeof raw === 'string' && col.type !== 'notes') val = raw.trim()
      const current = apps.find((a) => a.id === id)
      if (!skip && current && current[col.key] !== val) actions.update(id, { [col.key]: val })
      if (move) {
        const i = EDIT_ORDER.indexOf(col.key) + move
        setEditing(i >= 0 && i < EDIT_ORDER.length ? { id, key: EDIT_ORDER[i] } : null)
      } else setEditing(null)
    },
  }

  const cycleSort = (key) => {
    const s = tf.sort
    patchTf({ sort: !s || s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null })
  }
  const toggleStatus = (st) =>
    patchTf({ statuses: tf.statuses.includes(st) ? tf.statuses.filter((x) => x !== st) : [...tf.statuses, st], page: 1 })
  const clearAll = () => patchTf({ q: '', statuses: [], cols: {}, sort: null, page: 1 })
  const addRow = () => {
    const a = actions.add({ company: '', role: '' })
    patchTf({ q: '', statuses: [], cols: {}, sort: null, page: 1 })
    setEditing({ id: a.id, key: 'company' })
  }
  const toggleRow = (id) =>
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const stickyTd = 'sticky z-10'

  return (
    <section className="bg-card border border-line rounded-2xl shadow-card overflow-hidden" aria-label="Application tracker">
      {/* toolbar */}
      <div className="p-4 pb-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto min-w-[120px]">
            <h2 className="text-base font-semibold leading-tight">Application tracker</h2>
            <p className="text-xs text-muted">
              {rows.length} of {apps.length} application{apps.length === 1 ? '' : 's'}
              {hasFilters && ' · filtered'}
            </p>
          </div>
          <div className="relative w-full sm:w-64 order-last sm:order-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={tf.q}
              onChange={(e) => patchTf({ q: e.target.value, page: 1 })}
              placeholder="Search company or role…"
              aria-label="Search applications"
              className={cx(inputCls, 'pl-9 pr-8 h-9')}
            />
            {tf.q && (
              <button aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted hover:text-ink" onClick={() => patchTf({ q: '', page: 1 })}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) actions.importCSV(f)
              e.target.value = ''
            }}
          />
          <Btn size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
            Import
          </Btn>
          <Btn size="sm" icon={Download} onClick={() => actions.exportCSV(hasFilters ? rows : apps, hasFilters)}>
            Export
          </Btn>
          <Btn size="sm" variant="primary" icon={Plus} onClick={addRow}>
            Add row
          </Btn>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1">
          <button
            onClick={() => patchTf({ statuses: [], page: 1 })}
            className={cx(
              'shrink-0 h-7 px-3 rounded-full text-xs font-medium ring-1 ring-inset transition',
              tf.statuses.length === 0 ? 'bg-navy text-white ring-navy dark:bg-pb dark:text-[#1b2b45] dark:ring-pb' : 'bg-card text-muted ring-line hover:bg-soft',
            )}
          >
            All <span className="opacity-70 tabular-nums">{apps.length}</span>
          </button>
          {STATUSES.map((st) => {
            const on = tf.statuses.includes(st)
            return (
              <button
                key={st}
                onClick={() => toggleStatus(st)}
                aria-pressed={on}
                className={cx(
                  'shrink-0 h-7 pl-2.5 pr-3 rounded-full text-xs font-medium ring-1 ring-inset transition inline-flex items-center gap-1.5',
                  on ? STATUS_STYLE[st].badge + ' shadow-card' : 'bg-card text-muted ring-line hover:bg-soft',
                )}
              >
                <span className={cx('w-1.5 h-1.5 rounded-full', STATUS_STYLE[st].dot)} />
                {st}
                <span className="opacity-60 tabular-nums">{counts[st] || 0}</span>
              </button>
            )
          })}
          {hasFilters && (
            <button onClick={clearAll} className="shrink-0 ml-1 h-7 px-2.5 rounded-full text-xs font-medium text-prInk hover:bg-prSoft inline-flex items-center gap-1">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-pbSoft border border-pb/40 px-3 py-2 animate-fade">
            <span className="text-sm font-medium text-pbInk">{selected.size} selected</span>
            <select
              aria-label="Set status for selected"
              className="h-8 rounded-lg border border-line bg-card text-xs px-2"
              value=""
              onChange={(e) => {
                if (!e.target.value) return
                actions.bulkUpdate([...selected], { status: e.target.value })
                setSelected(new Set())
              }}
            >
              <option value="">Set status…</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Btn
              size="sm"
              variant="danger"
              icon={Trash2}
              onClick={() => {
                actions.remove([...selected])
                setSelected(new Set())
              }}
            >
              Delete
            </Btn>
            <button className="ml-auto text-xs text-muted hover:text-ink" onClick={() => setSelected(new Set())}>
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* grid */}
      <div className={cx('overflow-auto border-t border-line', compact ? 'max-h-[560px]' : 'max-h-[calc(100vh-330px)] min-h-[360px]')} data-testid="grid-scroll">
        <table className="border-separate border-spacing-0 w-max min-w-full text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-soft border-b border-line w-11 min-w-[44px] max-w-[44px]">
                <div className="grid place-items-center h-10">
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    checked={allOnPage}
                    onChange={() =>
                      setSelected((s) => {
                        const n = new Set(s)
                        pageRows.forEach((a) => (allOnPage ? n.delete(a.id) : n.add(a.id)))
                        return n
                      })
                    }
                  />
                </div>
              </th>
              {COLUMNS.map((col) => {
                const dir = tf.sort?.key === col.key ? tf.sort.dir : null
                const filtered = isActiveFilter(tf.cols[col.key])
                const isCompany = col.key === 'company'
                return (
                  <th
                    key={col.key}
                    style={{ minWidth: col.width, width: col.width }}
                    aria-sort={dir ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={cx(
                      'sticky top-0 bg-soft border-b border-line text-left text-xs font-medium text-muted select-none',
                      isCompany ? 'left-11 z-30 border-r' : 'z-20',
                    )}
                  >
                    <div className="flex items-center h-10 pl-3 pr-1.5 gap-1">
                      <button onClick={() => cycleSort(col.key)} className="flex items-center gap-1 min-w-0 hover:text-ink">
                        <span className="truncate">{col.label}</span>
                        {dir === 'asc' && <ArrowUp className="w-3 h-3 text-pbInk shrink-0" />}
                        {dir === 'desc' && <ArrowDown className="w-3 h-3 text-pbInk shrink-0" />}
                      </button>
                      <button
                        aria-label={`Sort or filter ${col.label}`}
                        onClick={(e) => {
                          const el = e.currentTarget
                          setMenu((m) => (m?.key === col.key ? null : { key: col.key, anchor: el }))
                        }}
                        className={cx('ml-auto relative w-6 h-6 grid place-items-center rounded-md hover:bg-line/70 shrink-0', filtered ? 'text-pbInk' : 'text-muted/70')}
                      >
                        <Filter className="w-3.5 h-3.5" />
                        {filtered && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-pr" />}
                      </button>
                    </div>
                  </th>
                )
              })}
              <th className="sticky top-0 right-0 z-30 bg-soft border-b border-l border-line w-[84px] min-w-[84px]" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((a) => {
              const sel = selected.has(a.id)
              const tdBase = cx('h-12 px-3 border-b border-line transition-colors group-hover:bg-pbSoft', sel ? 'bg-pbSoft' : 'bg-card')
              return (
                <tr key={a.id} className="group">
                  <td className={cx(tdBase, stickyTd, 'left-0 w-11 min-w-[44px] max-w-[44px] px-0')}>
                    <div className="grid place-items-center">
                      <input type="checkbox" aria-label={`Select ${a.company || 'row'}`} checked={sel} onChange={() => toggleRow(a.id)} />
                    </div>
                  </td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      style={{ minWidth: col.width, width: col.width, maxWidth: col.width }}
                      className={cx(tdBase, 'relative whitespace-nowrap', col.key === 'company' && cx(stickyTd, 'left-11 border-r'))}
                    >
                      <Cell app={a} col={col} ctx={ctx} />
                    </td>
                  ))}
                  <td className={cx(tdBase, stickyTd, 'right-0 border-l w-[84px] min-w-[84px] px-2')}>
                    <div className="flex items-center justify-end gap-0.5">
                      <IconBtn aria-label={`Open ${a.company || 'row'} details`} title="Open details" onClick={() => actions.openEdit(a.id)}>
                        <Maximize2 className="w-4 h-4" />
                      </IconBtn>
                      <IconBtn tone="danger" aria-label={`Delete ${a.company || 'row'}`} title="Delete" onClick={() => actions.remove([a.id])}>
                        <Trash2 className="w-4 h-4" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
            {pageRows.length > 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="p-0 bg-card">
                  <button
                    onClick={addRow}
                    className="sticky left-0 flex items-center gap-2 px-4 h-11 text-sm text-muted hover:text-pbInk hover:bg-pbSoft w-full max-w-[calc(100vw-2rem)] sm:max-w-none transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New row
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {pageRows.length === 0 && (
          <div className="sticky left-0 w-full">
            {apps.length === 0 ? (
              <EmptyState icon={Plus} title="No applications yet" text="Add your first application, or import a CSV to bring in an existing spreadsheet.">
                <Btn variant="primary" icon={Plus} onClick={() => actions.openAdd()}>
                  Add application
                </Btn>
                <Btn icon={Upload} onClick={() => fileRef.current?.click()}>
                  Import CSV
                </Btn>
              </EmptyState>
            ) : (
              <EmptyState icon={SearchX} title="No matching applications" text="Try a different search or clear the active filters.">
                <Btn onClick={clearAll}>Clear filters</Btn>
              </EmptyState>
            )}
          </div>
        )}
      </div>

      {/* footer / pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-line text-xs text-muted">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={tf.pageSize}
            onChange={(e) => patchTf({ pageSize: Number(e.target.value), page: 1 })}
            className="h-8 rounded-lg border border-line bg-card px-2 text-ink"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            {rows.length ? (page - 1) * tf.pageSize + 1 : 0}–{Math.min(page * tf.pageSize, rows.length)} of {rows.length}
          </span>
          <IconBtn aria-label="Previous page" disabled={page <= 1} onClick={() => patchTf({ page: page - 1 })} className="border border-line disabled:opacity-40 disabled:pointer-events-none">
            <ChevronLeft className="w-4 h-4" />
          </IconBtn>
          <span className="tabular-nums text-ink font-medium">
            {page} / {pageCount}
          </span>
          <IconBtn aria-label="Next page" disabled={page >= pageCount} onClick={() => patchTf({ page: page + 1 })} className="border border-line disabled:opacity-40 disabled:pointer-events-none">
            <ChevronRight className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>

      {menu && <ColumnMenu col={COL_BY_KEY[menu.key]} tf={tf} patchTf={patchTf} anchor={menu.anchor} onClose={() => setMenu(null)} />}
    </section>
  )
}
