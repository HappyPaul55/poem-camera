import { createContext } from "react";
import type WebBluetoothReceiptPrinter from "./web-bluetooth-receipt-printer";

export type ConnectedDevice = { type: "bluetooth"; id: string };

export type PrinterConnection = {
  isConnecting: boolean;
  setIsConnecting: (isConnecting: boolean) => void;
  driver?: WebBluetoothReceiptPrinter | undefined;
  setDriver: (driver: WebBluetoothReceiptPrinter | undefined) => void;
  device?: ConnectedDevice | undefined;
  setDevice: (device: ConnectedDevice | undefined) => void;
};

const PrinterConnectionContext = createContext<PrinterConnection>({
  setDriver: () => undefined,
  setDevice: () => undefined,
  isConnecting: false,
  setIsConnecting: () => undefined,
});

export default PrinterConnectionContext;
