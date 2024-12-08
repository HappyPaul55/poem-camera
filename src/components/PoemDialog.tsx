'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCallback, useState } from "react"
import { Button } from "./ui/button";
import { DialogClose } from "@radix-ui/react-dialog";
import { ImSpinner5 } from "react-icons/im";
import Poem from "@/types/Poem";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";

type PoemDialogProps = {
  poem: Poem | undefined,
  onClose: () =>
    void,
}

function PoemDialogContent(props: Pick<PoemDialogProps, "poem">) {
  if (props.poem === undefined) {
    return <DialogContent>
      <DialogTitle>Processing...</DialogTitle>
      <div className="animate-bounce">
        <ImSpinner5 className="block mx-auto w-40 h-40 animate-spin" />
      </div>
    </DialogContent>
  }

  return <DialogContent>
    <DialogHeader>
      <DialogTitle>{props.poem.title}</DialogTitle>
    </DialogHeader>
    <div
      dangerouslySetInnerHTML={{
        __html: '<p>' +
          props.poem
            .body
            .split('\n\n').join('</p><p class="pt-4">')
            .split('\n').join('<br />')
          + '</p>',
      }}
    />
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button">
          Close
        </Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
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
  return <Dialog open={open} onOpenChange={openChangeHandler}>
    <PoemDialogContent poem={props.poem} />
  </Dialog>;
}
