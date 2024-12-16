'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogClose, DialogDescription } from '@radix-ui/react-dialog';
import { useCallback, useContext, useEffect, useState } from 'react'
import { ImSpinner5 } from 'react-icons/im';
import Poem from '@/types/Poem';
import PrinterConnectionContext from '@/lib/PrinterConnectionContext';
import printPoem from '@/lib/printPoem';
import usePrinter from '@/hooks/usePrinter';
import useSettings, { AppInstantPrint } from '@/hooks/useAppSettings';
import { PrinterType } from '@/hooks/usePrinterSettings';
import { Badge } from "@/components/ui/badge"

type PoemDialogProps = {
  poem: Poem | undefined,
  onClose: () => void,
}

function PoemDialogContent(props: PoemDialogProps) {
  const [settings] = useSettings();
  const { printer } = usePrinter();
  const { driver, device } = useContext(PrinterConnectionContext);

  const printHandler = useCallback(() => {
    if (!props.poem) {
      return;
    }

    if (printer.type === PrinterType.native) {
      window.print();
      return;
    }

    if (driver && device && printer.type == PrinterType.thermal) {
      printPoem(props.poem, driver, printer.model)
      return;
    }

    return;
  }, [driver, device, printer.type, props.poem?.title, props.poem?.body]);

  useEffect(() => {
    if (settings.instantPrint !== AppInstantPrint.yes) {
      return;
    }

    printHandler();
    props.onClose()
  }, [settings.instantPrint, props.onClose, printHandler]);

  if (props.poem === undefined) {
    return <>
      <DialogTitle>Processing...</DialogTitle>
      <div className="animate-bounce">
        <ImSpinner5 className="block mx-auto w-40 h-40 animate-spin" />
      </div>
    </>
  }

  return <ScrollArea className="max-h-[85vh] print:max-h-[95vh]">
    <DialogHeader>
      <DialogTitle>
        {props.poem.title}
        <Badge variant="secondary" className="hidden">{props.poem.ai}</Badge>
      </DialogTitle>
      <DialogDescription className="text-sm italic hidden print:block">By Poem Printer</DialogDescription>
    </DialogHeader>
    <div
      dangerouslySetInnerHTML={{
        __html: '<p class="py-4">' +
          props.poem
            .body
            .split('\n\n').join('</p><p class="pb-4">')
            .split('\n').join('<br />')
          + '</p>',
      }}
    />
    <DialogFooter className="gap-2 print:hidden">
      <Button type="button" onClick={printHandler}>
        Print
      </Button>
      <DialogClose asChild>
        <Button type="button" variant="destructive">
          Close
        </Button>
      </DialogClose>
    </DialogFooter>
  </ScrollArea>
}

export default function PoemDialog(props: PoemDialogProps) {
  const [open, setOpen] = useState(true);
  const openChangeHandler = useCallback((open: boolean) => {
    // No action whilst we loading.
    if (props.poem === undefined) {
      return;
    }
    if (open === false) {
      props.onClose();
      return;
    }

    setOpen(false);
  }, [props.poem, props.onClose]);
  return <Dialog modal open={open} onOpenChange={openChangeHandler}>
    <DialogContent>
      <PoemDialogContent onClose={props.onClose} poem={props.poem} />
    </DialogContent>
  </Dialog>;
}
