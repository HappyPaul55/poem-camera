import { useEffect, useRef, useState } from "react";
import {
  loadTurnstile,
  requestTurnstileSession,
} from "../../lib/turnstile-client";
import { TURNSTILE_ACTION } from "../../lib/turnstile-shared";

interface Props {
  sitekey: string;
  onVerified: () => void;
}

/**
 * The human-check gate shown when the camera opens and whenever the 30-minute
 * session lapses. Renders the Turnstile widget explicitly and exchanges its
 * token for a signed session. A token is single-use, so the widget is reset
 * after a failed exchange to allow a retry.
 */
export default function TurnstileGate({ sitekey, onVerified }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifiedRef = useRef(onVerified);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Keep the latest callback without re-creating the widget on every render.
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey,
          action: TURNSTILE_ACTION,
          theme: "dark",
          callback: (token) => {
            if (!token) return;
            setChecking(true);
            setError(null);

            requestTurnstileSession(token)
              .then(() => {
                if (!cancelled) onVerifiedRef.current();
              })
              .catch((cause: unknown) => {
                if (cancelled) return;
                setChecking(false);
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "The human check could not be verified. Please try again.",
                );
                if (widgetIdRef.current) turnstile.reset(widgetIdRef.current);
              });
          },
          "error-callback": () => {
            if (!cancelled) {
              setError("The human check hit a problem. Please try again.");
            }
          },
          "expired-callback": () => {
            if (!cancelled) {
              setError("The human check expired. Please try again.");
            }
          },
        });
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "The human check failed to load.",
          );
        }
      });

    return () => {
      cancelled = true;
      const turnstile = window.turnstile;
      if (widgetIdRef.current && turnstile) {
        turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [sitekey]);

  return (
    <div className="intro">
      <p className="intro__eyebrow">
        <span aria-hidden="true">//</span> human check
      </p>
      <h1 className="intro__title">One quick check first.</h1>

      <p className="max-w-[34rem] text-center text-[0.95rem] text-[rgba(250,250,244,0.72)]">
        Poem Camera uses AI to write each poem. To keep that free and fast, we ask
        for a quick challenge when the camera opens — and only again after 30
        minutes.
      </p>

      <div ref={containerRef} />

      {checking && (
        <p className="flex items-center gap-2 text-[0.9rem] text-[rgba(250,250,244,0.72)]">
          <span className="spinner" aria-hidden="true" /> Verifying…
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="max-w-[34rem] text-center text-[0.9rem] text-[var(--color-baddie)]"
        >
          {error}
        </p>
      )}

      <p className="max-w-[34rem] text-center text-[0.8rem] text-[rgba(250,250,244,0.5)]">
        Verification is provided by Cloudflare Turnstile.{" "}
        <a
          className="underline decoration-[rgba(250,250,244,0.4)] underline-offset-2 hover:text-yellow"
          href="/privacy"
        >
          Privacy notice
        </a>
        .
      </p>
    </div>
  );
}
