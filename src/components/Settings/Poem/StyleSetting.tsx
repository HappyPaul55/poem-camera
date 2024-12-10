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
import orderBy from 'lodash.orderby';
import usePoemStyle from "@/hooks/usePoemStyle";
import poemStyles, { PoemStyleNames } from "@/lib/poemStyles";

export default function PoemStyleSetting() {
  const [poemStyle, setPoemStyle] = usePoemStyle();

  return <>
    <Label htmlFor="name" className="text-right">
      Style
    </Label>
    <Select
      value={poemStyle}
      onValueChange={(value) => {
        setPoemStyle(value as PoemStyleNames);
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