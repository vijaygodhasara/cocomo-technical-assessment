import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY, // Ensure this is set in your .env file
});

export async function POST(request: Request) {
  try {
    const { todoId, title } = await request.json();
    if (!todoId || !title) {
      return NextResponse.json({ error: 'Todo ID and title are required' }, { status: 400 });
    }

    const result: any = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: title,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    // Update the todo with the generated image URL
    await prisma.todo.update({
      where: { id: todoId },
      data: { imageUrl: result.images[0].url },
    });

    return NextResponse.json({ imageUrl: result.images[0].url }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error generating image' }, { status: 500 });
  }
}