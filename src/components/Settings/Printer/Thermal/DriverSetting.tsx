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

export default function PrinterThermalDriverSetting() {
  const { printer, setPrinter } = usePrinter();

  if (printer.type !== PrinterType.thermal) {
    return undefined;
  }

  return <>
    <Label htmlFor="printer-thermal-driver" className="text-right">
      Driver
    </Label>
    <Select
      name="printer-thermal-driver"
      value={printer.driver.toString()}
      onValueChange={(value) => {
        const typedValue = Number(value) as PrinterDriver;
        setPrinter({
          type: printer.type,
          driver: typedValue,
          ...(typedValue === PrinterDriver.serial ? { baudRate: 9600 } : {}) as any,
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Driver" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={PrinterDriver.usb.toString()}>USB</SelectItem>
        <SelectItem value={PrinterDriver.serial.toString()}>Serial</SelectItem>
        <SelectItem value={PrinterDriver.bluetooth.toString()}>Bluetooth</SelectItem>
      </SelectContent>
    </Select>
  </>
}