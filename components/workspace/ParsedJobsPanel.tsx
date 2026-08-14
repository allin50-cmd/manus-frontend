'use client'

import { useEffect, useState } from 'react'
import { ParsedCommandJob, readParsedCommandJobs, writeParsedCommandJobs } from '@/lib/parsed-command-jobs'

export default function ParsedJobsPanel() {
  const [jobs, setJobs] = useState<ParsedCommandJob[]>([])

  useEffect(() => {
    setJobs(readParsedCommandJobs())
  }, [])

  function setJobStatus(id: string, status: ParsedCommandJob['status']) {
    const next = jobs.map((job) => job.id === id ? { ...job, status } : job)
    setJobs(next)
    writeParsedCommandJobs(next)
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">Parsed Jobs</h2>
      {jobs.length === 0 ? (
        <p className="mt-2 text-sm text-white/60">No parsed items have been saved yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">{job.description}</h3>
              <p className="mt-1 text-xs text-white/50">{job.sourceEventType} · {job.status}</p>
              <p className="mt-2 text-sm text-white/60">{job.originalText}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setJobStatus(job.id, 'active')} className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs text-blue-200">Start</button>
                <button onClick={() => setJobStatus(job.id, 'completed')} className="rounded-lg bg-green-500/20 px-3 py-1 text-xs text-green-200">Complete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
