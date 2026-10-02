import { useCallback, useContext, useEffect, useMemo } from "react";
import type { Poem } from "../../lib/app/poem-types";
import type { PoemDraft } from "../../lib/app/use-poem";
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
  /** The poem so far, while it is still being written. */
  draft: PoemDraft;
  /** True while the model is still streaming. */
  busy: boolean;
  error?: Error;
  onClose: () => void;
}

export default function PoemDialog({
  poem,
  draft,
  busy,
  error,
  onClose,
}: Props) {
  const [settings] = useAppSettings();
  const { printer, connect } = usePrinter();
  const { driver, device } = useContext(PrinterConnectionContext);

  const title = poem?.title ?? draft.title;
  const lines = useMemo(
    () => (poem ? (poem.body ? poem.body.split("\n") : []) : draft.lines),
    [poem, draft.lines],
  );
  const hasContent = title !== undefined || lines.length > 0;

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
      {error ? (
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
      ) : (
        <>
          {!hasContent && (
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

          {hasContent && (
            <div className="poem-receipt">
              <h2 id="poem-title" className="poem-receipt__title">
                {title !== undefined && (
                  <span className="poem-reveal">{title}</span>
                )}
              </h2>
              <p className="poem-receipt__byline">By Poem Camera</p>
              <div
                className="poem-receipt__body"
                aria-busy={busy || undefined}
              >
                {lines.map((line, index) =>
                  line === "" ? (
                    <span
                      key={index}
                      className="poem-line poem-line--blank"
                      aria-hidden="true"
                    />
                  ) : (
                    <span key={index} className="poem-line poem-reveal">
                      {line}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          {poem && (
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="primary" onClick={print}>
                Print
              </Button>
              <Button variant="danger" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}
