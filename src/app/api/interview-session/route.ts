import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'
import { Resend } from 'resend'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json()

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true }
    })
    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let weaknesses: string[] = []
    try {
      weaknesses = JSON.parse(application.aiWeaknesses)
    } catch {
      weaknesses = []
    }

    const existingSession = await prisma.interviewSession.findFirst({
      where: {
        applicationId,
        completed: false,
        expiresAt: { gt: new Date() },
      },
    })

    if (existingSession) {
      return NextResponse.json({
        success: true,
        token: existingSession.token,
        expiresAt: existingSession.expiresAt,
        note: 'Active interview session already exists — reused instead of creating a duplicate.',
      })
    }


    const prompt = `You are an expert interviewer.
Generate exactly 5 interview questions for this candidate.

Job Title: ${application.job.title}
Candidate Weaknesses: ${weaknesses.join(', ')}
Resume Summary: ${application.aiSummary}

Return ONLY valid JSON, no markdown:
{
  "questions": [
    { "id": 1, "type": "Technical", "question": "..." },
    { "id": 2, "type": "Behavioral", "question": "..." },
    { "id": 3, "type": "Situational", "question": "..." },
    { "id": 4, "type": "Technical", "question": "..." },
    { "id": 5, "type": "Behavioral", "question": "..." }
  ]
}`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? ''
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const { questions } = JSON.parse(cleaned)

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const session = await prisma.interviewSession.create({
      data: {
        applicationId,
        questions: JSON.stringify(questions),
        expiresAt,
      }
    })

    const interviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/${session.token}`

    await resend.emails.send({
      from: 'HireIQ <onboarding@resend.dev>',
      to: application.email,
      subject: `Your Interview Questions — ${application.job.title} at HireIQ`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#4f46e5;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
            <div style="font-size:36px;">📝</div>
            <h1 style="color:white;margin:8px 0 0;font-size:22px;font-weight:900;">Interview Questions Ready</h1>
          </div>
          <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#374151;font-size:15px;font-weight:700;margin:0 0 12px;">Hi ${application.firstName},</p>
            <p style="color:#6b7280;line-height:1.7;font-size:14px;margin:0 0 20px;">
              Congratulations on being shortlisted for the <strong>${application.job.title}</strong> position. 
              Please answer the interview questions at the link below.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
              <p style="color:#065f46;margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;">⏰ Important</p>
              <p style="color:#065f46;margin:0;font-size:13px;">This link expires in <strong>24 hours</strong>. Please complete your responses before then.</p>
            </div>
            <a href="${interviewUrl}" style="display:block;background:#4f46e5;color:white;text-decoration:none;padding:14px 24px;border-radius:10px;text-align:center;font-weight:900;font-size:15px;margin-bottom:20px;">
              Answer Interview Questions →
            </a>
            <p style="color:#9ca3af;font-size:12px;margin:0;">Or copy this link: ${interviewUrl}</p>
          </div>
          <p style="text-align:center;color:#d1d5db;font-size:11px;margin:12px 0;">Powered by HireIQ</p>
        </div>
      `
    })

    return NextResponse.json({ success: true, token: session.token, expiresAt })
  } catch (error: any) {
    console.error('Interview session error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
