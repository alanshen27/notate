import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const note = await prisma.note.findUnique({
      where: {
        id: (await params).id,
        user: {
          id: session.user.id,
        }
      },
      include: {
        media: true,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, content } = body;

    let note = await prisma.note.findUnique({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
    });

    if (!note) {
      // Create a new note if not found
      note = await prisma.note.create({
        data: {
          id: (await params).id,
          title: title || "Untitled Note",
          content: content || "",
          userId: session.user.id,
        },
        include: {
          media: true,
        },
      });
    } else {
      note = await prisma.note.update({
        where: {
          id: (await params).id,
          userId: session.user.id,
        },
        data: {
          title,
          content,
        },
        include: {
          media: true,
        },
      });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.note.delete({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[NOTE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 