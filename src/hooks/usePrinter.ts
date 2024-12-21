'use client'

import WebBluetoothReceiptPrinter, { EmitterEvents } from "@/lib/WebBluetoothReceiptPrinter";
import { useCallback, useContext, useEffect } from "react";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import PrinterConnectionContext from "@/lib/PrinterConnectionContext";
import usePrinterSettings, { PrinterDriver, PrinterType } from "@/hooks/usePrinterSettings";

export enum ConnectionStatus {
  disconnected,
  connecting,
  connected,
};

export default function usePrinter() {
  /**
   * The printer settings. 
   */
  const [settings, setSettings] = usePrinterSettings();

  const {
    setDriver,
    device,
    setDevice,
    isConnecting,
    setIsConnecting
  } = useContext(PrinterConnectionContext)

  // Timeout the connection if no updates in 30s.
  useEffect(() => {
    if (isConnecting !== true) {
      return;
    }

    const timeout = setTimeout(() => setIsConnecting(false), 30_000);

    return () => clearTimeout(timeout);
  }, [isConnecting, setIsConnecting])

  const printerModel = settings.type === PrinterType.thermal
    ? settings.model
    : undefined;

  // Use wants to connect.
  const connect = useCallback(() => {
    if (settings.type !== PrinterType.thermal
      || settings.driver !== PrinterDriver.bluetooth
      || device !== undefined
      || isConnecting
    ) {
      return;
    }

    const driver = new WebBluetoothReceiptPrinter();
    driver.addEventListener('connected', (device: EmitterEvents["connected"][0]) => {
      setDriver(driver)
      setDevice(device);
      setIsConnecting(false);

      const encoder = new ReceiptPrinterEncoder({
        printerModel,
      });

      /* Print the header. */
      driver.print(encoder
        .initialize()
        .align('center')
        .size(2, 2)
        .bold(true)
        .text('Poem Camera')
        .newline()
        .bold(false)
        .size(1, 1)
        .text('By Paul Happy Hutchinson')
        .newline()
        .align('left')
        .newline()
        .newline()
        .newline()
        .newline()
        .encode(),
      );
    })
    driver.addEventListener('disconnected', () => {
      console.log("disconnected")
      setDevice(undefined);
      setIsConnecting(false);
    });
    driver.addEventListener('data', (data: any) => {
      console.log({ data })
    })
    driver.connect();
    setIsConnecting(true);
  }, [printerModel, device, isConnecting, setIsConnecting, setDevice])

  // Our state and actions.
  return {
    printer: settings,
    setPrinter: setSettings,
    connect,
    status: (isConnecting
      ? ConnectionStatus.connecting
      : (device ? ConnectionStatus.connected : ConnectionStatus.disconnected)),
  };
}