import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Briefcase, ArrowUpRight, Sparkles } from 'lucide-react'

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900">HireIQ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight mb-2">Open Positions</h1>
          <p className="text-gray-400">Find your next opportunity. Apply directly — AI screens your CV instantly.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-300 font-bold">No open positions right now</p>
            <p className="text-gray-300 text-sm mt-1">Check back soon</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-gray-900">{job.title}</h2>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 ml-13">
                      {job.description.substring(0, 200)}...
                    </p>
                  </div>
                  <Link href={`/jobs/${job.id}`}
                    className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-colors shadow-sm">
                    Apply Now <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
