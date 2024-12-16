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
import useSettings, { AppInstantPrint } from '@/hooks/useAppSettings';
import { PrinterType } from '@/hooks/usePrinterSettings';

export default function PrinterThermalInstantPrintSetting() {
  const [settings, setSettings] = useSettings();
  const { printer } = usePrinter();

  if (printer.type !== PrinterType.thermal) {
    return undefined;
  }

  return <>
    <Label htmlFor="printer-thermal-instant-print" className="text-right">
      Instant Printer
    </Label>
    <Select
      name="printer-thermal-instant-print"
      value={settings.instantPrint.toString()}
      onValueChange={(value) => {
        setSettings({
          ...settings,
          instantPrint: Number(value) as AppInstantPrint,
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Without previews" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={AppInstantPrint.yes.toString()}>Yes</SelectItem>
        <SelectItem value={AppInstantPrint.no.toString()}>No</SelectItem>
      </SelectContent>
    </Select>
  </>
}