'use client'

import { useState, useEffect } from 'react'
import { Briefcase, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ManagePage() {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [jobLoading, setJobLoading] = useState(false)
  const [jobCount, setJobCount] = useState<number | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [empLoading, setEmpLoading] = useState(false)
  const [empCount, setEmpCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(d => setJobCount(Array.isArray(d) ? d.length : 0)).catch(() => {})
    fetch('/api/employees').then(r => r.json()).then(d => setEmpCount(Array.isArray(d) ? d.length : 0)).catch(() => {})
  }, [])

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!jobTitle.trim() || !jobDesc.trim()) return
    setJobLoading(true)
    try {
      const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: jobTitle, description: jobDesc, departmentId: 1 }) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error)
      toast.success(`"${data.title}" created`); setJobTitle(''); setJobDesc(''); setJobCount(p => (p ?? 0) + 1)
    } catch (e: any) { toast.error(e.message) } finally { setJobLoading(false) }
  }

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!firstName.trim() || !lastName.trim() || !email.trim()) return
    setEmpLoading(true)
    try {
      const res = await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, lastName, email, phone, departmentId: 1 }) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error)
      toast.success(`${data.firstName} ${data.lastName} onboarded`); setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setEmpCount(p => (p ?? 0) + 1)
    } catch (e: any) { toast.error(e.message) } finally { setEmpLoading(false) }
  }

  const input = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white focus:border-transparent transition-all"

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-[10px] font-black text-violet-600 uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />Records
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight leading-none">Manage Records</h1>
          <p className="text-gray-400 mt-2 text-sm">Create job postings and onboard employees. All data syncs live to Supabase.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Job Postings', value: jobCount, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Employees', value: empCount, icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`bg-white rounded-2xl border ${border} p-5 shadow-sm flex items-center gap-4`}>
              <div className={`w-11 h-11 rounded-2xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">{label}</p>
                <p className={`text-4xl font-black ${color} tabular-nums`}>{value === null ? '—' : value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900">New Job Posting</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Used as the base for AI resume analysis</p>
              </div>
            </div>
            <form onSubmit={handleJobSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Job Title *</label>
                <input type="text" placeholder="e.g. Senior Software Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className={input} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Job Description *</label>
                <textarea rows={6} placeholder="Describe the role, responsibilities, required skills and qualifications. More detail = better AI analysis." value={jobDesc} onChange={e => setJobDesc(e.target.value)} className={`${input} resize-none leading-relaxed`} />
              </div>
              <button type="submit" disabled={jobLoading || !jobTitle.trim() || !jobDesc.trim()}
                className="w-full py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2">
                {jobLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : '+ Create Job Posting'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900">Onboard Employee</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Add a new team member to the system</p>
              </div>
            </div>
            <form onSubmit={handleEmpSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">First Name *</label>
                  <input type="text" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} className={input} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Last Name *</label>
                  <input type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className={input} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Work Email *</label>
                <input type="email" placeholder="jane.doe@company.com" value={email} onChange={e => setEmail(e.target.value)} className={input} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input type="tel" placeholder="+254 700 000 000" value={phone} onChange={e => setPhone(e.target.value)} className={input} />
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 mb-1">After onboarding</p>
                <p className="text-xs text-gray-500 leading-relaxed">Employee will appear in the HR Dashboard for attendance tracking and performance management.</p>
              </div>
              <button type="submit" disabled={empLoading || !firstName.trim() || !lastName.trim() || !email.trim()}
                className="w-full py-3.5 rounded-xl bg-gray-950 text-white text-sm font-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200 active:scale-[0.98] flex items-center justify-center gap-2">
                {empLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Onboarding...</> : '+ Onboard Employee'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
