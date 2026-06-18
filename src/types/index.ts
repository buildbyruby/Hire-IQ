export interface Job {
  id: number
  title: string
  description: string
  departmentId: number
  createdAt: Date
}

export interface Employee {
  id: number
  firstName: string
  lastName: string
  email: string
  departmentId: number
  createdAt: Date
  performanceLogs?: PerformanceLog[]
  attendanceLogs?: AttendanceLog[]
}

export interface PerformanceLog {
  id: number
  logDate: Date
  rating: number
  notes?: string
  employeeId: number
}

export interface AttendanceLog {
  id: number
  status: string
  timestamp: Date
  employeeId: number
}

export interface AnalysisResult {
  score: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}
