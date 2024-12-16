'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import orderBy from 'lodash.orderby';
import poemStyles, { PoemStyleNames } from '@/lib/poemStyles';
import usePoemSettings from '@/hooks/usePoemSettings';

export default function PoemStyleSetting() {
  const [poemSettings, setPoemSettings] = usePoemSettings();

  return <>
    <Label htmlFor="poem-style" className="text-right">
      Style
    </Label>
    <Select
      name="poem-style"
      value={poemSettings.style}
      onValueChange={(value) => {
        setPoemSettings({
          ...poemSettings,
          style: value as PoemStyleNames,
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Style" />
      </SelectTrigger>
      <SelectContent>
        {
          (Object.keys(poemStyles) as (keyof typeof poemStyles)[]).map((poemStyleCategory) => <SelectGroup key={poemStyleCategory}>
            <SelectLabel>{poemStyleCategory}</SelectLabel>
            {
              (orderBy(poemStyles[poemStyleCategory], 'name', 'asc') as { name: string }[]).map(
                poemStyle => <SelectItem key={poemStyle.name} value={poemStyle.name}>{poemStyle.name}</SelectItem>
              )
            }
          </SelectGroup>)
        }
      </SelectContent>
    </Select>
  </>
}