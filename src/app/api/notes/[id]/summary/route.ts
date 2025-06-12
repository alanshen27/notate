import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

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
          content: "You are a helpful assistant that creates concise, well-structured summaries. Combine the given media transcripts and summaries into a single coherent summary. Focus on the key points and maintain a clear narrative flow. Make sure to not miss out anything, and make this look like notes that a student would take."
        },
        {
            role: "system",
            content: "Do so in a structured manner with headers, subheaders, links, etc. If it is a slideshow, describe each slide. Return in HTML format."
        },
        {
            role: "system",
            content: "Include only the summary please in HTML markup. Do not include any other text.",
        },
        {
          role: "user",
          content: `Please create a comprehensive summary of the following media content:\n\n${mediaContent}\n\nNote's existing content:\n${note.content}`
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

    return NextResponse.json({
      summary: newSummary,
    });
  } catch (error) {
    console.error('[NOTES_SUMMARY_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 