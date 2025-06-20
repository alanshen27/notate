import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";


// @consider: if media upload fails -> nothing happens. however, if media creation in db fails, there is media in db without a listing in db

// @todo: move Gcloud init to a seperate file
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!storage) {
      throw new Error("Google Cloud Storage not initialized");
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueId = uuidv4();
    const extension = file.name.split(".").pop();
    const filename = `${uniqueId}.${extension}`;

    // Upload the file to Google Cloud Storage
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(filename);
    await blob.save(buffer, {
      contentType: file.type,
    });

    // Generate a public URL for the uploaded file
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

    // Verify note exists and belongs to user
    const note = await prisma.note.findUnique({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    // Create a Media record in the database
    const newMedia = await prisma.media.create({
      data: {
        name: file.name,
        type: file.type,
        url: publicUrl,
        processing: true,
        note: {
          connect: {
            id: (await params).id,
          },
        },
      },
    });

    // Return updated note with media
    const updatedNote = await prisma.note.findUnique({
      where: {
        id: (await params).id,
      },
      include: {
        media: true,
      },
    });

    // automatically generates transcript and summary server side if necessary
    fetch(`${process.env.NEXTAUTH_URL}/api/getTranscript`, {
      method: "POST",
      body: JSON.stringify({
        mediaId: newMedia.id,
      }),
    });

    return NextResponse.json({...updatedNote, newMedia });
  } catch (error) {
    console.error("[MEDIA_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 