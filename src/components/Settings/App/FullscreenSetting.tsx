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

export default function AppFullscreenSetting() {
  const [settings, setSettings] = useSettings();

  return <>
    <Label htmlFor="app-fullscreen" className="text-right">
      Fullscreen
    </Label>
    <Select
      value={settings.fullScreen ? 'Yes' : "No"}
      onValueChange={(value) => {
        setSettings({
          ...settings,
          fullScreen: value === "Yes"
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Use Fullscreen" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Yes">Yes</SelectItem>
        <SelectItem value="No">No</SelectItem>
      </SelectContent>
    </Select>
  </>
}