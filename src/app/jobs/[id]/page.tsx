'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Upload, CheckCircle, Loader2, Briefcase, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Job { id: number; title: string; description: string }

export default function ApplyPage() {
  const params = useParams()
  const jobId = Number(params.id)

  const [job, setJob] = useState<Job | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fileName, setFileName] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(jobs => {
      const found = jobs.find((j: Job) => j.id === jobId)
      if (found) setJob(found)
    })
  }, [jobId])

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') { setError('PDF files only'); return }
    setIsUploading(true); setError('')
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/resumes/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResumeText(data.text)
      setFileName(file.name)
      toast.success('CV uploaded successfully')
    } catch (e: any) { setError(e.message || 'Failed to parse PDF') }
    finally { setIsUploading(false) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Please fill in all required fields'); return
    }
    if (!resumeText) {
      setError('Please upload your CV before submitting'); return
    }
    setIsSubmitting(true); setError('')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, resumeText, fileName, jobId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setScore(data.score)
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message || 'Failed to submit. Please try again.')
    } finally { setIsSubmitting(false) }
  }

  const input = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all"

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-950 mb-2">Application Submitted!</h1>
          <p className="text-gray-400 text-sm mb-6">Your CV has been screened by our AI. The recruiter will review your profile and you will receive an email with the outcome.</p>
          {score !== null && (
            <div className={`rounded-2xl p-5 mb-6 ${score >= 75 ? 'bg-emerald-50 border border-emerald-100' : score >= 50 ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Your AI Match Score</p>
              <p className={`text-5xl font-black ${score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {score}<span className="text-lg font-normal text-gray-300">/100</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {score >= 75 ? 'Strong match for this role' : score >= 50 ? 'Moderate match for this role' : 'Keep developing your skills'}
              </p>
            </div>
          )}
          <Link href="/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-colors">
            View More Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-gray-900 text-sm">HireIQ</span>
          </div>
          <Link href="/jobs" className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to jobs
          </Link>
          {job && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-950">{job.title}</h1>
                <p className="text-xs text-gray-400">Complete the form below — your CV is AI-screened instantly on submission</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 mb-4">Personal Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">First Name *</label>
                    <input type="text" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} className={input} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Last Name *</label>
                    <input type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className={input} required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Address *</label>
                  <input type="email" placeholder="jane@email.com" value={email} onChange={e => setEmail(e.target.value)} className={input} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input type="tel" placeholder="+254 700 000 000" value={phone} onChange={e => setPhone(e.target.value)} className={input} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 mb-4">Upload Your CV</h2>
              <div
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
                  ${isDragging ? 'border-indigo-400 bg-indigo-50' : fileName ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                    <p className="text-sm font-semibold text-gray-500">Reading your CV...</p>
                  </div>
                ) : fileName ? (
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <CheckCircle className="w-7 h-7 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-700">{fileName}</p>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-wider">Ready to submit</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">Drop your CV here or <span className="text-indigo-600 font-bold">browse</span></p>
                    <p className="text-xs text-gray-400">PDF only · Max 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-600 font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full py-4 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting and Screening CV...</>
                : isUploading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading CV...</>
                : '✦ Submit Application'
              }
            </button>
          </form>

          {job && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit sticky top-6">
              <h2 className="text-sm font-black text-gray-900 mb-3">Role Details</h2>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">{job.title}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{job.description}</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">Your CV is automatically screened by AI the moment you apply. You will see your match score immediately after submitting.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
