'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle, Sparkles, Clock } from 'lucide-react'

interface Question { id: number; type: string; question: string }
interface SessionData {
  candidateName: string
  jobTitle: string
  questions: Question[]
  expiresAt: string
}
interface ScoreResult {
  scores: { questionId: number; score: number; feedback: string }[]
  overallScore: number
  recommendation: string
}

const SECONDS_PER_QUESTION = 120

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    setTimeLeft(seconds)
  }, [seconds])

  useEffect(() => {
    if (timeLeft <= 0) { onExpire(); return }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, onExpire])

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const pct = (timeLeft / SECONDS_PER_QUESTION) * 100
  const isUrgent = timeLeft <= 30

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-100'}`}>
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-black ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-500' : 'text-amber-500'}`}>
            {isUrgent ? 'Hurry!' : 'Time remaining'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function InterviewPage() {
  const params = useParams()
  const token = params.token as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState('')
  const [timerKey, setTimerKey] = useState(0)
  const [locked, setLocked] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    fetch(`/api/interview-session/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setSession(data)
        setAnswers(new Array(data.questions.length).fill(''))
        setLoading(false)
      })
      .catch(() => { setError('Failed to load interview'); setLoading(false) })
  }, [token])

  const submitAll = useCallback(async (finalAnswers: string[]) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/interview-session/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.scoring)
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message || 'Submission failed')
    } finally { setSubmitting(false) }
  }, [token])

  const moveToNext = useCallback((answerToSave: string) => {
    if (!session) return
    setLocked(true)

    const newAnswers = [...answers]
    newAnswers[currentIndex] = answerToSave
    setAnswers(newAnswers)

    setTimeout(() => {
      if (currentIndex >= session.questions.length - 1) {
        submitAll(newAnswers)
      } else {
        setCurrentIndex(p => p + 1)
        setCurrentAnswer('')
        setLocked(false)
        setTimerKey(p => p + 1)
      }
    }, 800)
  }, [session, answers, currentIndex, submitAll])

  const handleTimerExpire = useCallback(() => {
    if (locked) return
    moveToNext(currentAnswer)
  }, [locked, currentAnswer, moveToNext])

  const handleNext = () => {
    if (locked) return
    moveToNext(currentAnswer)
  }

  const typeColors: Record<string, string> = {
    Technical: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Behavioral: 'bg-violet-50 text-violet-700 border-violet-100',
    Situational: 'bg-amber-50 text-amber-700 border-amber-100',
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-gray-400 font-medium">Loading your interview...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-2">
          {error === 'Link expired' ? 'This link has expired' :
           error === 'Already completed' ? 'Already submitted' : 'Invalid link'}
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          {error === 'Link expired' ? 'Interview links expire after 48 hours. Please contact the recruiter for a new link.' :
           error === 'Already completed' ? 'You have already submitted your answers for this interview. Results have been sent to the recruiter.' :
           'This interview link is not valid. Please check your email for the correct link.'}
        </p>
      </div>
    </div>
  )

  if (submitting) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-gray-800 font-black text-lg mb-1">Scoring your answers...</p>
        <p className="text-gray-400 text-sm">Our AI is reviewing your responses</p>
      </div>
    </div>
  )

  if (submitted && result) return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-950 mb-2">Interview Complete!</h1>
          <p className="text-gray-400 text-sm mb-6">Your answers have been scored. The recruiter will review your results and be in touch.</p>
          <div className={`rounded-2xl p-6 mb-4 ${result.overallScore >= 7 ? 'bg-emerald-50 border border-emerald-100' : result.overallScore >= 5 ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Your Interview Score</p>
            <p className={`text-5xl font-black ${result.overallScore >= 7 ? 'text-emerald-600' : result.overallScore >= 5 ? 'text-amber-500' : 'text-red-500'}`}>
              {result.overallScore}<span className="text-lg font-normal text-gray-300">/10</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {result.overallScore >= 7 ? 'Strong performance' : result.overallScore >= 5 ? 'Good effort' : 'Keep developing your skills'}
            </p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{result.recommendation}</p>
        </div>

        <div className="space-y-3">
          {result.scores.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-gray-500">Question {s.questionId}</p>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${s.score >= 7 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : s.score >= 5 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {s.score}/10
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{s.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (!session) return null

  if (!started) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-7 h-7 text-indigo-500" />
        </div>
        <h1 className="text-xl font-black text-gray-950 mb-1">Ready for your interview?</h1>
        <p className="text-sm text-gray-500 mb-2">Hi {session.candidateName.split(' ')[0]}</p>
        <p className="text-xs text-gray-400 mb-6">Position: <strong className="text-gray-700">{session.jobTitle}</strong></p>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left space-y-2">
          <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">Before you start — read this</p>
          {[
            '5 questions total',
            '2 minutes per question — timer starts immediately',
            'When time runs out, your answer locks automatically',
            'You cannot go back to a previous question',
            'Complete all questions in one sitting',
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-xs text-amber-800 leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>

        <button onClick={() => setStarted(true)}
          className="w-full py-4 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
          I understand — Start Interview
        </button>
      </div>
    </div>
  )

  const currentQuestion = session.questions[currentIndex]
  const progress = ((currentIndex) / session.questions.length) * 100

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-black text-gray-900 text-sm">HireIQ Interview</span>
            </div>
            <span className="text-xs font-black text-gray-400">
              Question {currentIndex + 1} of {session.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-4">
          <Timer
            key={`${timerKey}-${currentIndex}`}
            seconds={SECONDS_PER_QUESTION}
            onExpire={handleTimerExpire}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${typeColors[currentQuestion.type] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
              {currentQuestion.type}
            </span>
            <span className="text-[10px] text-gray-300 font-bold">Q{currentIndex + 1}</span>
          </div>
          <p className="text-base font-bold text-gray-900 leading-relaxed mb-5">
            {currentQuestion.question}
          </p>
          <textarea
            rows={6}
            placeholder="Type your answer here..."
            value={currentAnswer}
            onChange={e => !locked && setCurrentAnswer(e.target.value)}
            disabled={locked}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all resize-none leading-relaxed
              ${locked ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-50 border-gray-200 focus:bg-white'}`}
          />
          {locked && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <p className="text-xs font-bold text-indigo-600">
                {currentIndex >= session.questions.length - 1 ? 'Submitting your answers...' : 'Moving to next question...'}
              </p>
            </div>
          )}
        </div>

        {!locked && (
          <button onClick={handleNext}
            className="w-full py-4 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            {currentIndex >= session.questions.length - 1 ? 'Submit Final Answer' : 'Submit Answer & Next Question →'}
          </button>
        )}

        <p className="text-[10px] text-gray-300 text-center mt-3">
          You cannot go back once you move to the next question
        </p>
      </div>
    </div>
  )
}
