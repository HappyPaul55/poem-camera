'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import usePrinter from '@/hooks/usePrinter';
import { PrinterDriver, PrinterType } from '@/hooks/usePrinterSettings';

export default function PrinterThermalBaudRateSetting() {
  const { printer, setPrinter } = usePrinter();

  if (printer.type !== PrinterType.thermal || printer.driver !== PrinterDriver.serial) {
    return undefined;
  }

  return <>
    <Label htmlFor="printer-thermal-baudrate" className="text-right">
      Baud Rate
    </Label>
    <Select
      name="printer-thermal-baudrate"
      value={printer.baudRate.toString()}
      onValueChange={(value) => {
        setPrinter({
          ...printer,
          baudRate: (Number(value)) as 9600 | 38400 | 115200,
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Mode" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="9600">9600</SelectItem>
        <SelectItem value="38400">38400</SelectItem>
        <SelectItem value="115200">115200</SelectItem>
      </SelectContent>
    </Select>
  </>
}