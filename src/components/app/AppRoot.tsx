import { useCallback, useEffect, useState } from "react";
import usePoem from "../../lib/app/use-poem";
import { PoemApiError } from "../../lib/app/poem-client";
import { hasTurnstileSession } from "../../lib/turnstile-client";
import useAppSettings, {
  AppPreviewMode,
} from "../../lib/app/use-app-settings";
import PrinterConnectionContext, {
  type ConnectedDevice,
} from "../../lib/app/printer-connection";
import type WebBluetoothReceiptPrinter from "../../lib/app/web-bluetooth-receipt-printer";
import Intro from "./Intro";
import Camera from "./Camera";
import FileUploadButton from "./FileUploadButton";
import PrinterButton from "./PrinterButton";
import SettingsSheet from "./SettingsSheet";
import ConfirmDialog from "./ConfirmDialog";
import PoemDialog from "./PoemDialog";
import PrintPoem from "./PrintPoem";
import TurnstileGate from "./TurnstileGate";
import { HomeIcon } from "./icons";

/**
 * React island root for /app.
 *
 * Owns the boot state, the printer connection and the poem pipeline, and hands
 * the pieces down to the (mostly dumb) views.
 */
export default function AppRoot({
  siteUrl,
  turnstileSiteKey,
}: {
  siteUrl: string;
  turnstileSiteKey: string;
}) {
  const [isBooted, setIsBooted] = useState(false);
  const [settings] = useAppSettings();

  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [driver, setDriver] = useState<WebBluetoothReceiptPrinter | undefined>();
  const [device, setDevice] = useState<ConnectedDevice | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);

  const { poem, draft, busy, setFrame, frame, error, retry } = usePoem();

  // `null` until sessionStorage has been read on the client, so the server
  // render and the first client render agree.
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    setVerified(hasTurnstileSession());
  }, []);

  // A 30-minute session that lapses mid-use brings the gate back.
  useEffect(() => {
    if (error instanceof PoemApiError && error.kind === "turnstile") {
      setVerified(false);
    }
  }, [error]);

  const handlePhoto = useCallback(
    (photo: string) => {
      if (settings.preview === AppPreviewMode.always) {
        setPreview(photo);
      } else {
        setFrame(photo);
      }
    },
    [settings.preview, setFrame],
  );

  const previewConfirm = useCallback(() => {
    setFrame(preview);
    setPreview(undefined);
  }, [preview, setFrame]);

  const previewReject = useCallback(() => {
    setFrame(undefined);
    setPreview(undefined);
  }, [setFrame]);

  const poemClose = useCallback(() => {
    setFrame(undefined);
    setPreview(undefined);
  }, [setFrame]);

  // Hold the camera behind the human check. `null` is the brief pre-read state.
  if (verified !== true) {
    return (
      <PrinterConnectionContext.Provider
        value={{
          driver,
          device,
          setDriver,
          setDevice,
          isConnecting,
          setIsConnecting,
        }}
      >
        <div className="app-shell no-print">
          {verified === false ? (
            <TurnstileGate
              sitekey={turnstileSiteKey}
              onVerified={() => {
                setVerified(true);
                retry();
              }}
            />
          ) : (
            <div className="intro" aria-busy="true">
              <p className="intro__eyebrow">
                <span aria-hidden="true">//</span> loading
              </p>
            </div>
          )}
        </div>
      </PrinterConnectionContext.Provider>
    );
  }

  return (
    <PrinterConnectionContext.Provider
      value={{
        driver,
        device,
        setDriver,
        setDevice,
        isConnecting,
        setIsConnecting,
      }}
    >
      <div className="app-shell no-print">
        {isBooted ? (
          <>
            <Camera onPhoto={handlePhoto} />
            <div className="app-controls">
              <a
                className="icon-btn"
                href="/"
                aria-label="Go to the homepage"
                title="Home"
              >
                <HomeIcon />
              </a>
              <FileUploadButton onPhoto={handlePhoto} />
              <PrinterButton />
              <SettingsSheet />
            </div>
          </>
        ) : (
          <Intro onBooted={() => setIsBooted(true)} />
        )}
      </div>

      {preview && (
        <ConfirmDialog
          preview={preview}
          onConfirm={previewConfirm}
          onReject={previewReject}
        />
      )}

      {frame !== undefined && (
        <PoemDialog
          poem={poem}
          draft={draft}
          busy={busy}
          error={error}
          onClose={poemClose}
        />
      )}

      {poem && <PrintPoem poem={poem} siteUrl={siteUrl} />}
    </PrinterConnectionContext.Provider>
  );
}
