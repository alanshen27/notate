export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { parse } from 'pptx2json-ts'
// @ts-expect-error pdf-parse library issues https://gitlab.com/autokent/pdf-parse/-/issues/24
import pdfParse from 'pdf-parse/lib/pdf-parse'
import sanitizeHtml from 'sanitize-html';
import { Section } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: "https://api.cohere.ai/compatibility/v1",
    apiKey: process.env['COHERE_API_KEY'],
});

const SanitizeConfig = {
    allowedTags: ['p', 'br', 'h1', 'h2', 'h3', 'blockquote', 'b', 'strong', 'div', 'span', 'ol', 'ul'],
    allowedAttributes: {
        'a': ['href', 'target'],
        'img': ['src', 'alt'],
    },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mediaId = formData.get('mediaId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!mediaId) {
      return NextResponse.json({ error: 'No media ID provided' }, { status: 400 });
    }

    let text: string | Section[];
    
    const arrayBuffer = await file.arrayBuffer();

    switch (file.type) {
      case 'text/plain':
        text = await file.text();
        break;

      case 'application/pdf': {
        const data = await pdfParse(Buffer.from(arrayBuffer));
        text = data.text;
        break;
      }

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword': {
        const result = await mammoth.convertToHtml({ buffer: Buffer.from(arrayBuffer) });
        text = result.value;
        break;
      }

      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.ms-powerpoint': {
        const result = await parse(arrayBuffer);
        text = result.slides.map((slide, index) => ({
            label: `Slide ${index + 1}`,
            text: sanitizeHtml(slide.elements
              .filter(e => ['shape'].includes(e.type))
              .map(e => e.content)
              .join(' '), SanitizeConfig)
          }))
        
        break;
      }

      default:
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }


    let summary = null;
    if (text.length > 1000) {
    // send request to openai to get summary
    summary = (await client.chat.completions.create({
        model: "command-r-plus",
        messages: [{
            role: 'system',
            content: "You are a helpful assistant that summarizes text. You will be given a transcript of a video or audio file. You will need to summarize the transcript in a way that is easy to understand and follow. You will also need to include the timestamps of the transcript in the summary (if applicable).",
        },
        {
            role: 'system',
            content: "Do so in a structured manner with headers, subheaders, links, etc. If it is a slideshow, describe each slide.",
        },
        {
            role: 'system',
            content: "Convert ur markdown syntax to HTML",
        },
        {
            role: 'user',
            content: 'Summarize: ' + JSON.stringify(text)
        },
    ],
    temperature: 0.5,
    max_tokens: 1000,
    })).choices[0].message.content;
    } else {
        summary = "Not available, transcript is too short";
    }

    if (typeof text == 'string') {
        text = sanitizeHtml(text, SanitizeConfig);
    }

    // Update the media record with transcript and summary
    const updatedMedia = await prisma.media.update({
      where: {
        id: mediaId,
      },
      data: {
        transcript: typeof text === 'string' ? text : JSON.stringify(text),
        summary: summary,
        processing: false,
      },
    });

    return NextResponse.json({ 
      transcript: text, 
      summary: summary,
      media: updatedMedia 
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
