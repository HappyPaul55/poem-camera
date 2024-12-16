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
import { Printer, PrinterDriver, PrinterType } from '@/hooks/usePrinterSettings';

function getDefaultConfigForType(type: PrinterType): Printer {
  const defaultConfigs = {
    [PrinterType.native]: {
      type: PrinterType.native,
    },
    [PrinterType.thermal]: {
      type: PrinterType.thermal,
      driver: PrinterDriver.bluetooth,
      model: 'generic',
    },
  } as const;

  return defaultConfigs[type];
}

export default function PrinterTypeSetting() {
  const { printer, setPrinter } = usePrinter();

  return <>
    <Label htmlFor="printer-type" className="text-right">
      Type
    </Label>
    <Select
      name="printer-type"
      value={printer.type.toString()}
      onValueChange={(value) => {
        setPrinter(getDefaultConfigForType(Number(value) as PrinterType));
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Mode" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={PrinterType.native.toString()}>Native</SelectItem>
        <SelectItem value={PrinterType.thermal.toString()}>Thermal Printer</SelectItem>
      </SelectContent>
    </Select>
  </>
}