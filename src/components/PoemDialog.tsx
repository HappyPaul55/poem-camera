'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCallback, useContext, useEffect, useState } from "react"
import { Button } from "./ui/button";
import { DialogClose } from "@radix-ui/react-dialog";
import { ImSpinner5 } from "react-icons/im";
import Poem from "@/types/Poem";
import { ScrollArea } from "./ui/scroll-area";
import PrinterConnectionContext from "@/lib/PrinterConnectionContext";
import printPoem from "@/lib/printPoem";
import usePrinter from "@/hooks/usePrinter";
import useSettings from "@/hooks/useSettings";

type PoemDialogProps = {
  poem: Poem | undefined,
  onClose: () => void,
}

function PoemDialogContent(props: PoemDialogProps) {
  const [settings] = useSettings();
  const { printer } = usePrinter();
  const { driver, device } = useContext(PrinterConnectionContext);

  useEffect(() => {
    if (!props.poem || !driver || !device || printer.type !== 'thermal' || settings.instantPrint !== true) {
      return;
    }

    printPoem(props.poem, driver, printer.model)
    props.onClose()
  }, [settings.instantPrint, props.onClose, driver, device, props.poem?.title, props.poem?.body]);

  const printHandler = useCallback(() => {
    if (!props.poem || !driver || !device || printer.type !== 'thermal') {
      return;
    }

    printPoem(props.poem, driver, printer.model)
  }, [driver, device, props.poem?.title, props.poem?.body]);

  if (props.poem === undefined) {
    return <>
      <DialogTitle>Processing...</DialogTitle>
      <div className="animate-bounce">
        <ImSpinner5 className="block mx-auto w-40 h-40 animate-spin" />
      </div>
    </>
  }

  return <ScrollArea className="max-h-[85vh]">
    <DialogHeader>
      <DialogTitle>{props.poem.title}</DialogTitle>
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
    <DialogFooter className="gap-2">
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
