import { INACTIVE_STATUSES, INTERVIEW_STATUSES, STATUSES, PRIORITIES, JOB_TYPES } from './constants'

/* ---------- dates (all stored as local YYYY-MM-DD) ---------- */
const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (iso, n) => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000)

export function formatDate(iso, withYear) {
  if (!iso) return ''
  const d = parseISO(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withYear || !sameYear ? { year: 'numeric' } : {}),
  })
}
export function longToday() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
export function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
export function relative(iso) {
  if (!iso) return ''
  const n = diffDays(iso, todayISO())
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  return n > 0 ? `in ${n} days` : `${-n} days ago`
}

/* ---------- misc ---------- */
export const uid = () =>
  globalThis.crypto?.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
export const splitSkills = (s) =>
  String(s || '')
    .split(/[,;|]/)
    .map((x) => x.trim())
    .filter(Boolean)
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n))
export function domainOf(url) {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
// Returns a safe, clickable http(s) URL, or null when the value isn't a real web address
// (e.g. "javascript:…", "mailto:…" or free text imported from a CSV).
export function hrefOf(url) {
  const s = String(url || '').trim()
  if (!s) return null
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : 'https://' + s)
    return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : null
  } catch {
    return null
  }
}
export const initials = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

export function blankApp(over = {}) {
  return {
    id: uid(),
    company: '',
    role: '',
    jobType: 'Full-time',
    appliedDate: todayISO(),
    source: 'LinkedIn',
    link: '',
    salary: '',
    skills: '',
    match: 5,
    status: 'Applied',
    priority: 'Medium',
    round: 0,
    interviewDate: '',
    followUpDate: '',
    resumeCustomized: false,
    assessmentDone: false,
    notes: '',
    createdAt: Date.now(),
    ...over,
  }
}

/* ---------- derived state ---------- */
export const isActive = (a) => !INACTIVE_STATUSES.includes(a.status)
export const isOverdue = (a, today = todayISO()) => isActive(a) && !!a.followUpDate && a.followUpDate < today
export const daysSince = (a, today = todayISO()) =>
  a.appliedDate && a.status !== 'Wishlist' ? Math.max(0, diffDays(today, a.appliedDate)) : null
export const reachedInterview = (a) =>
  INTERVIEW_STATUSES.includes(a.status) || a.status === 'Selected' || a.round > 0 || !!a.interviewDate
export const gotResponse = (a) => !['Wishlist', 'Applied', 'No Response'].includes(a.status)

export function computeStats(apps) {
  const c = (s) => apps.filter((a) => a.status === s).length
  const submitted = apps.filter((a) => a.status !== 'Wishlist')
  const total = submitted.length
  const offers = c('Selected')
  const interviews = c('Interview Scheduled') + c('Interview Completed')
  const today = todayISO()
  return {
    total,
    wishlist: c('Wishlist'),
    applied: c('Applied'),
    inProgress: c('Under Review') + c('Assessment'),
    interviews,
    offers,
    rejected: c('Rejected'),
    noResponse: c('No Response'),
    upcomingInterviews: apps.filter((a) => a.interviewDate >= today && INTERVIEW_STATUSES.includes(a.status)).length,
    successRate: total ? offers / total : 0,
    interviewRate: total ? submitted.filter(reachedInterview).length / total : 0,
    responseRate: total ? submitted.filter(gotResponse).length / total : 0,
    overdue: apps.filter((a) => isOverdue(a, today)).length,
  }
}
export const pct = (n, digits = 0) => `${(n * 100).toFixed(digits)}%`

export function followUpGroups(apps) {
  const today = todayISO()
  const week = addDays(today, 7)
  const withDate = apps.filter((a) => isActive(a) && a.followUpDate)
  const by = (f) => withDate.filter(f).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))
  return {
    overdue: by((a) => a.followUpDate < today),
    today: by((a) => a.followUpDate === today),
    week: by((a) => a.followUpDate > today && a.followUpDate <= week),
    later: by((a) => a.followUpDate > week),
    suggestions: apps
      .filter(
        (a) =>
          ['Applied', 'Under Review', 'No Response'].includes(a.status) &&
          !a.followUpDate &&
          (daysSince(a, today) ?? 0) >= 7,
      )
      .sort((a, b) => (a.appliedDate || '').localeCompare(b.appliedDate || '')),
  }
}

/** Applications logged per day (last 30 days) or per week (last 12 weeks). */
export function activitySeries(apps, mode = 'weekly') {
  const today = todayISO()
  const dates = apps.filter((a) => a.status !== 'Wishlist' && a.appliedDate).map((a) => a.appliedDate)
  if (mode === 'daily') {
    const out = []
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i)
      out.push({ label: formatDate(d), count: dates.filter((x) => x === d).length })
    }
    return out
  }
  const out = []
  for (let i = 11; i >= 0; i--) {
    const end = addDays(today, -i * 7)
    const start = addDays(end, -6)
    out.push({
      label: `${formatDate(start)} – ${formatDate(end)}`,
      short: formatDate(start),
      count: dates.filter((x) => x >= start && x <= end).length,
    })
  }
  return out
}

export function monthlyStats(apps, months = 6) {
  const now = new Date()
  const out = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    const inMonth = apps.filter((a) => a.status !== 'Wishlist' && (a.appliedDate || '').startsWith(key))
    out.push({
      key,
      month: d.toLocaleDateString('en-IN', { month: 'short', year: i > 11 ? '2-digit' : undefined }),
      fullMonth: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      Applications: inMonth.length,
      Interviews: inMonth.filter(reachedInterview).length,
      Offers: inMonth.filter((a) => a.status === 'Selected').length,
      Rejected: inMonth.filter((a) => a.status === 'Rejected').length,
    })
  }
  return out
}

/** Merge a patch into an application, applying small automations. */
export function applyPatch(a, patch, followUpDays = 7) {
  const n = { ...a, ...patch }
  if (patch.status && patch.status !== a.status) {
    if (INTERVIEW_STATUSES.includes(patch.status) && !n.round) n.round = 1
    if (a.status === 'Wishlist' && patch.status !== 'Wishlist') {
      if (!n.appliedDate) n.appliedDate = todayISO()
      if (patch.status === 'Applied' && !n.followUpDate && followUpDays > 0) {
        n.followUpDate = addDays(n.appliedDate, followUpDays)
      }
    }
  }
  return n
}

/* ---------- CSV ---------- */
const CSV_FIELDS = [
  ['company', 'Company Name'],
  ['role', 'Job Role'],
  ['jobType', 'Job Type'],
  ['appliedDate', 'Applied Date'],
  ['source', 'Application Source'],
  ['link', 'Job Description Link'],
  ['salary', 'Salary / CTC'],
  ['skills', 'Required Skills'],
  ['match', 'My Skill Match (1-10)'],
  ['status', 'Status'],
  ['priority', 'Priority'],
  ['round', 'Interview Round'],
  ['interviewDate', 'Interview Date'],
  ['followUpDate', 'Follow-up Date'],
  ['resumeCustomized', 'Resume Customized'],
  ['assessmentDone', 'Assessment Completed'],
  ['notes', 'Notes'],
]
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
const ALIASES = {
  company: ['company', 'companyname', 'employer'],
  role: ['role', 'jobrole', 'position', 'title', 'jobtitle'],
  jobType: ['jobtype', 'type'],
  appliedDate: ['applieddate', 'dateapplied', 'applied'],
  source: ['source', 'applicationsource'],
  link: ['link', 'jobdescriptionlink', 'jdlink', 'url'],
  salary: ['salary', 'salaryctc', 'ctc'],
  skills: ['skills', 'requiredskills'],
  match: ['match', 'myskillmatch', 'myskillmatch110', 'skillmatch'],
  status: ['status'],
  priority: ['priority'],
  round: ['round', 'interviewround'],
  interviewDate: ['interviewdate'],
  followUpDate: ['followupdate', 'followup'],
  resumeCustomized: ['resumecustomized', 'resume'],
  assessmentDone: ['assessmentcompleted', 'assessmentdone', 'assessment'],
  notes: ['notes', 'note', 'comments'],
}

const csvCell = (v) => {
  let s = v == null ? '' : String(v)
  if (/^[=+@\t]/.test(s)) s = "'" + s // neutralise spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(apps) {
  const head = CSV_FIELDS.map(([, l]) => csvCell(l)).join(',')
  const lines = apps.map((a) =>
    CSV_FIELDS.map(([k]) => {
      const v = a[k]
      if (typeof v === 'boolean') return v ? 'Yes' : 'No'
      return csvCell(v)
    }).join(','),
  )
  return '﻿' + [head, ...lines].join('\r\n')
}

export function parseCSV(text) {
  text = text.replace(/^﻿/, '')
  const rows = []
  let row = []
  let cur = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else q = false
      } else cur += c
    } else if (c === '"') q = true
    else if (c === ',') {
      row.push(cur)
      cur = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cur)
      cur = ''
      rows.push(row)
      row = []
    } else cur += c
  }
  if (cur !== '' || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

function normDate(s) {
  s = String(s || '').trim()
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}` // dd/mm/yyyy
  const t = Date.parse(s)
  return isNaN(t) ? '' : toISO(new Date(t))
}
const pick = (v, list, fallback) => list.find((x) => norm(x) === norm(v)) || fallback
const truthy = (v) => ['yes', 'y', 'true', '1', 'done', 'x'].includes(String(v).trim().toLowerCase())

export function csvToApps(text) {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  const headers = rows[0].map(norm)
  const idx = {}
  Object.entries(ALIASES).forEach(([key, names]) => {
    const i = headers.findIndex((h) => names.includes(h))
    if (i >= 0) idx[key] = i
  })
  if (idx.company == null && idx.role == null) return []
  return rows.slice(1).map((r) => {
    const g = (k) => (idx[k] == null ? '' : String(r[idx[k]] ?? '').trim())
    const clean = (s) => s.replace(/^'(?=[=+@])/, '')
    const match = parseInt(g('match'), 10)
    const round = parseInt(g('round').replace(/\D/g, ''), 10)
    return blankApp({
      company: clean(g('company')),
      role: clean(g('role')),
      jobType: pick(g('jobType'), JOB_TYPES, g('jobType') || 'Full-time'),
      appliedDate: normDate(g('appliedDate')),
      source: g('source') || 'Other',
      link: g('link'),
      salary: clean(g('salary')),
      skills: g('skills'),
      match: isNaN(match) ? 5 : clamp(match, 1, 10),
      status: pick(g('status'), STATUSES, 'Applied'),
      priority: pick(g('priority'), PRIORITIES, 'Medium'),
      round: isNaN(round) ? 0 : clamp(round, 0, 6),
      interviewDate: normDate(g('interviewDate')),
      followUpDate: normDate(g('followUpDate')),
      resumeCustomized: truthy(g('resumeCustomized')),
      assessmentDone: truthy(g('assessmentDone')),
      notes: clean(g('notes')),
    })
  })
}

export function download(filename, text, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
