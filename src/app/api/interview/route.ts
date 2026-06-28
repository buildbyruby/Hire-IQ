import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, jobTitle, jobDescription, score, weaknesses } = body

    if (!resumeText || !jobTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = `You are an expert technical interviewer and talent acquisition specialist.

Based on the following candidate information, generate exactly 8 targeted interview questions with scoring guidance.

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Candidate ATS Score: ${score}/100
Candidate Weaknesses identified: ${weaknesses?.join(', ')}

Resume Summary:
${resumeText.substring(0, 2000)}

Generate 8 interview questions. For each question include:
- The question itself
- The type (Technical, Behavioral, or Situational)
- The purpose (what this reveals about the candidate)
- Scoring criteria for scores 1-2 (Poor), 3-4 (Below Average), 5-6 (Average), 7-8 (Good), 9-10 (Excellent)

Also provide an overall hiring recommendation based on the ATS score and interview performance.

Return ONLY a valid JSON object, no markdown, no backticks:
{
  "questions": [
    {
      "type": "Technical",
      "question": "...",
      "purpose": "one sentence on what this reveals",
      "scoring": {
        "1-2": "what a poor answer looks like",
        "3-4": "what a below average answer looks like",
        "5-6": "what an average answer looks like",
        "7-8": "what a good answer looks like",
        "9-10": "what an excellent answer looks like"
      }
    }
  ],
  "hiringRecommendation": {
    "verdict": "Strong Hire / Hire / Maybe / No Hire",
    "reason": "2-3 sentence explanation based on the candidate profile",
    "watchPoints": ["thing to watch for 1", "thing to watch for 2"]
  }
}`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 3000,
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? ''
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Interview generation error:', error)
    return NextResponse.json({ error: 'Failed to generate questions: ' + error.message }, { status: 500 })
  }
}
