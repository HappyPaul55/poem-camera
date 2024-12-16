import { MdPrint } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import usePrinter, { ConnectionStatus } from '@/hooks/usePrinter';
import { ImSpinner5 } from 'react-icons/im';
import { PrinterType } from '@/hooks/usePrinterSettings';

export default function Printer() {
  const { printer, connect, status } = usePrinter();

  if (printer.type !== PrinterType.thermal) {
    return undefined;
  }

  if (status === ConnectionStatus.connected) {
    return <Button className="bg-green-500">
      <MdPrint />
    </Button>
  }

  if (status === ConnectionStatus.connecting) {
    return <Button variant="secondary" disabled>
      <ImSpinner5 className="animate-spin" />
    </Button>
  }

  return <Button variant="destructive" onClick={connect}>
    <MdPrint />
  </Button>
}