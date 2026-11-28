import { AFFILIATION_LABEL, affiliationShort, formatDate, type ResearchReport } from '@/lib/research-format'

export default function ReportView({ report, researchedAt }: { report: ResearchReport; researchedAt?: string }) {
  const a = report.affiliation
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-xl font-medium">{report.campus_name}</h2>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
            Confidence: {report.confidence}
          </span>
          {researchedAt && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
              Researched {formatDate(researchedAt)}
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-neutral-800">{report.summary}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Affiliation" value={affiliationShort(report)} />
        <Stat label="Ministries found" value={String(report.ministries.length)} />
        <Stat label="Enrollment" value={report.enrollment ?? 'Not found'} />
      </div>

      <Section title="Religious affiliation">
        <p>
          <strong>{AFFILIATION_LABEL[a.category]}</strong>
          {a.denomination ? ` — ${a.denomination}` : ''}. {a.details}
        </p>
      </Section>

      <Section title={`Ministries on campus (${report.ministries.length})`}>
        {report.ministries.length === 0 ? (
          <p>No active ministries were found.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-divider rounded-md border border-divider">
            {report.ministries.map((m) => (
              <li key={m.name} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-ink">
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                        {m.name}
                      </a>
                    ) : (
                      m.name
                    )}
                  </span>
                  <span className="text-xs text-neutral-600">{m.kind}</span>
                </div>
                {m.notes && <p className="mt-0.5 text-neutral-700">{m.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Starting a student club">
        <p>{report.club_policy.summary}</p>
        {report.club_policy.requirements.length > 0 && (
          <ul className="mt-2 list-disc pl-5">
            {report.club_policy.requirements.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        )}
        {report.club_policy.religious_groups && (
          <p className="mt-2 rounded-md bg-accent-100 px-3 py-2 text-accent-800">
            <strong>Religious groups:</strong> {report.club_policy.religious_groups}
          </p>
        )}
        {report.club_policy.how_to_start_url && (
          <a
            href={report.club_policy.how_to_start_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-accent-700 underline underline-offset-4"
          >
            Official guide to starting a club ↗
          </a>
        )}
      </Section>

      {report.other_notes.length > 0 && (
        <Section title="Other notes">
          <ul className="list-disc pl-5">
            {report.other_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Sources (${report.sources.length})`}>
        <ul className="flex flex-col gap-1">
          {report.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-accent-700 underline underline-offset-4">
                {s.title || s.url}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-neutral-600">
          AI-generated from web sources — confirm important details (especially club rules) with the school.
        </p>
      </Section>
    </article>
  )
}

export function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-md bg-neutral-100 px-4 py-3">
      <div className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            {value}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-neutral-800">
      <h3 className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">{title}</h3>
      {children}
    </section>
  )
}
