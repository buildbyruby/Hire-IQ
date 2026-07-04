'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search, Users, Sparkles } from 'lucide-react'

interface Application {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
  aiScore: number
  aiSummary: string
  status: string
  createdAt: string
  job: { id: number; title: string }
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${color}`}>
      {score}/100
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-50 text-gray-500 border-gray-200',
    recruited: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
  }
  const labels: Record<string, string> = {
    pending: 'Pending Review',
    recruited: '✅ Recruited',
    rejected: '❌ Rejected',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  )
}

export default function RecruiterPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/applications').then(r => r.json()).then(data => {
      setApplications(data); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = applications.filter(a => {
    const matchesSearch = `${a.firstName} ${a.lastName} ${a.email} ${a.job.title}`.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || a.status === filter
    return matchesSearch && matchesFilter
  })

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    recruited: applications.filter(a => a.status === 'recruited').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
            <Sparkles className="w-3 h-3" />Recruiter View
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight leading-none">Candidate Applications</h1>
          <p className="text-gray-400 mt-2 text-sm">Every applicant, AI-screened automatically. Click a card to see the full profile.</p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {(['all', 'pending', 'recruited', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`p-4 rounded-2xl border text-left transition-all ${filter === f ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-200 hover:border-indigo-200'}`}>
              <p className={`text-3xl font-black tabular-nums ${filter === f ? 'text-white' : 'text-gray-900'}`}>{counts[f]}</p>
              <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${filter === f ? 'text-indigo-200' : 'text-gray-400'}`}>{f}</p>
            </button>
          ))}
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or job title..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 placeholder:text-gray-300 text-gray-700 font-medium" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-gray-200" />
            </div>
            <p className="text-sm font-bold text-gray-300">{search ? 'No candidates match your search' : 'No applications yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(app => (
              <div key={app.id} onClick={() => router.push(`/recruiter/${app.id}`)}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-100">
                    {app.firstName[0]}{app.lastName[0]}
                  </div>
                  <ScoreBadge score={app.aiScore} />
                </div>
                <h3 className="font-black text-gray-900 text-sm mb-0.5">{app.firstName} {app.lastName}</h3>
                <p className="text-xs text-gray-400 mb-3">{app.email}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                    {app.job.title}
                  </span>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mt-3 line-clamp-2">{app.aiSummary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
