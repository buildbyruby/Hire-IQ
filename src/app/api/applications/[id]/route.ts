import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import Groq from 'groq-sdk'

const resend = new Resend(process.env.RESEND_API_KEY)
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

    if (!status) return NextResponse.json({ error: 'Status required' }, { status: 400 })

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: { job: true }
    })

    if (status === 'recruited') {
      const weaknesses = JSON.parse(application.aiWeaknesses)

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

      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

      const session = await prisma.interviewSession.create({
        data: {
          applicationId,
          questions: JSON.stringify(questions),
          expiresAt,
        }
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const interviewUrl = `${appUrl}/interview/${session.token}`

      await resend.emails.send({
        from: 'HireIQ <onboarding@resend.dev>',
        to: application.email,
        subject: `Congratulations! You have been selected — ${application.job.title} at HireIQ`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#4f46e5;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
              <div style="font-size:36px;">🎉</div>
              <h1 style="color:white;margin:8px 0 0;font-size:22px;font-weight:900;">Congratulations ${application.firstName}!</h1>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">You have been shortlisted for ${application.job.title}</p>
            </div>
            <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
                We are excited to move you to the next stage. Please complete your interview questions using the button below.
                Each question has a <strong>2-minute timer</strong> — once time is up, the question locks and you move to the next one automatically.
              </p>
              <div style="background:#fef9f0;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="color:#92400e;margin:0;font-size:13px;font-weight:700;">⏰ Important — Please read before starting</p>
                <ul style="color:#92400e;margin:8px 0 0;padding-left:16px;font-size:12px;line-height:1.8;">
                  <li>You have <strong>2 minutes per question</strong></li>
                  <li>Once you move to the next question, you <strong>cannot go back</strong></li>
                  <li>Once the timer runs out, your answer locks automatically</li>
                  <li>Complete all 5 questions in one sitting</li>
                </ul>
              </div>
              <a href="${interviewUrl}" style="display:block;background:#4f46e5;color:white;text-decoration:none;padding:16px 24px;border-radius:10px;text-align:center;font-weight:900;font-size:15px;margin-bottom:20px;">
                Start Interview Questions →
              </a>
              <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">This link expires in 48 hours</p>
            </div>
            <p style="text-align:center;color:#d1d5db;font-size:11px;margin:12px 0;">Powered by HireIQ · AI Recruitment Intelligence</p>
          </div>
        `
      })

    } else if (status === 'rejected') {
      await resend.emails.send({
        from: 'HireIQ <onboarding@resend.dev>',
        to: application.email,
        subject: `Update on your application — ${application.job.title} at HireIQ`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
              <div style="font-size:36px;">📋</div>
              <h1 style="color:#374151;margin:8px 0 0;font-size:22px;font-weight:900;">Application Update</h1>
            </div>
            <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <p style="color:#374151;font-size:15px;font-weight:700;margin:0 0 12px;">Hi ${application.firstName},</p>
              <p style="color:#6b7280;line-height:1.7;font-size:14px;margin:0 0 20px;">
                Thank you for applying for <strong>${application.job.title}</strong>. After careful review, we regret to inform you we will not be moving forward at this time.
              </p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 20px;">We encourage you to apply for future roles and wish you the very best.</p>
              <p style="color:#6b7280;font-size:14px;margin:0;">Best regards,<br/><strong style="color:#111827;">HireIQ Recruitment Team</strong></p>
            </div>
            <p style="text-align:center;color:#d1d5db;font-size:11px;margin:12px 0;">Powered by HireIQ</p>
          </div>
        `
      })
    }

    return NextResponse.json({ success: true, status: application.status })
  } catch (error: any) {
    console.error('Update error:', error)
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
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
