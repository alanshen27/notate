import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Storage } from "@google-cloud/storage";

// Initialize the Google Cloud Storage client
let storage: Storage;
try {
  const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS;
  if (!credentials) {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS is not set");
  }

  storage = new Storage({
    credentials: JSON.parse(credentials)
  });
} catch (error) {
  console.error("Failed to initialize Google Cloud Storage:", error);
}

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "notable_media";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    if (!storage) {
      throw new Error("Google Cloud Storage not initialized");
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify note exists and belongs to user
    const note = await prisma.note.findUnique({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
      include: {
        media: true,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    // Find the media to delete
    const media = note.media.find(async (m) => m.id === (await params).mediaId);
    if (!media) {
      return new NextResponse("Media not found", { status: 404 });
    }

    // Delete the file from Google Cloud Storage
    if (media.url) {
      const filename = media.url.split('/').pop();
      if (filename) {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(filename);
        await file.delete().catch(error => {
          console.error("Error deleting file from GCS:", error);
          // Continue with database deletion even if GCS deletion fails
        });
      }
    }

    // Delete the media record from the database
    await prisma.media.delete({
      where: {
        id: (await params).mediaId,
      },
    });

    // Return the updated note
    const updatedNote = await prisma.note.findUnique({
      where: {
        id: (await params).id,
      },
      include: {
        media: true,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("[MEDIA_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const media = await prisma.media.findUnique({
    where: {
      id: (await params).mediaId,
      note: {
        userId: session.user.id,
      }
    },
  });

  if (!media) {
    return new NextResponse("Media not found", { status: 404 });
  }

  return NextResponse.json(media);
}