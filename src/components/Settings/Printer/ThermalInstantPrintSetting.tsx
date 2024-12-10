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
import useSettings from "@/hooks/useSettings";

export default function PrinterThermalInstantPrintSetting() {
  const [settings, setSettings] = useSettings();
  const { printer } = usePrinter();

  if (printer.type !== 'thermal') {
    return undefined;
  }

  return <>
    <Label htmlFor="printer-thermal-instant-print" className="text-right">
      Instant Printer
    </Label>
    <Select
      name="printer-thermal-instant-print"
      value={settings.instantPrint ? 'yes' : 'no'}
      onValueChange={(value) => {
        setSettings({
          ...settings,
          instantPrint: value === 'yes'
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Without previews" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="yes">Yes</SelectItem>
        <SelectItem value="no">No</SelectItem>
      </SelectContent>
    </Select>
  </>
}