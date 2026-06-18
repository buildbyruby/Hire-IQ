import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, resumeText } = body

    if (!jobId || !resumeText) {
      return NextResponse.json({ error: 'Missing jobId or resumeText' }, { status: 400 })
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const prompt = `You are an expert HR Analyst and ATS specialist.
Analyze the resume against the job description and return ONLY a valid JSON object with no markdown, no backticks, no extra text.

Job Description:
${job.description}

Resume Text:
${resumeText}

Return ONLY this exact JSON structure:
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
    const analysis = JSON.parse(cleaned)

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze resume: ' + error.message }, { status: 500 })
  }
}
