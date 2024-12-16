'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import useAppSettings, { AppPreviewMode } from '@/hooks/useAppSettings';

export default function PreviewSetting() {
  const [settings, setSettings] = useAppSettings();

  return <>
    <Label htmlFor="app-preview" className="text-right">
      Preview
    </Label>
    <Select
      name="app-preview"
      value={settings.preview.toString()}
      onValueChange={(value) => {
        setSettings({
          ...settings,
          preview: Number(value) as AppPreviewMode,
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Show Previews" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={AppPreviewMode.always.toString()}>Always</SelectItem>
        <SelectItem value={AppPreviewMode.never.toString()}>Never</SelectItem>
      </SelectContent>
    </Select>
  </>
}