import { generateText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import z from 'zod';
import sharp from 'sharp';

const requestFormat = z.object({
  style: z.enum(['limerick', 'poem', 'haiku']),
  image: z.string().startsWith('data:')
});

export type RequestFormat = z.infer<typeof requestFormat>;

const xai = createXai({
  apiKey: process.env.XAI_API_KEY!,
});

const initialSystemMessage = 'You are a photo to %style% printer. You will be given a picture from the user, you need to return a short %style% that is highly related to the picture provided. Make reference to what is in the foreground and optionally the background as well. Responses should not be generic and must be about the picture provided. The first line will be the the title of the poem, the rest will be the poem contents only.';

async function webp2Jpeg(image: string): Promise<Buffer> {
  const buffer = Buffer.from(image, 'base64');
  
  return await sharp(buffer)
    .jpeg()
    .toBuffer();
}

export async function POST(request: Request) {
  const { image, style } = requestFormat.parse(await request.json() as any);
  const [formatParts, data] = image.substring('data:'.length).split(',');
  const [format, encoding] = formatParts.split(';');
  if (encoding !== 'base64') {
    throw new Error('Encoding must be "base64"');
  }

  const imageData =
    format !== 'image/webp'
      ? Buffer.from(data, 'base64')
      : await webp2Jpeg(data);

  const { text } = await generateText({
    model: xai('grok-vision-beta'),
    system: initialSystemMessage
      .replaceAll('%style%', style),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: imageData.toString('base64'),
          },
        ],
      },
    ],
  });

  const textParts = text.split("\n");
  const title = textParts.shift()!;
  const body = textParts.join("\n").trim();

  return Response.json({ title, body });
}