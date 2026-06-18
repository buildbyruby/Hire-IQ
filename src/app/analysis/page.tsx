'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, FileText, Briefcase, CheckCircle, AlertCircle, Lightbulb, Loader2, RotateCcw, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface Job { id: number; title: string }
interface AnalysisResult { score: number; summary: string; strengths: string[]; weaknesses: string[]; suggestions: string[] }

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
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>ATS Score</p>
        <p className="text-xl font-black text-gray-900 leading-tight">{label}</p>
        <p className="text-xs text-gray-500 mt-1">Based on keyword match &amp; role alignment</p>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 rounded-2xl skeleton" />
      <div className="h-20 rounded-2xl skeleton" />
      <div className="grid grid-cols-3 gap-3"><div className="h-32 rounded-xl skeleton" /><div className="h-32 rounded-xl skeleton" /><div className="h-32 rounded-xl skeleton" /></div>
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
  const [result, setResult] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(d => { setJobs(d); if (d.length > 0) setSelectedJobId(d[0].id) })
      .catch(() => toast.error('Failed to load jobs'))
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') { toast.error('PDF files only'); return }
    setIsUploading(true); setResumeText(''); setResult(null)
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
    setIsAnalyzing(true); setResult(null)
    try {
      const res = await fetch('/api/resumes/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, resumeText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data); toast.success(`Score: ${data.score}/100`)
    } catch (e: any) { toast.error(e.message || 'Analysis failed') }
    finally { setIsAnalyzing(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />Gemini 2.0 Flash
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight leading-none">Resume Analysis</h1>
          <p className="text-gray-400 mt-2 text-sm">Upload any PDF — get instant AI scoring against your job description.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-5">
          <div className="flex flex-col gap-4">

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Job Position</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" style={{zIndex:2}} />
                <select value={selectedJobId ?? ''} onChange={e => setSelectedJobId(Number(e.target.value))}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all appearance-none cursor-pointer relative"
                  style={{position:'relative', zIndex:1}}>
                  {jobs.length === 0
                    ? <option disabled value="">No jobs — add one in Manage Records</option>
                    : jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" style={{zIndex:2}} />
              </div>
              {jobs.length > 0 && <p className="mt-2 text-[10px] text-gray-400">{jobs.length} job{jobs.length !== 1 ? 's' : ''} available</p>}
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
                <button onClick={() => { setResult(null); setResumeText(''); setFileName('') }}
                  className="p-3.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-400 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
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
                  <p className="text-sm font-semibold text-gray-500">Gemini is reading the resume...</p>
                </div>
                <Skeleton />
              </div>
            )}

            {result && (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
