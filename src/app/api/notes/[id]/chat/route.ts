import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const client = new OpenAI({
    baseURL: "https://api.cohere.ai/compatibility/v1",
    apiKey: process.env.COHERE_API_KEY,
});

export async function GET (req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
        where: {
            noteId: (await params).id,
        },
        orderBy: {
            createdAt: 'asc'
        },
        select: {
            id: true,
            content: true,
            role: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            }
        }
    });

    return NextResponse.json({ messages });
}

export async function POST (req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { message } = await req.json();

    let chat = await prisma.chat.findFirst({
        where: { note: {id: (await params).id, user: {id: session.user.id}} },
    });

    if (!chat) {
        chat = await prisma.chat.create({
            data: {
                note: { connect: { id: (await params).id, user: { id: session.user.id } } },
            },
        });
    }

    await prisma.chat.update({
        where: { id: chat.id },
        data: { messages: { create: { content: message, 
            userId: session.user.id,
            role: "user", noteId: (await params).id } } },
    });


    const context = (await prisma.note.findUnique({
        where: {
            id: (await params).id,
            user: { id: session.user.id }
        },
    }))!.content;

    const chatContext = (await prisma.chat.findMany({
        where: { note: {id: (await params).id, user: {id: session.user.id}} },
        select: {
            messages: {
                select: {
                    content: true,
                    role: true,
                }
            }
        }
    })).flatMap(chat => {
        return chat.messages.map(message => {
            return `${message.role}: ${message.content}`;
        });
    });

    const response = await client.chat.completions.create({
        model: "command-r-plus",
        messages: [
            { role: "system", content: "You are a helpful assistant. You are given a note and a message. You need to respond to the message based on the note. You need to be concise and to the point. You need to be helpful and friendly. You need to be a good teacher." },
            { role: "system", content: "The context of the note is as follows: " + context },
            { role: "system", content: "The chat context is as follows: " + chatContext.join("\n") },
            { role: "user", content: "The user asks the following: " + message },
        ],
        max_tokens: 1000,
        temperature: 0.7,
    });

    await prisma.chat.update({
        where: { id: chat.id },
        data: { messages: { create: { content: response.choices[0].message.content!, role: "assistant", noteId: (await params).id } } },
    });

    return NextResponse.json({message: response.choices[0].message.content});
}