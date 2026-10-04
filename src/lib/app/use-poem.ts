import { useCallback, useEffect, useState } from "react";
import type { Poem } from "./poem-types";
import { streamPoem } from "./poem-client";
import usePoemSettings from "./use-poem-settings";

/** The poem as it is being written, before the model has finished. */
export interface PoemDraft {
  title?: string;
  lines: string[];
}

const EMPTY_DRAFT: PoemDraft = { lines: [] };

/**
 * Turns a captured frame into a poem, streaming it back line by line. Re-runs
 * whenever the frame or the chosen form/style changes, aborting any in-flight
 * request.
 */
export default function usePoem() {
  const [poemSettings] = usePoemSettings();
  const [frame, setFrame] = useState<string | undefined>(undefined);
  const [poem, setPoem] = useState<Poem | undefined>(undefined);
  const [draft, setDraft] = useState<PoemDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  /** Bumped to re-run the request after a re-verification, without a new frame. */
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (frame === undefined) {
      return;
    }

    const controller = new AbortController();
    setPoem(undefined);
    setDraft(EMPTY_DRAFT);
    setError(undefined);
    setBusy(true);

    streamPoem({
      form: poemSettings.form,
      style: poemSettings.style,
      image: frame,
      signal: controller.signal,
      onTitle: (title) => setDraft((current) => ({ ...current, title })),
      onLine: (text) =>
        setDraft((current) => ({
          ...current,
          lines: [...current.lines, text],
        })),
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
  }, [poemSettings.form, poemSettings.style, frame, retryNonce]);

  useEffect(() => {
    if (frame === undefined && poem !== undefined) {
      setPoem(undefined);
      setDraft(EMPTY_DRAFT);
      setError(undefined);
    }
  }, [frame, poem]);

  const retry = useCallback(() => setRetryNonce((nonce) => nonce + 1), []);

  return { error, poem, draft, setFrame, frame, busy, retry };
}
