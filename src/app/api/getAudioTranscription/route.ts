import { NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

const llmClient = new OpenAI({
  baseURL: "https://api.cohere.ai/compatibility/v1",
  apiKey: process.env.COHERE_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioUrl = formData.get("audio") as string;
    const mediaId = formData.get("mediaId") as string;

    if (!audioUrl) {
      return NextResponse.json(
        { error: "No audio URL provided" },
        { status: 400 }
      );
    }

    // Transcribe using the SDK
    const transcript = await client.transcripts.transcribe({
      audio: audioUrl,
      speech_model: "universal",
    });
    

    // get summary if transcript is longer than 1000 words
    if (transcript.text && transcript.text.length > 1000) {
      const summary = await llmClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes text.",
          },
        ],
        max_tokens: 1000,
        temperature: 0.5, 
      });
    
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        transcript: transcript.text,
        summary: summary.choices[0].message.content,
        processing: false,
      },
    });

      return NextResponse.json({
        transcript: transcript.text,
        summary: summary.choices[0].message.content,
        updatedMedia,
      });
    }

    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        transcript: transcript.text,
        summary: "Not available, transcript is too short",
        processing: false,
      },
    });

    return NextResponse.json({
      transcript: transcript.text,
      summary: "Not available, transcript is too short",
      updatedMedia,
    });
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process audio" },
      { status: 500 }
    );
  }
}
