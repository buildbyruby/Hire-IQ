import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const result = await resend.emails.send({
      from: 'HireIQ <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
    console.log('Email sent:', result)
    return { success: true, result }
  } catch (error: any) {
    console.error('Email failed:', error)
    return { success: false, error: error.message }
  }
}

export function recruitedEmail(firstName: string, jobTitle: string, interviewUrl: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">🎉</div>
        <h1 style="color:white;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">Congratulations ${firstName}!</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">You have been shortlisted</p>
      </div>
      <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
          We are excited to move you to the next stage of the recruitment process for the 
          <strong style="color:#111827;">${jobTitle}</strong> position.
        </p>
        <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
          Please complete your interview questions using the button below. 
          Read the instructions carefully before you begin.
        </p>
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#92400e;margin:0 0 10px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">⏰ Interview Rules</p>
          <ul style="color:#92400e;margin:0;padding-left:18px;font-size:13px;line-height:2;">
            <li>5 questions total</li>
            <li><strong>2 minutes per question</strong> — timer starts automatically</li>
            <li>When time runs out, your answer locks and the next question loads</li>
            <li>You <strong>cannot go back</strong> to a previous question</li>
            <li>Complete all questions in one sitting</li>
          </ul>
        </div>
        <a href="${interviewUrl}" 
           style="display:block;background:#4f46e5;color:white;text-decoration:none;padding:16px 24px;border-radius:12px;text-align:center;font-weight:900;font-size:16px;margin-bottom:16px;letter-spacing:-0.3px;">
          Start Interview Questions →
        </a>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0 0 24px;">This link expires in 48 hours</p>
        <p style="color:#6b7280;font-size:14px;margin:0;">
          Best regards,<br/>
          <strong style="color:#111827;">The HireIQ Recruitment Team</strong>
        </p>
      </div>
      <p style="text-align:center;color:#d1d5db;font-size:11px;margin:16px 0;">Powered by HireIQ · AI Recruitment Intelligence</p>
    </div>
  `
}

export function rejectedEmail(firstName: string, jobTitle: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">📋</div>
        <h1 style="color:#374151;margin:0;font-size:24px;font-weight:900;">Application Update</h1>
        <p style="color:#9ca3af;margin:8px 0 0;font-size:14px;">Regarding your recent application</p>
      </div>
      <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
        <p style="color:#374151;font-size:16px;font-weight:700;margin:0 0 12px;">Hi ${firstName},</p>
        <p style="color:#6b7280;line-height:1.7;font-size:14px;margin:0 0 16px;">
          Thank you for taking the time to apply for the 
          <strong style="color:#111827;">${jobTitle}</strong> position and for your interest in joining our team.
        </p>
        <p style="color:#6b7280;line-height:1.7;font-size:14px;margin:0 0 24px;">
          After carefully reviewing all applications, we regret to inform you that we will not be 
          moving forward with your candidacy at this time. This was a difficult decision as we 
          received many strong applications.
        </p>
        <div style="background:#fef9f0;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#92400e;margin:0 0 4px;font-size:12px;font-weight:800;text-transform:uppercase;">Position Applied For</p>
          <p style="color:#92400e;margin:0;font-size:15px;font-weight:700;">${jobTitle}</p>
          <p style="color:#d97706;margin:6px 0 0;font-size:12px;">Status: Unsuccessful at this time</p>
        </div>
        <p style="color:#6b7280;line-height:1.7;font-size:14px;margin:0 0 24px;">
          We genuinely encourage you to continue developing your skills and to apply for 
          future roles that match your profile. We wish you every success.
        </p>
        <p style="color:#6b7280;font-size:14px;margin:0;">
          Best regards,<br/>
          <strong style="color:#111827;">The HireIQ Recruitment Team</strong>
        </p>
      </div>
      <p style="text-align:center;color:#d1d5db;font-size:11px;margin:16px 0;">Powered by HireIQ · AI Recruitment Intelligence</p>
    </div>
  `
}
