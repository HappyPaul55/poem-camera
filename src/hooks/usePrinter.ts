'use client'

import useLocalStorageState from "use-local-storage-state";
import WebBluetoothReceiptPrinter from "./../../node_modules/@point-of-sale/webbluetooth-receipt-printer/dist/webbluetooth-receipt-printer.esm"
import { useCallback, useEffect, useState } from "react";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

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

  /**
   * If the driver is trying to connect to the device.
   */
  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * The device/connection, or undefined if not connected.
   */
  const [device, setDevice] = useState<{ type: 'serial', vendorId: string, productId: string } | undefined>(undefined);

  // Timeout the connection if no updates in 30s.
  useEffect(() => {
    if (isConnecting !== true) {
      return;
    }

    const timeout = setTimeout(() => setIsConnecting(false), 30_000);

    return () => clearTimeout(timeout);
  }, [isConnecting, setIsConnecting])

  // Use wants to connect.
  const connect = useCallback(() => {
    alert(JSON.stringify([
      settings.type !== 'thermal',
      settings.driver !== 'bluetooth',
      device !== undefined,
      isConnecting
    ]))
    if (settings.type !== 'thermal'
      || settings.driver !== 'bluetooth'
      || device !== undefined
      || isConnecting
    ) {
      return;
    }

    const driver = new WebBluetoothReceiptPrinter();
    driver.addEventListener('connected', (device) => {
      setDevice(device);
      setIsConnecting(false);

      let encoder = new ReceiptPrinterEncoder({
        printerModel: 'pos-5890',
      });

      let data = encoder
        .initialize()
        .text('The quick brown fox jumps over the lazy dog')
        .newline()
        .qrcode('https://nielsleenheer.com')
        .encode();

      /* Print the receipt */
      driver.print(data);
    })
    driver.addEventListener('disconnected', () => {
      console.log("disconnected")
      setDevice(undefined);
      setIsConnecting(false);
    });
    driver.connect();
    setIsConnecting(true);
  }, [device, isConnecting, setIsConnecting, setDevice])

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