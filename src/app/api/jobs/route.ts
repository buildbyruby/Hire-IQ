import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(jobs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, departmentId } = body

    if (!title || !description || !departmentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Auto-create department if it doesn't exist
    await prisma.department.upsert({
      where: { id: departmentId },
      update: {},
      create: { id: departmentId, name: `Department ${departmentId}` }
    })

    const job = await prisma.job.create({
      data: { title, description, departmentId }
    })
    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
