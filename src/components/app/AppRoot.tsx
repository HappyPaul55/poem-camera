import { useCallback, useState } from "react";
import usePoem from "../../lib/app/use-poem";
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

/**
 * React island root for /app.
 *
 * Owns the boot state, the printer connection and the poem pipeline, and hands
 * the pieces down to the (mostly dumb) views.
 */
export default function AppRoot() {
  const [isBooted, setIsBooted] = useState(false);
  const [settings] = useAppSettings();

  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [driver, setDriver] = useState<WebBluetoothReceiptPrinter | undefined>();
  const [device, setDevice] = useState<ConnectedDevice | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);

  const { poem, setFrame, frame, error } = usePoem();

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
        <PoemDialog poem={poem} error={error} onClose={poemClose} />
      )}

      {poem && <PrintPoem poem={poem} />}
    </PrinterConnectionContext.Provider>
  );
}
