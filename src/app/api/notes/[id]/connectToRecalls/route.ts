import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { setId } = await req.json();

  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note || !setId) {
    return new Response("Note not found or setId not provided", { status: 404 });
  }

  await prisma.note.update({
    where: { id },
    data: { recallSetId: setId },
  });

  return new Response("Connected to Recalls", { status: 200 });
}