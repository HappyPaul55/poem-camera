import useLocalStorageState from "use-local-storage-state";

export enum PrinterType {
  thermal,
  native,
}

export enum PrinterDriver {
  serial,
  usb,
  bluetooth,
}

export type NativePrinter = {
  type: PrinterType.native;
};

export type ThermalPrinterSerial = {
  type: PrinterType.thermal;
  driver: PrinterDriver.serial;
  model: string;
  baudRate: 9600 | 38400 | 115200;
};

export type ThermalPrinterUsb = {
  type: PrinterType.thermal;
  driver: PrinterDriver.usb;
  model: string;
};

export type ThermalPrinterBluetooth = {
  type: PrinterType.thermal;
  driver: PrinterDriver.bluetooth;
  model: string;
};

export type ThermalPrinter =
  | ThermalPrinterSerial
  | ThermalPrinterUsb
  | ThermalPrinterBluetooth;

export type Printer = ThermalPrinter | NativePrinter;

/**
 * Printer preference, persisted under the original `printerSettings` key.
 *
 * Only the Bluetooth driver is wired up (as in the original app); the serial
 * and USB options are recorded but not yet connected.
 */
export default function usePrinterSettings() {
  return useLocalStorageState<Printer>("printerSettings", {
    defaultValue: {
      type: PrinterType.native,
    },
  });
}
