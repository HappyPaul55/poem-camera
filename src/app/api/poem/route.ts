import { generateText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import { createMistral, mistral } from '@ai-sdk/mistral';
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
const initialSystemMessageDetective = 'You are playing a mystery murder game. You are Detective %form% and must look at the photo provided by the user for clues, everyone and everything you see could be clue. Write a short description in the style of a poem of what you see such as threats, motives, and other creative ideas. The first line will be the the title of the %form% poem, the rest will be the poem contents only.';
const initialSystemMessageDebug = 'You are a futureistic AI scanning camera for a sci-fi movie. You will be given a photo, you must analyse it and create a "data sheet" of what you see. The more you see, the more you should output but at most, you should output no more than 40 lines. The first line will be a very short summary of what you see, the rest of the content will be the "data sheet".';

async function webp2Jpeg(image: string): Promise<Buffer> {
  const buffer = Buffer.from(image, 'base64');

  return await sharp(buffer)
    .jpeg()
    .toBuffer();
}

function getAi() {
  return Math.random() > 0.5
    ? {
      name: 'X.ai',
      model: xai('grok-vision-beta')
    } as const
    : {
      name: 'Mistral',
      model: mistral('pixtral-12b-2409'),
    } as const;
}

export async function POST(request: Request) {
  const { image, style, form } = requestFormat.parse(await request.json() as any) as { image: string, style: PoemStyleNames, form: PoemFormsNames };
  const [formatParts, data] = image.substring('data:'.length).split(',');
  const [format, encoding] = formatParts.split(';');
  if (encoding !== 'base64') {
    throw new Error('Encoding must be "base64"');
  }

  // Use different prompts based on settings.
  let systemMessageTemplate = initialSystemMessageWithCategory;
  if (poemStyles.Theme.map(row => row.name).includes(style as any)) {
    systemMessageTemplate = initialSystemMessageWithPerson;
  }
  if (form === 'Detective') {
    systemMessageTemplate = initialSystemMessageDetective;
  }
  if (form === 'Debug') {
    systemMessageTemplate = initialSystemMessageDebug;
  }

  const imageData =
    format !== 'image/webp'
      ? Buffer.from(data, 'base64')
      : await webp2Jpeg(data);

  const systemPrompt = systemMessageTemplate
    .replaceAll('%form%', form)
    .replaceAll('%style%', style);

  const ai = getAi();

  const { text } = await generateText({
    model: ai.model,
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
  const title = textParts.shift()!.trim()
    .replace(/^##+/, '').replace(/^\*+/, '').replace(/\*+$/, '').trim();
  const body = textParts.join("\n").trim();

  return Response.json({ ai: ai.name, title, body });
}