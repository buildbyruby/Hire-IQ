import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const isRecruited = status === 'recruited'
    const subject = isRecruited
      ? `Congratulations! You've been selected — ${application.job.title}`
      : `Update on your application — ${application.job.title}`

    const emailBody = isRecruited
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <div style="background: #4f46e5; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
          </div>
          <h2 style="color: #111827;">Hi ${application.firstName},</h2>
          <p style="color: #6b7280; line-height: 1.6;">We are excited to let you know that after reviewing your application for the <strong>${application.job.title}</strong> position, you have been <strong style="color: #059669;">selected to move forward</strong> in our recruitment process.</p>
          <p style="color: #6b7280; line-height: 1.6;">Our team will be in touch shortly with next steps regarding your interview schedule.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #065f46; margin: 0; font-weight: 600;">Position: ${application.job.title}</p>
            <p style="color: #065f46; margin: 4px 0 0;">Status: ✅ Selected for Interview</p>
          </div>
          <p style="color: #6b7280;">Best regards,<br/><strong>HireIQ Recruitment Team</strong></p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <div style="background: #f9fafb; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: #374151; margin: 0; font-size: 24px;">Application Update</h1>
          </div>
          <h2 style="color: #111827;">Hi ${application.firstName},</h2>
          <p style="color: #6b7280; line-height: 1.6;">Thank you for taking the time to apply for the <strong>${application.job.title}</strong> position at our company.</p>
          <p style="color: #6b7280; line-height: 1.6;">After carefully reviewing your application, we regret to inform you that we will not be moving forward with your candidacy at this time. We received many strong applications and this was a difficult decision.</p>
          <div style="background: #fef9f0; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400e; margin: 0; font-weight: 600;">Position: ${application.job.title}</p>
            <p style="color: #92400e; margin: 4px 0 0;">Status: Application not successful</p>
          </div>
          <p style="color: #6b7280; line-height: 1.6;">We encourage you to apply for future openings that match your profile. We wish you the very best in your job search.</p>
          <p style="color: #6b7280;">Best regards,<br/><strong>HireIQ Recruitment Team</strong></p>
        </div>
      `

    await resend.emails.send({
      from: 'HireIQ <onboarding@resend.dev>',
      to: application.email,
      subject,
      html: emailBody,
    })

    return NextResponse.json({ success: true, status: application.status })
  } catch (error: any) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Failed to update status: ' + error.message }, { status: 500 })
  }
}
