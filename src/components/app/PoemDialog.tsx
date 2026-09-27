import { useCallback, useContext, useEffect } from "react";
import type { Poem } from "../../lib/app/poem-types";
import Dialog from "./ui/Dialog";
import Button from "./ui/Button";
import usePrinter from "../../lib/app/use-printer";
import PrinterConnectionContext from "../../lib/app/printer-connection";
import printPoem from "../../lib/app/print-poem";
import useAppSettings, {
  AppInstantPrint,
} from "../../lib/app/use-app-settings";
import { PrinterType } from "../../lib/app/use-printer-settings";

interface Props {
  poem: Poem | undefined;
  error?: Error;
  onClose: () => void;
}

export default function PoemDialog({ poem, error, onClose }: Props) {
  const [settings] = useAppSettings();
  const { printer, connect } = usePrinter();
  const { driver, device } = useContext(PrinterConnectionContext);

  const busy = poem === undefined && error === undefined;

  const print = useCallback(() => {
    if (!poem) {
      return;
    }

    if (printer.type === PrinterType.native) {
      window.print();
      return;
    }

    if (printer.type === PrinterType.thermal) {
      if (!driver || !device) {
        connect();
        return;
      }
      printPoem(poem, driver, printer.model);
    }
  }, [poem, printer, driver, device, connect]);

  // Instant print: skip the dialog entirely when the printer is ready.
  useEffect(() => {
    if (
      printer.type !== PrinterType.thermal ||
      settings.instantPrint !== AppInstantPrint.yes ||
      poem === undefined
    ) {
      return;
    }

    print();
    onClose();
  }, [poem, printer.type, settings.instantPrint, print, onClose]);

  // Print only the poem: the CSS keys off this attribute.
  useEffect(() => {
    document.body.dataset.print = "poem";
    return () => {
      delete document.body.dataset.print;
    };
  }, []);

  return (
    <Dialog onClose={onClose} blockClose={busy} labelId="poem-title">
      {busy && (
        <>
          <h2 id="poem-title" className="app-dialog__title">
            Writing your poem…
          </h2>
          <div className="grid place-items-center py-12">
            <span
              className="spinner"
              style={{ width: 56, height: 56, borderWidth: 6 }}
            />
          </div>
        </>
      )}

      {error && (
        <>
          <h2 id="poem-title" className="app-dialog__title">
            The poem didn't arrive
          </h2>
          <p className="alert alert--error mt-4">{error.message}</p>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      )}

      {poem && (
        <>
          <div className="poem-receipt">
            <h2 id="poem-title" className="poem-receipt__title">
              {poem.title}
            </h2>
            <p className="poem-receipt__byline">By Poem Camera</p>
            <div className="poem-receipt__body">{poem.body}</div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="primary" onClick={print}>
              Print
            </Button>
            <Button variant="danger" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
