'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import useSettings, { AppFullScreen } from '@/hooks/useAppSettings';

export default function AppFullscreenSetting() {
  const [settings, setSettings] = useSettings();

  return <>
    <Label htmlFor="app-fullscreen" className="text-right">
      Fullscreen
    </Label>
    <Select
      name="app-fullscreen"
      value={settings.fullScreen === AppFullScreen.yes ? 'yes' : "no"}
      onValueChange={(value) => {
        setSettings({
          ...settings,
          fullScreen: value === 'yes' ? AppFullScreen.yes : AppFullScreen.no
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Use Fullscreen" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="yes">Yes</SelectItem>
        <SelectItem value="no">No</SelectItem>
      </SelectContent>
    </Select>
  </>
}