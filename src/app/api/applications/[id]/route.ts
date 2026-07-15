import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'
import { sendEmail, recruitedEmail, rejectedEmail } from '@/lib/email'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const applicationId = parseInt(id)
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 })
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: { job: true }
    })

    if (status === 'recruited') {
      const weaknesses = JSON.parse(application.aiWeaknesses)

      const prompt = `You are an expert interviewer. Generate exactly 5 interview questions.
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

      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

      const session = await prisma.interviewSession.create({
        data: {
          applicationId,
          questions: JSON.stringify(questions),
          expiresAt,
        }
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hire-iq-self.vercel.app'
      const interviewUrl = `${appUrl}/interview/${session.token}`

      await sendEmail({
        to: application.email,
        subject: `🎉 Congratulations! You have been shortlisted — ${application.job.title}`,
        html: recruitedEmail(application.firstName, application.job.title, interviewUrl),
      })

    } else if (status === 'rejected') {
      await sendEmail({
        to: application.email,
        subject: `Update on your application — ${application.job.title}`,
        html: rejectedEmail(application.firstName, application.job.title),
      })
    }

    return NextResponse.json({ success: true, status: application.status })
  } catch (error: any) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.application.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete: ' + error.message }, { status: 500 })
  }
}
