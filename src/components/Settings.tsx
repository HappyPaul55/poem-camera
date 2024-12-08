'use client'

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MdSettings } from "react-icons/md";
import usePoemForm from "@/hooks/usePoemForm";
import poemStyles, { PoemStyleNames } from "@/lib/poemStyles";
import poemForms, { PoemFormsNames } from "@/lib/poemForms";
import usePoemStyle from "@/hooks/usePoemStyle";
import useSettings from "@/hooks/useSettings";
import orderBy from 'lodash.orderby';

export default function Settings() {
  const [settings, setSettings] = useSettings();
  const [poemForm, setPoemForm] = usePoemForm();
  const [poemStyle, setPoemStyle] = usePoemStyle();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="absolute top-8 right-8 text-black z-50">
          <MdSettings />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Make the Poem Camera yours...
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <h2 className="font-bold col-span-4">App Settings</h2>
            <Label htmlFor="name" className="text-right">
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
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <h2 className="font-bold col-span-4">Poem Settings</h2>
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
            {
              poemForm === 'Poem' && <>
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
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
