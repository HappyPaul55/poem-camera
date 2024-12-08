'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import poemForms, { PoemFormsNames } from "@/lib/poemForms";
import orderBy from 'lodash.orderby';
import usePoemForm from "@/hooks/usePoemForm";

export default function PoemFormSetting() {
  const [poemForm, setPoemForm] = usePoemForm();

  return <>
    <Label htmlFor="name" className="text-right">
      Form
    </Label>
    <Select
      value={poemForm}
      onValueChange={(value) => {
        setPoemForm(value as PoemFormsNames);
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