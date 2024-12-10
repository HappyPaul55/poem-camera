import { MdPrint } from "react-icons/md";
import { Button } from "./ui/button";
import usePrinter from "@/hooks/usePrinter";
import { ImSpinner5 } from "react-icons/im";

export default function Printer() {
  const { printer, connect, status } = usePrinter();

  if (printer.type !== 'thermal') {
    return undefined;
  }

  if (status === 'connected') {
    return <Button className="bg-green-500">
      <MdPrint />
    </Button>
  }

  if (status === 'connecting') {
    return <Button variant="secondary" disabled>
      <ImSpinner5 className="animate-spin" />
    </Button>
  }

  return <Button variant="destructive" onClick={connect}>
    <MdPrint />
  </Button>
}