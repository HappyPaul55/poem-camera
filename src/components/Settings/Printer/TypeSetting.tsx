'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import usePrinter, { Printer } from "@/hooks/usePrinter";

function getDefaultConfigForType(type: Printer["type"]): Printer {
  const defaultConfigs = {
    none: {
      type: 'none'
    },
    image: {
      type: 'image'
    },
    thermal: {
      type: 'thermal',
      driver: 'usb',
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
      value={printer.type}
      onValueChange={(value) => {
        setPrinter(getDefaultConfigForType(value as 'none' | 'image' | 'thermal'));
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Mode" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        <SelectItem value="thermal">Thermal Printer</SelectItem>
        <SelectItem value="image">Image</SelectItem>
      </SelectContent>
    </Select>
  </>
}