import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("[NOTES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, folderId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const defaultFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
    });

    const note = await prisma.note.create({
      data: {
        title,
        content: content || "",
        user: {
          connect: {
            id: session.user.id,
          },
        },
        folder: folderId ? {
          connect: {
            id: folderId,
          },
        } : {
          connect: {
            id: defaultFolder?.id || "",
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTES_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
} 