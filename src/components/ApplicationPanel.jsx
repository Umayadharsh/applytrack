import { useEffect, useMemo, useState } from 'react'
import { Briefcase, CalendarDays, ClipboardCheck, Sparkles, StickyNote, Trash2, X } from 'lucide-react'
import { JOB_TYPES, MAX_ROUND, PRIORITIES, ROUNDS, SOURCES, STATUSES } from '../lib/constants'
import { addDays, blankApp, splitSkills } from '../lib/utils'
import { Btn, Field, IconBtn, Switch, cx, inputCls } from './ui'

function Section({ icon: Icon, title, children }) {
  return (
    <section className="py-5 border-b border-line last:border-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <span className="w-6 h-6 rounded-lg bg-pbSoft text-pbInk grid place-items-center">
          <Icon className="w-3.5 h-3.5" />
        </span>
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">{children}</div>
    </section>
  )
}

const Select = ({ value, onChange, options, ...p }) => (
  <select {...p} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, 'pr-8 appearance-auto')}>
    {options.map((o) => (
      <option key={o.value ?? o} value={o.value ?? o}>
        {o.label ?? o}
      </option>
    ))}
  </select>
)

export default function ApplicationPanel({ panel, apps, followUpDays, onSave, onDelete, onClose }) {
  const editing = panel.mode === 'edit' ? apps.find((a) => a.id === panel.id) : null
  const [f, setF] = useState(() => {
    if (editing) return { ...editing }
    const base = blankApp(panel.preset || {})
    if (base.status === 'Wishlist') base.appliedDate = ''
    else if (!base.followUpDate && followUpDays > 0) base.followUpDate = addDays(base.appliedDate, followUpDays)
    return base
  })
  const [errors, setErrors] = useState({})
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const input = (k) => ({ value: f[k] ?? '', onChange: (e) => set(k)(e.target.value) })

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
    }
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  })

  const skillChips = useMemo(() => splitSkills(f.skills), [f.skills])
  const roundOptions = ROUNDS.map((r) => ({ value: r.value, label: r.value === 0 ? 'Not started' : r.label }))
  const isWishlist = f.status === 'Wishlist'

  function save() {
    const errs = {}
    if (!f.company.trim()) errs.company = 'Company name is required'
    if (!f.role.trim()) errs.role = 'Job role is required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSave({ ...f, company: f.company.trim(), role: f.role.trim(), match: Number(f.match) || 5, round: Number(f.round) || 0 }, editing)
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Edit application' : 'Add application'}
        className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-bg border-l border-line shadow-pop flex flex-col animate-slide"
      >
        <header className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 bg-card border-b border-line">
          <div>
            <h2 className="text-lg font-semibold">{editing ? 'Edit application' : f.status === 'Wishlist' ? 'Add to wishlist' : 'Add application'}</h2>
            <p className="text-xs text-muted mt-0.5">
              {editing ? 'Update any detail — changes save to this device.' : 'Capture the essentials now, refine later.'}
            </p>
          </div>
          <IconBtn onClick={onClose} aria-label="Close panel">
            <X className="w-5 h-5" />
          </IconBtn>
        </header>

        <div className="flex-1 overflow-y-auto px-6 bg-card">
          <div>
            <Section icon={Briefcase} title="Company & role">
              <Field label="Company name *" className="col-span-2 sm:col-span-1">
                <input autoFocus {...input('company')} placeholder="e.g. Razorpay" className={cx(inputCls, errors.company && 'border-pr ring-4 ring-pr/20')} />
                {errors.company && <span className="block text-[11px] text-prInk mt-1">{errors.company}</span>}
              </Field>
              <Field label="Job role *" className="col-span-2 sm:col-span-1">
                <input {...input('role')} placeholder="e.g. Frontend Engineer" className={cx(inputCls, errors.role && 'border-pr ring-4 ring-pr/20')} />
                {errors.role && <span className="block text-[11px] text-prInk mt-1">{errors.role}</span>}
              </Field>
              <Field label="Job type">
                <Select value={f.jobType} onChange={set('jobType')} options={f.jobType && !JOB_TYPES.includes(f.jobType) ? [...JOB_TYPES, f.jobType] : JOB_TYPES} />
              </Field>
              <Field label="Application source">
                <Select value={f.source} onChange={set('source')} options={f.source && !SOURCES.includes(f.source) ? [...SOURCES, f.source] : SOURCES} />
              </Field>
              <Field label="Job description link" className="col-span-2">
                <input {...input('link')} type="url" inputMode="url" placeholder="https://…" className={inputCls} />
              </Field>
            </Section>
          </div>

          <Section icon={Sparkles} title="Compensation & fit">
            <Field label="Salary / CTC" className="col-span-2 sm:col-span-1">
              <input {...input('salary')} placeholder="e.g. ₹24–28 LPA" className={inputCls} />
            </Field>
            <Field label={`My skill match — ${f.match}/10`} className="col-span-2 sm:col-span-1">
              <span className="flex items-center h-10">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={f.match}
                  onChange={(e) => set('match')(Number(e.target.value))}
                  className="range-pb"
                  style={{ '--fill': `${((f.match - 1) / 9) * 100}%` }}
                />
              </span>
            </Field>
            <Field label="Required skills" hint="Separate with commas" className="col-span-2">
              <input {...input('skills')} placeholder="React, TypeScript, Node.js" className={inputCls} />
              {skillChips.length > 0 && (
                <span className="flex flex-wrap gap-1.5 mt-2">
                  {skillChips.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-pbSoft text-pbInk text-xs ring-1 ring-inset ring-pb/40">
                      {s}
                    </span>
                  ))}
                </span>
              )}
            </Field>
          </Section>

          <Section icon={CalendarDays} title="Status & timeline">
            <Field label="Status">
              <Select value={f.status} onChange={set('status')} options={STATUSES} />
            </Field>
            <Field label="Priority">
              <Select value={f.priority} onChange={set('priority')} options={PRIORITIES} />
            </Field>
            <Field label={isWishlist ? 'Applied date (optional)' : 'Applied date'}>
              <input type="date" {...input('appliedDate')} className={inputCls} />
            </Field>
            <Field label="Follow-up date">
              <input type="date" {...input('followUpDate')} className={inputCls} />
            </Field>
            <Field label="Interview date">
              <input type="date" {...input('interviewDate')} className={inputCls} />
            </Field>
            <Field label="Interview round">
              <Select value={f.round} onChange={(v) => set('round')(Number(v))} options={roundOptions.slice(0, MAX_ROUND + 1)} />
            </Field>
          </Section>

          <Section icon={ClipboardCheck} title="Preparation">
            <div className="col-span-2 sm:col-span-1 flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 h-12">
              <span className="text-sm">Resume customized</span>
              <Switch checked={!!f.resumeCustomized} onChange={set('resumeCustomized')} label="Resume customized" />
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 h-12">
              <span className="text-sm">Assessment completed</span>
              <Switch checked={!!f.assessmentDone} onChange={set('assessmentDone')} label="Assessment completed" />
            </div>
          </Section>

          <Section icon={StickyNote} title="Personal notes">
            <Field label="Notes" className="col-span-2">
              <textarea
                {...input('notes')}
                rows={4}
                placeholder="Referrals, interview prep, recruiter name, things to remember…"
                className={cx(inputCls, 'h-auto py-2.5 resize-y min-h-[96px]')}
              />
            </Field>
          </Section>
        </div>

        <footer className="flex items-center gap-2 px-6 py-4 bg-card border-t border-line">
          {editing && (
            <Btn variant="danger" icon={Trash2} onClick={() => onDelete(editing)}>
              Delete
            </Btn>
          )}
          <div className="flex-1" />
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            {editing ? 'Save changes' : 'Save application'}
          </Btn>
        </footer>
      </aside>
    </div>
  )
}
