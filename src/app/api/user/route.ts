import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, tokens: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const { name } = await req.json();
  if (!name) {
    return new NextResponse('Name is required', { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
    select: { name: true, tokens: true },
  });
  return NextResponse.json(user);
} 