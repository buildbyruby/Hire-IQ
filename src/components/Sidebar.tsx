'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileSearch, Users, LayoutGrid, Home, Menu, X, Sparkles, Briefcase, UserCheck } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/jobs', label: 'Job Listings', icon: Briefcase },
  { href: '/analysis', label: 'Candidate Intelligence', icon: FileSearch },
  { href: '/recruiter', label: 'Applications', icon: UserCheck },
  { href: '/dashboard', label: 'Pipeline Directory', icon: Users },
  { href: '/manage', label: 'Manage Records', icon: LayoutGrid },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => { setIsOpen(false) }, [pathname])

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
        <button onClick={() => setIsOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Menu className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-black text-gray-900 text-sm">HireIQ</span>
        </div>
      </div>

      <div className="md:hidden h-14 shrink-0" />

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col
        transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0
      `}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-gray-950 text-sm leading-none">HireIQ</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Candidate Intelligence</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')  && href !== '/'
            return (
              <Link key={href} href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                  ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-200' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-gray-100">
          <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-slate-50 border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-gray-700 leading-none">All systems online</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Supabase · Groq · Resend</p>
            </div>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors
                ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-bold">{label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
