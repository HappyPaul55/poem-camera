import {
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { cn } from "../../../lib/app/cn";

interface Props {
  onClose: () => void;
  /** Prevent Escape/backdrop dismissal (e.g. while the poem is being written). */
  blockClose?: boolean;
  className?: string;
  labelId?: string;
  describedById?: string;
  children: ReactNode;
}

/**
 * A thin wrapper around the native `<dialog>` element, which gives us focus
 * containment, Escape-to-close and a proper backdrop for free.
 */
export default function Dialog({
  onClose,
  blockClose = false,
  className,
  labelId,
  describedById,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (blockClose) {
      event.preventDefault();
    }
  };

  const handleClose = () => {
    if (!blockClose) {
      onClose();
    }
  };

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (blockClose) return;
    if (event.target === ref.current) {
      ref.current?.close();
    }
  };

  return (
    <dialog
      ref={ref}
      className={cn("app-dialog no-print", className)}
      aria-labelledby={labelId}
      aria-describedby={describedById}
      onCancel={handleCancel}
      onClose={handleClose}
      onClick={handleClick}
    >
      <div className="app-dialog__body">{children}</div>
    </dialog>
  );
}
