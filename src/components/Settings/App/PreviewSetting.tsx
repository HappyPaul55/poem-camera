'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import useSettings from "@/hooks/useSettings";

export default function PreviewSetting() {
  const [settings, setSettings] = useSettings();

  return <>
    <Label htmlFor="app-preview" className="text-right">
      Preview
    </Label>
    <Select
      name="app-preview"
      value={settings.preview}
      onValueChange={(value) => {
        setSettings({
          ...settings,
          preview: value as 'always' | 'never'
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Show Previews" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="always">Always</SelectItem>
        <SelectItem value="never">Never</SelectItem>
      </SelectContent>
    </Select>
  </>
}