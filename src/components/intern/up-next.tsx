'use client'

import Link from 'next/link'

export type OpenTask = {
  id: string
  title: string
  due_date: string | null
  campus_id: string
  campus_name: string
}

// due_date is a plain YYYY-MM-DD; compare against the viewer's local today so
// "overdue" doesn't flip early for someone behind the server's timezone.
function localToday() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDue(due: string) {
  const [y, m, d] = due.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function UpNext({ tasks }: { tasks: OpenTask[] }) {
  const today = localToday()

  if (tasks.length === 0) {
    return <p className="text-sm text-neutral-600">You&apos;re all caught up — no open tasks.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-divider">
      {tasks.map((t) => {
        const overdue = !!t.due_date && t.due_date < today
        const dueToday = t.due_date === today
        return (
          <li key={t.id}>
            <Link
              href={`/intern/campuses/${t.campus_id}/tasks`}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-accent-800"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.title}</div>
                <div className="truncate text-xs text-neutral-600">{t.campus_name}</div>
              </div>
              {t.due_date && (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    overdue
                      ? 'bg-accent-800 text-white'
                      : dueToday
                        ? 'bg-accent-200 text-accent-900'
                        : 'bg-neutral-200 text-neutral-800'
                  }`}
                >
                  {overdue ? 'Overdue · ' : dueToday ? 'Today · ' : ''}
                  {formatDue(t.due_date)}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
