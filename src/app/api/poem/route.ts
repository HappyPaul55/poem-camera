import { generateText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import z from 'zod';
import sharp from 'sharp';
import poemForms, { PoemFormsNames } from '@/lib/poemForms';
import poemStyles, { PoemStyleNames } from '@/lib/poemStyles';

const poemFormsNames = Object.values(poemForms)
  .flat()
  .map((row) => row.name);
const poemStyleNames = Object.values(poemStyles)
  .flat()
  .map((row) => row.name);

const requestFormat = z.object({
  form: z.enum(poemFormsNames as [string, ...string[]]),
  style: z.enum(poemStyleNames as [string, ...string[]]),
  image: z.string().startsWith('data:')
});

export type RequestFormat = z.infer<typeof requestFormat>;

const xai = createXai({
  apiKey: process.env.XAI_API_KEY!,
});

const initialSystemMessage = 'You are a photo to %form% printer. You will be given a picture from the user, you need to return a short %form% that is highly related to the picture provided. Make reference to what is in the foreground and optionally the background as well. Responses should not be generic and must be about the picture provided. The first line will be the the title of the %form%, the rest will be the poem contents only.';
const initialSystemMessageWithCategory = initialSystemMessage + ' The %form% should be %style%.';
const initialSystemMessageWithPerson = initialSystemMessage + ' The %form% must be written in the style of %style%.';

async function webp2Jpeg(image: string): Promise<Buffer> {
  const buffer = Buffer.from(image, 'base64');

  return await sharp(buffer)
    .jpeg()
    .toBuffer();
}

export async function POST(request: Request) {
  const { image, style, form } = requestFormat.parse(await request.json() as any) as { image: string, style: PoemStyleNames, form: PoemFormsNames };
  const [formatParts, data] = image.substring('data:'.length).split(',');
  const [format, encoding] = formatParts.split(';');
  if (encoding !== 'base64') {
    throw new Error('Encoding must be "base64"');
  }

  // Use different prompts basedon settings.
  const systemMessageTemplate = poemStyles.Theme.map(row => row.name).includes(style as any)
    ? initialSystemMessageWithCategory
    : initialSystemMessageWithPerson;

  const imageData =
    format !== 'image/webp'
      ? Buffer.from(data, 'base64')
      : await webp2Jpeg(data);

  const systemPrompt = systemMessageTemplate
    .replaceAll('%form%', form)
    .replaceAll('%style%', style);

  const { text } = await generateText({
    model: xai('grok-vision-beta'),
    system: systemPrompt,
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

  const textParts = text.trim().split("\n");
  const title = textParts.shift()!.trim().replace(/^\*+/, '').replace(/\*+$/, '').trim();
  const body = textParts.join("\n").trim();

  return Response.json({ title, body });
}