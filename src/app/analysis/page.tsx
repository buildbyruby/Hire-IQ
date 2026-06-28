'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, FileText, Briefcase, CheckCircle, AlertCircle, Lightbulb, Loader2, RotateCcw, ChevronDown, MessageSquare, Brain, Target, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface Job { id: number; title: string; description: string }
interface AnalysisResult { score: number; summary: string; strengths: string[]; weaknesses: string[]; suggestions: string[] }
interface ScoringCriteria { '1-2': string; '3-4': string; '5-6': string; '7-8': string; '9-10': string }
interface InterviewQuestion { type: string; question: string; purpose: string; scoring: ScoringCriteria }
interface HiringRecommendation { verdict: string; reason: string; watchPoints: string[] }
interface InterviewResult { questions: InterviewQuestion[]; hiringRecommendation: HiringRecommendation }

function ScoreRing({ score }: { score: number }) {
  const [display, setDisplay] = useState(0)
  const r = 52; const circ = 2 * Math.PI * r
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const trackBg = score >= 75 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#fef2f2'
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Needs Work'

  useEffect(() => {
    let cur = 0; const step = score / 50
    const t = setInterval(() => {
      cur += step
      if (cur >= score) { setDisplay(score); clearInterval(t) } else setDisplay(Math.round(cur))
    }, 20)
    return () => clearInterval(t)
  }, [score])

  return (
    <div className="flex items-center gap-5 p-5 rounded-2xl border" style={{ background: trackBg, borderColor: color + '30' }}>
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={circ} strokeDashoffset={circ - (circ * display) / 100}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.02s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-gray-900 tabular-nums leading-none">{display}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">/100</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>Candidate Score</p>
        <p className="text-xl font-black text-gray-900 leading-tight">{label}</p>
        <p className="text-xs text-gray-500 mt-1">Based on keyword match & role alignment</p>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 rounded-2xl skeleton" />
      <div className="h-20 rounded-2xl skeleton" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-32 rounded-xl skeleton" />
        <div className="h-32 rounded-xl skeleton" />
        <div className="h-32 rounded-xl skeleton" />
      </div>
    </div>
  )
}

function ScoreBadge({ range, description, selected }: { range: string; description: string; selected?: boolean }) {
  const colors: Record<string, string> = {
    '1-2': 'bg-red-50 border-red-100 text-red-600',
    '3-4': 'bg-orange-50 border-orange-100 text-orange-600',
    '5-6': 'bg-amber-50 border-amber-100 text-amber-600',
    '7-8': 'bg-blue-50 border-blue-100 text-blue-600',
    '9-10': 'bg-emerald-50 border-emerald-100 text-emerald-600',
  }
  return (
    <div className={`p-2.5 rounded-lg border text-[10px] leading-relaxed ${colors[range] || 'bg-gray-50 border-gray-100 text-gray-600'}`}>
      <span className="font-black">{range}:</span> {description}
    </div>
  )
}

function InterviewPanel({ questions, recommendation }: { questions: InterviewQuestion[]; recommendation: HiringRecommendation }) {
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
  const interviewPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const scoredCount = Object.keys(scores).length

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-500" />
          <p className="text-sm font-black text-gray-900">AI Interview Questions</p>
        </div>
        {scoredCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-black text-indigo-700">{totalScore}/{maxScore} pts ({interviewPercent}%)</span>
          </div>
        )}
      </div>

      {/* Hiring Recommendation */}
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

      {/* Interview score summary */}
      {scoredCount > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interview Progress</p>
            <p className="text-[10px] font-bold text-gray-500">{scoredCount} of {questions.length} scored</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${(scoredCount / questions.length) * 100}%` }} />
          </div>
          {scoredCount === questions.length && (
            <p className="text-xs font-bold text-indigo-600 mt-2 text-center">
              ✦ Interview complete — Overall score: {interviewPercent}%
            </p>
          )}
        </div>
      )}

      {/* Questions */}
      {questions.map((q, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${typeColors[q.type] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                  {q.type}
                </span>
                <span className="text-[9px] text-gray-300 font-bold">Q{i + 1}</span>
              </div>
              {scores[i] !== undefined && (
                <span className="text-xs font-black text-indigo-600 shrink-0">{scores[i]}/10</span>
              )}
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
                {Object.entries(q.scoring).map(([range, desc]) => (
                  <ScoreBadge key={range} range={range} description={desc} />
                ))}
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rate This Answer</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setScores(prev => ({ ...prev, [i]: n }))}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all border
                        ${scores[i] === n
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}>
                      {n}
                    </button>
                  ))}
                </div>
                {scores[i] !== undefined && (
                  <p className="text-[10px] text-indigo-500 font-bold mt-1.5">Scored: {scores[i]}/10</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AnalysisPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null)
  const [showInterview, setShowInterview] = useState(false)

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(d => { setJobs(d); if (d.length > 0) setSelectedJobId(d[0].id) })
      .catch(() => toast.error('Failed to load jobs'))
  }, [])

  const selectedJob = jobs.find(j => j.id === selectedJobId)

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') { toast.error('PDF files only'); return }
    setIsUploading(true); setResumeText(''); setResult(null); setInterviewResult(null); setShowInterview(false)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/resumes/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResumeText(data.text); setFileName(file.name)
      toast.success('Resume parsed — ready to analyze')
    } catch (e: any) { toast.error(e.message || 'Parse failed') }
    finally { setIsUploading(false) }
  }, [])

  const handleAnalyze = async () => {
    if (!resumeText || !selectedJobId) return
    setIsAnalyzing(true); setResult(null); setInterviewResult(null); setShowInterview(false)
    try {
      const res = await fetch('/api/resumes/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, resumeText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data); toast.success(`Score: ${data.score}/100 — Analysis complete`)
    } catch (e: any) { toast.error(e.message || 'Analysis failed') }
    finally { setIsAnalyzing(false) }
  }

  const handleGenerateQuestions = async () => {
    if (!result || !selectedJob) return
    setIsGeneratingQuestions(true); setShowInterview(true); setInterviewResult(null)
    try {
      const res = await fetch('/api/interview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobTitle: selectedJob.title,
          jobDescription: selectedJob.description,
          score: result.score,
          weaknesses: result.weaknesses,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInterviewResult(data)
      toast.success('8 interview questions generated with scoring guide')
    } catch (e: any) { toast.error(e.message || 'Failed to generate questions') }
    finally { setIsGeneratingQuestions(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />Groq · Llama 3.3
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight leading-none">Candidate Intelligence</h1>
          <p className="text-gray-400 mt-2 text-sm">Upload any PDF resume — get instant AI scoring and tailored interview questions with scoring guide.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-5">
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Job Position</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
                <select value={selectedJobId ?? ''} onChange={e => setSelectedJobId(Number(e.target.value))}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all appearance-none cursor-pointer">
                  {jobs.length === 0
                    ? <option disabled value="">No jobs — add one in Manage Records</option>
                    : jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {jobs.length > 0 && <p className="mt-2 text-[10px] text-gray-400">{jobs.length} position{jobs.length !== 1 ? 's' : ''} available</p>}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Candidate Resume (PDF)</label>
              <div onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
                  ${isDragging ? 'border-indigo-400 bg-indigo-50' : fileName ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                    <p className="text-sm font-semibold text-gray-500">Parsing PDF...</p>
                  </div>
                ) : fileName ? (
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                    <p className="text-sm font-bold text-green-700 truncate max-w-full px-2">{fileName}</p>
                    <span className="px-2.5 py-1 rounded-full bg-green-100 text-[10px] font-black text-green-600 uppercase tracking-wider">Ready</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">Drop PDF or <span className="text-indigo-600 font-bold">browse</span></p>
                    <p className="text-xs text-gray-400">PDF only · Max 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAnalyze} disabled={!resumeText || !selectedJobId || isAnalyzing}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2">
                {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : '✦ Run AI Analysis'}
              </button>
              {result && (
                <button onClick={() => { setResult(null); setResumeText(''); setFileName(''); setInterviewResult(null); setShowInterview(false) }}
                  className="p-3.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-400 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {result && (
              <button onClick={handleGenerateQuestions} disabled={isGeneratingQuestions}
                className="w-full py-3.5 rounded-xl bg-violet-600 text-white text-sm font-black hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-200 active:scale-[0.98] flex items-center justify-center gap-2">
                {isGeneratingQuestions
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Questions...</>
                  : <><MessageSquare className="w-4 h-4" />Generate Interview Questions</>}
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 min-h-96">
            {!result && !isAnalyzing && (
              <div className="h-full min-h-80 flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-gray-100 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-300">No analysis yet</p>
                <p className="text-xs text-gray-300">Select a job, upload a resume, then run analysis</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <p className="text-sm font-semibold text-gray-500">AI is reading the resume...</p>
                </div>
                <Skeleton />
              </div>
            )}

            {result && !showInterview && (
              <div className="space-y-4 animate-fade-in">
                <ScoreRing score={result.score} />
                <div className="rounded-2xl bg-slate-50 border border-gray-100 p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">AI Summary</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'strengths', label: 'Strengths', icon: CheckCircle, items: result.strengths, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-400' },
                    { key: 'weaknesses', label: 'Weaknesses', icon: AlertCircle, items: result.weaknesses, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-400' },
                    { key: 'suggestions', label: 'Suggestions', icon: Lightbulb, items: result.suggestions, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-400' },
                  ].map(({ key, label, icon: Icon, items, color, bg, border, dot }) => (
                    <div key={key} className={`rounded-xl border ${border} ${bg} p-4`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${color} mb-3 flex items-center gap-1.5`}>
                        <Icon className="w-3 h-3" />{label}
                      </p>
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                            <span className={`w-1.5 h-1.5 rounded-full ${dot} mt-1 shrink-0`} />{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 text-center">
                  <p className="text-xs text-violet-600 font-semibold">✦ Click "Generate Interview Questions" to get 8 AI-tailored questions with scoring guide</p>
                </div>
              </div>
            )}

            {showInterview && (
              <div>
                <button onClick={() => setShowInterview(false)} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 mb-4 transition-colors">
                  ← Back to Analysis
                </button>
                {isGeneratingQuestions ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                      <p className="text-sm font-semibold text-gray-500">Generating tailored questions with scoring criteria...</p>
                    </div>
                    {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl skeleton" />)}
                  </div>
                ) : interviewResult ? (
                  <InterviewPanel questions={interviewResult.questions} recommendation={interviewResult.hiringRecommendation} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
