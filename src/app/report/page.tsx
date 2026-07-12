'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Users, CheckCircle, XCircle, Clock, FileText, TrendingUp, Sparkles, X, Download, Printer } from 'lucide-react'

interface Application {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
  aiScore: number
  aiSummary: string
  aiStrengths: string
  aiWeaknesses: string
  aiSuggestions: string
  status: string
  createdAt: string
  job: { title: string }
  interviewSessions: { completed: boolean; aiScores: string | null }[]
}

type StageFilter = 'all' | 'shortlisted' | 'interviewed' | 'rejected' | 'pending'

const STAGE_LABELS: Record<StageFilter, string> = {
  all: 'Total Applied',
  shortlisted: 'Shortlisted',
  interviewed: 'Interviewed',
  rejected: 'Rejected',
  pending: 'Pending Review',
}

function hasCompletedInterview(a: Application) {
  return Array.isArray(a.interviewSessions) && a.interviewSessions.some(s => s.completed)
}

function getInterviewScore(a: Application): number | null {
  const session = Array.isArray(a.interviewSessions) ? a.interviewSessions.find(s => s.completed) : null
  if (!session?.aiScores) return null
  try { return JSON.parse(session.aiScores).overallScore ?? null } catch { return null }
}

function getStage(a: Application): string {
  if (hasCompletedInterview(a)) return 'Interviewed'
  if (a.status === 'recruited') return 'Shortlisted'
  if (a.status === 'rejected') return 'Rejected'
  return 'Applied'
}

function matchesFilter(a: Application, filter: StageFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'shortlisted') return a.status === 'recruited'
  if (filter === 'interviewed') return hasCompletedInterview(a)
  if (filter === 'rejected') return a.status === 'rejected'
  if (filter === 'pending') return a.status === 'pending'
  return true
}

function safeList(json: string): string[] {
  try { const v = JSON.parse(json); return Array.isArray(v) ? v : [] } catch { return [] }
}

function csvEscape(value: string): string {
  const v = value.replace(/"/g, '""')
  return `"${v}"`
}

function downloadCSV(applications: Application[]) {
  const headers = [
    'First Name', 'Last Name', 'Email', 'Phone', 'Position', 'Stage', 'Status',
    'CV Score', 'AI Summary', 'Strengths', 'Weaknesses', 'Suggestions',
    'Interview Completed', 'Interview Score', 'Applied On',
  ]
  const rows = applications.map(a => [
    a.firstName,
    a.lastName,
    a.email,
    a.phone || '',
    a.job?.title || '',
    getStage(a),
    a.status,
    String(a.aiScore),
    a.aiSummary || '',
    safeList(a.aiStrengths).join('; '),
    safeList(a.aiWeaknesses).join('; '),
    safeList(a.aiSuggestions).join('; '),
    hasCompletedInterview(a) ? 'Yes' : 'No',
    getInterviewScore(a) !== null ? String(getInterviewScore(a)) : '',
    new Date(a.createdAt).toLocaleDateString(),
  ])
  const csv = [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `hireiq-candidates-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function CandidateListModal({ filter, applications, onClose, onSelect }: {
  filter: StageFilter
  applications: Application[]
  onClose: () => void
  onSelect: (id: number) => void
}) {
  const filtered = applications.filter(a => matchesFilter(a, filter))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-black text-gray-900">{STAGE_LABELS[filter]}</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{filtered.length} candidate{filtered.length === 1 ? '' : 's'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-gray-300 font-bold">No candidates in this stage</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(a => {
                const interviewScore = getInterviewScore(a)
                const stage = getStage(a)
                const stageColors: Record<string, string> = {
                  Interviewed: 'bg-violet-50 text-violet-700 border-violet-100',
                  Shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  Rejected: 'bg-red-50 text-red-600 border-red-100',
                  Applied: 'bg-gray-50 text-gray-500 border-gray-100',
                }
                return (
                  <div key={a.id} onClick={() => onSelect(a.id)}
                    className="px-6 py-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                      {a.firstName[0]}{a.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{a.firstName} {a.lastName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{a.email} · {a.job?.title}</p>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border shrink-0 ${a.aiScore >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : a.aiScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {a.aiScore}/100
                    </span>
                    {interviewScore !== null && (
                      <span className="text-xs font-black text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100 shrink-0">
                        {interviewScore}/10
                      </span>
                    )}
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider shrink-0 ${stageColors[stage]}`}>
                      {stage}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FullReportModal({ applications, onClose }: { applications: Application[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 print:hidden">
          <div>
            <h2 className="text-sm font-black text-gray-900">Full Report — All Candidate Data</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{applications.length} applications, every field included</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadCSV(applications)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-colors">
              <Download className="w-3.5 h-3.5" />Download CSV
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-xs font-black hover:bg-gray-100 transition-colors">
              <Printer className="w-3.5 h-3.5" />Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {applications.length === 0 && (
            <p className="text-center text-sm text-gray-300 font-bold py-16">No applications yet</p>
          )}
          {applications.map(a => {
            const interviewScore = getInterviewScore(a)
            const stage = getStage(a)
            return (
              <div key={a.id} className="rounded-xl border border-gray-100 p-4 break-inside-avoid">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-black text-gray-900">{a.firstName} {a.lastName}</p>
                    <p className="text-[10px] text-gray-400">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{a.job?.title}</span>
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider bg-gray-50 text-gray-500 border-gray-100">{stage}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <p className="text-[10px] text-gray-500"><span className="font-black text-gray-700">CV Score:</span> {a.aiScore}/100</p>
                  <p className="text-[10px] text-gray-500"><span className="font-black text-gray-700">Interview Score:</span> {interviewScore !== null ? `${interviewScore}/10` : 'Not completed'}</p>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed mb-2">{a.aiSummary}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <p className="font-black text-emerald-600 mb-1">Strengths</p>
                    <ul className="text-gray-600 space-y-0.5">{safeList(a.aiStrengths).map((s, i) => <li key={i}>• {s}</li>)}</ul>
                  </div>
                  <div>
                    <p className="font-black text-amber-600 mb-1">Weaknesses</p>
                    <ul className="text-gray-600 space-y-0.5">{safeList(a.aiWeaknesses).map((s, i) => <li key={i}>• {s}</li>)}</ul>
                  </div>
                  <div>
                    <p className="font-black text-indigo-600 mb-1">Suggestions</p>
                    <ul className="text-gray-600 space-y-0.5">{safeList(a.aiSuggestions).map((s, i) => <li key={i}>• {s}</li>)}</ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [modalFilter, setModalFilter] = useState<StageFilter | null>(null)
  const [fullReportOpen, setFullReportOpen] = useState(false)

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(data => { setApplications(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const total = applications.length
  const shortlisted = applications.filter(a => a.status === 'recruited').length
  const rejected = applications.filter(a => a.status === 'rejected').length
  const pending = applications.filter(a => a.status === 'pending').length
  const interviewed = applications.filter(hasCompletedInterview).length
  const avgScore = total > 0
    ? Math.round(applications.reduce((sum, a) => sum + a.aiScore, 0) / total)
    : 0

  const byJob = applications.reduce((acc: Record<string, number>, a) => {
    const title = a.job?.title || 'Unknown'
    acc[title] = (acc[title] || 0) + 1
    return acc
  }, {})

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />Recruitment Report
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight leading-none">Pipeline Report</h1>
            <p className="text-gray-400 mt-2 text-sm">Full recruitment pipeline — every stage, every candidate.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFullReportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-black hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" />Full Report
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-colors shadow-sm">
              <FileText className="w-3.5 h-3.5" />Print Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Applied', value: total, icon: Users, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50', filter: 'all' as StageFilter },
            { label: 'Shortlisted', value: shortlisted, icon: CheckCircle, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50', filter: 'shortlisted' as StageFilter },
            { label: 'Interviewed', value: interviewed, icon: FileText, color: 'text-violet-600', border: 'border-violet-100', bg: 'bg-violet-50', filter: 'interviewed' as StageFilter },
            { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-500', border: 'border-red-100', bg: 'bg-red-50', filter: 'rejected' as StageFilter },
            { label: 'Pending Review', value: pending, icon: Clock, color: 'text-amber-500', border: 'border-amber-100', bg: 'bg-amber-50', filter: 'pending' as StageFilter },
            { label: 'Avg AI Score', value: `${avgScore}/100`, icon: TrendingUp, color: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50', filter: null },
          ].map(({ label, value, icon: Icon, color, border, bg, filter }) => {
            const Wrapper = filter !== null ? 'button' : 'div'
            return (
              <Wrapper
                key={label}
                {...(filter !== null ? { onClick: () => setModalFilter(filter), type: 'button' } : {})}
                className={`text-left bg-white rounded-2xl border ${border} p-5 shadow-sm ${filter !== null ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 transition-all' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-xs font-bold text-gray-400 mb-1">{label}</p>
                <p className={`text-3xl font-black ${color} tabular-nums`}>{value}</p>
                {filter !== null && <p className="text-[9px] font-bold text-indigo-400 mt-1">Click to view candidates</p>}
              </Wrapper>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-black text-gray-900 mb-4">Applications by Job</h2>
            <div className="space-y-3">
              {Object.entries(byJob).map(([title, count]) => (
                <div key={title}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-700 truncate flex-1 mr-2">{title}</p>
                    <span className="text-xs font-black text-indigo-600 shrink-0">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-indigo-400 transition-all"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
              {Object.keys(byJob).length === 0 && <p className="text-xs text-gray-300">No applications yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-black text-gray-900 mb-4">Pipeline Funnel</h2>
            <div className="space-y-3">
              {[
                { label: 'Applied', value: total, color: 'bg-indigo-400', pct: 100 },
                { label: 'Shortlisted', value: shortlisted, color: 'bg-emerald-400', pct: total > 0 ? Math.round((shortlisted / total) * 100) : 0 },
                { label: 'Interviewed', value: interviewed, color: 'bg-violet-400', pct: total > 0 ? Math.round((interviewed / total) * 100) : 0 },
                { label: 'Rejected', value: rejected, color: 'bg-red-400', pct: total > 0 ? Math.round((rejected / total) * 100) : 0 },
              ].map(({ label, value, color, pct }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-700">{label}</p>
                    <span className="text-xs font-black text-gray-500">{value} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-black text-gray-900">All Candidates</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{total} total applications</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Position</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">CV Score</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Interview</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map(a => {
                  const interviewScore = getInterviewScore(a)
                  const stage = getStage(a)
                  const stageColors: Record<string, string> = {
                    Interviewed: 'bg-violet-50 text-violet-700 border-violet-100',
                    Shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    Rejected: 'bg-red-50 text-red-600 border-red-100',
                    Applied: 'bg-gray-50 text-gray-500 border-gray-100',
                  }

                  return (
                    <tr key={a.id} onClick={() => router.push(`/recruiter/${a.id}`)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                            {a.firstName[0]}{a.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{a.firstName} {a.lastName}</p>
                            <p className="text-[10px] text-gray-400">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-xs font-semibold text-gray-600">{a.job?.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${a.aiScore >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : a.aiScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {a.aiScore}/100
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {interviewScore !== null ? (
                          <span className="text-xs font-black text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                            {interviewScore}/10
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 font-semibold">Not yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${stageColors[stage]}`}>
                          {stage}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {applications.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-300 font-bold">No applications yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalFilter && (
        <CandidateListModal
          filter={modalFilter}
          applications={applications}
          onClose={() => setModalFilter(null)}
          onSelect={(id) => router.push(`/recruiter/${id}`)}
        />
      )}

      {fullReportOpen && (
        <FullReportModal applications={applications} onClose={() => setFullReportOpen(false)} />
      )}
    </div>
  )
}
