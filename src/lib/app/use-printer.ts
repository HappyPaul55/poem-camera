import WebBluetoothReceiptPrinter, {
  type EmitterEvents,
} from "./web-bluetooth-receipt-printer";
import { useCallback, useContext, useEffect } from "react";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import PrinterConnectionContext from "./printer-connection";
import usePrinterSettings, {
  PrinterDriver,
  PrinterType,
} from "./use-printer-settings";

export enum ConnectionStatus {
  disconnected,
  connecting,
  connected,
}

export default function usePrinter() {
  const [settings, setSettings] = usePrinterSettings();

  const {
    setDriver,
    device,
    setDevice,
    isConnecting,
    setIsConnecting,
  } = useContext(PrinterConnectionContext);

  // Time the connection out if nothing happens within 30s.
  useEffect(() => {
    if (isConnecting !== true) {
      return;
    }

    const timeout = setTimeout(() => setIsConnecting(false), 30_000);

    return () => clearTimeout(timeout);
  }, [isConnecting, setIsConnecting]);

  const printerModel =
    settings.type === PrinterType.thermal ? settings.model : undefined;

  // User wants to connect. Only the Bluetooth driver is wired up, matching the
  // original app.
  const connect = useCallback(() => {
    if (
      settings.type !== PrinterType.thermal ||
      settings.driver !== PrinterDriver.bluetooth ||
      device !== undefined ||
      isConnecting
    ) {
      return;
    }

    const driver = new WebBluetoothReceiptPrinter();
    driver.addEventListener(
      "connected",
      (connected: EmitterEvents["connected"][0]) => {
        setDriver(driver);
        setDevice(connected);
        setIsConnecting(false);

        const encoder = new ReceiptPrinterEncoder({ printerModel });

        // Print the header as soon as the printer is ready.
        driver.print(
          encoder
            .initialize()
            .align("center")
            .size(2, 2)
            .bold(true)
            .text("Poem Camera")
            .newline()
            .bold(false)
            .size(1, 1)
            .text("By HappyPaul55")
            .newline()
            .align("left")
            .newline()
            .newline()
            .newline()
            .newline()
            .encode(),
        );
      },
    );
    driver.addEventListener("disconnected", () => {
      setDevice(undefined);
      setDriver(undefined);
      setIsConnecting(false);
    });
    driver.connect();
    setIsConnecting(true);
  }, [
    printerModel,
    settings,
    device,
    isConnecting,
    setIsConnecting,
    setDevice,
    setDriver,
  ]);

  return {
    printer: settings,
    setPrinter: setSettings,
    connect,
    status: isConnecting
      ? ConnectionStatus.connecting
      : device
        ? ConnectionStatus.connected
        : ConnectionStatus.disconnected,
  };
}
