'use client'

import { useState, useEffect } from 'react'
import { Loader2, Users, CheckCircle, XCircle, Clock, FileText, TrendingUp, Sparkles } from 'lucide-react'

interface Application {
  id: number
  firstName: string
  lastName: string
  email: string
  aiScore: number
  status: string
  createdAt: string
  job: { title: string }
  interviewSessions: { completed: boolean; aiScores: string | null }[]
}

export default function ReportPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(data => { setApplications(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const total = applications.length
  const shortlisted = applications.filter(a => a.status === 'recruited').length
  const rejected = applications.filter(a => a.status === 'rejected').length
  const pending = applications.filter(a => a.status === 'pending').length
  const interviewed = applications.filter(a =>
    Array.isArray(a.interviewSessions) && a.interviewSessions.some(s => s.completed)
  ).length
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
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-colors shadow-sm">
            <FileText className="w-3.5 h-3.5" />Print Report
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Applied', value: total, icon: Users, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50' },
            { label: 'Shortlisted', value: shortlisted, icon: CheckCircle, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50' },
            { label: 'Interviewed', value: interviewed, icon: FileText, color: 'text-violet-600', border: 'border-violet-100', bg: 'bg-violet-50' },
            { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-500', border: 'border-red-100', bg: 'bg-red-50' },
            { label: 'Pending Review', value: pending, icon: Clock, color: 'text-amber-500', border: 'border-amber-100', bg: 'bg-amber-50' },
            { label: 'Avg AI Score', value: `${avgScore}/100`, icon: TrendingUp, color: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50' },
          ].map(({ label, value, icon: Icon, color, border, bg }) => (
            <div key={label} className={`bg-white rounded-2xl border ${border} p-5 shadow-sm`}>
              <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs font-bold text-gray-400 mb-1">{label}</p>
              <p className={`text-3xl font-black ${color} tabular-nums`}>{value}</p>
            </div>
          ))}
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
                  const completedSession = Array.isArray(a.interviewSessions)
                    ? a.interviewSessions.find(s => s.completed)
                    : null
                  const interviewScore = completedSession?.aiScores
                    ? (() => { try { return JSON.parse(completedSession.aiScores).overallScore } catch { return null } })()
                    : null

                  const stage = completedSession
                    ? 'Interviewed'
                    : a.status === 'recruited'
                    ? 'Shortlisted'
                    : a.status === 'rejected'
                    ? 'Rejected'
                    : 'Applied'

                  const stageColors: Record<string, string> = {
                    Interviewed: 'bg-violet-50 text-violet-700 border-violet-100',
                    Shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    Rejected: 'bg-red-50 text-red-600 border-red-100',
                    Applied: 'bg-gray-50 text-gray-500 border-gray-100',
                  }

                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
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
    </div>
  )
}
