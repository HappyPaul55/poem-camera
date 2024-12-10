'use client'

import useLocalStorageState from "use-local-storage-state";
import WebBluetoothReceiptPrinter, { EmitterEvents } from "@/lib/WebBluetoothReceiptPrinter";
import { useCallback, useContext, useEffect, useState } from "react";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import PrinterConnectionContext from "@/lib/PrinterConnectionContext";

export type NoPrinter = {
  type: 'none'
}

export type ThermalPrinterSerial = {
  type: 'thermal',
  driver: 'serial',
  model: string,
  baudRate: 9600 | 38400 | 115200,
};

export type ThermalPrinterUsb = {
  type: 'thermal',
  driver: 'usb',
  model: string,
};

export type ThermalPrinterBluetooth = {
  type: 'thermal',
  driver: 'bluetooth',
  model: string,
};

export type ThermalPrinter = ThermalPrinterSerial | ThermalPrinterUsb | ThermalPrinterBluetooth;

export type ImagePrinter = {
  type: 'image',
};

export type Printer = NoPrinter | ThermalPrinter | ImagePrinter;

export default function usePrinter() {
  /**
   * The printer settings. 
   */
  const [settings, setSettings] = useLocalStorageState<Printer>('printer', {
    defaultValue: {
      type: 'none',
    },
  });

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

  const printerModel = settings.type === 'thermal'
    ? settings.model
    : undefined;

  // Use wants to connect.
  const connect = useCallback(() => {
    if (settings.type !== 'thermal'
      || settings.driver !== 'bluetooth'
      || device !== undefined
      || isConnecting
    ) {
      return;
    }

    const driver = new WebBluetoothReceiptPrinter();
    alert("Driving")
    driver.addEventListener('connected', (device: EmitterEvents["connected"][0]) => {
      setDriver(driver)
      setDevice(device);
      setIsConnecting(false);

      const encoder = new ReceiptPrinterEncoder({
        printerModel,
      });

      const data = encoder
        .initialize()
        .align('center')
        .size(2, 2)
        .text('Poem Camera')
        .newline()
        .size(1, 1)
        .text('By Paul Happy Hutchinson')
        .newline()
        .align('left')
        .newline()
        .newline()
        .newline()
        .newline();

      /* Print the header. */
      driver.print(data.encode());
    })
    driver.addEventListener('disconnected', () => {
      console.log("disconnected")
      setDevice(undefined);
      setIsConnecting(false);
    });
    driver.connect();
    setIsConnecting(true);
  }, [printerModel, device, isConnecting, setIsConnecting, setDevice])

  // Our state and actions.
  return {
    printer: settings,
    setPrinter: setSettings,
    connect,
    status: (isConnecting
      ? 'connecting'
      : (device ? 'connected' : 'disconnected')) as 'connecting' | 'connected' | 'disconnected',
  };
}