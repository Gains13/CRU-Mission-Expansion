import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import UpNext, { type OpenTask } from '@/components/intern/up-next'

const STAGES = [
  ['followed', 'Followed'],
  ['survey_completed', 'Survey done'],
  ['survey_interested_launch', 'Interested'],
  ['invited_to_call', 'Invited to call'],
  ['attended_call', 'Attended call'],
  ['joined_launch_team', 'Joined launch'],
  ['registered_orientation', 'Registered'],
] as const

type StageKey = (typeof STAGES)[number][0]
type Prospect = { campus_id: string } & Record<StageKey, boolean>

const card = 'rounded-xl border border-divider bg-white p-6'
const eyebrow = 'font-ui text-[11px] font-semibold uppercase tracking-widest text-neutral-600'

export default async function InternHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: campusRows }, { data: prospectRows }, { data: taskRows }] = await Promise.all([
    supabase
      .from('campuses')
      .select('id, name, city, state, instagram_handle, followers_count, surveys_sent, conversations_count')
      .order('name'),
    supabase.from('prospects').select(`campus_id, ${STAGES.map(([k]) => k).join(', ')}`),
    supabase
      .from('goals_tasks')
      .select('id, title, due_date, campus_id')
      .eq('intern_id', user?.id ?? '')
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false }),
  ])

  const campuses = campusRows ?? []
  const prospects = (prospectRows ?? []) as unknown as Prospect[]
  const campusName = new Map(campuses.map((c) => [c.id, c.name]))

  const openTasks: OpenTask[] = (taskRows ?? []).map((t) => ({
    ...t,
    campus_name: campusName.get(t.campus_id) ?? 'Campus',
  }))

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    'there'

  const totals = {
    followers: campuses.reduce((n, c) => n + c.followers_count, 0),
    surveys: campuses.reduce((n, c) => n + c.surveys_sent, 0),
    conversations: campuses.reduce((n, c) => n + c.conversations_count, 0),
  }

  const stageCounts = STAGES.map(([key, label]) => ({
    label,
    count: prospects.filter((p) => p[key]).length,
  }))
  const maxCount = Math.max(prospects.length, 1)

  const stats = [
    { label: 'Students', value: prospects.length },
    { label: 'Followers', value: totals.followers },
    { label: 'Surveys sent', value: totals.surveys },
    { label: 'Conversations', value: totals.conversations },
  ]

  return (
    <div className="flex flex-col gap-6 font-ui">
      {/* Welcome */}
      <section className="flex flex-col gap-6 rounded-xl border border-divider bg-accent-100 p-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-accent-700">Intern home</div>
          <h1 className="mt-2 font-heading text-4xl font-medium leading-tight sm:text-5xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-sm text-neutral-800">
            {campuses.length === 0
              ? 'No campuses are assigned to you yet.'
              : `${campuses.length} ${campuses.length === 1 ? 'campus' : 'campuses'} · ${prospects.length} ${
                  prospects.length === 1 ? 'student' : 'students'
                } in your pipeline · ${openTasks.length} open ${openTasks.length === 1 ? 'task' : 'tasks'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/intern/students"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            + Add a student
          </Link>
          <Link
            href="/intern/campuses"
            className="rounded-lg border border-accent bg-white px-5 py-2.5 text-sm font-semibold text-accent-700 transition-colors hover:bg-accent-100"
          >
            Campus workspace
          </Link>
        </div>
      </section>

      {campuses.length === 0 ? (
        <section className={card}>
          <p className="text-sm text-neutral-700">
            Once your manager assigns you to a campus, its numbers, students and tasks will show up here.
          </p>
        </section>
      ) : (
        <>
          {/* Stat tiles */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className={card}>
                <div className={eyebrow}>{s.label}</div>
                <div className="mt-2 text-4xl font-semibold tabular-nums">{s.value.toLocaleString()}</div>
              </div>
            ))}
          </section>

          {/* Pipeline + tasks */}
          <section className="grid gap-4 lg:grid-cols-5">
            <div className={`${card} lg:col-span-3`}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-heading text-2xl font-medium">Student pipeline</h2>
                <Link href="/intern/students" className="text-sm font-medium text-accent-700 hover:underline">
                  Manage →
                </Link>
              </div>
              <div className="mt-5 flex flex-col gap-3.5">
                {stageCounts.map((s) => (
                  <div key={s.label} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-sm">
                    <span className="text-neutral-800">{s.label}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(s.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-right font-semibold tabular-nums">{s.count}</span>
                  </div>
                ))}
              </div>
              {prospects.length === 0 && (
                <p className="mt-5 text-sm text-neutral-600">
                  No students yet — add your first one to start the pipeline.
                </p>
              )}
            </div>

            <div className={`${card} lg:col-span-2`}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-heading text-2xl font-medium">Up next</h2>
                <span className="text-sm text-neutral-600">{openTasks.length} open</span>
              </div>
              <div className="mt-5">
                <UpNext tasks={openTasks.slice(0, 6)} />
              </div>
            </div>
          </section>

          {/* Campuses */}
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-2xl font-medium">Your campuses</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {campuses.map((c) => {
                const students = prospects.filter((p) => p.campus_id === c.id).length
                const tasks = openTasks.filter((t) => t.campus_id === c.id).length
                return (
                  <div key={c.id} className={card}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-heading text-xl font-semibold">{c.name}</h3>
                        <p className="text-sm text-neutral-600">
                          {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                          {c.instagram_handle ? ` · ${c.instagram_handle}` : ''}
                        </p>
                      </div>
                      <Link
                        href={`/intern/campuses/${c.id}`}
                        className="shrink-0 text-sm font-medium text-accent-700 hover:underline"
                      >
                        Open →
                      </Link>
                    </div>
                    <dl className="mt-5 grid grid-cols-4 gap-2 text-sm">
                      {[
                        ['Students', students],
                        ['Followers', c.followers_count],
                        ['Surveys', c.surveys_sent],
                        ['Open tasks', tasks],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-[11px] uppercase tracking-wider text-neutral-600">{label}</dt>
                          <dd className="mt-0.5 text-xl font-semibold tabular-nums">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-divider pt-4">
                      {[
                        ['tasks', 'Goals & tasks'],
                        ['account', 'Account info'],
                        ['instagram', 'Instagram review'],
                      ].map(([slug, label]) => (
                        <Link
                          key={slug}
                          href={`/intern/campuses/${c.id}/${slug}`}
                          className="rounded-lg border border-divider px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:border-accent-300 hover:bg-accent-100"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
