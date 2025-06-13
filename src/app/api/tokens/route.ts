import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { amount } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: {
            id: session.user.id,
        },
    });

    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    const newTokens = user.tokens + amount;

    await prisma.user.update({
        where: { id: session.user.id },
        data: { tokens: newTokens },
    });
    
    return new NextResponse("Tokens purchased successfully", { status: 200 });
}