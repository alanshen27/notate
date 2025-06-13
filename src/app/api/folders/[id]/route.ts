import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const folderId = (await params).id;

    // Get the folder to check ownership
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { children: true }
    });

    if (!folder) {
      return new NextResponse("Folder not found", { status: 404 });
    }

    if (folder.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Don't allow deleting the default folder
    if (folder.isDefault) {
      return new NextResponse("Cannot delete default folder", { status: 400 });
    }

    // Delete the folder and all its children recursively
    await prisma.folder.delete({
      where: { id: folderId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[FOLDER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const folderId = (await params).id;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Get the folder to check ownership
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return new NextResponse("Folder not found", { status: 404 });
    }

    if (folder.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update the folder name
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { name },
      include: {
        children: {
          include: {
            notes: {
              orderBy: {
                updatedAt: "desc"
              }
            }
          },
          orderBy: {
            name: "asc"
          }
        },
        notes: {
          orderBy: {
            updatedAt: "desc"
          }
        }
      }
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error("[FOLDER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 

export async function PUT (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const folderId = (await params).id;
        const body = await request.json();
        const { opened } = body;

        const folder = await prisma.folder.findUnique({
            where: { id: folderId }
        });

        if (!folder) {
            return new NextResponse("Folder not found", { status: 404 });
        }

        if (folder.userId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const updatedFolder = await prisma.folder.update({
            where: { id: folderId },
            data: { opened }
        }); 

        return NextResponse.json(updatedFolder);
    } catch (error) {
        console.error("[FOLDER_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}