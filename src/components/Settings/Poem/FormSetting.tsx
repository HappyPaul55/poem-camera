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
import poemForms, { PoemFormsNames } from '@/lib/poemForms';
import orderBy from 'lodash.orderby';
import usePoemSettings from '@/hooks/usePoemSettings';

export default function PoemFormSetting() {
  const [poemSettings, setPoemSettings] = usePoemSettings();

  return <>
    <Label htmlFor="poem-form" className="text-right">
      Form
    </Label>
    <Select
      name="poem-form"
      value={poemSettings.form}
      onValueChange={(value) => {
        setPoemSettings({
          ...poemSettings,
          form: value as PoemFormsNames,
        });
      }}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Form" />
      </SelectTrigger>
      <SelectContent>
        {
          (Object.keys(poemForms) as (keyof typeof poemForms)[]).map((poemFormCategory) => <SelectGroup key={poemFormCategory}>
            <SelectLabel>{poemFormCategory}</SelectLabel>
            {
              orderBy(poemForms[poemFormCategory], 'name', 'asc').map(
                poemForm => <SelectItem key={poemForm.name} value={poemForm.name}>{poemForm.name}</SelectItem>
              )
            }
          </SelectGroup>)
        }
      </SelectContent>
    </Select>
  </>
}