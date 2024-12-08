'use client'

import { Button } from "@/components/ui/button";
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
import PoemFormSetting from "./Settings/PoemFormSetting";
import PoemStyleSetting from "./Settings/PoemStyleSetting";
import FullscreenSetting from "./Settings/FullscreenSetting";

export default function Settings() {
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
            <FullscreenSetting />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <h2 className="font-bold col-span-4">Poem Settings</h2>
            <PoemFormSetting />
            <PoemStyleSetting />
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
