import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const session = await prisma.interviewSession.findUnique({
      where: { token },
      include: { application: { include: { job: true } } }
    })

    if (!session) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    if (session.completed) return NextResponse.json({ error: 'Already completed' }, { status: 400 })
    if (new Date() > session.expiresAt) return NextResponse.json({ error: 'Link expired' }, { status: 410 })

    return NextResponse.json({
      candidateName: `${session.application.firstName} ${session.application.lastName}`,
      jobTitle: session.application.job.title,
      questions: JSON.parse(session.questions),
      expiresAt: session.expiresAt,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { answers } = await request.json()

    const session = await prisma.interviewSession.findUnique({
      where: { token },
      include: { application: { include: { job: true } } }
    })

    if (!session) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    if (session.completed) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    if (new Date() > session.expiresAt) return NextResponse.json({ error: 'Link expired' }, { status: 410 })

    const questions = JSON.parse(session.questions)

    const scoringPrompt = `You are an expert interviewer scoring candidate responses.

Job Title: ${session.application.job.title}

Score each answer from 1-10 and provide a brief reason.

${questions.map((q: any, i: number) => `
Question ${i + 1} (${q.type}): ${q.question}
Candidate Answer: ${answers[i] || 'No answer provided'}
`).join('\n')}

Return ONLY valid JSON, no markdown:
{
  "scores": [
    { "questionId": 1, "score": <1-10>, "feedback": "<one sentence reason>" },
    { "questionId": 2, "score": <1-10>, "feedback": "<one sentence reason>" },
    { "questionId": 3, "score": <1-10>, "feedback": "<one sentence reason>" },
    { "questionId": 4, "score": <1-10>, "feedback": "<one sentence reason>" },
    { "questionId": 5, "score": <1-10>, "feedback": "<one sentence reason>" }
  ],
  "overallScore": <average score as number>,
  "recommendation": "<one paragraph overall assessment of the candidate based on their answers>"
}`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: scoringPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? ''
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const aiScoring = JSON.parse(cleaned)

    await prisma.interviewSession.update({
      where: { token },
      data: {
        answers: JSON.stringify(answers),
        aiScores: JSON.stringify(aiScoring),
        completed: true,
      }
    })

    return NextResponse.json({ success: true, scoring: aiScoring })
  } catch (error: any) {
    console.error('Answer submission error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
