import usePrinter, { ConnectionStatus } from "../../lib/app/use-printer";
import { PrinterType } from "../../lib/app/use-printer-settings";
import { PrinterIcon } from "./icons";

/** Toolbar button that connects the thermal printer. */
export default function PrinterButton() {
  const { printer, connect, status } = usePrinter();

  if (printer.type !== PrinterType.thermal) {
    return null;
  }

  if (status === ConnectionStatus.connected) {
    return (
      <button
        type="button"
        className="icon-btn icon-btn--connected"
        aria-label="Printer connected"
        title="Printer connected"
      >
        <PrinterIcon />
      </button>
    );
  }

  if (status === ConnectionStatus.connecting) {
    return (
      <button
        type="button"
        className="icon-btn"
        disabled
        aria-label="Connecting to printer"
        title="Connecting…"
      >
        <span className="spinner" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="icon-btn icon-btn--danger"
      onClick={connect}
      aria-label="Connect a thermal printer"
      title="Connect printer"
    >
      <PrinterIcon />
    </button>
  );
}
