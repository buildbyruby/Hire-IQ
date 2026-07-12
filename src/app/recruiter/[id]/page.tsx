'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, Lightbulb, Loader2, UserCheck, UserX, Brain, RotateCcw, Target, MessageSquare, TrendingUp } from 'lucide-react'
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
  resumeText: string
  createdAt: string
  job: { id: number; title: string; description: string }
}

interface InterviewQuestion {
  type: string
  question: string
  purpose: string
  scoring: Record<string, string>
}

interface InterviewResult {
  questions: InterviewQuestion[]
  hiringRecommendation: { verdict: string; reason: string; watchPoints: string[] }
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
            strokeDasharray={circ} strokeDashoffset={circ - (circ * score) / 100} strokeLinecap="round" />
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

function InterviewPanel({ questions, recommendation }: { questions: InterviewQuestion[]; recommendation: InterviewResult['hiringRecommendation'] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [scores, setScores] = useState<Record<number, number>>({})

  const typeColors: Record<string, string> = {
    Technical: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Behavioral: 'bg-violet-50 text-violet-700 border-violet-100',
    Situational: 'bg-amber-50 text-amber-700 border-amber-100',
  }

  const verdictColors: Record<string, string> = {
    'Strong Hire': 'bg-emerald-50 border-emerald-200 text-emerald-800',
    'Hire': 'bg-blue-50 border-blue-200 text-blue-800',
    'Maybe': 'bg-amber-50 border-amber-200 text-amber-800',
    'No Hire': 'bg-red-50 border-red-200 text-red-800',
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const maxScore = questions.length * 10
  const scoredCount = Object.keys(scores).length
  const interviewPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  return (
    <div className="space-y-4 mt-5">
      <div className={`p-4 rounded-2xl border ${verdictColors[recommendation.verdict] || 'bg-gray-50 border-gray-200 text-gray-800'}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">AI Hiring Recommendation</p>
          <span className="text-sm font-black">{recommendation.verdict}</span>
        </div>
        <p className="text-xs leading-relaxed mb-3">{recommendation.reason}</p>
        {recommendation.watchPoints.length > 0 && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Watch Points</p>
            <ul className="space-y-1">
              {recommendation.watchPoints.map((w, i) => (
                <li key={i} className="text-[10px] flex items-start gap-1.5 opacity-80">
                  <span className="mt-0.5 shrink-0">⚠</span>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {scoredCount > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interview Score</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-black text-indigo-700">{totalScore}/{maxScore} ({interviewPercent}%)</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${(scoredCount / questions.length) * 100}%` }} />
          </div>
          {scoredCount === questions.length && (
            <p className="text-xs font-bold text-indigo-600 mt-2 text-center">✦ Complete — Interview score: {interviewPercent}%</p>
          )}
        </div>
      )}

      {questions.map((q, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${typeColors[q.type] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>{q.type}</span>
                <span className="text-[9px] text-gray-300 font-bold">Q{i + 1}</span>
              </div>
              {scores[i] !== undefined && <span className="text-xs font-black text-indigo-600 shrink-0">{scores[i]}/10</span>}
            </div>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed">{q.question}</p>
            <div className="flex items-start gap-1.5 mt-2">
              <Target className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">{q.purpose}</p>
            </div>
          </div>

          {expandedIndex === i && (
            <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scoring Guide (1-10)</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(q.scoring).map(([range, desc]) => {
                  const colors: Record<string, string> = {
                    '1-2': 'bg-red-50 border-red-100 text-red-600',
                    '3-4': 'bg-orange-50 border-orange-100 text-orange-600',
                    '5-6': 'bg-amber-50 border-amber-100 text-amber-600',
                    '7-8': 'bg-blue-50 border-blue-100 text-blue-600',
                    '9-10': 'bg-emerald-50 border-emerald-100 text-emerald-600',
                  }
                  return (
                    <div key={range} className={`p-2.5 rounded-lg border text-[10px] leading-relaxed ${colors[range] || 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                      <span className="font-black">{range}:</span> {desc}
                    </div>
                  )
                })}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rate This Answer</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setScores(prev => ({ ...prev, [i]: n }))}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all border
                        ${scores[i] === n ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                {scores[i] !== undefined && <p className="text-[10px] text-indigo-500 font-bold mt-1.5">Scored: {scores[i]}/10</p>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


function SendInterviewLinkButton({ applicationId, candidateEmail, isRecruited }: { applicationId: number; candidateEmail: string; isRecruited: boolean }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!isRecruited) { toast.error('Candidate must be recruited first before sending interview link'); return }
    setSending(true)
    try {
      const res = await fetch('/api/interview-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
      toast.success(`Interview link sent to ${candidateEmail} — expires in 24 hours`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to send link')
    } finally { setSending(false) }
  }

  if (sent) return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-black text-emerald-700">
      <CheckCircle className="w-3.5 h-3.5" />Link Sent
    </div>
  )

  return (
    <button onClick={handleSend} disabled={sending || !isRecruited}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black hover:bg-indigo-100 disabled:opacity-40 transition-colors">
      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
      Send Interview Link
    </button>
  )
}

export default function CandidateProfilePage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = Number(params.id)

  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null)
  const [showInterview, setShowInterview] = useState(false)

  useEffect(() => {
    fetch('/api/applications').then(r => r.json()).then(apps => {
      const found = apps.find((a: Application) => a.id === applicationId)
      if (found) setApplication(found)
      setLoading(false)
    })
  }, [applicationId])

  const handleDecision = async (status: 'recruited' | 'rejected' | 'pending') => {
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
      if (status === 'recruited') toast.success(`${application.firstName} recruited ✅ — email sent to ${application.email}`)
      else if (status === 'rejected') toast.success(`${application.firstName} rejected — email sent to ${application.email}`)
      else toast.success('Decision reset to pending')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update')
    } finally { setUpdating(false) }
  }

  const handleGenerateQuestions = async () => {
    if (!application) return
    setGeneratingQuestions(true)
    setShowInterview(true)
    try {
      const weaknesses = JSON.parse(application.aiWeaknesses)
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: application.resumeText,
          jobTitle: application.job.title,
          jobDescription: application.job.description,
          score: application.aiScore,
          weaknesses,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInterviewResult(data)
      toast.success('8 interview questions generated')
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate questions')
      setShowInterview(false)
    } finally { setGeneratingQuestions(false) }
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
  const isPending = application.status === 'pending'
  const isRecruited = application.status === 'recruited'
  const isRejected = application.status === 'rejected'

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-4xl mx-auto">

        <button onClick={() => router.push('/recruiter')}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to applications
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 font-black text-lg flex items-center justify-center border border-indigo-100 shrink-0">
                {application.firstName[0]}{application.lastName[0]}
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-950">{application.firstName} {application.lastName}</h1>
                <p className="text-sm text-gray-400">{application.email}</p>
                {application.phone && <p className="text-sm text-gray-400">{application.phone}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">Applied for: {application.job.title}</span>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">CV: {application.fileName}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {isPending && (
                <div className="flex gap-2">
                  <button onClick={() => handleDecision('recruited')} disabled={updating}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-sm">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}Recruit
                  </button>
                  <button onClick={() => handleDecision('rejected')} disabled={updating}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-black hover:bg-red-100 disabled:opacity-40 transition-all">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}Reject
                  </button>
                </div>
              )}
              {!isPending && (
                <div className="flex flex-col gap-2">
                  <div className={`px-4 py-2.5 rounded-xl text-sm font-black border text-center ${isRecruited ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {isRecruited ? '✅ Recruited' : '❌ Rejected'}
                    <p className="text-[9px] font-semibold mt-0.5 opacity-70">Email sent to applicant</p>
                  </div>
                  <div className="flex gap-2">
                    {isRejected && (
                      <button onClick={() => handleDecision('recruited')} disabled={updating}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black hover:bg-emerald-100 disabled:opacity-40 transition-all">
                        <UserCheck className="w-3.5 h-3.5" />Change to Recruit
                      </button>
                    )}
                    {isRecruited && (
                      <button onClick={() => handleDecision('rejected')} disabled={updating}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-black hover:bg-red-100 disabled:opacity-40 transition-all">
                        <UserX className="w-3.5 h-3.5" />Change to Reject
                      </button>
                    )}
                    <button onClick={() => handleDecision('pending')} disabled={updating}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-500 border border-gray-200 text-xs font-black hover:bg-gray-100 disabled:opacity-40 transition-all">
                      <RotateCcw className="w-3.5 h-3.5" />Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Brain className="w-3.5 h-3.5" />Interview Questions
              </p>
              <p className="text-xs text-gray-400">Generate questions here for reference, or send a timed interview link directly to the candidate.</p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              {!showInterview && (
                <button onClick={handleGenerateQuestions} disabled={generatingQuestions}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black hover:bg-violet-700 disabled:opacity-40 transition-colors">
                  {generatingQuestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  Generate
                </button>
              )}
              <SendInterviewLinkButton applicationId={application.id} candidateEmail={application.email} isRecruited={application.status === 'recruited'} />
            </div>
            {showInterview && interviewResult && (
              <button onClick={() => { setShowInterview(false); setInterviewResult(null) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors shrink-0 ml-4">
                <RotateCcw className="w-3 h-3" />Reset
              </button>
            )}
          </div>

          {showInterview && generatingQuestions && (
            <div className="flex items-center gap-3 py-6 justify-center">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Generating tailored questions...</p>
            </div>
          )}

          {showInterview && interviewResult && (
            <InterviewPanel questions={interviewResult.questions} recommendation={interviewResult.hiringRecommendation} />
          )}
        </div>
      </div>
    </div>
  )
}
