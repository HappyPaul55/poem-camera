'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import usePrinter from '@/hooks/usePrinter';
import { Separator } from '@radix-ui/react-select';
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';
import { PrinterType } from '@/hooks/usePrinterSettings';

export default function PrinterThermalModelSetting() {
  const { printer, setPrinter } = usePrinter();

  if (printer.type !== PrinterType.thermal) {
    return undefined;
  }
  return <>
    <Label htmlFor="printer-thermal-model" className="text-right">
      Model
    </Label>
    <Select
      name="printer-thermal-model"
      value={printer.model}
      onValueChange={(value) => {
        setPrinter({
          ...printer,
          model: value,
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="generic">Generic</SelectItem>
        <SelectSeparator><Separator /></SelectSeparator>
        {
          ReceiptPrinterEncoder.printerModels.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)
        }
      </SelectContent>
    </Select>
  </>
}