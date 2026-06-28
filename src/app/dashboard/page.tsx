'use client'

import { useState, useEffect, useMemo } from 'react'
import { Users, Trash2, LogIn, LogOut, Loader2, Search, RefreshCw, Pencil, X, Check, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface Employee {
  id: number; firstName: string; lastName: string; email: string; phone: string | null
  departmentId: number; createdAt: string
  attendanceLogs: { status: string; timestamp: string }[]
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full skeleton shrink-0" /><div className="h-3 skeleton rounded w-32" /></div></td>
      <td className="px-6 py-4 hidden md:table-cell"><div className="h-3 skeleton rounded w-40" /></td>
      <td className="px-6 py-4"><div className="h-6 skeleton rounded-full w-20" /></td>
      <td className="px-6 py-4"><div className="h-3 skeleton rounded w-16 ml-auto" /></td>
    </tr>
  )
}

function EditModal({ employee, onClose, onSaved }: { employee: Employee; onClose: () => void; onSaved: () => void }) {
  const [firstName, setFirstName] = useState(employee.firstName)
  const [lastName, setLastName] = useState(employee.lastName)
  const [email, setEmail] = useState(employee.email)
  const [phone, setPhone] = useState(employee.phone ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Employee updated')
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const input = "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black text-gray-900">Edit Employee</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className={input} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
            <input type="tel" placeholder="+254 700 000 000" value={phone} onChange={e => setPhone(e.target.value)} className={input} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const fetchEmployees = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try { const res = await fetch('/api/employees'); setEmployees(await res.json()) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchEmployees() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return employees
    const q = search.toLowerCase()
    return employees.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
  }, [employees, search])

  const getStatus = (emp: Employee) => emp.attendanceLogs?.[0]?.status ?? null
  const clockedIn = employees.filter(e => getStatus(e) === 'Mark Active').length
  const clockedOut = employees.filter(e => getStatus(e) === 'Mark Inactive').length

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove ${name}?`)) return
    setActionId(id)
    try { await fetch(`/api/employees/${id}`, { method: 'DELETE' }); setEmployees(p => p.filter(e => e.id !== id)); toast.success(`${name} removed`) }
    catch { toast.error('Delete failed') }
    finally { setActionId(null) }
  }

  const handleAttendance = async (id: number, status: string, name: string) => {
    setActionId(id)
    try {
      await fetch(`/api/employees/${id}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      await fetchEmployees(true); toast.success(`${name} — ${status}`)
    } catch { toast.error('Failed') }
    finally { setActionId(null) }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live Data
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tight leading-none">Candidate Directory</h1>
            <p className="text-gray-400 mt-2 text-sm">AI-powered candidate pipeline — track screening status and hiring progress in real time.</p>
          </div>
          <button onClick={() => fetchEmployees(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Candidates', value: employees.length, sub: 'In hiring pipeline', color: 'text-indigo-600', border: 'border-indigo-100' },
            { label: 'Clocked In', value: clockedIn, sub: 'Currently active', color: 'text-emerald-600', border: 'border-emerald-100' },
            { label: 'Clocked Out', value: clockedOut, sub: 'Marked inactive', color: 'text-amber-500', border: 'border-amber-100' },
          ].map(({ label, value, sub, color, border }) => (
            <div key={label} className={`bg-white rounded-2xl border ${border} p-5 shadow-sm`}>
              <p className="text-xs font-bold text-gray-400 mb-2">{label}</p>
              <p className={`text-5xl font-black ${color} tracking-tight tabular-nums`}>{loading ? '—' : value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 md:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-gray-900">Pipeline Directory</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">{employees.length} total record{employees.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium rounded-xl border border-gray-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all placeholder:text-gray-300 text-gray-700" />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <table className="w-full"><tbody className="divide-y divide-gray-50">{[1,2,3].map(i => <SkeletonRow key={i} />)}</tbody></table>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-gray-100 flex items-center justify-center">
                  <Users className="w-7 h-7 text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-300">{search ? 'No results found' : 'No employees yet'}</p>
                {!search && <p className="text-xs text-gray-300">Add your first employee in Manage Records</p>}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50">
                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Contact</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(emp => {
                    const status = getStatus(emp)
                    const busy = actionId === emp.id
                    const name = `${emp.firstName} ${emp.lastName}`
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-400">{emp.email}</p>
                          {emp.phone && (
                            <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />{emp.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {status ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                              ${status === 'Mark Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status === 'Mark Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              {status}
                            </span>
                          ) : <span className="text-xs text-gray-300 font-semibold">No record</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {busy ? <Loader2 className="w-4 h-4 text-gray-300 animate-spin" /> : (
                              <>
                                <button onClick={() => setEditingEmployee(emp)} title="Edit"
                                  className="p-2 rounded-lg text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleAttendance(emp.id, 'Mark Active', name)} title="Mark Active"
                                  className="p-2 rounded-lg text-gray-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><LogIn className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleAttendance(emp.id, 'Mark Inactive', name)} title="Mark Inactive"
                                  className="p-2 rounded-lg text-gray-300 hover:bg-amber-50 hover:text-amber-600 transition-all"><LogOut className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDelete(emp.id, name)} title="Delete"
                                  className="p-2 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {editingEmployee && (
        <EditModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSaved={() => fetchEmployees(true)}
        />
      )}
    </div>
  )
}
