'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, Lightbulb, Loader2, UserCheck, UserX, Brain } from 'lucide-react'
import { toast } from 'sonner'

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
  fileName: string
  createdAt: string
  job: { id: number; title: string; description: string }
}

function ScoreRing({ score }: { score: number }) {
  const r = 52; const circ = 2 * Math.PI * r
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const trackBg = score >= 75 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#fef2f2'
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Needs Work'

  return (
    <div className="flex items-center gap-5 p-5 rounded-2xl border" style={{ background: trackBg, borderColor: color + '30' }}>
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={circ} strokeDashoffset={circ - (circ * score) / 100}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-gray-900 tabular-nums leading-none">{score}</span>
          <span className="text-[9px] font-bold text-gray-400">/100</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>ATS Score</p>
        <p className="text-lg font-black text-gray-900 leading-tight">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">AI candidate assessment</p>
      </div>
    </div>
  )
}

export default function CandidateProfilePage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = Number(params.id)

  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch('/api/applications').then(r => r.json()).then(apps => {
      const found = apps.find((a: Application) => a.id === applicationId)
      if (found) setApplication(found)
      setLoading(false)
    })
  }, [applicationId])

  const handleDecision = async (status: 'recruited' | 'rejected') => {
    if (!application) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setApplication(prev => prev ? { ...prev, status } : null)
      toast.success(`${application.firstName} ${status === 'recruited' ? 'recruited ✅' : 'rejected'} — email sent to ${application.email}`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
    </div>
  )

  if (!application) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-gray-400">Application not found</p>
    </div>
  )

  const strengths = JSON.parse(application.aiStrengths)
  const weaknesses = JSON.parse(application.aiWeaknesses)
  const suggestions = JSON.parse(application.aiSuggestions)

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-4xl mx-auto">

        <button onClick={() => router.push('/recruiter')}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to applications
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 font-black text-lg flex items-center justify-center border border-indigo-100">
                {application.firstName[0]}{application.lastName[0]}
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-950">{application.firstName} {application.lastName}</h1>
                <p className="text-sm text-gray-400">{application.email}</p>
                {application.phone && <p className="text-sm text-gray-400">{application.phone}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                    Applied for: {application.job.title}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    CV: {application.fileName}
                  </span>
                </div>
              </div>
            </div>

            {application.status === 'pending' ? (
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleDecision('recruited')} disabled={updating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-sm">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Recruit
                </button>
                <button onClick={() => handleDecision('rejected')} disabled={updating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-black hover:bg-red-100 disabled:opacity-40 transition-all">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            ) : (
              <div className={`px-4 py-2.5 rounded-xl text-sm font-black border ${application.status === 'recruited' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {application.status === 'recruited' ? '✅ Recruited' : '❌ Rejected'}
                <p className="text-[9px] font-semibold mt-0.5 opacity-70">Email sent to applicant</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="space-y-4">
            <ScoreRing score={application.aiScore} />

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">AI Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{application.aiSummary}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" />Strengths
              </p>
              <ul className="space-y-2">
                {strengths.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />Weaknesses
              </p>
              <ul className="space-y-2">
                {weaknesses.map((w: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />{w}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" />Suggestions
              </p>
              <ul className="space-y-2">
                {suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />Want interview questions for this candidate?
          </p>
          <p className="text-xs text-gray-400 mb-3">Go to Candidate Intelligence, upload this candidate's CV against the same job to generate tailored interview questions with scoring guide.</p>
          <button onClick={() => router.push('/analysis')}
            className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black hover:bg-violet-700 transition-colors">
            Generate Interview Questions →
          </button>
        </div>
      </div>
    </div>
  )
}
