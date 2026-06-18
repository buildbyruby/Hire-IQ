import Link from 'next/link'
import { FileSearch, Users, LayoutGrid, ArrowUpRight, Sparkles, Zap, Shield, Activity } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-4xl mx-auto">

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 md:p-12 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-50 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI-Powered HR Platform</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-gray-950 leading-[1.05] tracking-tight mb-5">
              Hire smarter.<br />
              <span className="text-indigo-600">Lead better.</span>
            </h1>

            <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-xl mb-8">
              AI resume screening, live workforce tracking, and intelligent HR management — engineered for teams that move fast.
            </p>

            <div className="flex flex-wrap gap-3">
              {[
                { icon: Zap, label: 'Gemini 2.0 Flash', sub: 'AI Engine' },
                { icon: Shield, label: 'Supabase', sub: 'PostgreSQL DB' },
                { icon: Activity, label: 'Next.js 15', sub: 'App Router' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-gray-100">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-xs font-bold text-gray-700 leading-none">{label}</p>
                    <p className="text-[10px] text-gray-400 leading-none mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/analysis', icon: FileSearch, title: 'Resume Analysis', description: 'AI-powered ATS scoring. Upload any PDF and match it against a job description in seconds.', tag: 'Gemini AI', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tagColor: 'text-indigo-500' },
            { href: '/dashboard', icon: Users, title: 'HR Dashboard', description: 'Live employee directory. Track attendance and monitor your workforce in real time.', tag: 'Live', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tagColor: 'text-emerald-500' },
            { href: '/manage', icon: LayoutGrid, title: 'Manage Records', description: 'Create job postings and onboard employees. Every record syncs instantly to Supabase.', tag: 'Supabase', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', tagColor: 'text-violet-500' },
          ].map(({ href, icon: Icon, title, description, tag, color, bg, border, tagColor }) => (
            <Link key={href} href={href}
              className="group bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${bg} border ${border}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${tagColor}`}>{tag}</span>
                  <ArrowUpRight className={`w-3.5 h-3.5 text-gray-300 group-hover:${color} transition-colors`} />
                </div>
              </div>
              <h2 className="text-sm font-black text-gray-900 mb-2">{title}</h2>
              <p className="text-xs text-gray-400 leading-relaxed flex-1">{description}</p>
              <div className={`mt-4 pt-4 border-t border-gray-100 text-[10px] font-bold ${tagColor} uppercase tracking-wider flex items-center gap-1`}>
                Open <ArrowUpRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-center text-[10px] text-gray-300 font-medium tracking-wide">
          SmartHR v2.0 · Next.js 15 · TypeScript · Prisma · Supabase · Gemini 2.0
        </p>
      </div>
    </div>
  )
}
