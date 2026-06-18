import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employeeId = parseInt(id)
    const body = await request.json()
    const { firstName, lastName, email, phone } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { firstName, lastName, email, phone: phone || null },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employeeId = parseInt(id)

    await prisma.employee.delete({
      where: { id: employeeId }
    })
    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
