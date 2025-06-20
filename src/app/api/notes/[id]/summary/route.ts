import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
          content: "You are a helpful assistant that converts multiple media sources and rough notes into a single student-style cram sheet. You organize, summarize, and format the material clearly, with high information density and logical flow."
        },
        {
          role: "system",
          content: "Return output in clean, semantically structured HTML using <h1>, <h2>, <ul>, <li>, <code>, and <p>. Use bullet points for facts and definitions. Include equations, statistics, and examples wherever they appear. If content includes slides, summarize each slide clearly."
        },
        {
          role: "system",
          content: "Focus on student needs: concepts, formulas, key examples, diagrams (describe in text), and all numerical/statistical data. Make it comprehensive and efficient to revise from. Do not omit any useful content. Do not include metadata or framing text."
        },
        {
          role: "user",
          content: `Please create a comprehensive cram sheet from the following media and notes:\n\n${mediaContent}\n\nStudent's notes:\n${note.content} Try to concatenate to the users notes, and only change if it would make it more helpful.`
        }    
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const newSummary = completion.choices[0].message.content;

    // Update the note with the new AI-generated summary
    await prisma.note.update({
      where: {
        id,
      },
      data: {
        content: newSummary! || note.content,
      },
      include: {
        media: true,
      },
    });

    pusher.trigger(`note_${id}`, 'summary_ready', id);

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