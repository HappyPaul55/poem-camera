import { useEffect, useState } from 'react';
import Poem from '@/types/Poem';
import usePoemSettings from '@/hooks/usePoemSettings';

async function convertFrameToPoem(poemForm: string, poemStyle: string, frame: string): Promise<Poem> {
  const response = await fetch('/api/poem', {
    method: 'POST',
    body: JSON.stringify({
      form: poemForm,
      style: poemStyle,
      image: frame,
    }),
  });

  const body = await response.json() as any;

  return {
    ai: body.ai,
    title: body.title,
    body: body.body,
  };
}

export default function usePoem() {
  const [poemSettings] = usePoemSettings();
  const [frame, setFrame] = useState<string | undefined>(undefined);
  const [poem, setPoem] = useState<Poem | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (frame === undefined) {
      return;
    }
    convertFrameToPoem(poemSettings.form, poemSettings.style, frame)
      .then(setPoem)
      .catch(setError)
  }, [poemSettings.form, poemSettings.style, setPoem, frame]);

  useEffect(() => {
    if (frame === undefined && poem !== undefined) {
      setPoem(undefined);
      setError(undefined)
    }
  }, [frame, poem, setPoem]);

  return { error, poem, setFrame, frame };
}