import { Bookmark, ExternalLink, Pencil, Send, Trash2 } from 'lucide-react'
import { Avatar, Btn, Card, EmptyState, IconBtn, MatchBar, PageHeader, PriorityBadge } from '../components/ui'
import { domainOf, hrefOf, splitSkills } from '../lib/utils'
import { HeaderActions } from './shared'

export default function Wishlist({ apps, actions, settings }) {
  const items = apps.filter((a) => a.status === 'Wishlist')
  const order = { High: 0, Medium: 1, Low: 2 }
  items.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3) || b.match - a.match)

  return (
    <>
      <PageHeader title="My Wishlist" subtitle="Roles you're keen on but haven't applied to yet.">
        <HeaderActions settings={settings} actions={actions} addLabel="Add to wishlist" preset={{ status: 'Wishlist', appliedDate: '' }} />
      </PageHeader>

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={Bookmark} title="Your wishlist is empty" text="Save interesting roles here, then move them into your pipeline with one click when you apply.">
            <Btn variant="primary" onClick={() => actions.openAdd({ status: 'Wishlist', appliedDate: '' })}>
              Add to wishlist
            </Btn>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((a) => {
            const skills = splitSkills(a.skills)
            return (
              <Card key={a.id} className="p-5 flex flex-col hover:shadow-pop transition-shadow">
                <div className="flex items-start gap-3">
                  <Avatar name={a.company} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{a.company || 'Untitled company'}</h3>
                    <p className="text-sm text-muted truncate">{a.role || 'No role yet'}</p>
                  </div>
                  <PriorityBadge priority={a.priority} />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span>Skill match</span>
                  <MatchBar value={a.match} />
                </div>
                {skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skills.slice(0, 5).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-soft text-xs ring-1 ring-inset ring-line">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {a.notes && <p className="mt-3 text-sm text-ink/80 line-clamp-2">{a.notes}</p>}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                  {a.salary && <span>{a.salary}</span>}
                  {hrefOf(a.link) && (
                    <a href={hrefOf(a.link)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-pbInk hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      {domainOf(a.link)}
                    </a>
                  )}
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2">
                  <Btn
                    variant="primary"
                    size="sm"
                    icon={Send}
                    className="flex-1"
                    onClick={() => {
                      actions.update(a.id, { status: 'Applied' })
                      actions.toast(`Moved ${a.company || 'role'} to Applied — good luck!`)
                    }}
                  >
                    Mark as applied
                  </Btn>
                  <IconBtn aria-label="Edit" title="Edit" onClick={() => actions.openEdit(a.id)}>
                    <Pencil className="w-4 h-4" />
                  </IconBtn>
                  <IconBtn tone="danger" aria-label="Delete" title="Delete" onClick={() => actions.remove([a.id])}>
                    <Trash2 className="w-4 h-4" />
                  </IconBtn>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
