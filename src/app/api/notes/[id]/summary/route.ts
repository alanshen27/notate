import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { marked } from 'marked';
import OpenAI from 'openai';
import pusher from '@/lib/pusher';

const openai = new OpenAI({
    baseURL: "https://api.cohere.ai/compatibility/v1",
    apiKey: process.env.COHERE_API_KEY,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const { mediaIds } = await req.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return new NextResponse('Media IDs are required', { status: 400 });
    }

    // Verify the note belongs to the user
    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        media: true,
      },
    });

    if (!note) {
      return new NextResponse('Note not found', { status: 404 });
    }

    // Verify all media IDs belong to the note
    const validMediaIds = note.media
      .filter(media => mediaIds.includes(media.id))
      .map(media => media.id);

    if (validMediaIds.length === 0) {
      return new NextResponse('No valid media found', { status: 400 });
    }

    // Get the transcripts and summaries for the selected media
    const selectedMedia = note.media.filter(media => validMediaIds.includes(media.id));
    
    // Prepare the content for AI processing
    const mediaContent = selectedMedia
      .map(media => {
        const transcript = Array.isArray(media.transcript)
          ? media.transcript.map(section => section.text).join('\n')
          : media.transcript;
        return `Media: ${media.name}\nTranscript: ${transcript}\nSummary: ${media.summary}\n`;
      })
      .join('\n---\n\n');

    // get the user
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // calculate the token usage
    const tokenUsage = (mediaContent + note.content).split(' ').length;

    // check if the user has enough tokens
    if (user.tokens < tokenUsage) {
      return new NextResponse('Insufficient tokens', { status: 400 });
    }

    // deduct the tokens from the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { tokens: { decrement: tokenUsage } },
    });

    // Generate a new combined summary using AI
    const completion = await openai.chat.completions.create({
      model: "command-r-plus",
      messages: [
        {
          role: "system",
          content: `You are an expert AI notetaker trained to convert media and student notes into a clear, compressed study guide in **Markdown**. Your style mimics TurboLearn: structured, high-density, and easy to revise from.`
        },
        {
          role: "system",
          content: `Output only valid Markdown. Use **#**, **##**, **-**, **1.**, and backticks for code or pinyin. No HTML tags. Do NOT mix HTML with Markdown. No explanations, no extra metadata — just the notes.`
        },
        {
          role: "system",
          content: `Merge all provided content (transcripts, slides, media) with student notes. Only reorganize or rephrase when it improves clarity. Keep all helpful examples, grammar, vocabulary, and lists.`
        },
        {
          role: "system",
          content: `Format clearly with headers for sections (e.g. # Speaking, ## Adjectives, etc). Use bold for key words and pinyin in backticks. Preserve lists and chains. Keep everything student-friendly.`
        },
        {
          role: "user",
          content: `Generate a full Markdown cram sheet from:\n\nMedia:\n${mediaContent}\n\nStudent Notes:\n${note.content}`
        }
      ],
      temperature: 0.4,
    });
    
    

      const newSummary = await marked.parse(completion.choices[0].message.content || "");

    // Update the note with the new AI-generated summary
    await prisma.note.update({
      where: {
        id,
      },
      data: {
        content: newSummary,
      },
      include: {
        media: true,
      },
    });

    await pusher.trigger(`note_${id}`, 'summary_ready', id);

    return NextResponse.json({
      summary: newSummary,
    });
  } catch (error) {
    console.error('[NOTES_SUMMARY_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  const note = await prisma.note.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!note) {
    return new NextResponse('Note not found', { status: 404 });
  }

  return NextResponse.json(note.content);
}