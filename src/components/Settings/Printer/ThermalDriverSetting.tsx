'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import usePrinter from "@/hooks/usePrinter";

export default function PrinterThermalDriverSetting() {
  const { printer, setPrinter } = usePrinter();

  if (printer.type !== 'thermal') {
    return undefined;
  }

  return <>
    <Label htmlFor="printer-thermal-driver" className="text-right">
      Driver
    </Label>
    <Select
      name="printer-thermal-driver"
      value={printer.driver}
      onValueChange={(value) => {
        const typedValue = value as 'usb' | 'serial' | 'bluetooth';
        setPrinter({
          type: printer.type,
          driver: typedValue,
          ...(typedValue === 'serial' ? { baudRate: 9600 } : {}) as any,
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Driver" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="usb">USB</SelectItem>
        <SelectItem value="serial">Serial</SelectItem>
        <SelectItem value="bluetooth">Bluetooth</SelectItem>
      </SelectContent>
    </Select>
  </>
}