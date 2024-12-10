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
import usePrinter from "@/hooks/usePrinter";
import AppSettings from "./Settings/AppSettings";
import PrinterSettings from "./Settings/PrinterSettings";
import PoemSettings from "./Settings/PoemSettings";
import { ScrollArea } from "./ui/scroll-area";

export default function Settings() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <MdSettings />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <ScrollArea className="h-full">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Make the Poem Camera yours...
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <h2 className="font-bold col-span-4">App Settings</h2>
              <AppSettings />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <h2 className="font-bold col-span-4">Poem Settings</h2>
              <PoemSettings />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <h2 className="font-bold col-span-4">Printer Settings</h2>
              <PrinterSettings />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit">Done</Button>
            </SheetClose>
          </SheetFooter>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
