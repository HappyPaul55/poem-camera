import { createContext } from "react";
import WebBluetoothReceiptPrinter from "./WebBluetoothReceiptPrinter";

type PrinterConnectionContextType = {
  isConnecting: boolean,
  setIsConnecting: (isConnecting: boolean) => void,
  driver?: WebBluetoothReceiptPrinter | undefined,
  setDriver: (driver: WebBluetoothReceiptPrinter | undefined) => void,
  device?: { type: 'bluetooth', id: string } | undefined,
  setDevice: (device: { type: 'bluetooth', id: string } | undefined) => void,
}

const PrinterConnectionContext = createContext<PrinterConnectionContextType>({
  setDriver: () => undefined,
  setDevice: () => undefined,
  isConnecting: false,
  setIsConnecting: () => undefined,
});

export default PrinterConnectionContext;