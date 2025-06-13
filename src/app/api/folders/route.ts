import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if default folder exists
    const defaultFolder = await prisma.folder.findFirst({
      where: {
        user: {
          id: session.user.id,
        },
        isDefault: true,
      },
    });

    // Create default folder if it doesn't exist
    if (!defaultFolder) {
      await prisma.folder.create({
        data: {
          name: session.user.name || session.user.email?.split('@')[0] || 'My Notes',
          isDefault: true,
          userId: session.user.id,
        },
      });
    }

    // Get all folders with their notes
    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        notes: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
        children: {
          include: {
            notes: {
              orderBy: {
                updatedAt: 'desc',
              },
            },
            children: {
              include: {
                notes: {
                  orderBy: {
                    updatedAt: 'desc',
                  },
                },
              },
              orderBy: {
                name: 'asc',
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("[FOLDERS_GET] Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, parentId } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // First check if this is a child folder
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
        select: { 
          userId: true,
          parentId: true 
        }
      });

      if (!parentFolder || parentFolder.userId !== session.user.id) {
        return new NextResponse("Parent folder not found or unauthorized", { status: 404 });
      }

      // Check if parent folder is already a child (depth = 2)
      if (parentFolder.parentId) {
        return new NextResponse("Cannot create folder deeper than two levels", { status: 400 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        isDefault: false,
        user: {
          connect: {
            id: session.user.id,
          },
        },
        ...(parentId && {
          parent: {
            connect: {
              id: parentId,
            },
          },
        }),
      },
      include: {
        notes: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
        children: {
          include: {
            notes: {
              orderBy: {
                updatedAt: 'desc',
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("[FOLDERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 