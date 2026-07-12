import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      include: {
        job: true,
        interviewSessions: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(applications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, resumeText, fileName, jobId } = body

    if (!firstName || !lastName || !email || !resumeText || !jobId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const prompt = `You are an expert HR Analyst and ATS specialist.
Analyze the resume against the job description and return ONLY valid JSON, no markdown.

Job Title: ${job.title}
Job Description: ${job.description}

Resume Text:
${resumeText.substring(0, 3000)}

Return ONLY:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence candidate summary>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"]
}`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? ''
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const ai = JSON.parse(cleaned)

    const application = await prisma.application.create({
      data: {
        firstName, lastName, email,
        phone: phone || null,
        resumeText, fileName, jobId,
        aiScore: ai.score,
        aiSummary: ai.summary,
        aiStrengths: JSON.stringify(ai.strengths),
        aiWeaknesses: JSON.stringify(ai.weaknesses),
        aiSuggestions: JSON.stringify(ai.suggestions),
        status: 'pending',
      }
    })

    return NextResponse.json({ success: true, applicationId: application.id, score: ai.score })
  } catch (error: any) {
    console.error('Application error:', error)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}
