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
      ? `🎉 Congratulations! You have been selected — ${application.job.title} at HireIQ`
      : `Update on your application — ${application.job.title} at HireIQ`

    const emailBody = isRecruited
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 16px 16px 0 0; padding: 40px 32px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Congratulations!</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">You have been selected</p>
          </div>
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="color: #374151; font-size: 16px; font-weight: 700; margin: 0 0 8px;">Hi ${application.firstName},</p>
            <p style="color: #6b7280; line-height: 1.7; margin: 0 0 24px; font-size: 14px;">
              We are thrilled to inform you that after reviewing your application for the <strong style="color: #111827;">${application.job.title}</strong> position, you have been <strong style="color: #059669;">selected to move forward</strong> in our recruitment process.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #065f46; margin: 0 0 4px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
              <p style="color: #065f46; margin: 0; font-size: 16px; font-weight: 700;">${application.job.title}</p>
              <p style="color: #059669; margin: 8px 0 0; font-size: 13px; font-weight: 600;">✅ Selected for Interview</p>
            </div>
            <p style="color: #6b7280; line-height: 1.7; font-size: 14px; margin: 0 0 24px;">
              Our recruitment team will be in touch with you shortly to schedule your interview and discuss the next steps in the process.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br/>
              <strong style="color: #111827;">The HireIQ Recruitment Team</strong>
            </p>
          </div>
          <p style="text-align: center; color: #d1d5db; font-size: 11px; margin: 16px 0;">Powered by HireIQ · AI Recruitment Intelligence</p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
          <div style="background: #f9fafb; border-radius: 16px 16px 0 0; padding: 40px 32px; text-align: center; border: 1px solid #e5e7eb; border-bottom: none;">
            <div style="font-size: 40px; margin-bottom: 8px;">📋</div>
            <h1 style="color: #374151; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Application Update</h1>
            <p style="color: #9ca3af; margin: 8px 0 0; font-size: 14px;">Regarding your recent application</p>
          </div>
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="color: #374151; font-size: 16px; font-weight: 700; margin: 0 0 8px;">Hi ${application.firstName},</p>
            <p style="color: #6b7280; line-height: 1.7; margin: 0 0 24px; font-size: 14px;">
              Thank you sincerely for taking the time to apply for the <strong style="color: #111827;">${application.job.title}</strong> position and for your interest in joining our team.
            </p>
            <p style="color: #6b7280; line-height: 1.7; margin: 0 0 24px; font-size: 14px;">
              After carefully reviewing all applications, we regret to inform you that we will not be moving forward with your candidacy at this time. This was a difficult decision as we received many strong applications.
            </p>
            <div style="background: #fef9f0; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #92400e; margin: 0 0 4px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Position Applied For</p>
              <p style="color: #92400e; margin: 0; font-size: 16px; font-weight: 700;">${application.job.title}</p>
              <p style="color: #d97706; margin: 8px 0 0; font-size: 13px; font-weight: 600;">Application unsuccessful at this time</p>
            </div>
            <p style="color: #6b7280; line-height: 1.7; font-size: 14px; margin: 0 0 24px;">
              We genuinely encourage you to continue developing your skills and to apply for future roles that match your profile. We wish you every success in your job search.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br/>
              <strong style="color: #111827;">The HireIQ Recruitment Team</strong>
            </p>
          </div>
          <p style="text-align: center; color: #d1d5db; font-size: 11px; margin: 16px 0;">Powered by HireIQ · AI Recruitment Intelligence</p>
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
    return NextResponse.json({ error: 'Failed to update: ' + error.message }, { status: 500 })
  }
}
