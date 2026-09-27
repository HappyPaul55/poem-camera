import { useEffect, useRef, useState, type MouseEvent } from "react";
import { SettingsIcon } from "./icons";
import Button from "./ui/Button";
import AppSettings from "./settings/AppSettings";
import PoemSettings from "./settings/PoemSettings";
import PrinterSettings from "./settings/PrinterSettings";

/** Toolbar button that opens the settings panel as a native modal dialog. */
export default function SettingsSheet() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) {
      ref.current?.close();
    }
  };

  return (
    <>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen(true)}
        aria-label="Settings"
        title="Settings"
      >
        <SettingsIcon />
      </button>

      <dialog
        ref={ref}
        className="app-sheet no-print"
        aria-labelledby="settings-title"
        onClose={() => setOpen(false)}
        onClick={handleClick}
      >
        <div className="app-sheet__body">
          <div className="app-sheet__head">
            <h2 id="settings-title" className="app-dialog__title">
              Settings
            </h2>
            <p className="app-dialog__meta mt-1">Make the Poem Camera yours…</p>
          </div>

          <div className="app-sheet__content">
            <AppSettings />
            <PoemSettings />
            <PrinterSettings />
          </div>

          <div className="app-sheet__foot">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => ref.current?.close()}
            >
              Done
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
