export const KEYS = {
  apps: 'applytrack.v1.apps',
  settings: 'applytrack.v1.settings',
}

export const STATUSES = [
  'Wishlist',
  'Applied',
  'Under Review',
  'Assessment',
  'Interview Scheduled',
  'Interview Completed',
  'Selected',
  'Rejected',
  'No Response',
]
export const INTERVIEW_STATUSES = ['Interview Scheduled', 'Interview Completed']
export const INACTIVE_STATUSES = ['Wishlist', 'Selected', 'Rejected']
export const PRIORITIES = ['High', 'Medium', 'Low']
export const JOB_TYPES = ['Full-time', 'Internship', 'Contract', 'Part-time', 'Freelance']
export const SOURCES = [
  'LinkedIn',
  'Company Website',
  'Referral',
  'Naukri',
  'Indeed',
  'Wellfound',
  'Glassdoor',
  'Campus',
  'Recruiter',
  'Other',
]
export const ROUNDS = [
  { value: 0, label: '—' },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `Round ${n}` })),
]
export const MAX_ROUND = 6

// Tailwind classes live here (inside ./src) so the JIT picks them up.
export const STATUS_STYLE = {
  Wishlist: { badge: 'bg-soft text-muted ring-line', dot: 'bg-muted/50', hex: '#C9D3E1' },
  Applied: { badge: 'bg-pbSoft text-pbInk ring-pb/50', dot: 'bg-pb', hex: '#CFE0F8' },
  'Under Review': { badge: 'bg-pb/20 text-pbInk ring-pb/60', dot: 'bg-pb', hex: '#A9C9F5' },
  Assessment: { badge: 'bg-pb/30 text-pbInk ring-pb/70', dot: 'bg-pbInk/60', hex: '#8DB4EA' },
  'Interview Scheduled': { badge: 'bg-pb/45 text-pbInk ring-pb', dot: 'bg-pbInk', hex: '#6F9ADB' },
  'Interview Completed': { badge: 'bg-pb/35 text-pbInk ring-pb/80', dot: 'bg-pbInk/80', hex: '#5A87C9' },
  Selected: { badge: 'bg-pb text-[#1b2b45] ring-pb', dot: 'bg-[#1b2b45]', hex: '#3F6FB5' },
  Rejected: { badge: 'bg-prSoft text-prInk ring-pr/60', dot: 'bg-pr', hex: '#F4A6A6' },
  'No Response': { badge: 'bg-soft text-muted ring-line', dot: 'bg-transparent ring-1 ring-muted', hex: '#9AA7BB' },
}
export const PRIORITY_STYLE = {
  High: 'bg-prSoft text-prInk ring-pr/60',
  Medium: 'bg-pbSoft text-pbInk ring-pb/50',
  Low: 'bg-soft text-muted ring-line',
}

/**
 * Spreadsheet columns.
 * type: text | select | date | derived | link | skills | match | status | priority | round | followup | bool | notes
 */
export const COLUMNS = [
  { key: 'company', label: 'Company Name', type: 'text', width: 220 },
  { key: 'role', label: 'Job Role', type: 'text', width: 210 },
  { key: 'jobType', label: 'Job Type', type: 'select', options: JOB_TYPES, width: 130 },
  { key: 'appliedDate', label: 'Applied Date', type: 'date', width: 140 },
  { key: 'daysSince', label: 'Days Since', type: 'derived', width: 110 },
  { key: 'source', label: 'Application Source', type: 'select', options: SOURCES, width: 170 },
  { key: 'link', label: 'Job Description Link', type: 'link', width: 180 },
  { key: 'salary', label: 'Salary / CTC', type: 'text', width: 140 },
  { key: 'skills', label: 'Required Skills', type: 'skills', width: 250 },
  { key: 'match', label: 'My Skill Match', type: 'match', width: 150 },
  { key: 'status', label: 'Status', type: 'status', width: 190 },
  { key: 'priority', label: 'Priority', type: 'priority', width: 120 },
  { key: 'round', label: 'Interview Round', type: 'round', width: 150 },
  { key: 'interviewDate', label: 'Interview Date', type: 'date', width: 160 },
  { key: 'followUpDate', label: 'Follow-up Date', type: 'followup', width: 170 },
  { key: 'resumeCustomized', label: 'Resume Customized', type: 'bool', width: 150 },
  { key: 'assessmentDone', label: 'Assessment Completed', type: 'bool', width: 170 },
  { key: 'notes', label: 'Notes', type: 'notes', width: 300 },
]
export const COL_BY_KEY = Object.fromEntries(COLUMNS.map((c) => [c.key, c]))
export const EDIT_ORDER = COLUMNS.filter((c) =>
  ['text', 'link', 'date', 'followup', 'skills', 'match', 'notes'].includes(c.type),
).map((c) => c.key)

export const NAV = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'applications', label: 'All Applications', icon: 'Table2' },
  { id: 'wishlist', label: 'My Wishlist', icon: 'Bookmark' },
  { id: 'interviews', label: 'Interviews', icon: 'CalendarClock' },
  { id: 'followups', label: 'Follow-ups', icon: 'Bell' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
]

export const DEFAULT_SETTINGS = {
  name: 'Job Seeker',
  theme: 'light',
  followUpDays: 7,
  sample: false,
}
