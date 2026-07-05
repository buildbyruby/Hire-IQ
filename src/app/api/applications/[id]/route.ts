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

    if (status !== 'pending') {
      const isRecruited = status === 'recruited'
      const subject = isRecruited
        ? `Congratulations! You have been selected for ${application.job.title}`
        : `Update on your application for ${application.job.title}`

      const emailBody = isRecruited
        ? `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#4f46e5;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
              <div style="font-size:36px;">🎉</div>
              <h1 style="color:white;margin:8px 0 0;font-size:22px;font-weight:900;">Congratulations!</h1>
            </div>
            <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <p style="color:#374151;font-size:15px;font-weight:700;margin:0 0 12px;">Hi ${application.firstName},</p>
              <p style="color:#6b7280;line-height:1.7;margin:0 0 20px;font-size:14px;">We are excited to inform you that you have been <strong style="color:#059669;">selected</strong> for the <strong>${application.job.title}</strong> position.</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
                <p style="color:#065f46;margin:0;font-weight:700;">Position: ${application.job.title}</p>
                <p style="color:#059669;margin:6px 0 0;font-size:13px;">Status: Selected for Interview</p>
              </div>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 20px;">Our team will contact you shortly to schedule your interview and discuss next steps.</p>
              <p style="color:#6b7280;font-size:14px;margin:0;">Best regards,<br/><strong style="color:#111827;">HireIQ Recruitment Team</strong></p>
            </div>
            <p style="text-align:center;color:#d1d5db;font-size:11px;margin:12px 0;">Powered by HireIQ</p>
          </div>`
        : `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
              <div style="font-size:36px;">📋</div>
              <h1 style="color:#374151;margin:8px 0 0;font-size:22px;font-weight:900;">Application Update</h1>
            </div>
            <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <p style="color:#374151;font-size:15px;font-weight:700;margin:0 0 12px;">Hi ${application.firstName},</p>
              <p style="color:#6b7280;line-height:1.7;margin:0 0 20px;font-size:14px;">Thank you for applying for <strong>${application.job.title}</strong>. After careful review, we regret to inform you we will not be moving forward with your application at this time.</p>
              <div style="background:#fef9f0;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px;">
                <p style="color:#92400e;margin:0;font-weight:700;">Position: ${application.job.title}</p>
                <p style="color:#d97706;margin:6px 0 0;font-size:13px;">Status: Unsuccessful at this time</p>
              </div>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 20px;">We encourage you to apply for future roles and wish you the best in your search.</p>
              <p style="color:#6b7280;font-size:14px;margin:0;">Best regards,<br/><strong style="color:#111827;">HireIQ Recruitment Team</strong></p>
            </div>
            <p style="text-align:center;color:#d1d5db;font-size:11px;margin:12px 0;">Powered by HireIQ</p>
          </div>`

      try {
        await resend.emails.send({
          from: 'HireIQ <onboarding@resend.dev>',
          to: application.email,
          subject,
          html: emailBody,
        })
      } catch (emailError) {
        console.error('Email failed:', emailError)
      }
    }

    return NextResponse.json({ success: true, status: application.status })
  } catch (error: any) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update: ' + error.message }, { status: 500 })
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
