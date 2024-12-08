'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCallback } from "react"
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

type ConfirmDialogProps = {
  preview: string,
  onConfirm: () => void,
  onReject: () => void,
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
  const openChangeHandler = useCallback((open: boolean) => {
    if (open === false) {
      props.onReject();
    }
  }, [props.onReject]);

  const confirmHandler = useCallback(() => {
    props.onConfirm()
  }, [props.onConfirm]);

  return <Dialog open={true} onOpenChange={openChangeHandler}>
    <DialogContent className="max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>How does it look?</DialogTitle>
        <DialogDescription>
          Before we make your poem, just check to see if the photo looks right.
        </DialogDescription>
      </DialogHeader>
      <img src={props.preview} alt="Photo Preview" className="w-full" />
      <DialogFooter>
        <Button
          type="submit"
          className="float-right"
          onClick={confirmHandler}
        >
          It looks good!
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
