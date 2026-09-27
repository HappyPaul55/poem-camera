import { useEffect, useState } from "react";
import type { Poem } from "./poem-types";
import { fetchPoem } from "./poem-client";
import usePoemSettings from "./use-poem-settings";

/**
 * Turns a captured frame into a poem. Re-runs whenever the frame or the chosen
 * form/style changes, aborting any in-flight request.
 */
export default function usePoem() {
  const [poemSettings] = usePoemSettings();
  const [frame, setFrame] = useState<string | undefined>(undefined);
  const [poem, setPoem] = useState<Poem | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (frame === undefined) {
      return;
    }

    const controller = new AbortController();
    setPoem(undefined);
    setError(undefined);
    setBusy(true);

    fetchPoem({
      form: poemSettings.form,
      style: poemSettings.style,
      image: frame,
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) setPoem(result);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });

    return () => controller.abort();
  }, [poemSettings.form, poemSettings.style, frame]);

  useEffect(() => {
    if (frame === undefined && poem !== undefined) {
      setPoem(undefined);
      setError(undefined);
    }
  }, [frame, poem]);

  return { error, poem, setFrame, frame, busy };
}
